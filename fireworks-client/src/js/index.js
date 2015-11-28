require(['app/consts', 'jquery', 'React', 'libs/socket.io', 'app/game_room', 'libs/timeout_transition_group', 'app/sign_in_view', 'app/lobby/lobby_view',
    'app/prefs', 'app/resource_loader'], 
    function (Consts, $, React, io, GameRoom, TimeoutTransitionGroup, SignInView, LobbyView, Prefs, ResourceLoader) {

    Prefs.load();    
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const PAGE_JOIN_GAME = 1; /** Deprecated. Original Join Game page. */
    const PAGE_IN_ROOM = 2;
    const PAGE_LOAD = 3;
    const PAGE_SIGN_IN = 4;
    const PAGE_LOBBY = 5;

    var endpoint;
    if (Consts.PROD) {
        endpoint = "https://murmuring-mountain-5923.herokuapp.com";
    } else {
        endpoint = "http://localhost:3000";
    }

    document.onkeypress = function (e) {
        e = e || window.event;

        if (e.keyCode === 13 && gameUi !== undefined) {
            gameUi.focus();
        }
    };

    if (Consts.PROD) {
        // heroku keep alive
        setInterval(function() {
            $.get("https://murmuring-mountain-5923.herokuapp.com/", function(data) {
                console.log("result: " + data);
            });
        }, 300000); // every 5 minutes (300000)
    } else {
        setInterval(function() {
            $.get("http://localhost:3000/ping/", function(data) {
                console.log("result: " + data);
            });
        }, 3000); // every 5 minutes (300000)
    }

    var GameUi = React.createClass({displayName: "GameUi",
        getInitialState:function() {
            return {
                where: PAGE_SIGN_IN
            };
        },
        joinTestGame:function() {
            // hack this sht so we can go into a room immediately...
            var socket = this.props.socket;
            socket.on('joinGame', function(msg)  {
                if (msg === true) {
                    this.onJoinGame('tester');
                } else {
                    // must mean we couldn't join the game...
                    socket.on('makeRoom', function(msg)  {
                        this.onJoinGame('tester');
                    }.bind(this));
                    socket.emit('makeRoom', {gameId: 1000, roomName: 'tester', enterRoom: true});
                }
            }.bind(this));
            socket.emit('joinGame', {gameId: 1000});
        },
        componentWillMount:function() {
            var s = this.props.socket;
            var handler = function(msg)  {
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);

                // TEST LINE
                //this.joinTestGame();
                // TEST LINE

                s.removeListener('getSelf', handler);
            }.bind(this);
            s.on('getSelf', handler);
            s.emit('getSelf');
        },
        onResourceLoaded:function() {
            this.setState({where: this.state.dest});
        },
        joinGameClick:function(e) {
            // deprecated...
            if (Consts.PROD) {
                console.log("hi");
                this.setState({where: PAGE_LOAD, dest: PAGE_SIGN_IN});
            } else {
                this.setState({where: PAGE_SIGN_IN});
            }
        },
        focus:function() {
            if (this.refs.gameRoom !== undefined) {
                this.refs.gameRoom.focus();
            }
        },
        setPlayerName:function(newName) {
            this.state.playerInfo.playerName = newName;
        },
        loginSuccess:function() {
            this.setState({where: PAGE_LOBBY});
        },
        onNewGame:function(roomName) {
            if (Consts.PROD) {
                this.setState({where: PAGE_LOAD, dest: PAGE_IN_ROOM});
            } else {
                this.setState({where: PAGE_IN_ROOM});
            }
        },
        onJoinGame:function(roomName) {
            this.onNewGame(roomName);
        },
        onLeaveRoom:function() {
            this.setState({where: PAGE_LOBBY});
        },
        render:function() {
            var content;
            switch (this.state.where) {
                /** Deprecated. Original Join Game page. */
                case PAGE_JOIN_GAME:
                    content = (
                        React.createElement("div", {key: PAGE_JOIN_GAME, className: "join-game-container"}, 
                            React.createElement("a", {className: "button join-game", onClick: this.joinGameClick}, "Join Game")
                        )
                    );
                    break;
                /** ^^^ Deprecated. Original Join Game page. ^^^ */
                case PAGE_LOAD:
                    content = (
                        React.createElement(ResourceLoader, {key: PAGE_LOAD, onLoaded: this.onResourceLoaded})
                    );
                    break;
                case PAGE_IN_ROOM:
                    content = (
                        React.createElement(GameRoom, {ref: "gameRoom", key: PAGE_IN_ROOM, socket: this.props.socket, onLeaveRoom: this.onLeaveRoom})
                    );
                    break;
                case PAGE_SIGN_IN:
                    content = (React.createElement(SignInView, {ref: "signInView", key: PAGE_SIGN_IN, socket: this.props.socket, playerInfo: this.state.playerInfo, 
                        pageController: this}));
                    break;
                case PAGE_LOBBY:
                    content = (React.createElement(LobbyView, {
                        key: PAGE_LOBBY, 
                        socket: this.props.socket, 
                        playerInfo: this.state.playerInfo, 
                        onNewGame: this.onNewGame, 
                        onJoinGame: this.onJoinGame}));
                    break;
            }

            return (
                React.createElement("div", {className: "main-container"}, 
                    React.createElement(ReactTransitionGroup, {
                        transitionName: "fade", 
                        transitionEnterTimeout: 300, transitionLeaveTimeout: 300, 
                        transitionAppear: true}, 
                        content
                    )
                )
            );
        }
    });

    var gameUi = React.render(
        React.createElement(GameUi, {socket: io(endpoint)}),
        $("#main")[0]
    );
});