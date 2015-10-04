define(['jquery', 'React'], function ($, React) {

    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    var GameBoard =  React.createClass({displayName: "GameBoard",
        getInitialState:function() {
            return {
                showDiscards: false,
                fadingOut: false
            };
        },
        getRefNameForCard:function(card) {
            switch (CardUtils.getCardColor(card.cardType)) {
                case CardUtils.Color.BLUE:
                    return "blue";
                case CardUtils.Color.GREEN:
                    return "green";
                case CardUtils.Color.RED:
                    return "red";
                case CardUtils.Color.WHITE:
                    return "white";
                case CardUtils.Color.YELLOW:
                    return "yellow";
            }
        },
        getPositionOf:function(refName) {
            return $(React.findDOMNode(this.refs[refName])).offset();
        },
        getSizeOf:function(refName) {
            var $elem = $(React.findDOMNode(this.refs[refName]));
            return {width: $elem.innerWidth(), height: $elem.innerHeight()};
        },
        showDiscards:function() {
            this.setState({showDiscards: true});
        },
        generateElemForCard:function(card) {
            if (card === undefined) return undefined;
            return (
                React.createElement("div", null, 
                    React.createElement("img", {className: "card", src: "res/cards/" + CardUtils.getResourceNameForSmallCard(card.cardType)})
                )
            );
        },
        onDoneClick:function() {
            this.setState({showDiscards: false, fadingOut: true});
            setTimeout(function()  {
                this.setState({showDiscards: false, fadingOut: false});
            }.bind(this), 300);
        },
        render:function() {
            var textColors = ["blue", "green", "red", "white", "yellow"];
            var discardView;
            var board = this.props.board;
            var showDiscards = this.state.showDiscards;
            var fadingOut = this.state.fadingOut;
            var cardClass = "card-slot" + (showDiscards || fadingOut ? " max-z-index" : "");
            if (showDiscards) {
                var discardViews = $.map(this.props.discards, function(val, index)  {
                    var discardText;
                    if (val.length === 0) {
                        discardText = (
                            React.createElement("p", null, "Nothing discarded")
                        );
                    } else {
                        var cardOnBoard = this.props.board[index];
                        var boardCardNumber = cardOnBoard === undefined ? 0 : CardUtils.getCardNumber(cardOnBoard.cardType);
                        discardText = 
                        (
                            React.createElement("p", {className: "text-" + textColors[index]}, 
                            
                                $.map(val, function(card, index)  {
                                    var cardNumber = CardUtils.getCardNumber(card.cardType);
                                    var isImportant = cardNumber > boardCardNumber;
                                    return (
                                        React.createElement("span", {className: isImportant ? "important-card" : ""}, cardNumber + (index === val.length - 1 ? "" : ", "))
                                    )
                                })
                            
                            )
                        );
                    }
                    return (
                        React.createElement("div", {className: "discard-container"}, 
                            React.createElement("div", {className: "card-slot"}, 
                                React.createElement("img", {className: "card", src: "res/cards/card_s_blue_1.png"})
                            ), 
                            discardText
                        )
                    );
                }.bind(this));
                discardView = (
                    React.createElement("div", {className: "discards-container", key: "discards"}, 
                        React.createElement("div", {className: "discards"}, 
                            React.createElement("h1", null, "Discards"), 
                            React.createElement("div", {className: "card-container"}, 
                                discardViews
                            ), 
                            React.createElement("a", {href: "javascript:;", onClick: this.onDoneClick}, "Done")
                        )
                    )
                );
            }
            return (
                React.createElement("div", {className: "board"}, 
                    React.createElement("div", {className: "card-container"}, 
                        React.createElement(ReactCSSTransitionGroup, {transitionName: "fade"}, 
                            discardView
                        ), 
                        React.createElement("div", {className: cardClass, ref: "blue"}, 
                            this.generateElemForCard(board[0])
                        ), 
                        React.createElement("div", {className: cardClass, ref: "green"}, 
                            this.generateElemForCard(board[1])
                        ), 
                        React.createElement("div", {className: cardClass, ref: "red"}, 
                            this.generateElemForCard(board[2])
                        ), 
                        React.createElement("div", {className: cardClass, ref: "white"}, 
                            this.generateElemForCard(board[3])
                        ), 
                        React.createElement("div", {className: cardClass, ref: "yellow"}, 
                            this.generateElemForCard(board[4])
                        )
                    )
                )
            );
        }
    });

    return GameBoard;
});