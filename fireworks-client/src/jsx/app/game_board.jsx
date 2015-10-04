define(['jquery', 'React'], function ($, React) {

    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    var GameBoard =  React.createClass({
        getInitialState() {
            return {
                showDiscards: false,
                fadingOut: false
            };
        },
        getRefNameForCard(card) {
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
        getPositionOf(refName) {
            return $(React.findDOMNode(this.refs[refName])).offset();
        },
        getSizeOf(refName) {
            var $elem = $(React.findDOMNode(this.refs[refName]));
            return {width: $elem.innerWidth(), height: $elem.innerHeight()};
        },
        showDiscards() {
            this.setState({showDiscards: true});
        },
        generateElemForCard(card) {
            if (card === undefined) return undefined;
            return (
                <div>
                    <img className="card" src={"res/cards/" + CardUtils.getResourceNameForSmallCard(card.cardType)}/>
                </div>
            );
        },
        onDoneClick() {
            this.setState({showDiscards: false, fadingOut: true});
            setTimeout(() => {
                this.setState({showDiscards: false, fadingOut: false});
            }, 300);
        },
        render() {
            var textColors = ["blue", "green", "red", "white", "yellow"];
            var discardView;
            var board = this.props.board;
            var showDiscards = this.state.showDiscards;
            var fadingOut = this.state.fadingOut;
            var cardClass = "card-slot" + (showDiscards || fadingOut ? " max-z-index" : "");
            if (showDiscards) {
                var discardViews = $.map(this.props.discards, (val, index) => {
                    var discardText;
                    if (val.length === 0) {
                        discardText = (
                            <p>Nothing discarded</p>
                        );
                    } else {
                        var cardOnBoard = this.props.board[index];
                        var boardCardNumber = cardOnBoard === undefined ? 0 : CardUtils.getCardNumber(cardOnBoard.cardType);
                        discardText = 
                        (
                            <p className={"text-" + textColors[index]}>
                            {
                                $.map(val, (card, index) => {
                                    var cardNumber = CardUtils.getCardNumber(card.cardType);
                                    var isImportant = cardNumber > boardCardNumber;
                                    return (
                                        <span className={isImportant ? "important-card" : ""}>{cardNumber + (index === val.length - 1 ? "" : ", ")}</span>
                                    )
                                })
                            }
                            </p>
                        );
                    }
                    return (
                        <div className="discard-container">
                            <div className="card-slot">
                                <img className="card" src="res/cards/card_s_blue_1.png"/>
                            </div>
                            {discardText}
                        </div>
                    );
                });
                discardView = (
                    <div className="discards-container" key="discards">
                        <div className="discards">
                            <h1>Discards</h1>
                            <div className="card-container">
                                {discardViews}
                            </div>
                            <a href="javascript:;" onClick={this.onDoneClick}>Done</a>
                        </div>
                    </div>
                );
            }
            return (
                <div className="board">
                    <div className="card-container">
                        <ReactCSSTransitionGroup transitionName="fade">
                            {discardView}
                        </ReactCSSTransitionGroup>
                        <div className={cardClass} ref="blue">
                            {this.generateElemForCard(board[0])}
                        </div>
                        <div className={cardClass} ref="green">
                            {this.generateElemForCard(board[1])}
                        </div>
                        <div className={cardClass} ref="red">
                            {this.generateElemForCard(board[2])}
                        </div>
                        <div className={cardClass} ref="white">
                            {this.generateElemForCard(board[3])}
                        </div>
                        <div className={cardClass} ref="yellow">
                            {this.generateElemForCard(board[4])}
                        </div>
                    </div>
                </div>
            );
        }
    });

    return GameBoard;
});