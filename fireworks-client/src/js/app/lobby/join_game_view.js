define(['jquery', 'React'], function ($, React) {
    var JoinGameView = React.createClass({displayName: "JoinGameView",
        getInitialState:function() {
            return {
            };
        },
        onJoinGameClick:function(e) {
            this.props.onJoinGameClickHandler(this.props.roomInfo.name, this.props.roomInfo.gameId);
        },
        render:function() {
            var info = this.props.roomInfo;
            var players = info.players;
            var playersView = $.map(players, function(val)  {
                return (
                    React.createElement("div", {className: "player-obj"}, 
                        val.playerName
                    )
                );
            });

            return (
                React.createElement("div", {className: "join-game-view"}, 
                    React.createElement("h1", null, "Join Game"), 
                    React.createElement("p", null, info.name), 
                    React.createElement("h2", null, "Players"), 
                    React.createElement("div", {className: "players-list"}, playersView), 
                    React.createElement("div", {className: "options-container"}, 
                        React.createElement("a", {className: "theme-button", href: "javascript:;", onClick: this.props.onCancelClickHandler}, "Cancel"), 
                        React.createElement("a", {className: "theme-button", href: "javascript:;", onClick: this.onJoinGameClick}, "Join game")
                    )
                )
            );
        }
    });

    return JoinGameView;
});