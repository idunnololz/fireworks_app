define(['jquery', 'React', 'app/lobby/top_bar', 'app/lobby/rooms_list', 'app/lobby/new_game_view', 'app/lobby/join_game_view'], 
    function ($, React, TopBar, RoomsList, NewGameView, JoinGameView) {

    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    /*
    [
                                    {gameId: 79, gameName: "Wtf gtfo...", numPlayers: 5, maxPlayers: 5, observers: 2, status: 1},
                                    {gameId: 1, gameName: "Wtf gtfo...", numPlayers: 5, maxPlayers: 5, observers: 2, status: 1}
                                    ]
    */

    var LobbyView = React.createClass({
        getInitialState() {
            return {
                showNewGame: false,
                rooms: [],

                roomSelected: null,
            };
        },
        componentWillMount() {
            var socket = this.props.socket;
            var handler = (msg) => {
                this.setState({rooms: msg.rooms});
            };
            socket.on('getRooms', handler);
            socket.emit('getRooms');

            socket.on('roomsUpdate', (msg) => {
                var dirty = false;
                if (msg.added != undefined) {
                    $.each(msg.added, (i, val) => {
                        this.state.rooms.push(val);
                    });
                    dirty = true;
                }
                if (msg.removed != undefined) {
                    $.each(msg.removed, (i, val) => {
                        this.state.rooms = $.grep(this.state.rooms, (val) => {
                            return val.gameId === val;
                        });
                    });
                    dirty = true;
                }

                if (dirty) {
                    this.setState();
                }
            });
        },
        onNewGameClick(e) {
            this.setState({showNewGame: true});
        },
        onNewGameCancelClick(e) {
            this.setState({showNewGame: false});
        },
        onNewGameMakeClick(roomName, roomType) {
            var socket = this.props.socket;
            var handler = (msg) => {
                socket.removeListener('makeRoom', handler);
                socket.emit('joinGame', {gameId: msg.gameId});

                this.props.onNewGame(roomName);
            };
            socket.on('makeRoom', handler);
            socket.emit('makeRoom', {roomName: roomName});
        },
        onRoomSelected(gameId) {
            var handler = (msg) => {
                this.setState({roomSelected: msg});
                this.props.socket.removeListener('getRoomInfo', handler);
            };

            this.props.socket.on('getRoomInfo', handler);
            this.props.socket.emit('getRoomInfo', {gameId: gameId});
        },
        onJoinGameCancelClick(e) {
            this.setState({roomSelected: null});
        },
        onJoinGame(roomName, gameId) {
            this.props.socket.emit('joinGame', {gameId: gameId});
            this.props.onJoinGame(roomName);
        },
        render() {
            var value = this.state.value;
            var newGameView;
            var joinGameView;

            if (this.state.showNewGame) {
                newGameView = (
                    <NewGameView 
                        key="newGameView" 
                        defaultRoomName={this.props.playerInfo.playerName + "'s dank room"}
                        onCancelClickHandler={this.onNewGameCancelClick}
                        onNewGameClickHandler={this.onNewGameMakeClick}/>
                );
            }

            if (this.state.roomSelected !== null) {
                joinGameView = (
                    <JoinGameView
                        roomInfo={this.state.roomSelected}
                        onCancelClickHandler={this.onJoinGameCancelClick}
                        onJoinGameClickHandler={this.onJoinGame}
                        />
                );
            }

            return (
                <div className="lobby-view">
                    <div style={{display: 'flex', 'flex-direction': 'row'}}>
                        <TopBar onNewGameClickHandler={this.onNewGameClick}/>
                    </div>
                    <div className="body">
                        <div className="body-left">
                        </div>
                        <div className="body-right">
                            <div className="top-spacer"> </div>
                            <RoomsList rooms={this.state.rooms} onRoomSelected={this.onRoomSelected}/>
                            
                            <ReactTransitionGroup 
                                transitionName="slide-up" 
                                className="bottom-sticky"
                                transitionEnterTimeout={300} 
                                transitionLeaveTimeout={300}>
                                {joinGameView}
                            </ReactTransitionGroup>
                        </div>

                        <div className="overlay">
                            <ReactTransitionGroup transitionName="slide-right" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
                                {newGameView}
                            </ReactTransitionGroup>
                        </div>
                    </div>
                </div>
            );
        }
    });

    return LobbyView;
});