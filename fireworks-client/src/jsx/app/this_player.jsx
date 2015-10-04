define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var ThisPlayer = React.createClass({
        getInitialState() {
            return {
                active: -1,
                menuHeight: -1,
                hintedCards: [],
                activeHint: undefined,

                flipCard: undefined
            };
        },
        componentWillMount() {
        },
        onCardClickHandler(e) {
            if (!this.props.manager.isMyTurn()) return;
            
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
        onDiscardClick(e) {
            this.close();
            var active = this.state.active;
            this.props.manager.discard(this.props.playerInfo.hand[active].cardId);
        },
        onPlayClick(e) {
            this.close();
            var active = this.state.active;
            this.props.manager.play(this.props.playerInfo.hand[active].cardId);
        },
        close() {
            this.setState({active: -1});
        },
        componentDidUpdate(prevProps, prevState) {
            var menuDom = React.findDOMNode(this.refs.menu);
            if (menuDom !== undefined) {
                var menuHeight = $(menuDom).outerHeight();
                if (menuHeight !== this.state.menuHeight) {
                    this.setState({menuHeight: menuHeight});
                }
            }
            if (prevProps.playerInfo !== undefined && prevProps.playerInfo.hand !== undefined) {
                // because we are modifying the original obj (playerInfo), nothing changes so we need to employ
                // a work around with our state...
                var oldHand = prevProps.playerInfo.hand;
                var newHand = this.props.playerInfo.hand;
                var prevLastCard = oldHand[oldHand.length - 1];
                var newLastCard = newHand[newHand.length - 1];

                if (prevLastCard.cardId !== this.state.lastCardId) {
                    // we just drew a card... animate the last card...
                    var $card = $(React.findDOMNode(this.refs["card" + (newHand.length - 1)]));
                    $card.addClass('card-draw');

                    this.setState({lastCardId: newLastCard.cardId});
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
                this.props.manager.showTimedDialog("YOU HAVE BEEN HINTED", `These cards are ${CardUtils.getHint(hintInfo.hintType)}!`, 5000);
            } else {
                this.props.manager.showTimedDialog("YOU HAVE BEEN HINTED", `These cards are ${CardUtils.getHint(hintInfo.hintType)}s!`, 5000);
            }

            setTimeout(() => {
                this.setState({hintedCards: [], activeHint: undefined});
            }, 5000);
        },
        animateDraw(removedIndex, newHand, callBack) {
            var idx = removedIndex;
            var manager = this.props.manager;
            if (idx !== newHand.length - 1) {
                var affected = [];
                for (var i = idx + 1; i < newHand.length; i++) {
                    var $c = $(React.findDOMNode(this.refs["card" + i]));
                    $c.addClass("shift");
                    affected.push($c);
                }
                setTimeout(() => {
                    $.each(affected, (index, val) => {
                        val.addClass('notransition');
                        val.removeClass("shift");
                        val[0].offsetHeight;
                        val.removeClass('notransition');
                    });
                    manager.onNewHand(this.props.playerInfo.playerId, newHand);
                    if (callBack !== undefined) {
                        callBack();
                    }
                }, 300);
            } else {
                manager.onNewHand(this.props.playerInfo.playerId, newHand);
                if (callBack !== undefined) {
                    callBack();
                }
            }
        },
        animateToTrash(cardIndex) {
            var idx = cardIndex;
            var menuBar = this.props.manager.getMenuBarRef();
            // animate the card going into the trash...
            var finalPos = menuBar.getPositionOf("delete");
            var finalSize = menuBar.getSizeOf("delete");
            var $card = $(React.findDOMNode(this.refs["card" + idx]));
            var startPos = $card.offset();
            var scale = finalSize.width / $card.innerWidth();
            var deltaX = finalPos.left - startPos.left - (($card.innerWidth() - finalSize.width) / 2);
            var deltaY = finalPos.top - startPos.top - (($card.innerHeight() - finalSize.height) / 2);
            $card.css("transform", `translateX(${deltaX}px) translateY(${deltaY}px) scale(${scale})`);
            $card.css("opacity", "0");
        },
        animatePlay(gameEvent) {
            /*
            {
              "playerId": 4,
              "eventType": 4,
              "data": {
                "cardId": 5
              },
              "lives": 2,
              "draw": {
                "cardId": 10,
                "cardType": 1048576
              },
              "played": {

                "cardId": 5,
                "cardType": 8192
              }
            }
            */
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardPlayed = gameEvent.played;

            manager.preloadResource(manager.getCardRes(cardPlayed), () => {
                this.setState({flipCard: cardPlayed, lastCardId: hand[hand.length - 1].cardId});

                setTimeout(() => {
                    var idx;
                    $.each(hand, (index, val) => {
                        if (val.cardId === cardPlayed.cardId) {
                            idx = index;
                        }
                    });

                    var menuBar = manager.getMenuBarRef();

                    if (manager.getLives() > gameEvent.lives) {
                        this.animateToTrash(idx);

                        // trigger a lives update...
                        manager.setLives(gameEvent.lives);

                        // after this, animate the draw
                        var newHand = this.props.playerInfo.hand.filter((x) => { return x.cardId !== cardPlayed.cardId});
                        newHand.push(gameEvent.draw);
                        setTimeout(() => {
                            this.animateDraw(idx, newHand, () => {
                                manager.addToDiscards(cardPlayed);
                                manager.commitState();
                            });
                        }, 300);
                    } else {
                        // animate the card going to the center...
                        var gameBoard = manager.getGameBoardRef();
                        var refName = gameBoard.getRefNameForCard(cardPlayed);
                        var finalPos = gameBoard.getPositionOf(refName);
                        var finalSize = gameBoard.getSizeOf(refName);

                        var $card = $(React.findDOMNode(this.refs["card" + idx]));
                        var startPos = $card.offset();
                        var scale = finalSize.width / $card.innerWidth();
                        var deltaX = finalPos.left - startPos.left - (($card.innerWidth() - finalSize.width) / 2);
                        var deltaY = finalPos.top - startPos.top - (($card.innerHeight() - finalSize.height) / 2);
                        $card.css("transform", `translateX(${deltaX}px) translateY(${deltaY}px) scale(${scale})`);
                        //$card.css("opacity", "0");
                        var newHand = this.props.playerInfo.hand.filter((x) => { return x.cardId !== cardPlayed.cardId});
                        newHand.push(gameEvent.draw);

                        setTimeout(() => {
                            manager.updateBoard(cardPlayed);
                            manager.preloadResource(manager.getSmallCardRes(cardPlayed), () => {
                                $card.css("opacity", "0");
                            });
                            this.animateDraw(idx, newHand, () => {
                                manager.commitState();
                            });
                        }, 300);
                    }
                }, 500);
            });
        },
        animateDiscard(gameEvent) {
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardDisc = gameEvent.discarded;
            
            manager.preloadResource(manager.getCardRes(cardDisc), () => {
                this.setState({flipCard: cardDisc, lastCardId: hand[hand.length - 1].cardId});

                setTimeout(() => {
                    var idx;

                    $.each(hand, (index, val) => {
                        if (val.cardId === cardDisc.cardId) {
                            idx = index;
                        }
                    });

                    this.animateToTrash(idx);

                    // trigger a hints update...
                    manager.setHints(gameEvent.hints);

                    var newHand = this.props.playerInfo.hand.filter((x) => { return x.cardId !== cardDisc.cardId});
                    newHand.push(gameEvent.draw);
                    setTimeout(() => {
                        this.animateDraw(idx, newHand, () => {
                            manager.addToDiscards(cardDisc);
                            manager.commitState();
                        });
                    }, 300);
                }, 300);
            });
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
                                        <li><a href="javascript:;" onClick={this.onDiscardClick}>Discard</a></li>
                                        <li><a href="javascript:;" onClick={this.onPlayClick}>Play</a></li>
                                    </ul>
                                </div>
                            </ReactTransitionGroup>
                        );
                    }

                    var cardClass = "";
                    if (isHinted) {
                        cardClass = "active-card";
                    } else if (isActive) {
                        cardClass = "active-card";
                    }

                    var cardRes = "res/cards/card_back.png";
                    var toFlip = this.state.flipCard;
                    var isAnimatingPlay = toFlip !== undefined && toFlip.cardId === val.cardId;
                    if (isAnimatingPlay) {
                        cardRes = "res/cards/" + CardUtils.getResourceNameForCard(toFlip.cardType);
                    }

                    return (
                        <span className={"card-in-hand"} key={val.cardId}>
                            {menu}
                            {isHinted ? hintDecor : undefined}
                            <a 
                                className={cardClass + " card-container" + (isActive || isHinted ? "" : " hoverable")}
                                onClick={this.onCardClickHandler}
                                data-index={index}
                                href="javascript:;"
                                ref={"card" + index}>
                                <div className={"card" + (isAnimatingPlay ? " flip" : "")}>
                                    <img 
                                        className={"front" + (isHinted ? appendClass : "")}
                                        src="res/cards/card_back.png"
                                        data-index={index}></img>
                                    <img 
                                        className="back"
                                        src={cardRes}></img>
                                </div>
                            </a>
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