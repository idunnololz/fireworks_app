define(['jquery', 'React', 'app/log', 'app/chat_box', 'app/player', 'app/this_player', 'app/info_bar', 'app/menu_bar', 'app/game_board', 
    'app/dialog_game_over', 'app/history_dialog', 'app/prefs', 'app/leave_game_dialog', 'app/lobby/how_to_play_view'], 
    function ($, React, Log, ChatBox, Player, ThisPlayer, InfoBar, MenuBar, GameBoard, GameOverDialog, HistoryDialog, Prefs, LeaveGameDialog, HowToPlayView) {

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

    var GameRoom = React.createClass({displayName: "GameRoom",
        batchState: {},
        getInitialState:function() {
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
            };
        },
        getLives:function() {
            return this.state.lives;
        },
        setLives:function(lives) {
            this.setState({lives: lives});
        },
        getHints:function() {
            return this.state.hints;
        },
        setHints:function(hints) {
            this.setState({hints: hints});
        },
        componentWillMount:function() {
            var s = this.props.socket;
            s.on('getSelf', function(msg)  {
                Log.d(TAG, 'getSelf: %O', msg);
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);
            }.bind(this));
            s.on('getGameInfo', function(msg)  {
                Log.d(TAG, 'getGameInfo: %O', msg);
                if (msg.gameStarted) {
                    this.setState({mode: MODE_SPECTATOR, playersInGame: msg.playersInGame});
                } else {
                    this.setState({mode: MODE_WAITING, playersInGame: msg.playersInGame, isHost: msg.isHost});
                }
            }.bind(this));
            s.on('playerJoined', function(msg)  {
                Log.d(TAG, 'playerJoined: %O', msg);
                var ps = this.state.playersInGame;
                ps.push(msg);
                this.setState({playersInGame: ps});
            }.bind(this));
            s.on('playerLeft', function(msg)  {
                if (this.state.mode === MODE_PLAYING) {
                    // TODO
                } else {
                    var ps = this.state.playersInGame;
                    ps = ps.filter(function(val)  {
                        return val.playerId !== msg.playerId;
                    });
                    this.setState({playersInGame: ps});
                }
            }.bind(this));
            s.on('isHost', function(msg)  {
                // for when the host changes...
                this.setState({isHost: msg});
            }.bind(this));
            s.on('gameStarted', function(msg)  {
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
            }.bind(this));
            s.on('gameEvent', function(msg)  {
                this.handleGameEvent(msg);
            }.bind(this));
            s.emit('getSelf');
            s.emit('getGameInfo');
        },
        getTurnIndex:function() {
            return this.state.turnIndex % this.state.numPlayers;
        },     
        isMyTurn:function() {
            return this.state.playerInfo.playerIndex === this.state.turnIndex % this.state.numPlayers;
        },
        tryDoMove:function(moveType, arg1, arg2, arg3) {
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
        hint:function(target, hintType, cardIds) {
            this.tryDoMove(EVENT_HINT, target, hintType, cardIds);
        },
        play:function(cardId) {
            this.tryDoMove(EVENT_PLAY, cardId);
        },
        discard:function(cardId) {
            this.tryDoMove(EVENT_DISCARD, cardId);
        },
        getMenuBarRef:function() {
            return this.refs.menuBar;
        },
        getGameBoardRef:function() {
            return this.refs.gameBoard;
        },
        getThisPlayerRef:function() {
            return this.refs.thisPlayer;
        },
        getPlayerWithId:function(playerId) {
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
        batchUpdatePlayer:function(newPlayerInfo) {
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
        handleGameEvent:function(gameEvent) {
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
                    Log.w(TAG, 'Event not supported: %O', gameEvent);
                    break;
            }
        },
        updateBoard:function(cardPlayed) {
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
        onNewHand:function(playerId, newHand) {
            var player = this.getPlayerWithId(playerId);
            player.hand = newHand;
            this.batchUpdatePlayer(player);
        },
        addToDiscards:function(card) {
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
            discards[index] = discards[index].sort(function(a, b)  {
                return a.cardType - b.cardType;
            });
            $.extend(this.batchState, {discards: discards});
        },
        commitState:function() {
            this.setState(this.batchState);
        },
        checkIfMyTurn:function() {
            if (this.isMyTurn()) {
                this.showYourTurn();
            }
        },
        componentDidUpdate:function(prevProps, prevState) {
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
        isMyTurn:function() {
            return this.state.turnIndex % this.state.playersInGame.length === this.state.playerInfo.playerIndex;
        },
        handleOnStartGameClick:function() {
            var players = this.state.playersInGame.length;
            if (players >= 2 && players <= 5) {
                this.props.socket.emit('startGame');
            }
        },
        handleSpecialCommand:function(msg) {
            var chat = this.refs.chatbox;
            chat.v(msg);
            var args = msg.split(' ');

            // cool things that can be done:
            // change chatbox alpha:
            // /setPref chat_bg_alpha <alpha_as_float>
            // /remount                                     ; this will immediately apply the alpha changes...

            switch (args[0]) {
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
                default:
                    chat.v("Invalid command '" + args[0] + "'.");
                    break;
            }
        },
        focus:function() {
            this.refs.chatbox.focus();
        },
        onPlayerOpen:function(playerInfo) {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame.filter(function(x)  {return x.playerId !== playerInfo.playerId});
            $.each(filteredPlayers, function(index, val)  {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            }.bind(this));
            this.refs.thisPlayer.close();
        },
        onThisPlayerOpen:function() {
            // called when a player is expanded (player is trying to give a hint)
            var filteredPlayers = this.state.playersInGame;
            $.each(filteredPlayers, function(index, val)  {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            }.bind(this));
        },
        closeAll:function() {
            var filteredPlayers = this.state.playersInGame;
            $.each(filteredPlayers, function(index, val)  {
                var ref = this.refs["player" + val.playerId];
                if (ref !== undefined) {
                    ref.close();
                }
            }.bind(this));
            this.refs.thisPlayer.close();
        },
        showTimedDialog:function(title, message, interval) {
            this.pushRunnable({eventType: UI_EVENT_SHOW_DIALOG, title: title, message: message, interval: interval});
        },
        showToast:function(message, interval) {
            this.pushRunnable({eventType: UI_EVENT_SHOW_TOAST, message: message, interval: interval});
        },
        wait:function(interval) {
            this.pushRunnable({eventType: UI_EVENT_WAIT, interval: interval});
        },
        showYourTurn:function() {
            this.pushRunnable({eventType: UI_EVENT_SHOW_YOUR_TURN});
        },
        showGameOverDialog:function() {
            this.setState({isGameOver: true});
            this.pushRunnable({eventType: UI_EVENT_SHOW_GAME_OVER});
        },
        pushRunnable:function(runnable) {
            var toRun = this.state.toRun;
            toRun.push(runnable);
            this.setState({toRun: toRun});

            if (this.state.isIdle) {
                this.runNext();
            }
        },
        getCardRes:function(card) {
            return "res/cards/" + CardUtils.getResourceNameForCard(card.cardType);
        },
        getSmallCardRes:function(card) {
            return "res/cards/" + CardUtils.getResourceNameForSmallCard(card.cardType);
        },
        preloadResource:function(resName, callback) {
            (function(url, promise)  {
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
        runNext:function() {
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

                        setTimeout(function()  {
                            this.setState({showDialog: false});
                            this.runNext();
                        }.bind(this), next.interval);
                        break;
                    case UI_EVENT_SHOW_TOAST:
                        nextState = {
                            toastMessage: next.message,
                            showToast: true
                        };

                        setTimeout(function()  {
                            this.setState({showToast: false});
                            this.runNext();
                        }.bind(this), next.interval);
                        break;
                    case UI_EVENT_WAIT:
                        setTimeout(function()  {
                            this.runNext();
                        }.bind(this), next.interval);
                        break;
                    case UI_EVENT_SHOW_YOUR_TURN:
                        nextState = {
                            showYourTurn: true
                        };

                        setTimeout(function()  {
                            this.setState({showYourTurn: false});
                            this.runNext();
                        }.bind(this), 1200);
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
        onBgClick:function(e) {
            this.closeAll();
        },
        onHistoryClick:function(e) {
            this.setState({showHistory: true});
        },
        onHistoryDialogDoneClick:function(e) {
            this.setState({showHistory: false});
        },
        onMenuClick:function(e) {
            this.setState({showMenu: true});
        },
        onMenuCancelClick:function(e) {
            this.setState({showMenu: false});
        },
        onLeaveGameClick:function(e) {
            this.setState({showMenu: false});
            this.setState({showLeaveGameDialog: true});
        },
        onLeaveGameCancelClick:function(e) {
            this.setState({showLeaveGameDialog: false});
        },
        onLeaveGameOkClick:function(e) {
            var leaveGameHandler = function(msg)  {
                this.props.onLeaveRoom();
                this.props.socket.removeListener('leaveGame', this);
            }.bind(this);
            this.props.socket.on('leaveGame', leaveGameHandler);
            this.props.socket.emit('leaveGame');
        },
        onHowToPlayClick:function(e) {
            this.setState({showMenu: false});
            this.setState({showHowToPlayDialog: true});
        },
        onHowToPlayOkClick:function(e) {
            this.setState({showHowToPlayDialog: false});
        },
        render:function() {
            var thisPlayer = this.state.playerInfo;
            var topInterface = [];
            var bottomInterface = [];
            var toastView;
            var specialView;
            var dialogViews = [];

            var menuButton = (
                React.createElement("button", {className: "menu-button", onClick: this.onMenuClick, key: "menu-button"}, React.createElement("div", {className: "ic-menu"}))
            );

            if (this.state.showMenu) {
                menuButton = (
                    React.createElement("div", {className: "in-game-menu", key: "in-game-menu"}, 
                        React.createElement("button", {onClick: this.onHowToPlayClick}, "How to play"), 
                        React.createElement("button", null, "Options"), 
                        React.createElement("button", {onClick: this.onLeaveGameClick}, "Leave game"), 
                        React.createElement("button", {onClick: this.onMenuCancelClick}, "Cancel")
                    )
                );
            }

            if (this.state.showLeaveGameDialog) {
                dialogViews.push(
                    React.createElement("div", {className: "dialog-container"}, 
                        React.createElement(LeaveGameDialog, {
                            onOkClick: this.onLeaveGameOkClick, 
                            onCancelClick: this.onLeaveGameCancelClick})
                    )
                );
            }

            if (this.state.showHowToPlayDialog) {
                dialogViews.push(
                    React.createElement("div", {className: "dialog-container"}, 
                        React.createElement(HowToPlayView, {
                            onOkClickHandler: this.onHowToPlayOkClick})
                    )
                );
            }

            switch (this.state.mode) {
                case MODE_LOADING:
                    bottomInterface.push(React.createElement("div", {key: "spacer", className: "bottom-spacer"}, " "));
                    break;
                case MODE_WAITING:
                    var players = this.state.playersInGame.map(function(p)  {
                        return React.createElement("p", null, p.playerName);
                    });
                    bottomInterface.push(
                        React.createElement("div", {key: "waiting-view", className: "waiting-container"}, 
                            React.createElement("div", {className: "waiting-content"}, 
                                React.createElement("div", null, this.state.isHost ? "You are the host" : "Waiting on host"), 
                                this.state.isHost ? 
                                    React.createElement("button", {className: "theme-button", onClick: this.handleOnStartGameClick, 
                                        style: {width:'100%', margin:'10px 0 10px 0'}}, 
                                        "Start the Game"
                                    ) 
                                    :
                                    null, 
                                
                                React.createElement("h1", null, "Players"), 
                                players
                            )
                        )
                    );
                    bottomInterface.push(React.createElement("div", {key: "spacer", className: "bottom-spacer2"}, " "));
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
                    playerInterfaces = $.map(playersExcludingSelf, function(val)  {
                        return (
                            React.createElement("div", {className: "player-holder"}, 
                                React.createElement(Player, {
                                    ref: "player" + val.playerId, 
                                    playerInfo: val, 
                                    onOpen: this.onPlayerOpen, 
                                    hint: this.hint, 
                                    manager: this})
                            )
                        );
                    }.bind(this));

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
                        React.createElement("div", {key: "spacer", className: "bottom-player-space"}, 
                            React.createElement(ThisPlayer, {playerInfo: this.state.playerInfo, ref: "thisPlayer", onOpen: this.onThisPlayerOpen, manager: this})
                        )
                    );

                    topInterface.push(
                        React.createElement("div", {className: "left-side"}, 
                            left
                        )
                    );

                    topInterface.push(
                        React.createElement("div", {className: "right-side"}, 
                            right
                        )
                    );

                    topInterface.push(
                        React.createElement("div", {className: "main-side"}, 
                            React.createElement("div", {className: "top-side"}, 
                                top
                            ), 
                            React.createElement(GameBoard, {
                                ref: "gameBoard", 
                                board: this.state.board, 
                                discards: this.state.discards})
                        )
                    );

                    topInterface.push(
                        React.createElement(MenuBar, {
                            ref: "menuBar", 
                            onHistoryClick: this.onHistoryClick, 
                            manager: this})
                    );

                    topInterface.push(
                        React.createElement(InfoBar, {
                            ref: "infoBar", 
                            hints: this.state.hints, 
                            lives: this.state.lives, 
                            cardsLeft: this.state.cardsLeft})
                    );

                    break;
            }

            if (this.state.showDialog) {
                dialogViews = (
                    React.createElement("div", {className: "dialog-container"}, 
                        React.createElement("div", {className: "timed-dialog"}, 
                            React.createElement("h1", null, this.state.dialogTitle), 
                            React.createElement("p", null, this.state.dialogMessage)
                        )
                    )
                );
            }

            if (this.state.showYourTurn) {
                specialView = (
                    React.createElement("div", {className: "special-text-container"}, 
                        React.createElement("div", {className: "left"}, "YOUR"), 
                        React.createElement("div", {className: "right"}, "TURN")
                    )
                );
            }

            if (this.state.showGameOverDialog) {
                dialogViews.push(
                    React.createElement("div", {className: "dialog-container"}, 
                        React.createElement(GameOverDialog, {
                            board: this.state.board, 
                            totalTime: this.state.time})
                    )
                );
            }

            if (this.state.showHistory) {
                dialogViews.push(
                    React.createElement("div", {className: "dialog-container"}, 
                        React.createElement(HistoryDialog, {
                            playerInfo: this.state.playerInfo, 
                            history: this.state.history, 
                            onDoneClick: this.onHistoryDialogDoneClick, 
                            manager: this})
                    )
                );
            }

            if (this.state.showToast) {
                toastView = (
                    React.createElement("div", {key: "toast", className: "toast-inner-container"}, 
                        React.createElement("div", {className: "toast"}, 
                            this.state.toastMessage
                        )
                    )
                );
            }

            return (
                React.createElement("div", {className: "game-room"}, 
                    React.createElement("div", {className: "top-content"}, 
                        topInterface
                    ), 
                    React.createElement("div", {className: "bot-content"}, 
                        React.createElement(ChatBox, {
                            key: this.state.objectVersion, 
                            ref: "chatbox", 
                            playerInfo: this.state.playerInfo, 
                            socket: this.props.socket, 
                            className: "chat-box", 
                            handleSpecialCommand: this.handleSpecialCommand}), 
                        bottomInterface
                    ), 
                    React.createElement(ReactCSSTransitionGroup, {transitionName: "slide-right", transitionEnterTimeout: 300, transitionLeaveTimeout: 300}, 
                        menuButton
                    ), 
                    specialView, 
                    React.createElement("div", {className: "toast-container"}, 
                        React.createElement(ReactCSSTransitionGroup, {transitionName: "drop", transitionEnterTimeout: 300, transitionLeaveTimeout: 300}, 
                            toastView
                        )
                    ), 
                    React.createElement(ReactCSSTransitionGroup, {transitionName: "fade", transitionEnterTimeout: 250, transitionLeaveTimeout: 250}, 
                        dialogViews
                    )
                )
            );
        }
    });

    return GameRoom;
});