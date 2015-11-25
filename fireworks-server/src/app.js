import Game from './online_game';
import express from 'express';
import Player from './player';
import Log from './log';
import PlayerManager from './player_manager';
import CardUtils from './../shared/card_utils';

var http = require('http').Server(express);
var io = require('socket.io')(http);

var genId = () => {
    var lastId = 0;
    return () => {
        return ++lastId;
    }
}();

var genRoomId = () => {
    var lastId = 0;
    return () => {
        return ++lastId;
    }
}();

var playerManager = new PlayerManager();
var gameIdToGame = new Map();
var names = new Set();

io.set( 'origins', '*idunnololz.com*:*' );

const LOCATION_LOBBY = -1;

/*

The protocol:
First player enters is the host.
Player enters, sends ready.

Host is given the ability to start the game at any moment when the game has 2-5 players.

When the game begins, each player is given the information about other player's hands.

*/

/*
Game life cycle:

* - Actions where the server will emit to all players for convenience but will provide methods for it as well.

1. Players join...
2. When enough players are in, the start game button appears to the host.
3. When start game is pressed, the game starts.
4. Clients are expected to do all of the logic work. The server is mainly only for responding to clients.
5. The server will send out a game started message (for convenience), but a isGameStarted() method is provided.
6. Each player will call draw.
7. *Each player checks if it is their turn.
8. *The player whose turn it is will make an action. All other players will check if the active player has made a move.
9. *The next player will make an action.
0. A method is provided to get all actions since an action id. This also facilitates reconnection later.
*/

/*

Game rooms logic:
'getRooms' is a function to get a list of all games. The list has basic information about each room (such as room name, etc).

Whenever changes occur that relate to game rooms (either rooms getting created or destroyed), delta changes are propagated to all in the lobby.
They are of the form - emit('roomsUpdate', {added: [{new_rooms}], removed: [{deleted_rooms}]})
    where new_rooms is a list of room info
    where deleted_rooms is a list of room ids

*/

const TAG = "App";

io.on('connection', function(socket){
    // new player has joined! Create a player id and obj for the player
    var playerId = genId();
    var player = new Player(playerId, socket);
    var game;
    player.setName("Player " + playerId);
    player.setLocation(LOCATION_LOBBY);
    playerManager.addPlayer(player);
    Log.d(TAG, "Player %s has connected to the server.", player.getId());

    socket.join(LOCATION_LOBBY);

    socket.on('setName', (msg) => {
        if (names.has(msg.preferredName)) {
            // someone with this name already connected... reject...
            socket.emit('setName', false);
            return;
        }
        names.add(msg.preferredName);
        player.setName(msg.preferredName);
        socket.emit('setName', true);
    });

    socket.on('getRooms', (msg) => {
        var rooms = [];
        gameIdToGame.forEach((value, key) => {
            rooms.push(gameToRoomInfo(value));
        });

        socket.emit('getRooms', {rooms: rooms});
    });

    socket.on('getRoomInfo', (msg) => {
        var gameId = msg.gameId;
        var g = gameIdToGame.get(gameId);

        var playerArr = g.getPlayers().map((p) => {
            return {
                playerId: p.getId(),
                playerName: p.getName()
            };
        });

        socket.emit('getRoomInfo', {
            gameId: gameId,
            name: g.getName(),
            players: playerArr,
            capacity: g.getPlayerCapacity() 
        });
    });

    socket.on('makeRoom', (msg) => {
        var gameId;
        if (msg.gameId !== undefined) {
            // the user wants to make a room with a certain gameId (used mostly for testing...)
            if (gameIdToGame.has(msg.gameId)) {
                // nope... reject...
                socket.emit('makeRoom', 'Room with given ID already exists');
                return;
            }
            gameId = msg.gameId;
        } else {
            do {
                gameId = genRoomId();
            } while (gameIdToGame.has(gameId));
        }

        game = new Game(gameId, msg.roomName);
        gameIdToGame.set(game.getId(), game);
        socket.emit('makeRoom', {gameId: game.getId()});

        io.in(LOCATION_LOBBY).emit('roomsUpdate', {added: [gameToRoomInfo(game)]});

        if (msg.enterRoom !== undefined && msg.enterRoom === true) {
            joinGameHandler({gameId: gameId});
        }
    });

    var joinGameHandler = (msg) => {
        var gameId = msg.gameId;

        game = gameIdToGame.get(gameId);
        if (game === undefined) {
            socket.emit('joinGame', 'No game with given ID exists.');
            return;
        }
        game.addPlayer(player);

        socket.emit('joinGame', true);
        socket.join(game.getId());
        socket.broadcast.to(game.getId()).emit('playerJoined', {'playerId': playerId, playerName: player.getName()});

        // check if we can start the game
        var players = game.getNumPlayers();
        if (players >= 2 && players <= 5) {
            io.to(game.getId()).emit('numPlayers', game.getNumPlayers());
        }
    };
    socket.on('joinGame', joinGameHandler);

    var leaveGameHandler = (msg) => {
        if (game !== undefined) {
            var host = game.getHost();
            game.removePlayer(player.getId());
            socket.broadcast.to(game.getId()).emit('playerLeft', {'playerId': playerId, playerName: player.getName()});
            if (host !== game.getHost()) {
                // host changed... try to notify the new host
                var newHost = game.getHost();
                if (newHost != undefined) {
                    newHost.getSocket().emit('isHost', true);
                    Log.d(TAG, "Host changed to player %s.", newHost.getId());
                }
            }

            if (game.getRealNumPlayers() === 0) {
                // everyone left the game... remove the game...
                var gameId = game.getId();
                Log.d(TAG, "All players left! Removing game " + gameId);
                gameIdToGame.delete(gameId);
                io.in(LOCATION_LOBBY).emit('roomsUpdate', {removed: [gameId]});
            }
        }
    };
    socket.on('leaveGame', (msg) => {
        leaveGameHandler();
        socket.emit('leaveGame');
    });

    socket.on('getSelf', (msg) => {
        socket.emit('getSelf', {'playerId': playerId, playerName: player.getName()});
    });
    socket.on('getPlayers', (msg) => {
        socket.emit('getPlayers', game.getNumPlayers());
    })
    socket.on('sendMessage', (msg) => {
        io.to(game.getId()).emit('sendMessage', msg);
    });
    socket.on('isHost', (msg) => {
        var host = game.getHost();
        if (host !== undefined) {
            socket.emit('isHost', host.getId() === player.getId());
        }
    });
    socket.on('getPlayersInGame', (msg) => {
        socket.emit('getPlayersInGame', getPlayersInGame());
    });

    // convenience function
    socket.on('getGameInfo', (msg) => {
        socket.emit('getGameInfo', {
            isHost: game.getHost() !== undefined && game.getHost().getId() === player.getId(),
            playersInGame: getPlayersInGame(),
            gameStarted: game.isGameStarted()
        });
    });

    socket.on('startGame', (msg) => {
        var players = game.getNumPlayers();
        if (game.getHost().getId() === player.getId() && players >= 2 && players <= 5) {
            // we can start the game!
            game.startGame();

            // give everyone information about all players... 
            io.to(game.getId()).emit('gameStarted', {
                players: game.getAllPlayersInGame(), 
                hints: game.getHints(), 
                lives: game.getLives(), 
                deckSize: game.getDeck().getDeckSize()});
            Log.d(TAG, "Game started!");
        }
    });

    socket.on('getPlayerIndex', (msg) => {
        socket.emit('getPlayerIndex', game.getIndex(playerId))
    });

    const EVENT_DRAW_HAND = 1;
    const EVENT_HINT = 2;
    const EVENT_DISCARD = 3;
    const EVENT_PLAY = 4;
    const EVENT_DECLARE_GAME_OVER = 5;
    const EVENT_ERROR = 1000;

    socket.on('deckSize', (msg) => {
        socket.emit('deckSize', game.getDeck().getDeckSize());
    });

    socket.on('isGameStarted', (msg) => {
        socket.emit('isGameStarted', game.isGameStarted());
    });
    socket.on('drawHand', (msg) => {
        var cards = game.drawHand(playerId);
        if (cards !== undefined) {
            // construct a unknown hand from the hand drawn to by given to the player who drew them
            var unkCards = [];
            for (var i = 0; i < cards.length; i++) {
                var c = cards[i];
                unkCards.push({cardId: c.cardId, cardType: CardUtils.UNKNOWN_CARD});
            }
            var event = {
                playerId: playerId, 
                eventType: EVENT_DRAW_HAND,
                data: cards
            };
            socket.broadcast.to(game.getId()).emit('gameEvent', event);
            socket.emit('gameEvent', {
                playerId: playerId,
                eventType: EVENT_DRAW_HAND,
                data: unkCards
            });

            game.pushEvent(event);
        }
    });
    socket.on('hint', (msg) => {
        /**
         * Expects an object with fields:
         *  target: Player id of the player to hint
         *  hintType: A hint enum. See CardUtils.getHint().
         *  affectedCards: An array of card ids of the cards affected by the hint.
         */
        var res = game.hint(playerId, msg.target, msg.hintType);
        if (typeof res === 'string' || res instanceof String) {
            // error!
            socket.emit('gameEvent', {eventType: EVENT_ERROR, msg: res});
            return;
        }
        var event = {
            playerId: playerId, 
            eventType: EVENT_HINT,
            data: msg,
            hints: game.getHints()
        };
        io.to(game.getId()).emit('gameEvent', event);

        game.pushEvent(event);

        checkGameOver();
    });
    socket.on('play', (msg) => {
        /**
         * Expects an object with fields:
         *  cardId: The id of the card to play
         */
        var curLives = game.getLives();
        var card = game.play(playerId, msg.cardId);
        var playable = game.getLives() === curLives;
        var unknownCard = card === null ? null : {cardId: card.cardId, cardType: CardUtils.UNKNOWN_CARD};
        var event = {
            playerId: playerId, 
            eventType: EVENT_PLAY,
            data: msg,
            lives: game.getLives(),
            hints: game.getHints(),
            draw: unknownCard,
            played: game.getCardWithId(msg.cardId),
            playable: playable
        };
        socket.emit('gameEvent', event);
        event.draw = card;
        socket.broadcast.to(game.getId()).emit('gameEvent', event);
        game.pushEvent(event);

        checkGameOver();
    });
    socket.on('discard', (msg) => {
        /**
         * Expects an object with fields:
         *  cardId: The id of the card to discard
         */
        var card = game.discard(playerId, msg.cardId);
        var unknownCard = card === null ? null : {cardId: card.cardId, cardType: CardUtils.UNKNOWN_CARD};
        var event = {
            playerId: playerId, 
            eventType: EVENT_DISCARD,
            data: msg,
            hints: game.getHints(),
            draw: unknownCard,
            discarded: game.getCardWithId(msg.cardId)
        };
        socket.emit('gameEvent', event);
        event.draw = card;
        socket.broadcast.to(game.getId()).emit('gameEvent', event);
        game.pushEvent(event);

        checkGameOver();
    });

    socket.on('disconnect', () => {
        var player = playerManager.getPlayerWithSocketId(socket.id);
        if (player === undefined) {
            Log.w(TAG, "Unknown player has disconnected");
            return;
        }

        // clean up after disconnected player...
        leaveGameHandler(null);

        names.delete(player.getName()); // free the name
        playerManager.removePlayer(player);
        
        Log.d(TAG, "Player %s has disconnected.", player.getId());
    });

    socket.on('error', (err) => { 
        console.error(err.stack); // TODO, cleanup 
    });

    function getPlayersInGame() {
        return game.getAllPlayersInGame();
    }

    function checkGameOver() {
        if (game.isGameOver()) {
            var event = {
                playerId: playerId, 
                eventType: EVENT_DECLARE_GAME_OVER,
            };
            io.to(game.getId()).emit('gameEvent', event);
            game.pushEvent(event);
        }
    }

    function gameToRoomInfo(game) {
        return {
            gameId: game.getId(), 
            gameName: game.getName(), 
            numPlayers: game.getNumPlayers(), 
            maxPlayers: game.getPlayerCapacity(),
            status: game.getStatus()
        };
    }
});

var port = process.env.PORT || 3000;
http.listen(port, function(){
    console.log('listening on ' + port);
});