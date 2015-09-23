define(['jquery', 'React'], function ($, React) {
    var ThisPlayer = React.createClass({displayName: "ThisPlayer",
        componentWillMount:function() {
        },
        render:function() {
            var playerInfo = this.props.playerInfo;
            var cardViews = [];
            console.log(playerInfo);
            if (playerInfo.hand !== undefined) {
                cardViews = $.map(playerInfo.hand, function(val, index)  {
                    return (
                        React.createElement("span", {className: "card-in-hand-" + (index === 0 ? "first" : "rest")}, 
                            React.createElement("img", {src: "res/cards/" + CardUtils.getResourceNameForCard(val)})
                        )
                    );
                });
            }
            return (
                React.createElement("div", {className: "player-container"}, 
                    React.createElement("h1", null, playerInfo.playerName), 
                    React.createElement("div", {className: "card-container"}, 
                        cardViews
                    )
                )
            );
        }
    });

    return ThisPlayer;
});