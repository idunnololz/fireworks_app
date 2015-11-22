define(['jquery', 'React', 'app/chat_box', 'app/player', 'app/this_player', 'app/info_bar', 'app/menu_bar', 'app/game_board', 
    'app/dialog_game_over', 'app/history_dialog'], 
    function ($, React, ChatBox, Player, ThisPlayer, InfoBar, MenuBar, GameBoard, GameOverDialog, HistoryDialog) {

    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;
    
    const MODE_LOADING = 1;
    const MODE_WAITING = 2;
    const MODE_PLAYING = 3;
    const MODE_SPECTATOR = 4;

    const EVENT_DRAW_HAND = 1;
    const EVENT_HINT = 2;
    const EVENT_DISCARD = 3;
    const EVENT_PLAY = 4;
    const EVENT_DECLARE_GAME_OVER = 5;

    var history = [];

    const UI_EVENT_SHOW_DIALOG = 1;
    const UI_EVENT_SHOW_TOAST = 2;
    const UI_EVENT_WAIT = 3;
    const UI_EVENT_SHOW_YOUR_TURN = 4;
    const UI_EVENT_SHOW_GAME_OVER = 5;

    var GameRoom = React.createClass({
        batchState: {},
        getInitialState() {
            return {
                playerInfo: undefined,
                mode: MODE_LOADING,
                isHost: false,
                playersInGame: [],
                lives: 0,
                hints: 0,
                cardsLeft: 0,

                showDialog: false,
                dialogTitle: "",
                dialogMessage: "",

                showToast: false,
                toastMessage: "",

                showYourTurn: false,
                showGameOverDialog: false,
                time: undefined,

                toRun: [],
                isIdle: true,
                board: [undefined, undefined, undefined, undefined, undefined],
                discards: [[], [], [], [], []],

                showHistory: false,
                history: [],
                isGameOver: false,
            };
        },
        getLives() {
            return this.state.lives;
        },
        setLives(lives) {
            this.setState({lives: lives});
        },
        getHints() {
            return this.state.hints;
        },
        setHints(hints) {
            this.setState({hints: hints});
        },
        componentWillMount() {
            var s = this.props.socket;
            s.on('getSelf', (msg) => {
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
                if (this.state.mode === MODE_PLAYING) {
                    // TODO
                } else {
                    var ps = this.state.playersInGame;
                    ps = ps.filter((val) => {
                        return val.playerId !== msg.playerId;
                    });
                    this.setState({playersInGame: ps});
                }
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

                console.log(msg.deckSize);

                this.setState({
                    mode: MODE_PLAYING, 
                    playerInfo: pi,
                    turnIndex: 0,
                    playersInGame: players,
                    numPlayers: players.length,
                    hints: msg.hints,
                    lives: msg.lives,
                    cardsLeft: msg.deckSize
                });
            });
            s.on('gameEvent', (msg) => {
                this.handleGameEvent(msg);
            });
            s.emit('getSelf');
            s.emit('getGameInfo');
        },
        getTurnIndex() {
            return this.state.turnIndex % this.state.numPlayers;
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
                            cardId: arg1
                        });
                        break;
                    case EVENT_DISCARD:
                        this.props.socket.emit('discard', {
                            cardId: arg1
                        });
                        break;
                }

                return true;
            }

            return false;
        },
        hint(target, hintType, cardIds) {
            this.tryDoMove(EVENT_HINT, target, hintType, cardIds);
        },
        play(cardId) {
            this.tryDoMove(EVENT_PLAY, cardId);
        },
        discard(cardId) {
            this.tryDoMove(EVENT_DISCARD, cardId);
        },
        getMenuBarRef() {
            return this.refs.menuBar;
        },
        getGameBoardRef() {
            return this.refs.gameBoard;
        },
        getThisPlayerRef() {
            return this.refs.thisPlayer;
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
        batchUpdatePlayer(newPlayerInfo) {
            var playerId = newPlayerInfo.playerId;
            var players = this.state.playersInGame;
            var len = players.length;
            for (var i = 0; i < len; i++) {
                var p = players[i];
                if (p.playerId === playerId) {
                    players[i] = newPlayerInfo;
                    if (this.state.playerInfo.playerId === playerId) {
                        $.extend(this.batchState, {playerInfo: newPlayerInfo, playersInGame: players});
                    } else {
                        $.extend(this.batchState, {playersInGame: players});
                    }
                    break;
                }
            }
        },
        handleGameEvent(gameEvent) {
            var newHistory = this.state.history;
            newHistory.push(gameEvent);
            switch (gameEvent.eventType) {
                case EVENT_DRAW_HAND:
                    var p = this.getPlayerWithId(gameEvent.playerId);
                    p.hand = gameEvent.data;

                    this.setState({
                        history: newHistory,
                        turnIndex: this.state.turnIndex + 1,
                        cardsLeft: Math.max(0, this.state.cardsLeft - gameEvent.data.length)
                    });
                    //this.checkIfMyTurn();
                    break;
                case EVENT_HINT:
                    if (gameEvent.data.target === this.state.playerInfo.playerId) {
                        // if this player was us...
                        this.refs.thisPlayer.animateHint(gameEvent.data);
                    } else {
                        // if someone hinted someone else...
                        var p = this.refs["player" + gameEvent.data.target];
                        p.animateHint(gameEvent.data);
                    }

                    history.push(gameEvent);

                    this.setState({
                        history: newHistory,
                        turnIndex: this.state.turnIndex + 1,
                        hints: this.state.hints - 1
                    });
                    this.checkIfMyTurn();
                    break;
                case EVENT_PLAY:
                    // this event is actually quite complicated and a lot can happen...
                    
                    // there are two primary cases here:
                    // 1) The play is valid, in which case we want to flip the card and the animate the play
                    // 2) The play is invalid, in which case we want to flip the card, animate the card to the discard pile and animate life

                    if (gameEvent.playerId === this.state.playerInfo.playerId) {
                        this.refs.thisPlayer.animatePlay(gameEvent);
                    } else {
                        var p = this.refs["player" + gameEvent.playerId];
                        p.animatePlay(gameEvent);
                    }

                    history.push(gameEvent);

                    this.setState({
                        history: newHistory,
                        turnIndex: this.state.turnIndex + 1,
                        cardsLeft: Math.max(0, this.state.cardsLeft - 1)
                    });
                    this.checkIfMyTurn();
                    break;
                case EVENT_DISCARD:
                    if (gameEvent.playerId === this.state.playerInfo.playerId) {
                        this.refs.thisPlayer.animateDiscard(gameEvent);
                    } else {
                        var p = this.refs["player" + gameEvent.playerId];
                        p.animateDiscard(gameEvent);
                    }

                    history.push(gameEvent);

                    this.setState({
                        history: newHistory,
                        turnIndex: this.state.turnIndex + 1,
                        cardsLeft: Math.max(0, this.state.cardsLeft - 1)
                    });
                    this.checkIfMyTurn();
                    break;
                case EVENT_DECLARE_GAME_OVER:
                    this.showGameOverDialog();
                    break;
                default:
                    console.log(gameEvent);
                    break;
            }
        },
        updateBoard(cardPlayed) {
            var curBoard = this.state.board;
            var boardIndex;
            switch (CardUtils.getCardColor(cardPlayed.cardType)) {
                case CardUtils.Color.BLUE:
                    boardIndex = 0;
                    break;
                case CardUtils.Color.GREEN:
                    boardIndex = 1;
                    break;
                case CardUtils.Color.RED:
                    boardIndex = 2;
                    break;
                case CardUtils.Color.WHITE:
                    boardIndex = 3;
                    break;
                case CardUtils.Color.YELLOW:
                    boardIndex = 4;
                    break;
            }

            curBoard[boardIndex] = cardPlayed;
            $.extend(this.batchState, {board: curBoard});
        },
        onNewHand(playerId, newHand) {
            var player = this.getPlayerWithId(playerId);
            player.hand = newHand;
            this.batchUpdatePlayer(player);
        },
        addToDiscards(card) {
            var index;
            switch (CardUtils.getCardColor(card.cardType)) {
                case CardUtils.Color.BLUE:
                    index = 0;
                    break;
                case CardUtils.Color.GREEN:
                    index = 1;
                    break;
                case CardUtils.Color.RED:
                    index = 2;
                    break;
                case CardUtils.Color.WHITE:
                    index = 3;
                    break;
                case CardUtils.Color.YELLOW:
                    index = 4;
                    break;
            }

            var discards = this.state.discards;
            discards[index].push(card);
            discards[index] = discards[index].sort((a, b) => {
                return a.cardType - b.cardType;
            });
            $.extend(this.batchState, {discards: discards});
        },
        commitState() {
            this.setState(this.batchState);
        },
        checkIfMyTurn() {
            if (this.isMyTurn()) {
                this.showYourTurn();
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

            if (this.state.lives === 0 && this.state.mode === MODE_PLAYING && !this.state.isGameOver) {
                this.showGameOverDialog();
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
        closeAll() {
            var filteredPlayers = this.state.playersInGame;
            $.each(filteredPlayers, (index, val) => {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            });
            this.refs.thisPlayer.close();
        },
        showTimedDialog(title, message, interval) {
            this.pushRunnable({eventType: UI_EVENT_SHOW_DIALOG, title: title, message: message, interval: interval});
        },
        showToast(message, interval) {
            this.pushRunnable({eventType: UI_EVENT_SHOW_TOAST, message: message, interval: interval});
        },
        wait(interval) {
            this.pushRunnable({eventType: UI_EVENT_WAIT, interval: interval});
        },
        showYourTurn() {
            this.pushRunnable({eventType: UI_EVENT_SHOW_YOUR_TURN});
        },
        showGameOverDialog() {
            this.setState({isGameOver: true});
            this.pushRunnable({eventType: UI_EVENT_SHOW_GAME_OVER});
        },
        pushRunnable(runnable) {
            var toRun = this.state.toRun;
            toRun.push(runnable);
            this.setState({toRun: toRun});

            if (this.state.isIdle) {
                this.runNext();
            }
        },
        getCardRes(card) {
            return "res/cards/" + CardUtils.getResourceNameForCard(card.cardType);
        },
        getSmallCardRes(card) {
            return "res/cards/" + CardUtils.getResourceNameForSmallCard(card.cardType);
        },
        preloadResource(resName, callback) {
            ((url, promise) => {
                var img = new Image();
                img.onload = function() {
                    promise.resolve();
                };
                img.src = url;
            })(resName, promise = $.Deferred());

            $.when.apply($, promise).done(function() {
              callback();
            });
        },
        runNext() {
            var toRun = this.state.toRun;
            if (toRun.length != 0) {
                var next = toRun.shift();
                var nextState;

                switch (next.eventType) {
                    case UI_EVENT_SHOW_DIALOG:
                        nextState = {
                            dialogTitle: next.title,
                            dialogMessage: next.message,
                            showDialog: true
                        };

                        setTimeout(() => {
                            this.setState({showDialog: false});
                            this.runNext();
                        }, next.interval);
                        break;
                    case UI_EVENT_SHOW_TOAST:
                        nextState = {
                            toastMessage: next.message,
                            showToast: true
                        };

                        setTimeout(() => {
                            this.setState({showToast: false});
                            this.runNext();
                        }, next.interval);
                        break;
                    case UI_EVENT_WAIT:
                        setTimeout(() => {
                            this.runNext();
                        }, next.interval);
                        break;
                    case UI_EVENT_SHOW_YOUR_TURN:
                        nextState = {
                            showYourTurn: true
                        };

                        setTimeout(() => {
                            this.setState({showYourTurn: false});
                            this.runNext();
                        }, 1200);
                        break;
                    case UI_EVENT_SHOW_GAME_OVER:
                        this.setState({showGameOverDialog: true, time: this.refs.infoBar.getTime()});
                        break;
                }
                if (nextState === undefined) {nextState = {};}
                nextState.isIdle = false;
                nextState.toRun = toRun;
                this.setState(nextState);
            } else {
                this.setState({isIdle: true});
            }
        },
        onBgClick(e) {
            this.closeAll();
        },
        onHistoryClick(e) {
            this.setState({showHistory: true});
        },
        onHistoryDialogDoneClick(e) {
            this.setState({showHistory: false});
        },
        render() {
            var thisPlayer = this.state.playerInfo;
            var topInterface = [];
            var bottomInterface = [];
            var toastView;
            var specialView;
            var dialogViews = [];

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
                                    <a className="button" onClick={this.handleOnStartGameClick}>Start the Game</a> :
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
                    if (len > 1) {
                        for (var i = (index + 1) % len; i !== index; i = (i + 1) % len) {
                            playersExcludingSelf.push(allPlayers[i]);
                        }
                    }
                    playerInterfaces = $.map(playersExcludingSelf, (val) => {
                        return (
                            <div className="player-holder">
                                <Player 
                                    ref={"player" + val.playerId} 
                                    playerInfo={val} 
                                    onOpen={this.onPlayerOpen}
                                    hint={this.hint}
                                    manager={this}/>
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
                            <div className="top-side">
                                {top}
                            </div>
                            <GameBoard 
                                ref="gameBoard"
                                board={this.state.board}
                                discards={this.state.discards}/>
                        </div>
                    );

                    topInterface.push(
                        <MenuBar
                            ref="menuBar"
                            onHistoryClick={this.onHistoryClick}
                            manager={this}/>
                    );

                    topInterface.push(
                        <InfoBar
                            ref="infoBar"
                            hints={this.state.hints}
                            lives={this.state.lives}
                            cardsLeft={this.state.cardsLeft}/>
                    );

                    break;
            }

            if (this.state.showDialog) {
                dialogViews = (
                    <div className="dialog-container">
                        <div className="timed-dialog">
                            <h1>{this.state.dialogTitle}</h1>
                            <p>{this.state.dialogMessage}</p>
                        </div>
                    </div>
                );
            }

            if (this.state.showYourTurn) {
                specialView = (
                    <div className="special-text-container">
                        <div className="left">YOUR</div>
                        <div className="right">TURN</div>
                    </div>
                );
            }

            if (this.state.showGameOverDialog) {
                dialogViews.push(
                    <div className="dialog-container">
                        <GameOverDialog
                            board={this.state.board}
                            totalTime={this.state.time}/>
                    </div>
                );
            }

            if (this.state.showHistory) {
                dialogViews.push(
                    <div className="dialog-container">
                        <HistoryDialog
                            playerInfo={this.state.playerInfo}
                            history={this.state.history}
                            onDoneClick={this.onHistoryDialogDoneClick}
                            manager={this}/>
                    </div>
                );
            }

            if (this.state.showToast) {
                console.log("showing toast");
                toastView = (
                    <div key="toast" className="toast-inner-container">
                        <div className="toast">
                        {this.state.toastMessage}
                        </div>
                    </div>
                );
            }

            // onClick={this.onBgClick}
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
                    {specialView}
                    <div className="toast-container">
                        <ReactCSSTransitionGroup transitionName="drop" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
                            {toastView}
                        </ReactCSSTransitionGroup>
                    </div>
                    <ReactCSSTransitionGroup transitionName="fade" transitionEnterTimeout={250} transitionLeaveTimeout={250}>
                        {dialogViews}
                    </ReactCSSTransitionGroup>
                </div>
            );
        }
    });

    return GameRoom;
});