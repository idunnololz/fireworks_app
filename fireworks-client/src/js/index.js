require(['app/consts', 'jquery', 'React', 'libs/socket.io', 'app/game_room', 'libs/timeout_transition_group', 'app/sign_in_view', 'app/lobby/lobby_view','app/prefs'], 
    function (Consts, $, React, io, GameRoom, TimeoutTransitionGroup, SignInView, LobbyView, Prefs) {

    Prefs.load();    
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const PAGE_JOIN_GAME = 1; /** Deprecated. Original Join Game page. */
    const PAGE_IN_ROOM = 2;
    const PAGE_LOAD = 3;
    const PAGE_SIGN_IN = 4;
    const PAGE_LOBBY = 5;

    const RESOURCE_DIR = "res/";

    var endpoint;
    if (Consts.PROD) {
        endpoint = "https://murmuring-mountain-5923.herokuapp.com";
    } else {
        endpoint = "http://localhost:3000";
    }

    document.onkeypress = function (e) {
        e = e || window.event;

        if (e.keyCode === 13 && gameUi !== undefined) {
            gameUi.focus();
        }
    };

    var $c;
    var curProgress = 0;
    var nextProgress = 0;
    var waitingProgress = -1;
    const ANIMATION_DURATION = 300.0;
    var animating = false;

    var GameUi = React.createClass({displayName: "GameUi",
        getInitialState:function() {
            return {
                where: PAGE_SIGN_IN
            };
        },
        joinTestGame:function() {
            // hack this sht so we can go into a room immediately...
            var socket = this.props.socket;
            socket.on('joinGame', function(msg)  {
                if (msg === true) {
                    this.onJoinGame('tester');
                } else {
                    // must mean we couldn't join the game...
                    socket.on('makeRoom', function(msg)  {
                        this.onJoinGame('tester');
                    }.bind(this));
                    socket.emit('makeRoom', {gameId: 1000, roomName: 'tester', enterRoom: true});
                }
            }.bind(this));
            socket.emit('joinGame', {gameId: 1000});
        },
        componentWillMount:function() {
            var s = this.props.socket;
            var handler = function(msg)  {
                var m = {playerInfo: {playerName: msg.playerName, playerId: msg.playerId}};
                this.setState(m);

                //this.joinTestGame();
                s.removeListener('getSelf', handler);
            }.bind(this);
            s.on('getSelf', handler);
            s.emit('getSelf');
        },
        load:function(cb, progressCb) {
            function preload(arr, cb, progress) {
                var done = 0;
                var promises = [];
                for (var i = 0; i < arr.length; i++) {
                    (function(url, promise) {
                        var img = new Image();
                        img.onload = function() {
                            done++;
                            promise.resolve();
                            progress(done / arr.length);
                        };
                        img.src = url;
                    })(arr[i], promises[i] = $.Deferred());
                }
                $.when.apply($, promises).done(function() {
                    cb();
                });
            }
            var res = [];
            CardUtils.getAllCardResources().forEach(function(val)  {
                res.push(RESOURCE_DIR + "cards/" + val[0] + ".png");
                res.push(RESOURCE_DIR + "cards/" + val[1] + ".png");
            });
            preload(res, cb, progressCb);
        },
        componentWillUpdate:function(nextProps, nextState) {
            if (nextState.where === PAGE_LOAD && this.state.where !== PAGE_LOAD) {
                this.load(function()  {
                    this.setState({where: this.state.dest});
                }.bind(this), function(progress)  {
                    this.updateProgress(progress);
                }.bind(this));
            }
        },
        updateProgress:function(progress) {
            if ($c === undefined) {
                $c = $('#pie-progress-bar');
                if ($c === undefined) {
                    return;
                }

                var ctx = $c[0].getContext('2d');
                var width = ctx.canvas.clientWidth;
                var height = ctx.canvas.clientHeight;
                ctx.canvas.width  = width;
                ctx.canvas.height = height;
            }

            var curTime = new Date().getTime();
            if (animating) {
                // we are already animating... ignore
                if (progress > waitingProgress) {
                    // remember we did try to update
                    waitingProgress = progress;
                    return;
                }
            }

            animating = true;
            nextProgress = progress;

            var that = this;

            function animateProgress(cp, np, t) {
                var startTime = t;
                function a() {
                    var deltaT = new Date().getTime() - startTime;

                    if (deltaT >= ANIMATION_DURATION) {
                        curProgress = np;
                        that.drawProgress(curProgress, curProgress, 0);
                        if (waitingProgress > curProgress) {
                            nextProgress = waitingProgress;
                            waitingProgress = -1;
                            animateProgress(curProgress, nextProgress   , new Date().getTime());
                        } else {
                            animating = false;
                        }
                    } else {
                        that.drawProgress(cp, np, deltaT / ANIMATION_DURATION);
                        setTimeout(a, 16);
                    }
                }
                a();
            }

            // draw the initial frame
            this.drawProgress(curProgress, nextProgress, 0);

            // kick off the animation
            animateProgress(curProgress, nextProgress, curTime);
        },
        drawProgress:function(curProgress, nextProgress, t) {
            // t is a time ratio, where 0 denotes the start of an animation and 1 denotes the completion...
            var ctx = $c[0].getContext('2d');
            var width = ctx.canvas.clientWidth;
            var height = ctx.canvas.clientHeight;
            
            var thickness = width * (1/8);

            var radius = (height/3 - thickness/2 - 1);
            if (radius <= 0) return;

            ctx.clearRect(0, 0, width, height);

            // font size:
            var baseFontSize = 18;
            var largeFont = Math.round(baseFontSize * 3);

            // draw text...
            ctx.globalAlpha = 0.97;
            ctx.fillStyle = "#FFFFFF";
            ctx.font='100 ' + baseFontSize + 'px Roboto';
            ctx.textAlign="center";
            ctx.fillText('Loading...', Math.round(width/2), Math.round(height/2) - (largeFont / 2));

            ctx.font='700 ' + largeFont + 'px Roboto';
            ctx.fillText(Math.round(nextProgress * 100) + '%', Math.round(width/2), Math.round(height/2) + (largeFont/2));

            ctx.lineWidth = thickness;
            ctx.strokeStyle = "#FFFFFF";
            ctx.globalAlpha = 0.05;

            ctx.beginPath();
            ctx.arc(width/2, height/2, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // draw current progress...
            ctx.globalAlpha = 0.90;
            ctx.beginPath();
            ctx.arc(width/2, height/2, radius, 0, (2 * Math.PI) * curProgress);
            ctx.stroke();

            ctx.lineWidth = thickness + 10 * (1 - t);
            ctx.globalAlpha = 0.75 * t;
            ctx.beginPath();
            ctx.arc(width/2, height/2, radius + 20 * (1 - t), (2 * Math.PI) * curProgress, (2 * Math.PI) * nextProgress);
            ctx.stroke();
        },
        joinGameClick:function(e) {
            if (Consts.PROD) {
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
        render:function() {
            var content;
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
                        React.createElement("div", {key: PAGE_LOAD, className: "load-container"}, 
                            React.createElement("canvas", {id: "pie-progress-bar"})
                        )
                    );
                    break;
                case PAGE_IN_ROOM:
                    content = (React.createElement(GameRoom, {ref: "gameRoom", key: PAGE_IN_ROOM, socket: this.props.socket, onLeaveRoom: this.onLeaveRoom}));
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

            return (
                React.createElement("div", {className: "main-container"}, 
                    React.createElement(ReactCSSTransitionGroup, {
                        transitionEnterTimeout: 300, transitionLeaveTimeout: 300, 
                        transitionName: "fade", 
                        transitionAppear: true}, 
                        content
                    )
                )
            );
        }
    });

    var gameUi = React.render(
        React.createElement(GameUi, {socket: io(endpoint)}),
        $("#main")[0]
    );
});