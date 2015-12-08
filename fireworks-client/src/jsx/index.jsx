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

    var navHandler = (evt) => {
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

    var GameUi = React.createClass({
        getInitialState() {
            return {
                where: PAGE_SIGN_IN,
                gameCount: 0,
                isDisconnected: false,
                isConnecting: false,
            };
        },
        joinTestGame() {
            if (Consts.PROD) return;
            // hack this sht so we can go into a room immediately...
            var socket = this.props.socket;
            socket.once('joinGame', (msg) => {
                if (msg === true) {
                    this.onJoinGame('tester');
                } else {
                    // must mean we couldn't join the game...
                    socket.once('joinGame', (msg) => {
                        this.onJoinGame('tester');
                    });
                    socket.emit('makeRoom', {gameId: 1000, roomName: 'tester', enterRoom: true});
                }
            });
            socket.emit('joinGame', {gameId: 1000});
        },
        componentWillMount() {
            var s = this.props.socket;
            s.once('getSelf', (msg) => {
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);

                // TEST LINE
                this.joinTestGame();
                // TEST LINE
            });
            s.emit('getSelf');

            s.on('disconnect', () => {
                Log.d(TAG, "Disconnected.");
                this.setState({isDisconnected: true});
                // $('*').css({
                //     filter: 'grayscale(100%)',
                //     '-moz-filter': 'grayscale(100%)',
                //     '-webkit-filter': 'grayscale(100%)'
                // });
                // $('body,html').css('background','#282828');
            });

            // setTimeout(() => {
            //     s.disconnect();
            // }, 5000);
        },
        componentDidUpdate() {
            this.props.onChangeLocation(this.state.where);
        },
        onResourceLoaded() {
            this.setState({where: this.state.dest});
        },
        joinGameClick(e) {
            // deprecated...
            if (Consts.PROD) {
                console.log("hi");
                this.setState({where: PAGE_LOAD, dest: PAGE_SIGN_IN});
            } else {
                this.setState({where: PAGE_SIGN_IN});
            }
        },
        focus() {
            if (this.refs.gameRoom !== undefined) {
                this.refs.gameRoom.focus();
            }
        },
        setPlayerName(newName) {
            this.state.playerInfo.playerName = newName;
        },
        loginSuccess() {
            this.setState({where: PAGE_LOBBY});
        },
        onNewGame(roomName) {
            this.setState({gameCount: this.state.gameCount + 1});
            if (Consts.PROD) {
                this.setState({where: PAGE_LOAD, dest: PAGE_IN_ROOM});
            } else {
                this.setState({where: PAGE_IN_ROOM});
            }
        },
        onJoinGame(roomName) {
            this.onNewGame(roomName);
        },
        onLeaveRoom() {
            this.setState({where: PAGE_LOBBY});
        },
        onReconnectClick() {
            this.setState({isConnecting: true});
            var socket = io.connect(endpoint, {'forceNew': true});
            socket.once('connect', () => {
                this.setState({where: PAGE_SIGN_IN, isConnecting: false, isDisconnected: false});      
            });
            this.setProps({socket: socket});
        },
        render() {
            var content;
            var dimFilter;
            switch (this.state.where) {
                /** Deprecated. Original Join Game page. */
                case PAGE_JOIN_GAME:
                    content = (
                        <div key={PAGE_JOIN_GAME} className="join-game-container">
                            <a className="button join-game" onClick={this.joinGameClick}>Join Game</a>
                        </div>
                    );
                    break;
                /** ^^^ Deprecated. Original Join Game page. ^^^ */
                case PAGE_LOAD:
                    content = (
                        <ResourceLoader key={PAGE_LOAD} onLoaded={this.onResourceLoaded}/>
                    );
                    break;
                case PAGE_IN_ROOM:
                    content = (
                        <GameRoom ref="gameRoom" key={'gameCount' + this.state.gameCount} socket={this.props.socket} onLeaveRoom={this.onLeaveRoom}/>
                    );
                    break;
                case PAGE_SIGN_IN:
                    content = (<SignInView ref="signInView" key={PAGE_SIGN_IN} socket={this.props.socket} playerInfo={this.state.playerInfo} 
                        pageController={this}/>);
                    break;
                case PAGE_LOBBY:
                    content = (<LobbyView 
                        key={PAGE_LOBBY} 
                        socket={this.props.socket} 
                        playerInfo={this.state.playerInfo}
                        onNewGame={this.onNewGame}
                        onJoinGame={this.onJoinGame}/>);
                    break;
            }

            if (this.state.isDisconnected) {
                dimFilter = (
                    <div className="dim-filter">
                        <div className="message-box">
                            <p>You have been disconnected</p>
                            <button className="theme-button" onClick={this.onReconnectClick}>Reconnect</button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="main-container">
                    <ReactTransitionGroup  
                        transitionName="fade"
                        transitionEnterTimeout={300} transitionLeaveTimeout={300}
                        transitionAppear={true}>
                        {content}
                    </ReactTransitionGroup>
                    <ReactTransitionGroup  
                        transitionName="fade"
                        transitionEnterTimeout={300} transitionLeaveTimeout={300}
                        transitionAppear={true}>
                        {dimFilter}
                    </ReactTransitionGroup>
                </div>
            );
        }
    });

    var gameUi = React.render(
        <GameUi socket={io(endpoint)} onChangeLocation={onChangeLocation}/>,
        $("#main")[0]
    );
});