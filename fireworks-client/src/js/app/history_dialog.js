define(['jquery', 'React'], function ($, React) {

    const EVENT_DRAW_HAND = 1;
    const EVENT_HINT = 2;
    const EVENT_DISCARD = 3;
    const EVENT_PLAY = 4;

    var HistoryItem = React.createClass({displayName: "HistoryItem",
        debugClick:function() {
            console.log('history item: ');
            console.log(this.props.event);
        },
        appendCard:function(arr, cardType) {
            var color = CardUtils.getCardColor(cardType);
            var number = CardUtils.getCardNumber(cardType);

            switch (color) {
                case CardUtils.Color.BLUE:
                    arr.push(
                        React.createElement("span", {className: "blue"}, number)
                    );
                    break;
                case CardUtils.Color.GREEN:
                    arr.push(
                        React.createElement("span", {className: "green"}, number)
                    );
                    break;
                case CardUtils.Color.RED:
                    arr.push(
                        React.createElement("span", {className: "red"}, number)
                    );
                    break;
                case CardUtils.Color.WHITE:
                    arr.push(
                        React.createElement("span", {className: "white"}, number)
                    );
                    break;
                case CardUtils.Color.YELLOW:
                    arr.push(
                        React.createElement("span", {className: "yellow"}, number)
                    );
                    break;
            }
        },
        render:function() {
            var styles = this.props.styles;
            var thisPlayerId = this.props.playerInfo.playerId;

            var manager = this.props.manager;
            var event = this.props.event;
            var eventIndex = this.props.eventIndex;
            var playerName = manager.getPlayerWithId(event.playerId).playerName;
            var actionName;
            var desc;

            switch (event.eventType) {
                case EVENT_DRAW_HAND:
                    actionName = "Draw hand";

                    // data contains the 5 cards...
                    if (event.playerId === thisPlayerId) {
                        // this is us so we don't know what we drew
                        desc = "Drew 5 cards.";
                    } else {
                        var cards = event.data;
                        desc = ["Drew "];

                        $.each(cards, function(index, val)  {
                            this.appendCard(desc, val.cardType);
                            
                            if (index !== cards.length - 1) {
                                desc.push(', ');
                            } else {
                                desc.push('.');
                            }
                        }.bind(this));
                    }
                    break;
                case EVENT_HINT:
                    actionName = "Hint";

                    var hintType = event.data.hintType;
                    desc = [];
                    desc.push("Hinted " + manager.getPlayerWithId(event.data.target).playerName + "'s ");
                    
                    if (CardUtils.isColorHint(hintType)) {
                        var color = CardUtils.getHintColor(hintType);
                        switch (color) {
                            case CardUtils.Color.BLUE:
                                desc.push(
                                    React.createElement("span", {className: "blue"}, "blue")
                                );
                                break;
                            case CardUtils.Color.GREEN:
                                desc.push(
                                    React.createElement("span", {className: "green"}, "green")
                                );
                                break;
                            case CardUtils.Color.RED:
                                desc.push(
                                    React.createElement("span", {className: "red"}, "red")
                                );
                                break;
                            case CardUtils.Color.WHITE:
                                desc.push(
                                    React.createElement("span", {className: "white"}, "white")
                                );
                                break;
                            case CardUtils.Color.YELLOW:
                                desc.push(
                                    React.createElement("span", {className: "yellow"}, "yellow")
                                );
                                break;
                        }
                        desc.push(" cards.");
                    } else {
                        desc.push(React.createElement("span", {className: "bold"}, CardUtils.getHintNumber(hintType)));
                        desc.push("s.");
                    }

                    break;
                case EVENT_DISCARD:
                    desc = [];
                    actionName = "Discard";

                    var cardDiscarded = event.discarded.cardType;
                    desc.push("Discarded ");

                    this.appendCard(desc, cardDiscarded);
                    desc.push(".");
                    break;
                case EVENT_PLAY:
                    desc = [];
                    actionName = "Play";

                    var card = event.played.cardType;
                    if (event.playable) {
                        desc.push("Played ");
                    } else {
                        desc.push("Tried to play ");
                    }

                    this.appendCard(desc, card);
                    desc.push(".");
                    break;
                default:
                    actionName = "Unknown";
                    break;
            }            

            return (
                React.createElement("div", {className: "history-item" + (eventIndex % 2 == 0 ? " even" : " odd"), onClick: this.debugClick}, 
                    React.createElement("div", {style: styles[0]}, eventIndex), 
                    React.createElement("div", {style: styles[1]}, playerName), 
                    React.createElement("div", {style: styles[2]}, actionName), 
                    React.createElement("div", {style: styles[3]}, desc), 
                    React.createElement("div", {style: styles[4]}, "Show move")
                )
            );
        }
    });

    var HistoryList = React.createClass({displayName: "HistoryList",
        getInitialState:function() {
            return {
                sizeRatio: [6, 24, 10, 45, 15]
            };
        },
        render:function() {
            var styles = [];
            var ratio = this.state.sizeRatio;
            for (var i = 0; i < ratio.length; i++) {
                styles.push({
                    'flex': ratio[i] + ' 0 0'
                });
            }
            
            var historyItems = [];

            var history = this.props.history;
            for (var i = history.length - 1; i >= 0; i--) {
                var val = history[i];
                historyItems.push(
                    React.createElement(HistoryItem, {
                        playerInfo: this.props.playerInfo, 
                        event: val, 
                        eventIndex: i, 
                        styles: styles, 
                        manager: this.props.manager}
                        )
                );
            }

            return (
                React.createElement("div", {className: "history"}, 
                    React.createElement("div", {className: "history-header"}, 
                        React.createElement("div", {className: "history-item"}, 
                            React.createElement("div", {className: "col", style: styles[0]}, "#"), 
                            React.createElement("div", {className: "col", style: styles[1]}, "Player"), 
                            React.createElement("div", {className: "col", style: styles[2]}, "Action"), 
                            React.createElement("div", {className: "col", style: styles[3]}, "Details"), 
                            React.createElement("div", {className: "col", style: styles[4]}, "Show move")
                        )
                    ), 
                    React.createElement("div", {className: "history-body nano"}, 
                        React.createElement("div", {className: "nano-content"}, 
                            historyItems
                        )
                    )
                )
            );
        }
    });

    var HistoryDialog = React.createClass({displayName: "HistoryDialog",
        render:function() {
            // history is this.props.history
            return (
                React.createElement("div", {className: "history-dialog"}, 
                    React.createElement("div", {className: "header"}, 
                        React.createElement("h1", null, "History")
                    ), 
                    React.createElement(HistoryList, {
                        history: this.props.history, 
                        manager: this.props.manager, 
                        playerInfo: this.props.playerInfo}
                        ), 
                    React.createElement("a", {href: "javascript:;", onClick: this.props.onDoneClick}, "Done")
                )
            );
        }
    });

    return HistoryDialog;
});