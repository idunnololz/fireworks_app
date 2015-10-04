define(['jquery', 'React'], function ($, React) {
    const HINT_COLOR = 1;
    const HINT_NUMBER = 2;
    var Player = React.createClass({displayName: "Player",
        getInitialState:function() {
            return {
                selected: [],
                hintType: HINT_COLOR,
                isOpen: false,
                selectedSingle: -1,
                hintedCards: [],
                activeHint: undefined,

                specialText: null,
                showSpecialText: false,
            };
        },
        componentDidUpdate:function(prevProps, prevState) {
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
        onMouseOverCardHandler:function(e) {
            var $card = $(e.target);
            $card.addClass('hover-card');
        },
        onMouseLeaveCardHandler:function(e) {
            var $card = $(e.target);
            $card.removeClass('hover-card');
        },
        onCardClickHandler:function(e) {
            if (!this.props.manager.isMyTurn()) return;

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
        animateDraw:function(removedIndex, newHand, callBack) {
            var idx = removedIndex;
            var manager = this.props.manager;
            if (idx !== newHand.length - 1) {
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
        animateHint:function(hintInfo) {
            // translate cardId to indices
            var thisPlayer = this.props.playerInfo;
            var hand = thisPlayer.hand;
            var isColorHint = CardUtils.isColorHint(hintInfo.hintType);

            var hintedIndices = $.map(hintInfo.affectedCards, function(val)  {
                return this.getIndexForCardId(val);
            }.bind(this));
            this.setState({
                hintedCards: hintedIndices, 
                activeHint: hintInfo, 
                specialText: (thisPlayer.playerName + " was hinted " + CardUtils.getHint(hintInfo.hintType) + "(s)"),
                showSpecialText: true
            });
            this.props.manager.wait(5000);

            setTimeout(function()  {
                this.setState({hintedCards: [], activeHint: undefined, showSpecialText: false});
            }.bind(this), 5000);
        },
        animatePlay:function(gameEvent) {
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardPlayed = gameEvent.played;

            manager.wait(900);

            manager.preloadResource(manager.getCardRes(cardPlayed), function()  {
                var idx;
                $.each(hand, function(index, val)  {
                    if (val.cardId === cardPlayed.cardId) {
                        idx = index;
                    }
                });

                var menuBar = manager.getMenuBarRef();

                if (manager.getLives() > gameEvent.lives) {
                    // animate the card going into the trash...
                    this.animateToTrash(idx);

                    // trigger a lives update...
                    manager.setLives(gameEvent.lives);

                    // after this, animate the draw
                    var newHand = this.props.playerInfo.hand.filter(function(x)  { return x.cardId !== cardPlayed.cardId});
                    newHand.push(gameEvent.draw);
                    setTimeout(function()  {
                        this.animateDraw(idx, newHand, function()  {
                            manager.addToDiscards(cardPlayed);
                            manager.commitState();
                        });
                    }.bind(this), 300);
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
            }.bind(this));
        },
        animateDiscard:function(gameEvent) {
            var manager = this.props.manager;
            var hand = this.props.playerInfo.hand;
            var cardDisc = gameEvent.discarded;
            
            manager.preloadResource(manager.getCardRes(cardDisc), function()  {
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
        render:function() {
            var open = this.state.isOpen;
            var playerInfo = this.props.playerInfo;
            var selectedCards = this.state.selected;
            var hintColor = this.state.hintType === HINT_COLOR;
            var cardViews = [];
            var appendClass = " active-card";
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
                cardViews = $.map(playerInfo.hand, function(val, index)  {
                    var selected = selectedCards.indexOf(index) > -1;
                    var isHinted = this.state.hintedCards.indexOf(index) !== -1;
                    return (
                        React.createElement("span", {className: "card-in-hand", ref: "card" + index, key: val.cardId}, 
                            React.createElement("img", {
                                className: (selected ? "active-card" : "") + (isHinted ? appendClass : ""), 
                                src: "res/cards/" + CardUtils.getResourceNameForCard(val.cardType), 
                                onMouseOver: this.onMouseOverCardHandler, 
                                onMouseLeave: this.onMouseLeaveCardHandler, 
                                onClick: this.onCardClickHandler, 
                                "data-index": index})
                        )
                    );
                }.bind(this));
            }

            var titleClass = isMyTurn ? " turn-indicator" : "";
            var showSpecialText = this.state.showSpecialText;
            var specialText = this.state.specialText;
            var playerTitle;
            if (showSpecialText) {
                playerTitle = (
                    React.createElement("div", {style: {position: 'relative'}}, 
                        React.createElement("h1", {className: titleClass + " invisible"}, playerInfo.playerName), 
                        React.createElement("h1", {className: "special " + titleClass}, specialText)
                    )
                );
            } else {
                playerTitle = (
                    React.createElement("div", {style: {position: 'relative'}}, 
                        React.createElement("h1", {className: titleClass}, playerInfo.playerName), 
                        React.createElement("h1", {className: "special " + titleClass + " invisible"}, specialText)
                    )
                );
            }
            return (
                React.createElement("div", {className: "player-container" + (open ? " player-container-open" : "")}, 
                    playerTitle, 
                    React.createElement("div", {className: "slideable-container" + (open || isHintActive ? " container-open" : "")}, 
                        React.createElement("div", {className: "centering-container"}, 
                            React.createElement("div", {className: "card-container"}, 
                                cardViews
                            )
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