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

    var GameRoom = React.createClass({
        getInitialState() {
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
        componentWillMount() {
            var s = this.props.socket;
            s.on('getId', (msg) => {
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);
            });
            s.on('getGameInfo', (msg) => {
                console.log(msg);
                if (msg.gameStarted) {
                    this.setState({mode: MODE_SPECTATOR, playersInGame: msg.playersInGame});
                } else {
                    this.setState({mode: MODE_WAITING, playersInGame: msg.playersInGame, isHost: msg.isHost});
                }
            });
            s.on('playerJoined', (msg) => {
                console.log(msg);
                var ps = this.state.playersInGame;
                ps.push(msg);
                this.setState({playersInGame: ps});
            });
            s.on('playerLeft', (msg) => {
                console.log(msg);
                var ps = this.state.playersInGame;
                ps = ps.filter((val) => {
                    return val.playerId !== msg.playerId;
                });
                this.setState({playersInGame: ps});
            });
            s.on('isHost', (msg) => {
                // for when the host changes...
                this.setState({isHost: msg});
            });
            s.on('gameStarted', (msg) => {
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
            });
            s.on('gameEvent', (msg) => {
                this.handleGameEvent(msg);
            });
            s.emit('getId');
            s.emit('getGameInfo');
        },
        isMyTurn() {
            return this.state.playerInfo.playerIndex === this.state.turnIndex % this.state.numPlayers;
        },
        tryDoMove(moveType, arg1, arg2, arg3) {
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
        hint(target, hintType, cardIds) {
            this.tryDoMove(EVENT_HINT, target, hintType, cardIds);
        },
        play(card) {
            this.tryDoMove(EVENT_PLAY, card);
        },
        getPlayerWithId(playerId) {
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
        handleGameEvent(gameEvent) {
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
        componentDidUpdate(prevProps, prevState) {
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
        isMyTurn() {
            return this.state.turnIndex % this.state.playersInGame.length === this.state.playerInfo.playerIndex;
        },
        handleOnStartGameClick() {
            var players = this.state.playersInGame.length;
            if (players >= 2 && players <= 5) {
                this.props.socket.emit('startGame');
            }
        },
        handleSpecialCommand(msg) {
            var chat = this.refs.chatbox;
            chat.v(msg);
            switch (msg) {
                case '/thisPlayer':
                    chat.v(JSON.stringify(this.state.playerInfo));
                    break;
            }
        },
        focus() {
            this.refs.chatbox.focus();
        },
        onPlayerOpen(playerInfo) {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame.filter((x) => {return x.playerId !== playerInfo.playerId});
            $.each(filteredPlayers, (index, val) => {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            });
            this.refs.thisPlayer.close();
        },
        onThisPlayerOpen() {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame;
            $.each(filteredPlayers, (index, val) => {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            });
        },
        showToast(title, message, interval) {
            this.setState({
                toastTitle: title,
                toastMessage: message,
                showToast: true
            });

            setTimeout(() => {
                this.setState({showToast: false});
            }, interval);
        },
        render() {
            var thisPlayer = this.state.playerInfo;
            var topInterface = [];
            var bottomInterface = [];
            var toastView;

            switch (this.state.mode) {
                case MODE_LOADING:
                    bottomInterface.push(<div key="spacer" className="bottom-spacer"> </div>);
                    break;
                case MODE_WAITING:
                    var players = this.state.playersInGame.map((p) => {
                        return <p>{p.playerName}</p>;
                    });
                    bottomInterface.push(
                        <div key="waiting-view" className="waiting-container"> 
                            <div className="waiting-content">
                                <div>{this.state.isHost ? "You are the host" : "Waiting on host"}</div>
                                {this.state.isHost ? 
                                    <a onClick={this.handleOnStartGameClick}>Start the Game</a> :
                                    null
                                }
                                <h1>Players</h1>
                                {players}
                            </div>
                        </div>
                    );
                    bottomInterface.push(<div key="spacer" className="bottom-spacer2"> </div>);
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
                    console.log(`index: ${index}`);
                    for (var i = (index + 1) % len; i !== index; i = (i + 1) % len) {
                        playersExcludingSelf.push(allPlayers[i]);
                    }
                    playerInterfaces = $.map(playersExcludingSelf, (val) => {
                        return (
                            <div className="player-holder">
                                <Player 
                                    ref={"player" + val.playerId} 
                                    playerInfo={val} 
                                    onOpen={this.onPlayerOpen}
                                    hint={this.hint}/>
                            </div>
                        );
                    });

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
                        <div key="spacer" className="bottom-player-space">
                            <ThisPlayer playerInfo={this.state.playerInfo} ref="thisPlayer" onOpen={this.onThisPlayerOpen} manager={this}/>
                        </div>
                    );

                    topInterface.push(
                        <div className="left-side">
                            {left}
                        </div>
                    );

                    topInterface.push(
                        <div className="right-side">
                            {right}
                        </div>
                    );

                    topInterface.push(
                        <div className="main-side">
                            <div className="top-size">
                                {top}
                            </div>
                        </div>
                    );

                    topInterface.push(
                        <InfoBar
                            hints={this.state.hints}
                            lives={this.state.lives}
                            />
                    );

                    break;
            }

            if (this.state.showToast) {
                toastView = (
                    <div className="toast-container">
                        <div className="toast">
                            <h1>{this.state.toastTitle}</h1>
                            <p>{this.state.toastMessage}</p>
                        </div>
                    </div>
                );
            }

            return (
                <div className="game-room">
                    <div className="top-content">
                        {topInterface}
                    </div>
                    <div className="bot-content">
                        <ChatBox 
                            ref="chatbox"
                            playerInfo={this.state.playerInfo} 
                            socket={this.props.socket} 
                            className="chat-box"
                            handleSpecialCommand={this.handleSpecialCommand}/>
                        {bottomInterface}
                    </div>
                    {toastView}
                </div>
            );
        }
    });

    return GameRoom;
});