define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = "ThisPlayer";

    var ThisPlayer = React.createClass({displayName: "ThisPlayer",
        getInitialState:function() {
            return {
                active: -1,
                menuHeight: -1,
                hintedCards: [],
                activeHint: undefined,

                flipCard: undefined,
                hinted: {}, // hinted is a mapping from cardId to what is known about the card: {123:{color:3,number:undefined}}
                showHinted: true,
                revealHand: false,
            };
        },
        componentWillMount:function() {
        },
        showHinted:function() {
            this.setState({showHinted: true});
        },
        hideHinted:function() {
            this.setState({showHinted: false});
        },
        onCardClickHandler:function(e) {
            if (!this.props.manager.isMyTurn() || this.props.manager.isGameOver()) return;
            
            var $card = $(e.target);
            var index = parseInt($card.attr("data-index"));
            $card.removeClass('hover-card');

            this.props.onOpen();
            this.setState({active: index});
        },
        // too lazy with the handler postfix
        onCancelClick:function(e) {
            this.close();
        },
        onDiscardClick:function(e) {
            this.close();
            var active = this.state.active;
            this.props.manager.discard(this.props.playerInfo.hand[active].cardId);
        },
        onPlayClick:function(e) {
            this.close();
            var active = this.state.active;
            this.props.manager.play(this.props.playerInfo.hand[active].cardId);
        },
        close:function() {
            this.setState({active: -1});
        },
        revealHand:function() {
            this.setState({revealHand: true});
        },
        componentDidUpdate:function(prevProps, prevState) {
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

                if (prevLastCard !== null && prevLastCard.cardId !== this.state.lastCardId) {
                    // we just drew a card... animate the last card...
                    var $card = $(React.findDOMNode(this.refs["card" + (newHand.length - 1)]));
                    $card.addClass('card-draw');

                    this.setState({lastCardId: newLastCard.cardId});
                }
            }
        },
        animateHint:function(hintInfo) {
            // translate cardId to indices
            var thisPlayer = this.props.playerInfo;
            var hand = thisPlayer.hand;
            var isColorHint = CardUtils.isColorHint(hintInfo.hintType);

            {
                // update the hinted...
                var hinted = this.state.hinted;
                $.each(hintInfo.affectedCards, function(index, val)  {
                    var cardInfo;
                    if (hinted[val] === undefined) {
                        cardInfo = {color: undefined, number: undefined};
                    } else {
                        cardInfo = hinted[val];
                    }

                    if (isColorHint) {
                        cardInfo.color = CardUtils.getHintColor(hintInfo.hintType);
                    } else {
                        cardInfo.number = CardUtils.getHintNumber(hintInfo.hintType);
                    }

                    hinted[val] = cardInfo;
                });
            }

            var hintedIndices = $.map(hintInfo.affectedCards, function(val)  {
                return this.getIndexForCardId(val);
            }.bind(this));
            this.setState({hintedCards: hintedIndices, activeHint: hintInfo, hinted: hinted});

            if (isColorHint) {
                this.props.manager.showTimedDialog("YOU HAVE BEEN HINTED", ("These cards are " + CardUtils.getHint(hintInfo.hintType) + "!"), 5000);
            } else {
                this.props.manager.showTimedDialog("YOU HAVE BEEN HINTED", ("These cards are " + CardUtils.getHint(hintInfo.hintType) + "s!"), 5000);
            }

            setTimeout(function()  {
                this.setState({hintedCards: [], activeHint: undefined});
            }.bind(this), 5000);
        },
        animateDraw:function(removedIndex, newHand, callBack) {
            var idx = removedIndex;
            var manager = this.props.manager;
            Log.d(TAG, "newHand: %O", newHand);

            if (newHand[newHand.length - 1] === null) {
                // we drew a 'null' card (aka deck empty)

                var leftShift = [];
                var rightShift = [];
                for (var i = 0; i < idx; i++) {
                    var $c = $(React.findDOMNode(this.refs["card" + i]));
                    $c.addClass("right-half-shift");
                    rightShift.push($c);
                }
                for (var i = idx + 1; i < newHand.length; i++) {
                    var $c = $(React.findDOMNode(this.refs["card" + i]));
                    $c.addClass("left-half-shift");
                    leftShift.push($c);
                }

                setTimeout(function()  {
                    $.each(leftShift, function(index, val)  {
                        val.addClass('notransition');
                        val.removeClass("left-half-shift");
                        val[0].offsetHeight;
                        val.removeClass('notransition');
                    });
                    $.each(rightShift, function(index, val)  {
                        val.addClass('notransition');
                        val.removeClass("right-half-shift");
                        val[0].offsetHeight;
                        val.removeClass('notransition');
                    });
                    manager.onNewHand(this.props.playerInfo.playerId, newHand);
                    if (callBack !== undefined) {
                        callBack();
                    }
                }.bind(this), 300);
            } else if (idx !== newHand.length - 1) {
                var affected = [];
                for (var i = idx + 1; i < newHand.length; i++) {
                    var $c = $(React.findDOMNode(this.refs["card" + i]));
                    $c.addClass("shift");
                    affected.push($c);
                }
                setTimeout(function()  {
                    $.each(affected, function(index, val)  {
                        val.addClass('notransition');
                        val.removeClass("shift");
                        val[0].offsetHeight;
                        val.removeClass('notransition');
                    });
                    manager.onNewHand(this.props.playerInfo.playerId, newHand);
                    if (callBack !== undefined) {
                        callBack();
                    }
                }.bind(this), 300);
            } else {
                manager.onNewHand(this.props.playerInfo.playerId, newHand);
                if (callBack !== undefined) {
                    callBack();
                }
            }
        },
        animateToTrash:function(cardIndex) {
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
            $card.css("transform", ("translateX(" + deltaX + "px) translateY(" + deltaY + "px) scale(" + scale + ")"));
            $card.css("opacity", "0");
        },
        animatePlay:function(gameEvent) {
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

            if (!gameEvent.playable) {
                manager.wait(3900);
            } else {
                manager.wait(900);
            }

            manager.preloadResource(manager.getCardRes(cardPlayed), function()  {
                // clean up hinted...
                var hinted = this.state.hinted;
                if (hinted[cardPlayed.cardId] !== undefined) {
                    delete hinted[cardPlayed.cardId];
                }
                var lastCard = hand[hand.length - 1];
                this.setState({flipCard: cardPlayed, lastCardId: lastCard === null ? -1 : lastCard.cardId, hinted: hinted});

                setTimeout(function()  {
                    var idx;
                    $.each(hand, function(index, val)  {
                        if (val.cardId === cardPlayed.cardId) {
                            idx = index;
                        }
                    });

                    var menuBar = manager.getMenuBarRef();

                    if (manager.getHints() !== gameEvent.hints) {
                        manager.setHints(gameEvent.hints);
                        manager.commitState();
                    }

                    if (!gameEvent.playable) {
                        // Animate the card going to the center.
                        // Then animate a flashing no sign.
                        // Finally animate the card going to the trash.
                        var gameBoard = manager.getGameBoardRef();
                        var refName = gameBoard.getRefNameForCard(cardPlayed);
                        var finalPos = gameBoard.getPositionOf(refName);
                        var finalSize = gameBoard.getSizeOf(refName);

                        var $card = $(React.findDOMNode(this.refs["card" + idx]));
                        var $noSign = $(React.findDOMNode(this.refs["no-sign" + idx]));
                        var startPos = $card.offset();
                        var scale = finalSize.width / $card.innerWidth();
                        var deltaX = finalPos.left - startPos.left - (($card.innerWidth() - finalSize.width) / 2);
                        var deltaY = finalPos.top - startPos.top - (($card.innerHeight() - finalSize.height) / 2);

                        {
                            // we need to precalculate the destination location (which is where the garbage icon is)
                            // because GSAP animates from the ORIGINAL location, not the intermediate location
                            var menuBar = this.props.manager.getMenuBarRef();
                            var finalPos = menuBar.getPositionOf("delete");
                            var finalSize = menuBar.getSizeOf("delete");

                            var s2 = finalSize.width / $card.innerWidth();
                            var d1 = finalPos.left - startPos.left - (($card.innerWidth() - finalSize.width) / 2);
                            var d2 = finalPos.top - startPos.top - (($card.innerHeight() - finalSize.height) / 2);
                        }

                        TweenLite.lagSmoothing(0);
                        TweenMax.lagSmoothing(0);
                        TweenLite.to($card, 0.3, {x: deltaX, y: deltaY, scale: scale, ease: Power0.easeNone});
                        TweenMax.to($noSign, 0.3, {delay: 0.8, yoyo:true, repeat:4, autoAlpha: 1, onComplete: function()  {
                            // trigger a lives update...
                            manager.setLives(gameEvent.lives);

                            TweenLite.to($noSign, 0.3, {autoAlpha: 0});
                            TweenLite.to($card, 0.3, {x: d1, y: d2, scale: s2, autoAlpha: 0});

                            // after this, animate the draw
                            var newHand = this.props.playerInfo.hand.filter(function(x)  { return x.cardId !== cardPlayed.cardId});
                            newHand.push(gameEvent.draw);
                            setTimeout(function()  {
                                this.animateDraw(idx, newHand, function()  {
                                    manager.addToDiscards(cardPlayed);
                                    manager.commitState();
                                });
                            }.bind(this), 300);
                        }.bind(this)});
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
                        $card.css("transform", ("translateX(" + deltaX + "px) translateY(" + deltaY + "px) scale(" + scale + ")"));
                        //$card.css("opacity", "0");
                        var newHand = this.props.playerInfo.hand.filter(function(x)  { return x.cardId !== cardPlayed.cardId});
                        newHand.push(gameEvent.draw);

                        setTimeout(function()  {
                            manager.updateBoard(cardPlayed);
                            manager.preloadResource(manager.getSmallCardRes(cardPlayed), function()  {
                                $card.css("opacity", "0");
                            });
                            this.animateDraw(idx, newHand, function()  {
                                manager.commitState();
                            });
                        }.bind(this), 300);
                    }
                }.bind(this), 500);
            }.bind(this));
        },
        animateDiscard:function(gameEvent) {
            this.props.manager.wait(900);
            
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardDisc = gameEvent.discarded;
            
            manager.preloadResource(manager.getCardRes(cardDisc), function()  {
                this.setState({flipCard: cardDisc, lastCardId: hand[hand.length - 1].cardId});

                setTimeout(function()  {
                    var idx;

                    $.each(hand, function(index, val)  {
                        if (val.cardId === cardDisc.cardId) {
                            idx = index;
                        }
                    });

                    this.animateToTrash(idx);

                    // trigger a hints update...
                    manager.setHints(gameEvent.hints);

                    var newHand = this.props.playerInfo.hand.filter(function(x)  { return x.cardId !== cardDisc.cardId});
                    newHand.push(gameEvent.draw);
                    setTimeout(function()  {
                        this.animateDraw(idx, newHand, function()  {
                            manager.addToDiscards(cardDisc);
                            manager.commitState();
                        });
                    }.bind(this), 300);
                }.bind(this), 300);
            }.bind(this));
        },
        getIndexForCardId:function(cardId) {
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
        render:function() {
            var playerInfo = this.props.playerInfo;
            var cardViews = [];
            var appendClass = "";
            var targetedHintDecor;
            var revealHand = this.state.revealHand;

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

                    targetedHintDecor = (
                        React.createElement("div", {className: "hint-decor"}, 
                            numberHint
                        )
                    );
                }
            }

            if (playerInfo.hand !== undefined) {
                cardViews = $.map(playerInfo.hand, function(val, index)  {
                    if (val === null) {
                        return null;
                        // return (
                        //     <span className="card-in-hand animate-gone" key="notHere">
                        //     </span>
                        // );
                    }
                    var isActive = this.state.active === index;
                    var isHinted = this.state.hintedCards.indexOf(index) !== -1;
                    var isShowHinted = this.state.showHinted;
                    var hinted = this.state.hinted;
                    var menu = undefined;
            
                    if (isActive) {
                        menu = (
                            React.createElement(ReactTransitionGroup, {transitionName: "fade-in", transitionAppear: true}, 
                                React.createElement("div", {className: "menu-container", style: {top: -this.state.menuHeight}, ref: "menuContainer"}, 
                                    React.createElement("ul", {className: "menu", ref: "menu"}, 
                                        React.createElement("li", null, React.createElement("a", {href: "javascript:;", onClick: this.onCancelClick}, "Cancel")), 
                                        React.createElement("li", null, React.createElement("a", {href: "javascript:;", onClick: this.onDiscardClick}, "Discard")), 
                                        React.createElement("li", null, React.createElement("a", {href: "javascript:;", onClick: this.onPlayClick}, "Play"))
                                    )
                                )
                            )
                        );
                    }

                    var cardClass = "";
                    var cardBackClass = "front" + (isHinted ? appendClass : "");
                    if (isHinted) {
                        cardClass = "active-card";
                    } else if (isActive) {
                        cardClass = "active-card";
                    }

                    var hintDecor = isHinted ? targetedHintDecor : undefined;

                    if (isShowHinted && hinted[val.cardId] !== undefined) {
                        var whatWeKnow = hinted[val.cardId];
                        if (whatWeKnow.color !== undefined) {
                            switch (CardUtils.getHintColor(whatWeKnow.color)) {
                                case CardUtils.Color.BLUE:
                                    cardBackClass += " strong-blue-pulse";
                                    break;
                                case CardUtils.Color.GREEN:
                                    cardBackClass += " strong-green-pulse";
                                    break;
                                case CardUtils.Color.RED:
                                    cardBackClass += " strong-red-pulse";
                                    break;
                                case CardUtils.Color.WHITE:
                                    cardBackClass += " strong-white-pulse";
                                    break;
                                case CardUtils.Color.YELLOW:
                                    cardBackClass += " strong-yellow-pulse";
                                    break;
                            }
                        }
                        if (whatWeKnow.number !== undefined) {
                            var numberHint = whatWeKnow.number;

                            hintDecor = (
                                React.createElement("div", {className: "hint-decor"}, 
                                    numberHint
                                )
                            );
                        }
                    }

                    var cardRes = "res/cards/card_back.png";
                    var toFlip = this.state.flipCard;
                    var isAnimatingPlay = toFlip !== undefined && toFlip.cardId === val.cardId;
                    if (isAnimatingPlay) {
                        cardRes = "res/cards/" + CardUtils.getResourceNameForCard(toFlip.cardType);
                    } else if (revealHand) {
                        cardRes = "res/cards/" + CardUtils.getResourceNameForCard(val.cardType);
                    }

                    return (
                        React.createElement("span", {className: "card-in-hand", key: val.cardId}, 
                            menu, 
                            React.createElement("a", {
                                className: cardClass + " card-container" + (isActive || isHinted ? "" : " hoverable"), 
                                onClick: this.onCardClickHandler, 
                                "data-index": index, 
                                href: "javascript:;", 
                                ref: "card" + index}, 
                                React.createElement("div", {className: "card" + (isAnimatingPlay || revealHand ? " flip" : "")}, 
                                    React.createElement("img", {
                                        className: cardBackClass, 
                                        src: "res/cards/card_back.png", 
                                        "data-index": index}), 
                                    React.createElement("img", {
                                        className: "back", 
                                        src: cardRes})
                                ), 
                                React.createElement("div", {ref: "no-sign" + index, className: "invisible no-sign"}, " "), 
                                hintDecor
                            )
                        )
                    );
                }.bind(this));
            }
            return (
                React.createElement("div", {className: "hand-container", ref: "handContainer"}, 
                    cardViews
                )
            );
        }
    });

    return ThisPlayer;
});