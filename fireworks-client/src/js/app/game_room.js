define(['jquery', 'React', 'app/chat_box', 'app/player', 'app/this_player', 'app/info_bar'], 
    function ($, React, ChatBox, Player, ThisPlayer, InfoBar) {

    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    
    const MODE_LOADING = 1;
    const MODE_WAITING = 2;
    const MODE_PLAYING = 3;
    const MODE_SPECTATOR = 4;

    const EVENT_DRAW_HAND = 1;
    const EVENT_HINT = 2;
    const EVENT_DISCARD = 3;
    const EVENT_PLAY = 4;

    var history = [];

    var GameRoom = React.createClass({displayName: "GameRoom",
        getInitialState:function() {
            return {
                playerInfo: undefined,
                mode: MODE_LOADING,
                isHost: false,
                playersInGame: [],
                lives: 0,
                hints: 0,

                showToast: false,
                toastTitle: "",
                toastMessage: "",
            };
        },
        componentWillMount:function() {
            var s = this.props.socket;
            s.on('getId', function(msg)  {
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);
            }.bind(this));
            s.on('getGameInfo', function(msg)  {
                console.log(msg);
                if (msg.gameStarted) {
                    this.setState({mode: MODE_SPECTATOR, playersInGame: msg.playersInGame});
                } else {
                    this.setState({mode: MODE_WAITING, playersInGame: msg.playersInGame, isHost: msg.isHost});
                }
            }.bind(this));
            s.on('playerJoined', function(msg)  {
                console.log(msg);
                var ps = this.state.playersInGame;
                ps.push(msg);
                this.setState({playersInGame: ps});
            }.bind(this));
            s.on('playerLeft', function(msg)  {
                console.log(msg);
                var ps = this.state.playersInGame;
                ps = ps.filter(function(val)  {
                    return val.playerId !== msg.playerId;
                });
                this.setState({playersInGame: ps});
            }.bind(this));
            s.on('isHost', function(msg)  {
                // for when the host changes...
                this.setState({isHost: msg});
            }.bind(this));
            s.on('gameStarted', function(msg)  {
                var pi = this.state.playerInfo;
                var players = msg.players;
                for (var i = 0; i < players.length; i++) {
                    var p = players[i];

                    // if this player is us, update our info
                    if (p.playerId === pi.playerId) {
                        pi = p;
                    }
                }

                this.setState({
                    mode: MODE_PLAYING, 
                    playerInfo: pi,
                    turnIndex: 0,
                    playersInGame: players,
                    numPlayers: players.length,
                    hints: msg.hints,
                    lives: msg.lives
                });
            }.bind(this));
            s.on('gameEvent', function(msg)  {
                this.handleGameEvent(msg);
            }.bind(this));
            s.emit('getId');
            s.emit('getGameInfo');
        },
        isMyTurn:function() {
            return this.state.playerInfo.playerIndex === this.state.turnIndex % this.state.numPlayers;
        },
        tryDoMove:function(moveType, arg1, arg2, arg3) {
            // only perform the move if it is actually our turn...
            if (this.isMyTurn()) {
                switch (moveType) {
                    case EVENT_DRAW_HAND:
                        this.props.socket.emit('drawHand');
                        break;
                    case EVENT_HINT:
                        // arg1 = target playerId
                        // arg2 = hint type
                        // arg3 = cardIds effected
                        this.props.socket.emit('hint', {
                            target: arg1,
                            hintType: arg2,
                            affectedCards: arg3
                        });
                        break;
                    case EVENT_PLAY:
                        this.props.socket.emit('play', {
                            card: arg1
                        });
                        break;
                }
            }
        },
        hint:function(target, hintType, cardIds) {
            this.tryDoMove(EVENT_HINT, target, hintType, cardIds);
        },
        play:function(card) {
            this.tryDoMove(EVENT_PLAY, card);
        },
        getPlayerWithId:function(playerId) {
            var players = this.state.playersInGame;
            var len = players.length;
            for (var i = 0; i < len; i++) {
                var p = players[i];
                if (p.playerId === playerId) {
                    return p;
                }
            }
            return null;
        },
        handleGameEvent:function(gameEvent) {
            switch (gameEvent.eventType) {
                case EVENT_DRAW_HAND:
                    var p = this.getPlayerWithId(gameEvent.playerId);
                    p.hand = gameEvent.data;

                    this.setState({
                        turnIndex: this.state.turnIndex + 1
                    });
                    break;
                case EVENT_HINT:
                    if (gameEvent.data.target === this.state.playerInfo.playerId) {
                        // if this player was us...
                        this.refs.thisPlayer.animateHint(gameEvent.data);
                    } else {
                        // if someone hinted someone else...
                        // TODO
                    }

                    history.push(gameEvent);

                    this.setState({
                        turnIndex: this.state.turnIndex + 1,
                        hints: this.state.hints - 1
                    });
                    break;
            }
        },
        componentDidUpdate:function(prevProps, prevState) {
            // check if it is our turn... if it is, figure out what we need to do...
            if (this.isMyTurn()) {
                if (this.state.playerInfo.hand === undefined) {
                    // don't have a hand yet... let's draw it!
                    this.tryDoMove(EVENT_DRAW_HAND);
                } else {
                    // probably need for player to decide on a move...
                }
            }
        },
        isMyTurn:function() {
            return this.state.turnIndex % this.state.playersInGame.length === this.state.playerInfo.playerIndex;
        },
        handleOnStartGameClick:function() {
            var players = this.state.playersInGame.length;
            if (players >= 2 && players <= 5) {
                this.props.socket.emit('startGame');
            }
        },
        handleSpecialCommand:function(msg) {
            var chat = this.refs.chatbox;
            chat.v(msg);
            switch (msg) {
                case '/thisPlayer':
                    chat.v(JSON.stringify(this.state.playerInfo));
                    break;
            }
        },
        focus:function() {
            this.refs.chatbox.focus();
        },
        onPlayerOpen:function(playerInfo) {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame.filter(function(x)  {return x.playerId !== playerInfo.playerId});
            $.each(filteredPlayers, function(index, val)  {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            }.bind(this));
            this.refs.thisPlayer.close();
        },
        onThisPlayerOpen:function() {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame;
            $.each(filteredPlayers, function(index, val)  {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            }.bind(this));
        },
        showToast:function(title, message, interval) {
            this.setState({
                toastTitle: title,
                toastMessage: message,
                showToast: true
            });

            setTimeout(function()  {
                this.setState({showToast: false});
            }.bind(this), interval);
        },
        render:function() {
            var thisPlayer = this.state.playerInfo;
            var topInterface = [];
            var bottomInterface = [];
            var toastView;

            switch (this.state.mode) {
                case MODE_LOADING:
                    bottomInterface.push(React.createElement("div", {key: "spacer", className: "bottom-spacer"}, " "));
                    break;
                case MODE_WAITING:
                    var players = this.state.playersInGame.map(function(p)  {
                        return React.createElement("p", null, p.playerName);
                    });
                    bottomInterface.push(
                        React.createElement("div", {key: "waiting-view", className: "waiting-container"}, 
                            React.createElement("div", {className: "waiting-content"}, 
                                React.createElement("div", null, this.state.isHost ? "You are the host" : "Waiting on host"), 
                                this.state.isHost ? 
                                    React.createElement("a", {onClick: this.handleOnStartGameClick}, "Start the Game") :
                                    null, 
                                
                                React.createElement("h1", null, "Players"), 
                                players
                            )
                        )
                    );
                    bottomInterface.push(React.createElement("div", {key: "spacer", className: "bottom-spacer2"}, " "));
                    break;
                case MODE_PLAYING:
                    var myCards = [];
                    var playerInterfaces = [];
                    var top = [];
                    var left = [];
                    var right = [];

                    var allPlayers = this.state.playersInGame;
                    var playersExcludingSelf = [];
                    var index = this.state.playerInfo.playerIndex;
                    var len = allPlayers.length;
                    console.log(("index: " + index));
                    for (var i = (index + 1) % len; i !== index; i = (i + 1) % len) {
                        playersExcludingSelf.push(allPlayers[i]);
                    }
                    playerInterfaces = $.map(playersExcludingSelf, function(val)  {
                        return (
                            React.createElement("div", {className: "player-holder"}, 
                                React.createElement(Player, {
                                    ref: "player" + val.playerId, 
                                    playerInfo: val, 
                                    onOpen: this.onPlayerOpen, 
                                    hint: this.hint})
                            )
                        );
                    }.bind(this));

                    switch (playerInterfaces.length) {
                        case 1:
                            top.push(playerInterfaces[0]);
                            break;
                        case 2:
                            top.push(playerInterfaces[0]);
                            top.push(playerInterfaces[1]);
                            break;
                        case 3:
                            left.push(playerInterfaces[0]);
                            top.push(playerInterfaces[1]);
                            right.push(playerInterfaces[2]);
                            break;
                        case 4:
                            left.push(playerInterfaces[0]);
                            top.push(playerInterfaces[1]);
                            top.push(playerInterfaces[2]);
                            right.push(playerInterfaces[3]);
                            break;
                    }

                    bottomInterface.push(
                        React.createElement("div", {key: "spacer", className: "bottom-player-space"}, 
                            React.createElement(ThisPlayer, {playerInfo: this.state.playerInfo, ref: "thisPlayer", onOpen: this.onThisPlayerOpen, manager: this})
                        )
                    );

                    topInterface.push(
                        React.createElement("div", {className: "left-side"}, 
                            left
                        )
                    );

                    topInterface.push(
                        React.createElement("div", {className: "right-side"}, 
                            right
                        )
                    );

                    topInterface.push(
                        React.createElement("div", {className: "main-side"}, 
                            React.createElement("div", {className: "top-size"}, 
                                top
                            )
                        )
                    );

                    topInterface.push(
                        React.createElement(InfoBar, {
                            hints: this.state.hints, 
                            lives: this.state.lives}
                            )
                    );

                    break;
            }

            if (this.state.showToast) {
                toastView = (
                    React.createElement("div", {className: "toast-container"}, 
                        React.createElement("div", {className: "toast"}, 
                            React.createElement("h1", null, this.state.toastTitle), 
                            React.createElement("p", null, this.state.toastMessage)
                        )
                    )
                );
            }

            return (
                React.createElement("div", {className: "game-room"}, 
                    React.createElement("div", {className: "top-content"}, 
                        topInterface
                    ), 
                    React.createElement("div", {className: "bot-content"}, 
                        React.createElement(ChatBox, {
                            ref: "chatbox", 
                            playerInfo: this.state.playerInfo, 
                            socket: this.props.socket, 
                            className: "chat-box", 
                            handleSpecialCommand: this.handleSpecialCommand}), 
                        bottomInterface
                    ), 
                    toastView
                )
            );
        }
    });

    return GameRoom;
});