define(['jquery', 'React'], function ($, React) {
    const HINT_COLOR = 1;
    const HINT_NUMBER = 2;
    var Player = React.createClass({
        getInitialState() {
            return {
                selected: [],
                hintType: HINT_COLOR,
                isOpen: false,
                selectedSingle: -1
            };
        },
        componentWillMount() {
        },
        onMouseOverCardHandler(e) {
            var $card = $(e.target);
            $card.addClass('hover-card');
        },
        onMouseLeaveCardHandler(e) {
            var $card = $(e.target);
            $card.removeClass('hover-card');
        },
        onCardClickHandler(e) {
            var playerInfo = this.props.playerInfo;
            var $card = $(e.target);
            var index = parseInt($card.attr("data-index"));
            $card.removeClass('hover-card');

            this.props.onOpen(this.props.playerInfo);
            this.setState({selected: this.getSelected(index, this.state.hintType), selectedSingle: index, isOpen: true});
        },
        onColorClick(e) {
            if (this.state.hintType === HINT_COLOR) return;
            this.setState({selected: this.getSelected(this.state.selectedSingle, HINT_COLOR), hintType: HINT_COLOR});
        },
        onNumberClick(e) {
            if (this.state.hintType === HINT_NUMBER) return;
            this.setState({selected: this.getSelected(this.state.selectedSingle, HINT_NUMBER), hintType: HINT_NUMBER});
        },
        getSelected(index, hintType) {
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
        onHintClick(e) {
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
            $.each(this.state.selected, (index, val) => {
                selectedCardIds.push(hand[val].cardId);
            })

            this.props.hint(this.props.playerInfo.playerId, hintType, selectedCardIds);
            this.close();
        },
        close() {
            this.setState({selected: [], isOpen: false});
        },
        render() {
            var open = this.state.isOpen;
            var playerInfo = this.props.playerInfo;
            var selectedCards = this.state.selected;
            var hintColor = this.state.hintType === HINT_COLOR;
            var cardViews = [];
            if (playerInfo.hand !== undefined) {
                cardViews = $.map(playerInfo.hand, (val, index) => {
                    var selected = selectedCards.indexOf(index) > -1;
                    return (
                        <span className={"card-in-hand-" + (index === 0 ? "first" : "rest")}>
                            <img 
                                className={selected ? "active-card" : ""}
                                src={"res/cards/" + CardUtils.getResourceNameForCard(val.cardType)}
                                onMouseOver={this.onMouseOverCardHandler}
                                onMouseLeave={this.onMouseLeaveCardHandler}
                                onClick={this.onCardClickHandler}
                                data-index={index}></img>
                        </span>
                    );
                });
            }
            return (
                <div className={"player-container" + (open ? " player-container-open" : "")}>
                    <h1>{playerInfo.playerName}</h1>
                    <div className={"slideable-container" + (open ? " container-open" : "")}>
                        <div className="card-container">
                            {cardViews}
                        </div>
                        <div className={"option-container" + (open ? "" : " gone")}>
                            <a href="javascript:;" className={hintColor ? "selected" : ""} onClick={this.onColorClick}>Color</a>
                            <a href="javascript:;" className={!hintColor ? "selected" : ""} onClick={this.onNumberClick}>Number</a>
                            <div className="horizontal-spacer"></div>
                            <a href="javascript:;" onClick={this.onHintClick}>Hint</a>
                        </div>
                    </div>
                </div>
            );
        }
    });

    return Player;
});