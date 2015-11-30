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
        //endpoint = "http://185.28.22.25:3000";
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
            $.get("https://murmuring-mountain-5923.herokuapp.com/ping", function(data) {
                console.log("result: " + data);
            });
        }, 300000); // every 5 minutes (300000)
    }

    var GameUi = React.createClass({
        getInitialState() {
            return {
                where: PAGE_SIGN_IN
            };
        },
        joinTestGame() {
            // hack this sht so we can go into a room immediately...
            var socket = this.props.socket;
            socket.once('joinGame', (msg) => {
                if (msg === true) {
                    this.onJoinGame('tester');
                } else {
                    // must mean we couldn't join the game...
                    socket.once('makeRoom', (msg) => {
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
        render() {
            var content;
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
                        <GameRoom ref="gameRoom" key={PAGE_IN_ROOM} socket={this.props.socket} onLeaveRoom={this.onLeaveRoom}/>
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

            return (
                <div className="main-container">
                    <ReactTransitionGroup  
                        transitionName="fade"
                        transitionEnterTimeout={300} transitionLeaveTimeout={300}
                        transitionAppear={true}>
                        {content}
                    </ReactTransitionGroup>
                </div>
            );
        }
    });

    var gameUi = React.render(
        <GameUi socket={io(endpoint)}/>,
        $("#main")[0]
    );
});