define(['jquery', 'React', 'app/lobby/top_bar', 'app/lobby/rooms_list', 'app/lobby/new_game_view', 'app/lobby/join_game_view', 'app/lobby/how_to_play_view',
    'app/lobby/about_view', 'app/options_view', 'app/log'], 
    function ($, React, TopBar, RoomsList, NewGameView, JoinGameView, HowToPlayView, AboutView, OptionsView, Log) {

    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    /*
    [
                                    {gameId: 79, gameName: "Wtf gtfo...", numPlayers: 5, maxPlayers: 5, observers: 2, status: 1},
                                    {gameId: 1, gameName: "Wtf gtfo...", numPlayers: 5, maxPlayers: 5, observers: 2, status: 1}
                                    ]
    */

    const TAG = 'LobbyView';

    const NONE = 0;
    const VIEW_NEW_GAME = 1;
    const VIEW_HOW_TO_PLAY = 2;
    const VIEW_ABOUT = 3;
    const VIEW_OPTIONS = 4;

    var LobbyView = React.createClass({displayName: "LobbyView",
        getInitialState:function() {
            return {
                leftView: NONE,
                rooms: [],

                roomSelected: null,
            };
        },
        componentWillMount:function() {
            var socket = this.props.socket;
            socket.on('getRooms', function(msg)  {
                this.setState({rooms: msg.rooms});
            }.bind(this));
            socket.emit('getRooms');

            socket.on('roomsUpdate', function(msg)  {
                var dirty = false;
                if (msg.added != undefined) {
                    $.each(msg.added, function(i, val)  {
                        this.state.rooms.push(val);
                    }.bind(this));
                    dirty = true;
                }
                if (msg.removed != undefined) {
                    $.each(msg.removed, function(i, val)  {
                        this.state.rooms = $.grep(this.state.rooms, function(val)  {
                            return val.gameId === val;
                        });
                    }.bind(this));
                    dirty = true;
                }

                if (dirty) {
                    this.setState();
                }
            }.bind(this));
        },
        onNewGameClick:function(e) {
            this.setState({leftView: VIEW_NEW_GAME});
        },
        onNewGameCancelClick:function(e) {
            this.setState({leftView: NONE});
        },
        onHowToPlayClick:function(e) {
            this.setState({leftView: VIEW_HOW_TO_PLAY});
        },
        onNewGameMakeClick:function(roomName, roomType) {
            var socket = this.props.socket;
            socket.once('makeRoom', function(msg)  {
                socket.once('joinGame', function(msg)  {
                    Log.d(TAG, "Got message: %O", msg);
                    this.props.onNewGame(roomName);
                }.bind(this));
                socket.emit('joinGame', {gameId: msg.gameId});
            }.bind(this));
            socket.emit('makeRoom', {roomName: roomName});
        },
        onRoomSelected:function(gameId) {
        },
        onJoinGameClick:function(gameId) {
            this.props.socket.once('getRoomInfo', function(msg)  {
                this.onJoinGame(msg.name, gameId);
            }.bind(this));
            this.props.socket.emit('getRoomInfo', {gameId: gameId});
        },
        onJoinGameCancelClick:function(e) {
            this.setState({roomSelected: null});
        },
        onJoinGame:function(roomName, gameId) {
            this.props.socket.emit('joinGame', {gameId: gameId});
            this.props.onJoinGame(roomName);
        },
        onHowToPlayOkClick:function(e) {
            this.setState({leftView: NONE});
        },
        onAboutClick:function(e) {
            this.setState({leftView: VIEW_ABOUT});
        },
        onAboutOkClick:function(e) {
            this.setState({leftView: NONE});
        },
        onOptionsClick:function(e) {
            this.setState({leftView: VIEW_OPTIONS});
        },
        onOptionsCancelClick:function(e) {
            this.setState({leftView: NONE});
        },
        onRefreshClick:function(e) {
            this.props.socket.emit('getRooms');
        },
        render:function() {
            var value = this.state.value;
            var leftView;
            var joinGameView;

            switch (this.state.leftView) {
                case VIEW_NEW_GAME:
                    leftView = (
                        React.createElement(NewGameView, {
                            key: "newGameView", 
                            defaultRoomName: this.props.playerInfo.playerName + "'s room", 
                            onCancelClickHandler: this.onNewGameCancelClick, 
                            onNewGameClickHandler: this.onNewGameMakeClick})
                    );
                    break;
                case VIEW_HOW_TO_PLAY:
                    leftView = (
                        React.createElement(HowToPlayView, {
                            key: "howToPlayView", 
                            onOkClickHandler: this.onHowToPlayOkClick})
                    );
                    break;
                case VIEW_ABOUT:
                    leftView = (
                        React.createElement(AboutView, {
                            key: "aboutView", 
                            onOkClickHandler: this.onAboutOkClick})
                    );
                    break;
                case VIEW_OPTIONS:
                    leftView = (
                        React.createElement(OptionsView, {
                            key: "optionsView", 
                            onCancelClickHandler: this.onOptionsCancelClick, 
                            onOkClickHandler: this.onOptionsCancelClick})
                    );
                    break;
            }

            if (this.state.roomSelected !== null) {
                joinGameView = (
                    React.createElement(JoinGameView, {
                        roomInfo: this.state.roomSelected, 
                        onCancelClickHandler: this.onJoinGameCancelClick, 
                        onJoinGameClickHandler: this.onJoinGame}
                        )
                );
            }

            return (
                React.createElement("div", {className: "lobby-view"}, 
                    React.createElement("div", {style: {display: 'flex', 'flex-direction': 'row'}}, 
                        React.createElement(TopBar, {
                            onNewGameClickHandler: this.onNewGameClick, 
                            onHowToPlayClickHandler: this.onHowToPlayClick, 
                            onOptionsClickHandler: this.onOptionsClick, 
                            onAboutClickHandler: this.onAboutClick})
                    ), 
                    React.createElement("div", {className: "body"}, 
                        React.createElement("div", {className: "body-left"}
                        ), 
                        React.createElement("div", {className: "body-right"}, 
                            React.createElement("div", {className: "top-spacer"}, " "), 
                            React.createElement(RoomsList, {
                                rooms: this.state.rooms, 
                                onRoomSelected: this.onRoomSelected, 
                                onJoinGame: this.onJoinGameClick, 
                                onRefreshClickHandler: this.onRefreshClick}), 
                            
                            React.createElement(ReactTransitionGroup, {
                                transitionName: "slide-up", 
                                className: "bottom-sticky", 
                                transitionEnterTimeout: 300, 
                                transitionLeaveTimeout: 300}, 
                                joinGameView
                            )
                        ), 

                        React.createElement("div", {className: "overlay"}, 
                            React.createElement(ReactTransitionGroup, {transitionName: "slide-right", transitionEnterTimeout: 300, transitionLeaveTimeout: 300}, 
                                leftView
                            )
                        )
                    )
                )
            );
        }
    });

    return LobbyView;
});