require(['app/consts', 'jquery', 'React', 'libs/socket.io', 'app/game_room', 'libs/timeout_transition_group', 'app/sign_in_view', 
    'app/lobby/lobby_view', 'app/prefs', 'app/resource_loader', 'app/log'], 
    function (Consts, $, React, io, GameRoom, TimeoutTransitionGroup, SignInView, LobbyView, Prefs, ResourceLoader, Log) {

    Prefs.load();    
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const PAGE_JOIN_GAME = 1; /** Deprecated. Original Join Game page. */
    const PAGE_IN_ROOM = 2;
    const PAGE_LOAD = 3;
    const PAGE_SIGN_IN = 4;
    const PAGE_LOBBY = 5;

    const TAG = "Index";

    var endpoint;
    if (Consts.PROD) {
        endpoint = "https://murmuring-mountain-5923.herokuapp.com";
        //endpoint = "http://185.28.22.25:3000";
    } else {
        endpoint = "http://localhost:3000";
    }

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            // refresh the page when the user tabs back. This is to address some weird chrome render bug
            var main = document.getElementById('main');
            main.style.display='none';
            main.offsetHeight; // no need to store this anywhere, the reference is enough
            main.style.display='';
        }
    });

    document.onkeypress = function (e) {
        e = e || window.event;

        if (e.keyCode === 13 && gameUi !== undefined) {
            gameUi.focus();
        }
    };

    if (Consts.PROD) {
        // heroku keep alive
        setInterval(function() {
            $.get("https://murmuring-mountain-5923.herokuapp.com/ping", function(data) {
            });
        }, 300000); // every 5 minutes (300000)
    }

    var navHandler = function(evt)  {
        var message = 'You are in a game.';
        if (typeof evt == 'undefined') {
            evt = window.event;
        }
        if (evt) {
            evt.returnValue = message;
        }
        return message;
    };

    function onChangeLocation(newLocation) {
        if (newLocation === PAGE_IN_ROOM) {
            window.onbeforeunload = navHandler;
        } else {
            window.onbeforeunload = null;
        }
    }

    var GameUi = React.createClass({displayName: "GameUi",
        getInitialState:function() {
            return {
                where: PAGE_SIGN_IN,
                gameCount: 0,
                isDisconnected: false,
                isConnecting: false,
            };
        },
        joinTestGame:function() {
            if (Consts.PROD) return;
            // hack this sht so we can go into a room immediately...
            var socket = this.props.socket;
            socket.once('joinGame', function(msg)  {
                if (msg === true) {
                    this.onJoinGame('tester');
                } else {
                    // must mean we couldn't join the game...
                    socket.once('joinGame', function(msg)  {
                        this.onJoinGame('tester');
                    }.bind(this));
                    socket.emit('makeRoom', {gameId: 1000, roomName: 'tester', enterRoom: true});
                }
            }.bind(this));
            socket.emit('joinGame', {gameId: 1000});
        },
        componentWillMount:function() {
            var s = this.props.socket;
            s.once('getSelf', function(msg)  {
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);

                // TEST LINE
                this.joinTestGame();
                // TEST LINE
            }.bind(this));
            s.emit('getSelf');

            s.on('disconnect', function()  {
                Log.d(TAG, "Disconnected.");
                this.setState({isDisconnected: true});
                // $('*').css({
                //     filter: 'grayscale(100%)',
                //     '-moz-filter': 'grayscale(100%)',
                //     '-webkit-filter': 'grayscale(100%)'
                // });
                // $('body,html').css('background','#282828');
            }.bind(this));

            // setTimeout(() => {
            //     s.disconnect();
            // }, 5000);
        },
        componentDidUpdate:function() {
            this.props.onChangeLocation(this.state.where);
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
            this.setState({gameCount: this.state.gameCount + 1});
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
        onReconnectClick:function() {
            this.setState({isConnecting: true});
            var socket = io.connect(endpoint, {'forceNew': true});
            socket.once('connect', function()  {
                this.setState({where: PAGE_SIGN_IN, isConnecting: false, isDisconnected: false});      
            }.bind(this));
            this.setProps({socket: socket});
        },
        render:function() {
            var content;
            var dimFilter;
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
                        React.createElement(GameRoom, {ref: "gameRoom", key: 'gameCount' + this.state.gameCount, socket: this.props.socket, onLeaveRoom: this.onLeaveRoom})
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

            if (this.state.isDisconnected) {
                dimFilter = (
                    React.createElement("div", {className: "dim-filter"}, 
                        React.createElement("div", {className: "message-box"}, 
                            React.createElement("p", null, "You have been disconnected"), 
                            React.createElement("button", {className: "theme-button", onClick: this.onReconnectClick}, "Reconnect")
                        )
                    )
                );
            }

            return (
                React.createElement("div", {className: "main-container"}, 
                    React.createElement(ReactTransitionGroup, {
                        transitionName: "fade", 
                        transitionEnterTimeout: 300, transitionLeaveTimeout: 300, 
                        transitionAppear: true}, 
                        content
                    ), 
                    React.createElement(ReactTransitionGroup, {
                        transitionName: "fade", 
                        transitionEnterTimeout: 300, transitionLeaveTimeout: 300, 
                        transitionAppear: true}, 
                        dimFilter
                    )
                )
            );
        }
    });

    var gameUi = React.render(
        React.createElement(GameUi, {socket: io(endpoint), onChangeLocation: onChangeLocation}),
        $("#main")[0]
    );
});