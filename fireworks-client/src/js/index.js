require(['jquery', 'React', 'libs/socket.io', 'app/game_room', 'libs/timeout_transition_group'], function ($, React, io, GameRoom, TimeoutTransitionGroup) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const PAGE_JOIN_GAME = 1;
    const PAGE_IN_ROOM = 2;

    document.onkeypress = function (e) {
        e = e || window.event;

        if (e.keyCode === 13 && gameUi !== undefined) {
            gameUi.focus();
        }
    };

    var GameUi = React.createClass({displayName: "GameUi",
        getInitialState:function() {
            return {
                where: PAGE_JOIN_GAME
            };
        },
        joinGameClick:function(e) {
            this.setState({where: PAGE_IN_ROOM, socket: io(
            //    "https://pure-journey-3550.herokuapp.com")});
              "http://localhost:3000")});
        },
        focus:function() {
            this.refs.gameRoom.focus();
        },
        render:function() {
            var content;
            switch (this.state.where) {
                case PAGE_JOIN_GAME:
                    content = (
                        React.createElement("div", {key: PAGE_JOIN_GAME, className: "join-game-container"}, 
                            React.createElement("a", {className: "button join-game", onClick: this.joinGameClick}, "Join Game")
                        )
                    );
                    break;
                case PAGE_IN_ROOM:
                    content = (React.createElement(GameRoom, {ref: "gameRoom", key: PAGE_IN_ROOM, socket: this.state.socket}));
                    break;
            }

            return (
                React.createElement("div", {className: "main-container"}, 
                    React.createElement(TimeoutTransitionGroup, {
                        enterTimeout: 300, 
                        leaveTimeout: 300, 
                        transitionName: "fade", 
                        transitionAppear: true}, 
                        content
                    )
                )
            );
        }
    });

    var gameUi = React.render(
        React.createElement(GameUi, null),
        $("#main")[0]
    );
});