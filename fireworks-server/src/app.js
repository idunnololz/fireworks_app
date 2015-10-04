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

var playerManager = new PlayerManager();
var game = new Game();

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

const TAG = "App";

io.on('connection', function(socket){
    var THIS_IS_A_CONST = 12;

    // new player has joined! Create a player id and obj for the player
    var playerId = genId();
    var player = new Player(playerId, socket);
    player.setName("Player " + playerId);
    game.addPlayer(player);
    playerManager.addPlayer(player);
    Log.d(TAG, "Player %s has connected.", player.getId());

    socket.join(game.getId());
    socket.broadcast.to(game.getId()).emit('playerJoined', {'playerId': playerId, playerName: player.getName()});

    // check if we can start the game
    var players = game.getNumPlayers();
    if (players >= 2 && players <= 5) {
        io.to(game.getId()).emit('numPlayers', game.getNumPlayers());
    }

    socket.on('getId', (msg) => {
        socket.emit('getId', {'playerId': playerId, playerName: player.getName()});
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
            io.to(game.getId()).emit('gameStarted', {players: game.getAllPlayersInGame(), hints: game.getHints(), lives: game.getLives()});
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

    socket.on('isGameStarted', (msg) => {
        sockeet.emit('isGameStarted', game.isGameStarted());
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
        game.hint(playerId, msg.target, msg.hintType);
        var event = {
            playerId: playerId, 
            eventType: EVENT_HINT,
            data: msg,
            hints: game.getHints()
        };
        io.to(game.getId()).emit('gameEvent', event);

        game.pushEvent(event);
    });
    socket.on('play', (msg) => {
        /**
         * Expects an object with fields:
         *  cardId: The id of the card to play
         */
        var card = game.play(playerId, msg.cardId);
        var event = {
            playerId: playerId, 
            eventType: EVENT_PLAY,
            data: msg,
            lives: game.getLives(),
            draw: {cardId: card.cardId, cardType: CardUtils.UNKNOWN_CARD},
            played: game.getCardWithId(msg.cardId)
        };
        socket.emit('gameEvent', event);
        event.draw = card;
        socket.broadcast.to(game.getId()).emit('gameEvent', event);
        game.pushEvent(event);
    });
    socket.on('discard', (msg) => {
        /**
         * Expects an object with fields:
         *  cardId: The id of the card to discard
         */
        var card = game.discard(playerId, msg.cardId);
        var event = {
            playerId: playerId, 
            eventType: EVENT_DISCARD,
            data: msg,
            hints: game.getHints(),
            draw: {cardId: card.cardId, cardType: CardUtils.UNKNOWN_CARD},
            discarded: game.getCardWithId(msg.cardId)
        };
        socket.emit('gameEvent', event);
        event.draw = card;
        socket.broadcast.to(game.getId()).emit('gameEvent', event);
        game.pushEvent(event);
    });

    socket.on('disconnect', () => {
        var player = playerManager.getPlayerWithSocketId(socket.id);
        if (player === undefined) {
            Log.w(TAG, "Unknown player has disconnected");
        } else {
            var host = game.getHost();
            game.removePlayer(player.getId());
            playerManager.removePlayer(player);
            socket.broadcast.to(game.getId()).emit('playerLeft', {'playerId': playerId, playerName: player.getName()});
            if (host !== game.getHost()) {
                // host changed... try to notify the new host
                var newHost = game.getHost();
                if (newHost != undefined) {
                    newHost.getSocket().emit('isHost', true);
                    Log.d(TAG, "Host changed to player %s.", newHost.getId());
                }
            }
            
            Log.d(TAG, "Player %s has disconnected.", player.getId());

            if (game.getRealNumPlayers() === 0) {
                // everyone left the game... restart the game...
                game = new Game();
                Log.d(TAG, "All players left! Restarting game.");
            }
        }
    });

    socket.on('error', (err) => { 
        console.error(err.stack); // TODO, cleanup 
    });

    function getPlayersInGame() {
        return game.getAllPlayersInGame();
    }
});

var port = process.env.PORT || 3000;
http.listen(port, function(){
    console.log('listening on ' + port);
});