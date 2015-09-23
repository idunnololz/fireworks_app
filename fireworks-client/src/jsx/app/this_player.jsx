define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var ThisPlayer = React.createClass({
        getInitialState() {
            return {
                active: -1,
                menuHeight: -1,
                hintedCards: [],
                activeHint: undefined
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
            var $card = $(e.target);
            var index = parseInt($card.attr("data-index"));
            $card.removeClass('hover-card');

            this.props.onOpen();
            this.setState({active: index});
        },
        // too lazy with the handler postfix
        onCancelClick(e) {
            this.close();
        },
        close() {
            this.setState({active: -1});
        },
        componentDidUpdate(prevProps, prevState) {
            var menuDom = React.findDOMNode(this.refs.menu);
                console.log(menuDom);
            if (menuDom !== undefined) {
                var menuHeight = $(menuDom).outerHeight();
                console.log(menuHeight);
                if (menuHeight !== this.state.menuHeight) {
                    this.setState({menuHeight: menuHeight});
                }
            }
        },
        animateHint(hintInfo) {
            // translate cardId to indices
            var thisPlayer = this.props.playerInfo;
            var hand = thisPlayer.hand;
            var isColorHint = CardUtils.isColorHint(hintInfo.hintType);

            var hintedIndices = $.map(hintInfo.affectedCards, (val) => {
                return this.getIndexForCardId(val);
            });
            this.setState({hintedCards: hintedIndices, activeHint: hintInfo});

            if (isColorHint) {
                this.props.manager.showToast("YOU HAVE BEEN HINTED", `These cards are ${CardUtils.getHint(hintInfo.hintType)}!`, 5000);
            } else {
                this.props.manager.showToast("YOU HAVE BEEN HINTED", `These cards are ${CardUtils.getHint(hintInfo.hintType)}s!`, 5000);
            }

            setTimeout(() => {
                this.setState({hintedCards: [], activeHint: undefined});
            }, 5000);
        },
        getIndexForCardId(cardId) {
            var hand = this.props.playerInfo.hand;
            var len = hand.length;
            for (var i = 0; i < len; i++) {
                var c = hand[i];
                if (c.cardId === cardId) {
                    return i;
                }
            }
            return -1;
        },
        render() {
            var playerInfo = this.props.playerInfo;
            var cardViews = [];
            var appendClass = "";
            var hintDecor;

            if (this.state.activeHint !== undefined) {
                var isColorHint = CardUtils.isColorHint(this.state.activeHint.hintType);
                console.log("isColorHint: " + CardUtils.isColorHint(this.state.activeHint.hintType));
                console.log("color: " + CardUtils.getHintColor(this.state.activeHint.hintType));
                if (isColorHint) {
                    switch (CardUtils.getHintColor(this.state.activeHint.hintType)) {
                        case CardUtils.Color.BLUE:
                            appendClass += " blue-pulse";
                            break;
                        case CardUtils.Color.GREEN:
                            appendClass += " green-pulse";
                            break;
                        case CardUtils.Color.RED:
                            appendClass += " red-pulse";
                            break;
                        case CardUtils.Color.WHITE:
                            appendClass += " white-pulse";
                            break;
                        case CardUtils.Color.YELLOW:
                            appendClass += " yellow-pulse";
                            break;
                    }
                } else {
                    var numberHint = CardUtils.getHintNumber(this.state.activeHint.hintType);

                    hintDecor = (
                        <div className="hint-decor">
                            {numberHint}
                        </div>
                    );
                }
            }

            if (playerInfo.hand !== undefined) {
                cardViews = $.map(playerInfo.hand, (val, index) => {
                    var isActive = this.state.active === index;
                    var isHinted = this.state.hintedCards.indexOf(index) !== -1;
                    var menu = undefined;
            
                    if (isActive) {
                        menu = (
                            <ReactTransitionGroup transitionName="fade-in" transitionAppear={true}>
                                <div className="menu-container" style={{top: -this.state.menuHeight}} ref="menuContainer">
                                    <ul className="menu" ref="menu">
                                        <li><a href="javascript:;" onClick={this.onCancelClick}>Cancel</a></li>
                                        <li><a href="javascript:;">Discard</a></li>
                                        <li><a href="javascript:;">Play</a></li>
                                    </ul>
                                </div>
                            </ReactTransitionGroup>
                        );
                    }

                    var cardClass = "";
                    if (isHinted) {
                        cardClass = "active-card" + appendClass;
                    } else if (isActive) {
                        cardClass = "active-card";
                    }

                    return (
                        <span className={"card-in-hand-" + (index === 0 ? "first" : "rest")}>
                            {menu}
                            {isHinted ? hintDecor : undefined}
                            <img 
                                className={cardClass}
                                src="res/cards/card_back.png" 
                                onMouseOver={this.onMouseOverCardHandler}
                                onMouseLeave={this.onMouseLeaveCardHandler}
                                onClick={this.onCardClickHandler}
                                data-index={index}></img>
                        </span>
                    );
                });
            }
            return (
                <div className="hand-container">
                    {cardViews}
                </div>
            );
        }
    });

    return ThisPlayer;
});