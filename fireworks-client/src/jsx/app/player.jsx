define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = "Player";

    const HINT_COLOR = 1;
    const HINT_NUMBER = 2;
    var Player = React.createClass({
        getInitialState() {
            return {
                selected: [],
                hintType: HINT_COLOR,
                isOpen: false,
                selectedSingle: -1,
                hintedCards: [],
                activeHint: undefined,

                specialText: null,
                showSpecialText: false,

                showMenu: false,

                hinted: {}, // hinted is a mapping from cardId to what is known about the card: {123:{color:3,number:undefined}}
                showHinted: true,
            };
        },
        componentWillMount() {
            if (this.props.hinted !== undefined) {
                var hand = this.props.playerInfo.hand;
                this.setState({hinted: this.props.hinted, lastCardId: hand[hand.length - 1].cardId});
            }
        },
        componentDidUpdate(prevProps, prevState) {
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

            if (this.state.isOpen) {
                document.addEventListener('click', this.handleClickOutside, false);
            }
        },
        componentWillUnmount(){
            document.removeEventListener('click', this.handleClickOutside, false);
        },
        handleClickOutside(e) {
            if (this.getDOMNode().contains(e.target)) {
                return;
            }
            this.close();
        },
        onMouseOverCardHandler(e) {
            var $card = $(e.target);
            $card.addClass('hover-card');
        },
        onMouseLeaveCardHandler(e) {
            var $card = $(e.target);
            $card.removeClass('hover-card');
        },
        onCardClickHandler(index, e) {
            if (this.props.manager.isGameOver()) return;
            if (this.props.manager.isSpectator()) {
                this.props.manager.showToast("You are a spectator.", 3000);
                return;
            }
            if (!this.props.manager.isMyTurn()) return;

            var playerInfo = this.props.playerInfo;
            var $card = $(e.target);
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
            var manager = this.props.manager;

            if (manager.getHints() <= 0) {
                manager.showToast("We can't give a hint because we have no more hint tokens!", 3000);
                this.close();
                return;
            }

            // get the hintType (from CardUtils...not to be confused with this.state.hintType)
            var hintType = this.state.hintType;
            var card = this.props.playerInfo.hand[this.state.selectedSingle];
            if (hintType === HINT_COLOR) {
                // we can easily determine the hint type from the single selected card...
                hintType = CardUtils.colorToHint(CardUtils.getCardColor(card.cardType));
            } else {
                hintType = CardUtils.numberToHint(CardUtils.getCardNumber(card.cardType));
            }
            Log.d(TAG, "Sent hint with hint type: " + hintType);

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
        animateHint(hintInfo) {
            // translate cardId to indices
            var thisPlayer = this.props.playerInfo;
            var hand = thisPlayer.hand;
            var isColorHint = CardUtils.isColorHint(hintInfo.hintType);

            {
                // update the hinted...
                var hinted = this.state.hinted;
                $.each(hintInfo.affectedCards, (index, val) => {
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

            var hintedIndices = $.map(hintInfo.affectedCards, (val) => {
                return this.getIndexForCardId(val);
            });
            this.setState({
                hintedCards: hintedIndices, 
                activeHint: hintInfo, 
                specialText: `${thisPlayer.playerName} was hinted ${CardUtils.getHint(hintInfo.hintType)}(s)`,
                showSpecialText: true,
                hinted: hinted
            });
            this.props.manager.wait(5000);

            setTimeout(() => {
                this.setState({hintedCards: [], activeHint: undefined, showSpecialText: false});
            }, 5000);
        },
        animatePlay(gameEvent) {
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardPlayed = gameEvent.played;

            if (gameEvent.playable) {
                manager.wait(900);
            } else {
                manager.wait(3900);
            }

            manager.preloadResource(manager.getCardRes(cardPlayed), () => {
                // clean up hinted...
                var hinted = this.state.hinted;
                if (hinted[cardPlayed.cardId] !== undefined) {
                    delete hinted[cardPlayed.cardId];
                }
                this.setState({hinted: hinted});

                var idx;
                $.each(hand, (index, val) => {
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
                    TweenLite.set($card, {css:{zIndex:1}});
                    TweenLite.to($gsap, 0.3, {x: deltaX, y: deltaY, scale: scale});
                    TweenMax.to($noSign, 0.3, {delay: 0.3, yoyo:true, repeat:4, autoAlpha: 1, onComplete: () => {
                        // trigger a lives update...
                        manager.setLives(gameEvent.lives);

                        TweenLite.to($noSign, 0.3, {autoAlpha: 0});
                        TweenLite.to($gsap, 0.3, {x: d1, y: d2, scale: s2, autoAlpha: 0});

                        // after this, animate the draw
                        var newHand = this.props.playerInfo.hand.filter((x) => { return x.cardId !== cardPlayed.cardId});
                        newHand.push(gameEvent.draw);
                        setTimeout(() => {
                            this.animateDraw(idx, newHand, () => {
                                manager.addToDiscards(cardPlayed);
                                manager.commitState();
                            });
                        }, 300);
                    }});
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
            });
        },
        animateDiscard(gameEvent) {
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardDisc = gameEvent.discarded;

            manager.wait(2600);
            
            manager.preloadResource(manager.getCardRes(cardDisc), () => {
                setTimeout(() => {
                    var idx;

                    $.each(hand, (index, val) => {
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
                    var finalScale = finalSize.width / $(React.findDOMNode(this.refs["card" + idx])).innerWidth();
                    var finalX = finalPos.left - startPos.left - (($card.innerWidth() - finalSize.width) / 2);
                    var finalY = finalPos.top - startPos.top - (($card.innerHeight() - finalSize.height) / 2);

                    // trigger a hints update...
                    manager.setHints(gameEvent.hints);

                    var midX = Math.floor(window.innerWidth/2) - $card.innerWidth()/2 - startPos.left;
                    var midY = Math.floor(window.innerHeight/2) - $card.innerHeight()/2 - startPos.top;
                    
                    // three step animation after flip, first animate to center of screen...
                    // then slowly animate it going toward trash (with trash icon glowing on card)
                    // finally animate the card to the trash
                    TweenLite.lagSmoothing(0);
                    TweenMax.lagSmoothing(0);
                    TweenLite.set($card, {css:{zIndex:1}});

                    TweenLite.to($card, 0.3, {x: midX, y: midY});
                    var stepScale = finalScale / 5;
                    TweenLite.to($card, 40, {x: finalX, y: finalY, scale: stepScale, delay: 0.3});
                    TweenMax.to($delete, 0.3, {delay: 0.4, yoyo:true, repeat:5, autoAlpha: 0.9});
                    TweenLite.to($card, 0.3, {x: finalX, y: finalY, scale: finalScale, delay: 2.3, autoAlpha: 0, onComplete: () => {
                        var newHand = this.props.playerInfo.hand.filter((x) => { return x.cardId !== cardDisc.cardId});
                        newHand.push(gameEvent.draw);
                        this.animateDraw(idx, newHand, () => {
                            manager.addToDiscards(cardDisc);
                            manager.commitState();
                        });
                    }});
                }, 300);
            });
        },
        onShowMenuClick(e) {
            // center menu under our arrow...
            var $dropBtn = $(e.target);
            var $menu = $(".menu");

            var x = $dropBtn.outerWidth() / 2 + $dropBtn.position().left - ($menu.outerWidth() / 2);
            var y = $dropBtn.outerHeight() + $dropBtn.position().top;

            $menu.css({top: y, left: x});

            this.setState({showMenu: true});
        },
        onMenuCancelClick() {
            this.setState({showMenu: false});
        },
        showHinted() {
            this.setState({showMenu:false, showHinted: true});
        },
        hideHinted() {
            this.setState({showHinted: false});
        },
        render() {
            var open = this.state.isOpen;
            var playerInfo = this.props.playerInfo;
            var selectedCards = this.state.selected;
            var hintColor = this.state.hintType === HINT_COLOR;
            var cardViews = [];
            var appendClass = "";
            var isHintActive = this.state.activeHint !== undefined;

            var isMyTurn = this.props.manager.getTurnIndex() === playerInfo.playerIndex;

            if (isHintActive) {
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
                }
            }

            if (playerInfo.hand !== undefined) {
                var isShowHinted = this.state.showHinted;
                var hinted = this.state.hinted;

                cardViews = $.map(playerInfo.hand, (val, index) => {
                    if (val === null) {
                        return null;
                    }

                    var selected = selectedCards.indexOf(index) > -1;
                    var isHinted = this.state.hintedCards.indexOf(index) !== -1;
                    var hintView;

                    // logic for displaying hinted cards
                    if (isShowHinted && hinted[val.cardId] !== undefined) {
                        var whatWeKnow = hinted[val.cardId];
                        var colorClass;
                        var numberHint = "a";
                        var numberClass = " no-number";
                        var isWhite = false;
                        if (whatWeKnow.color !== undefined) {
                            switch (CardUtils.getHintColor(whatWeKnow.color)) {
                                case CardUtils.Color.BLUE:
                                    colorClass += " card-blue";
                                    break;
                                case CardUtils.Color.GREEN:
                                    colorClass += " card-green";
                                    break;
                                case CardUtils.Color.RED:
                                    colorClass += " card-red";
                                    break;
                                case CardUtils.Color.WHITE:
                                    colorClass += " card-white";
                                    isWhite = true; // white text doesn't work well on a white background...
                                    break;
                                case CardUtils.Color.YELLOW:
                                    colorClass += " card-yellow";
                                    break;
                            }
                        }
                        if (whatWeKnow.number !== undefined) {
                            numberHint = whatWeKnow.number;
                            numberClass = "";

                            if (isWhite) {
                                colorClass += "  black-text";
                            }
                        }
                        
                        hintView = (
                            <div className={"hint-decor " + colorClass + numberClass} key="hintView">
                                {numberHint}
                            </div>
                        );
                    }
                    
                    return (
                        <div className="gsap-container" ref={"gsap" + index} key={val.cardId}>
                            <span className={"card-in-hand" + (selected || isHinted ? " active-card" : "")} ref={"card" + index}>
                                <ReactTransitionGroup transitionName="hint-view-transition" transitionEnterTimeout={300} transitionLeaveTimeout={300} >
                                    {hintView}
                                </ReactTransitionGroup>
                                <img 
                                    className={isHinted ? appendClass : ""}
                                    src={"res/cards/" + CardUtils.getResourceNameForCard(val.cardType)}
                                    onMouseOver={this.onMouseOverCardHandler}
                                    onMouseLeave={this.onMouseLeaveCardHandler}
                                    onClick={this.onCardClickHandler.bind(this, index)}
                                    />
                                <div ref={"no-sign" + index} className="invisible no-sign"> </div>
                                <div ref={"delete" + index} className="invisible delete"> </div>
                            </span>
                        </div>
                    );
                });
            }

            var titleClass = isMyTurn ? " turn-indicator" : "";
            var showSpecialText = this.state.showSpecialText;
            var specialText = this.state.specialText;
            var playerTitle;
            if (showSpecialText) {
                playerTitle = (
                    <div style={{position: 'relative'}}>
                        <div className="title invisible">
                            <h1 className={titleClass}>{playerInfo.playerName}</h1>
                            <div className="show-menu-button gone" onClick={this.onShowMenuClick}>
                                <div className="arrow-down"></div>
                            </div>
                        </div>
                        <h1 className={"special " + titleClass}>{specialText}</h1>
                    </div>
                );
            } else {
                playerTitle = (
                    <div style={{position: 'relative'}}>
                        <div className="title">

                            <div className={!isMyTurn ? "invisible" : "pyramid-gyro"}>
                              <div className="pyramid-axis">
                                
                                <div className="pyramid-wall front"></div>
                                <div className="pyramid-wall back"></div>
                                <div className="pyramid-wall left"></div>
                                <div className="pyramid-wall right"></div>
                                
                                <div className="bottom"></div>
                              </div>
                            </div>

                            <h1 className={titleClass}>{playerInfo.playerName}</h1>
                            <div className="show-menu-button gone" onClick={this.onShowMenuClick}>
                                <div className="arrow-down"></div>
                            </div>
                        </div>
                        <h1 className={"special " + titleClass + " invisible"}>{specialText}</h1>
                    </div>
                );
            }
            return (
                <div className={"player-container" + (open ? " player-container-open" : "")}>
                    {playerTitle}
                    <div className={"slideable-container" + (open || isHintActive ? " container-open" : "")}>
                        <div className="centering-container">
                            <div className="card-container">
                                {cardViews}
                            </div>
                        </div>
                        <div className={"option-container" + (open ? "" : " gone")}>
                            <a href="javascript:;" className={hintColor ? "selected" : ""} onClick={this.onColorClick}>Color</a>
                            <a href="javascript:;" className={!hintColor ? "selected" : ""} onClick={this.onNumberClick}>Number</a>
                            <div className="horizontal-spacer"></div>
                            <button className="theme-button" href="javascript:;" onClick={this.onHintClick}>Hint</button>
                        </div>
                    </div>
                    <div className={"menu" + (this.state.showMenu ? "" : " invisible")}>
                        <a href="javascript:;" className="menu-option" onClick={this.onMenuCancelClick}>Cancel</a>
                    </div>
                </div>
            );
        }
    });

    return Player;
});