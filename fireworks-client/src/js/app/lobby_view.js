define(['jquery', 'React', 'app/lobby/top_bar'], function ($, React, TopBar) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var LobbyView = React.createClass({displayName: "LobbyView",
        getInitialState:function() {
            return {
            };
        },
        render:function() {
            var value = this.state.value;
            return (
                React.createElement("div", {className: "lobby-view"}, 
                    React.createElement(TopBar, null
                    )
                )
            );
        }
    });

    return LobbyView;
});