define(['jquery', 'React'], function ($, React) {
    const HINT_COLOR = 1;
    const HINT_NUMBER = 2;
    var Player = React.createClass({displayName: "Player",
        getInitialState:function() {
            return {
                selected: [],
                hintType: HINT_COLOR,
                isOpen: false,
                selectedSingle: -1
            };
        },
        componentWillMount:function() {
        },
        onMouseOverCardHandler:function(e) {
            var $card = $(e.target);
            $card.addClass('hover-card');
        },
        onMouseLeaveCardHandler:function(e) {
            var $card = $(e.target);
            $card.removeClass('hover-card');
        },
        onCardClickHandler:function(e) {
            var playerInfo = this.props.playerInfo;
            var $card = $(e.target);
            var index = parseInt($card.attr("data-index"));
            $card.removeClass('hover-card');

            this.props.onOpen(this.props.playerInfo);
            this.setState({selected: this.getSelected(index, this.state.hintType), selectedSingle: index, isOpen: true});
        },
        onColorClick:function(e) {
            if (this.state.hintType === HINT_COLOR) return;
            this.setState({selected: this.getSelected(this.state.selectedSingle, HINT_COLOR), hintType: HINT_COLOR});
        },
        onNumberClick:function(e) {
            if (this.state.hintType === HINT_NUMBER) return;
            this.setState({selected: this.getSelected(this.state.selectedSingle, HINT_NUMBER), hintType: HINT_NUMBER});
        },
        getSelected:function(index, hintType) {
            var playerInfo = this.props.playerInfo;
            var selected;
            var card = playerInfo.hand[index];
            if (hintType === HINT_COLOR) {
                selected = CardUtils.getAllCardsWithColor(CardUtils.getCardColor(card.cardType), playerInfo.hand);
            } else {
                selected = CardUtils.getAllCardsWithNumber(CardUtils.getCardNumber(card.cardType), playerInfo.hand);
            }
            return selected;
        },
        onHintClick:function(e) {
            // send the hint then gtfo
            // get the hintType (from CardUtils...not to be confused with this.state.hintType)
            var hintType = this.state.hintType;
            var card = this.props.playerInfo.hand[this.state.selectedSingle];
            if (hintType === HINT_COLOR) {
                // we can easily determine the hint type from the single selected card...
                hintType = CardUtils.colorToHint(CardUtils.getCardColor(card.cardType));
            } else {
                hintType = CardUtils.numberToHint(CardUtils.getCardNumber(card.cardType));
            }
            console.log("Sent hint with hint type: " + hintType);

            var selectedCardIds = [];
            var hand = this.props.playerInfo.hand;
            $.each(this.state.selected, function(index, val)  {
                selectedCardIds.push(hand[val].cardId);
            })

            this.props.hint(this.props.playerInfo.playerId, hintType, selectedCardIds);
            this.close();
        },
        close:function() {
            this.setState({selected: [], isOpen: false});
        },
        render:function() {
            var open = this.state.isOpen;
            var playerInfo = this.props.playerInfo;
            var selectedCards = this.state.selected;
            var hintColor = this.state.hintType === HINT_COLOR;
            var cardViews = [];
            if (playerInfo.hand !== undefined) {
                cardViews = $.map(playerInfo.hand, function(val, index)  {
                    var selected = selectedCards.indexOf(index) > -1;
                    return (
                        React.createElement("span", {className: "card-in-hand-" + (index === 0 ? "first" : "rest")}, 
                            React.createElement("img", {
                                className: selected ? "active-card" : "", 
                                src: "res/cards/" + CardUtils.getResourceNameForCard(val.cardType), 
                                onMouseOver: this.onMouseOverCardHandler, 
                                onMouseLeave: this.onMouseLeaveCardHandler, 
                                onClick: this.onCardClickHandler, 
                                "data-index": index})
                        )
                    );
                }.bind(this));
            }
            return (
                React.createElement("div", {className: "player-container" + (open ? " player-container-open" : "")}, 
                    React.createElement("h1", null, playerInfo.playerName), 
                    React.createElement("div", {className: "slideable-container" + (open ? " container-open" : "")}, 
                        React.createElement("div", {className: "card-container"}, 
                            cardViews
                        ), 
                        React.createElement("div", {className: "option-container" + (open ? "" : " gone")}, 
                            React.createElement("a", {href: "javascript:;", className: hintColor ? "selected" : "", onClick: this.onColorClick}, "Color"), 
                            React.createElement("a", {href: "javascript:;", className: !hintColor ? "selected" : "", onClick: this.onNumberClick}, "Number"), 
                            React.createElement("div", {className: "horizontal-spacer"}), 
                            React.createElement("a", {href: "javascript:;", onClick: this.onHintClick}, "Hint")
                        )
                    )
                )
            );
        }
    });

    return Player;
});