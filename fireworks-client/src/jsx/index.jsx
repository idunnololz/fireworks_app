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

    var GameUi = React.createClass({
        getInitialState() {
            return {
                where: PAGE_JOIN_GAME
            };
        },
        joinGameClick(e) {
            this.setState({where: PAGE_IN_ROOM, socket: io(
            //    "https://pure-journey-3550.herokuapp.com")});
              "http://localhost:3000")});
        },
        focus() {
            this.refs.gameRoom.focus();
        },
        render() {
            var content;
            switch (this.state.where) {
                case PAGE_JOIN_GAME:
                    content = (
                        <div key={PAGE_JOIN_GAME} className="join-game-container">
                            <a className="button join-game" onClick={this.joinGameClick}>Join Game</a>
                        </div>
                    );
                    break;
                case PAGE_IN_ROOM:
                    content = (<GameRoom ref="gameRoom" key={PAGE_IN_ROOM} socket={this.state.socket}/>);
                    break;
            }

            return (
                <div className="main-container">
                    <TimeoutTransitionGroup 
                        enterTimeout={300}
                        leaveTimeout={300}
                        transitionName="fade" 
                        transitionAppear={true}>
                        {content}
                    </TimeoutTransitionGroup>
                </div>
            );
        }
    });

    var gameUi = React.render(
        <GameUi/>,
        $("#main")[0]
    );
});