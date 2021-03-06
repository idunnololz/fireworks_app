define(['jquery', 'React', 'app/log', 'app/prefs'], function ($, React, Log, Prefs) {
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
                animationCoeff: parseFloat(Prefs.get(Prefs.KEY_ANIMATION_SPEED, 1)),
            };
        },
        componentWillMount:function() {
            if (this.props.hinted !== undefined) {
                var hand = this.props.playerInfo.hand;
                this.setState({hinted: this.props.hinted, lastCardId: hand[hand.length - 1].cardId});
            }
        },
        showHinted:function() {
            this.setState({showHinted: true});
        },
        hideHinted:function() {
            this.setState({showHinted: false});
        },
        onCardClickHandler:function(index, e) {
            if (this.props.manager.isGameOver()) return;
            if (this.props.manager.isSpectator()) {
                this.props.manager.showToast("You are a spectator.", 3000);
                return;
            }
            if (!this.props.manager.isMyTurn()) return;
            
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
        hideHand:function() {
            this.setState({revealHand: false});
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

                // TODO this is bugged... fix it
                if (prevLastCard !== null && prevLastCard.cardId !== this.state.lastCardId) {
                    // we just drew a card... animate the last card...
                    var $gsap = $(React.findDOMNode(this.refs["gsap" + (newHand.length - 1)]));
                    TweenLite.from($gsap, 0.3, {top: '+=20vw', opacity: '0'});

                    this.setState({lastCardId: newLastCard.cardId});
                }
            }

            if (this.state.active !== -1) {
                document.addEventListener('click', this.handleClickOutside, false);
            }
        },
        handleClickOutside:function(e) {
            if (this.getDOMNode().contains(e.target)) {
                return;
            }
            document.removeEventListener('click', this.handleClickOutside, false);
            this.setState({active: -1});
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

            var time = 5000 * this.state.animationCoeff;

            if (isColorHint) {
                this.props.manager.showTimedDialog("YOU HAVE BEEN HINTED", ("These cards are " + CardUtils.getHint(hintInfo.hintType) + "!"), time);
            } else {
                this.props.manager.showTimedDialog("YOU HAVE BEEN HINTED", ("These cards are " + CardUtils.getHint(hintInfo.hintType) + "(s)!"), time);
            }

            setTimeout(function()  {
                this.setState({hintedCards: [], activeHint: undefined});
            }.bind(this), time);
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
        animatePlay:function(gameEvent) {
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardPlayed = gameEvent.played;

            if (!gameEvent.playable) {
                manager.wait(1200 * this.state.animationCoeff + 2700);
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
                        var $gsap = $(React.findDOMNode(this.refs["gsap" + idx]));
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
                        TweenLite.to($gsap, 0.3, {x: deltaX, y: deltaY, scale: scale});
                        TweenMax.to($noSign, 0.3, {delay: 0.4 * this.state.animationCoeff, yoyo:true, repeat:4, autoAlpha: 1, onComplete: function()  {
                            // trigger a lives update...
                            manager.setLives(gameEvent.lives);

                            TweenLite.to($noSign, 0.3, {autoAlpha: 0});
                            TweenLite.to($gsap, 0.3, {x: d1, y: d2, scale: s2, autoAlpha: 0});

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
                        var newHand = this.props.playerInfo.hand.filter(function(x)  { return x.cardId !== cardPlayed.cardId});
                        newHand.push(gameEvent.draw);

                        TweenLite.to($card, 0.3, {autoAlpha: 0, delay: 0.2});

                        setTimeout(function()  {
                            manager.updateBoard(cardPlayed);
                            this.animateDraw(idx, newHand, function()  {
                                manager.commitState();
                            });
                        }.bind(this), 300);
                    }
                }.bind(this), 500);
            }.bind(this));
        },
        animateDiscard:function(gameEvent) {
            this.props.manager.wait(2600);
            
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardDisc = gameEvent.discarded;
            
            manager.preloadResource(manager.getCardRes(cardDisc), function()  {
                this.setState({flipCard: cardDisc, lastCardId: hand[hand.length - 1].cardId});

                setTimeout(function()  {
                    // this is post flip
                    var idx;

                    $.each(hand, function(index, val)  {
                        if (val.cardId === cardDisc.cardId) {
                            idx = index;
                        }
                    });

                    var menuBar = this.props.manager.getMenuBarRef();
                    // animate the card going into the trash...
                    var finalPos = menuBar.getPositionOf("delete");
                    var finalSize = menuBar.getSizeOf("delete");
                    var $card = $(React.findDOMNode(this.refs["gsap" + idx]));
                    var $delete = $(React.findDOMNode(this.refs["delete" + idx]));
                    var startPos = $card.offset();
                    var finalScale = finalSize.width / $card.innerWidth();
                    var finalX = finalPos.left - startPos.left - (($card.innerWidth() - finalSize.width) / 2);
                    var finalY = finalPos.top - startPos.top - (($card.innerHeight() - finalSize.height) / 2);

                    var midX = Math.floor(window.innerWidth/2) - $card.innerWidth()/2 - startPos.left;
                    var midY = Math.floor(window.innerHeight/2) - $card.innerHeight()/2 - startPos.top;

                    // trigger a hints update...
                    manager.setHints(gameEvent.hints);

                    // three step animation after flip, first animate to center of screen...
                    // then slowly animate it going toward trash (with trash icon glowing on card)
                    // finally animate the card to the trash
                    TweenLite.lagSmoothing(0);
                    TweenMax.lagSmoothing(0);

                    TweenLite.set($card, {css:{zIndex:2}});
                    TweenLite.to($card, 0.3, {x: midX, y: midY});
                    var stepScale = finalScale / 5;
                    TweenLite.to($card, 40, {x: finalX, y: finalY, scale: stepScale, delay: 0.3});
                    TweenMax.to($delete, 0.3, {delay: 0.4, yoyo:true, repeat:5, autoAlpha: 0.9});
                    TweenLite.to($card, 0.3, {x: finalX, y: finalY, scale: finalScale, delay: 2.3 * this.state.animationCoeff, 
                        autoAlpha: 0, onComplete: function()  {
                        
                        var newHand = this.props.playerInfo.hand.filter(function(x)  { return x.cardId !== cardDisc.cardId});
                        newHand.push(gameEvent.draw);
                        this.animateDraw(idx, newHand, function()  {
                            manager.addToDiscards(cardDisc);
                            manager.commitState();
                        });
                    }.bind(this)});
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

            var turnIndicator;

            if (this.props.isMyTurn && this.state.active === -1) {
                turnIndicator = (
                    React.createElement("div", {className: "my-turn-indicator-container"}, 
                        React.createElement("p", null, "Your turn"), 
                        React.createElement("div", {className: "arrow-down"})
                    )
                );
            }

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
                            React.createElement(ReactTransitionGroup, {transitionName: "fade-in", transitionAppear: true, 
                                transitionEnterTimeout: 300, transitionLeaveTimeout: 300}, 
                                React.createElement("div", {className: "menu-container", style: {top: -this.state.menuHeight}, ref: "menuContainer", onClick: this.onCancelClick}, 
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
                            React.createElement("div", {className: "gsap-container", ref: "gsap" + index}, 
                                React.createElement("a", {
                                    className: cardClass + " card-container" + (isActive || isHinted ? "" : " hoverable"), 
                                    onClick: this.onCardClickHandler.bind(this, index), 
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
                                    React.createElement("div", {ref: "delete" + index, className: "invisible delete"}, " "), 
                                    hintDecor
                                )
                            )
                        )
                    );
                }.bind(this));
            }
            return (
                React.createElement("div", {className: "hand-container", ref: "handContainer"}, 
                    React.createElement(ReactTransitionGroup, {
                        transitionName: "fade", 
                        transitionAppear: true, 
                        transitionEnterTimeout: 300, 
                        transitionLeaveTimeout: 300}, 

                        turnIndicator

                    ), 
                    cardViews
                )
            );
        }
    });

    return ThisPlayer;
});