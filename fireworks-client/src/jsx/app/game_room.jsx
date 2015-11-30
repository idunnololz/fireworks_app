define(['jquery', 'React', 'app/log', 'app/chat_box', 'app/player', 'app/this_player', 'app/info_bar', 'app/menu_bar', 'app/game_board', 
    'app/dialog_game_over', 'app/history_dialog', 'app/prefs', 'app/leave_game_dialog', 'app/lobby/how_to_play_view', 'app/surrender_vote_view'], 
    function ($, React, Log, ChatBox, Player, ThisPlayer, InfoBar, MenuBar, GameBoard, GameOverDialog, HistoryDialog, Prefs, LeaveGameDialog, 
        HowToPlayView, SurrenderVoteView) {

    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = "GameRoom";
    
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

                objectVersion: 1,

                showMenu: false,

                showLeaveGameDialog: false,
                showHowToPlayDialog: false,

                showSurrenderVoteView: false,
                _isPlayerWhoStartedVote: false,
                surrenderPlayers: 0,
            };
        },
        isGameOver() {
            return this.state.isGameOver;
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
        componentWillUnmount() {
            Log.d(TAG, "componentWillUnmount");
            var socket = this.props.socket;
            socket.removeAllListeners('getSelf');
            socket.removeAllListeners('getGameInfo');
            socket.removeAllListeners('playerJoined');
            socket.removeAllListeners('playerLeft');
            socket.removeAllListeners('isHost');
            socket.removeAllListeners('surrender');
            socket.removeAllListeners('surrenderUpdate');
            socket.removeAllListeners('gameStarted');
            socket.removeAllListeners('sgetPlayerHands');
            socket.removeAllListeners('gameEvent');
        },
        componentWillMount() {
            var s = this.props.socket;
            s.on('getSelf', (msg) => {
                Log.d(TAG, 'getSelf: %O', msg);
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);
            });
            s.on('getGameInfo', (msg) => {
                Log.d(TAG, 'getGameInfo: %O', msg);
                if (msg.gameStarted) {
                    this.setState({mode: MODE_SPECTATOR, playersInGame: this.sanatizePlayerList(msg.playersInGame)});
                } else {
                    this.setState({mode: MODE_WAITING, playersInGame: this.sanatizePlayerList(msg.playersInGame), isHost: msg.isHost});
                }
            });
            s.on('playerJoined', (msg) => {
                this.refs.chatbox.v("Player '" + msg.playerName + "' has joined the room.");
                Log.d(TAG, 'playerJoined: %O', msg);
                var ps = this.state.playersInGame;
                ps.push(msg);
                this.setState({playersInGame: this.sanatizePlayerList(ps)});
            });
            s.on('playerLeft', (msg) => {
                this.refs.chatbox.v("Player '" + this.getPlayerWithId(msg.playerId).playerName + "' has left the room.");
                if (this.state.mode === MODE_PLAYING) {
                    // TODO
                } else {
                    var ps = this.state.playersInGame;
                    ps = ps.filter((val) => {
                        return val.playerId !== msg.playerId;
                    });
                    this.setState({playersInGame: this.sanatizePlayerList(ps)});
                }
            });1
            s.on('isHost', (msg) => {
                // for when the host changes...
                this.setState({isHost: msg});
            });

            s.on('surrender', (msg) => {
                if (msg.errorType !== undefined) {
                    this.refs.chatbox.v('A surrender vote just recently concluded. Please wait a while before starting another vote.');
                } else {
                    this.refs.chatbox.v(this.getPlayerWithId(msg.playerId).playerName + ' has started a surrender vote.');
                    this.setState({_isPlayerWhoStartedVote: (msg.playerId === this.state.playerInfo.playerId)});
                }
            });

            s.on('surrenderUpdate', (msg) => {
                this.setState({surrenderVotes: msg.votes, surrenderPlayers: msg.numPlayers, showSurrenderVoteView: true});
            });

            s.on('gameStarted', (msg) => {
                var pi = this.state.playerInfo;
                var players = msg.players;
                var playersInGame = []; // use to align items...
                for (var i = 0; i < players.length; i++) {
                    var p = players[i];

                    // if this player is us, update our info
                    if (p.playerId === pi.playerId) {
                        pi = p;
                    }
                    playersInGame[p.playerIndex] = p;
                }

                this.setState({
                    mode: MODE_PLAYING, 
                    playerInfo: pi,
                    turnIndex: 0,
                    playersInGame: playersInGame,
                    numPlayers: players.length,
                    hints: msg.hints,
                    lives: msg.lives,
                    cardsLeft: msg.deckSize
                });
            });
            s.on('sgetPlayerHands', (msg) => {
                Log.d(TAG, "sgetPlayerHands");
                var filteredPlayers = this.state.playersInGame.filter((x) => {return x.playerId !== this.state.playerInfo.playerId});
                var obj = {};
                $.each(filteredPlayers, (index, val) => {
                    obj[val.playerId] = {
                        hand: val.hand
                    };
                });

                s.emit('sgetPlayerHands', obj);
            });
            s.on('gameEvent', (msg) => {
                this.handleGameEvent(msg);
            });
            s.emit('getSelf');
            s.emit('getGameInfo');
        },
        sanatizePlayerList(players) {
            var good = true;
            // check if list is in right order...
            Log.d(TAG, "In: %O", players);
            for (var i = 0; i < players.length; i++) {
                var p = players[i];

                if (p.playerIndex === undefined || p.playerIndex < 0) {
                    break;
                }
                if (p.playerIndex !== i) {
                    players[i] = players[p.playerIndex];
                    players[p.playerIndex] = p;
                }
            }
            Log.d(TAG, "Out: %O", players);
            return players;
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
                    var hand = gameEvent.data[this.state.playerInfo.playerId].hand;
                    Log.d(TAG, "GG hand: %O", hand);
                    this.state.playerInfo.hand = hand;
                    this.setState();

                    this.showGameOverDialog();
                    break;
                default:
                    Log.w(TAG, 'Event not supported: %O', gameEvent);
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
            if (this.state.playerInfo === undefined) return; // we just joined the room...

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
            var args = msg.split(' ');

            // cool things that can be done:
            // change chatbox alpha:
            // /setPref chat_bg_alpha <alpha_as_float>
            // /remount                                     ; this will immediately apply the alpha changes...

            switch (args[0]) {
                case '/this':
                    chat.v(JSON.stringify(this.state[args[1]]));
                    break;
                case '/thisPlayer':
                    chat.v(JSON.stringify(this.state.playerInfo));
                    break;
                case '/setPref':
                    Prefs.set(args[1], parseFloat(args[2]));
                    break;
                case '/getPref':
                    chat.v(args[1] + ': ' + Prefs.get(args[1]));
                    break;
                case '/cookiesEnabled':
                    chat.v(Prefs.isCookiesEnabled() ? 'Cookies are enabled.' : 'Cookies are not enabled.');
                    break;
                case '/rawCookies':
                    chat.v('rawCookies: ' + document.cookie);
                    break;
                case '/deleteAllCookies':
                    Prefs.deleteAllCookies();
                    chat.v('All cookies removed.');
                    break;
                case '/remount':
                    this.setState({objectVersion: this.state.objectVersion + 1});
                    chat.v('Remount success.');
                    break;
                case '/ff':
                    this.props.socket.emit('surrender', {vote: 1});
                    break;
                default:
                    chat.v("Invalid command '" + args[0] + "'.");
                    break;
            }
        },
        focus() {
            this.refs.chatbox.focus();
        },
        onPlayerOpen(playerInfo) {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame.filter((x) => {return x.playerId !== this.state.playerInfo.playerId});
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
                        // reveal the hand of this player
                        this.getThisPlayerRef().revealHand();
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
        onMenuClick(e) {
            this.setState({showMenu: true});
        },
        onMenuCancelClick(e) {
            this.setState({showMenu: false});
        },
        onLeaveGameClick(e) {
            this.setState({showMenu: false});
            this.setState({showLeaveGameDialog: true});
        },
        onLeaveGameCancelClick(e) {
            this.setState({showLeaveGameDialog: false});
        },
        onLeaveGameOkClick(e) {
            var leaveGameHandler = (msg) => {
                this.props.onLeaveRoom();
                this.props.socket.removeListener('leaveGame', this);
            };
            this.props.socket.on('leaveGame', leaveGameHandler);
            this.props.socket.emit('leaveGame');
        },
        onHowToPlayClick(e) {
            this.setState({showMenu: false});
            this.setState({showHowToPlayDialog: true});
        },
        onHowToPlayOkClick(e) {
            this.setState({showHowToPlayDialog: false});
        },
        onGameOverOkClick(e) {
            this.onLeaveGameOkClick(e);
        },
        showAllHinted() {
            var filteredPlayers = this.state.playersInGame.filter((x) => {return x.playerId !== this.state.playerInfo.playerId});
            $.each(filteredPlayers, (index, val) => {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.showHinted();
                }
            });
            this.getThisPlayerRef().showHinted();
        },
        hideAllHinted() {
            var filteredPlayers = this.state.playersInGame.filter((x) => {return x.playerId !== this.state.playerInfo.playerId});
            $.each(filteredPlayers, (index, val) => {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.hideHinted();
                }
            });
            this.getThisPlayerRef().hideHinted();
        },
        getSurrenderVoteStartPosition(size) {
            var pos = this.getMenuBarRef().getPositionOf('info');

            return {left: pos.left - size.width, top: pos.top};
        },
        onSurrenderVoteNoClick() {
            this.props.socket.emit('surrender', {vote: 0});
        },
        onSurrenderVoteYesClick() {
            this.props.socket.emit('surrender', {vote: 1});
        },
        onSurrenderVoteClose() {
            this.setState({showSurrenderVoteView: false});
        },
        render() {
            var thisPlayer = this.state.playerInfo;
            var topInterface = [];
            var bottomInterface = [];
            var toastView;
            var specialView;
            var dialogViews = [];

            var menuButton = (
                <button className="menu-button" onClick={this.onMenuClick} key="menu-button"><div className="ic-menu"></div></button>
            );

            if (this.state.showMenu) {
                menuButton = (
                    <div className="in-game-menu" key="in-game-menu">
                        <button onClick={this.onHowToPlayClick}>How to play</button>
                        <button>Options</button>
                        <button onClick={this.onLeaveGameClick}>Leave game</button>
                        <button onClick={this.onMenuCancelClick}>Cancel</button>
                    </div>
                );
            }

            if (this.state.showLeaveGameDialog) {
                dialogViews.push(
                    <div className="dialog-container">
                        <LeaveGameDialog
                            onOkClick={this.onLeaveGameOkClick}
                            onCancelClick={this.onLeaveGameCancelClick}/>
                    </div>
                );
            }

            if (this.state.showHowToPlayDialog) {
                dialogViews.push(
                    <div className="dialog-container">
                        <HowToPlayView 
                            onOkClickHandler={this.onHowToPlayOkClick}/>
                    </div>
                );
            }

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
                                    <button className="theme-button" onClick={this.handleOnStartGameClick}
                                        style={{width:'100%', margin:'10px 0 10px 0'}}>
                                        Start the Game
                                    </button> 
                                    :
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
                            totalTime={this.state.time}
                            onOkClickHandler={this.onGameOverOkClick}/>
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

            if (this.state.showSurrenderVoteView) {
                dialogViews.push(
                    <SurrenderVoteView
                        onNoClickHandler={this.onSurrenderVoteNoClick}
                        onYesClickHandler={this.onSurrenderVoteYesClick}
                        getStartPosition={this.getSurrenderVoteStartPosition}
                        surrenderVotes={this.state.surrenderVotes}
                        surrenderPlayers={this.state.surrenderPlayers}
                        allowPlayerToVote={!this.state._isPlayerWhoStartedVote}
                        onClose={this.onSurrenderVoteClose}
                        />
                );
            }

            if (this.state.showToast) {
                toastView = (
                    <div key="toast" className="toast-inner-container">
                        <div className="toast">
                            {this.state.toastMessage}
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
                            key={this.state.objectVersion}
                            ref="chatbox"
                            playerInfo={this.state.playerInfo} 
                            socket={this.props.socket} 
                            className="chat-box"
                            handleSpecialCommand={this.handleSpecialCommand}/>
                        {bottomInterface}
                    </div>
                    <ReactCSSTransitionGroup transitionName="slide-right" transitionEnterTimeout={300} transitionLeaveTimeout={300}>
                        {menuButton}
                    </ReactCSSTransitionGroup>
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