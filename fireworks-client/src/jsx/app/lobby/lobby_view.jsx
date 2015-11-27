define(['jquery', 'React', 'app/lobby/top_bar', 'app/lobby/rooms_list', 'app/lobby/new_game_view', 'app/lobby/join_game_view', 'app/lobby/how_to_play_view',
    'app/lobby/about_view', 'app/options_view'], 
    function ($, React, TopBar, RoomsList, NewGameView, JoinGameView, HowToPlayView, AboutView, OptionsView) {

    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    /*
    [
                                    {gameId: 79, gameName: "Wtf gtfo...", numPlayers: 5, maxPlayers: 5, observers: 2, status: 1},
                                    {gameId: 1, gameName: "Wtf gtfo...", numPlayers: 5, maxPlayers: 5, observers: 2, status: 1}
                                    ]
    */

    const NONE = 0;
    const VIEW_NEW_GAME = 1;
    const VIEW_HOW_TO_PLAY = 2;
    const VIEW_ABOUT = 3;
    const VIEW_OPTIONS = 4;

    var LobbyView = React.createClass({
        getInitialState() {
            return {
                leftView: NONE,
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
            this.setState({leftView: VIEW_NEW_GAME});
        },
        onNewGameCancelClick(e) {
            this.setState({leftView: NONE});
        },
        onHowToPlayClick(e) {
            this.setState({leftView: VIEW_HOW_TO_PLAY});
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
        onHowToPlayOkClick(e) {
            this.setState({leftView: NONE});
        },
        onAboutClick(e) {
            this.setState({leftView: VIEW_ABOUT});
        },
        onAboutOkClick(e) {
            this.setState({leftView: NONE});
        },
        onOptionsClick(e) {
            this.setState({leftView: VIEW_OPTIONS});
        },
        onOptionsCancelClick(e) {
            this.setState({leftView: NONE});
        },
        render() {
            var value = this.state.value;
            var leftView;
            var joinGameView;

            switch (this.state.leftView) {
                case VIEW_NEW_GAME:
                    leftView = (
                        <NewGameView 
                            key="newGameView" 
                            defaultRoomName={this.props.playerInfo.playerName + "'s dank room"}
                            onCancelClickHandler={this.onNewGameCancelClick}
                            onNewGameClickHandler={this.onNewGameMakeClick}/>
                    );
                    break;
                case VIEW_HOW_TO_PLAY:
                    leftView = (
                        <HowToPlayView 
                            key="howToPlayView" 
                            onOkClickHandler={this.onHowToPlayOkClick}/>
                    );
                    break;
                case VIEW_ABOUT:
                    leftView = (
                        <AboutView
                            key="aboutView" 
                            onOkClickHandler={this.onAboutOkClick}/>
                    );
                    break;
                case VIEW_OPTIONS:
                    leftView = (
                        <OptionsView
                            key="optionsView"
                            onCancelClickHandler={this.onOptionsCancelClick}
                            onOkClickHandler={this.onOptionsCancelClick}/>
                    );
                    break;
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
                        <TopBar 
                            onNewGameClickHandler={this.onNewGameClick}
                            onHowToPlayClickHandler={this.onHowToPlayClick}
                            onOptionsClickHandler={this.onOptionsClick}
                            onAboutClickHandler={this.onAboutClick}/>
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
                                {leftView}
                            </ReactTransitionGroup>
                        </div>
                    </div>
                </div>
            );
        }
    });

    return LobbyView;
});