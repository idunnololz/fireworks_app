define(['app/log'], function(Log) {
    const TAG = "HyperbolicTimeChamber";

    // The HTC project is about the restoration of game state from a game history.
    // It is named after the mythical chamber in DragonBall Z since time passes much slower
    // in the chamber than anywhere else in the world. This is metaphoric for the HTC's ability
    // to replay the entirety of a game in less than a second and reconstruct the final state of the
    // game.
    //
    // The HTC is powerful since it has the entirety of the game logic built inside of itself.


    const EVENT_DRAW_HAND = 1;
    const EVENT_HINT = 2;
    const EVENT_DISCARD = 3;
    const EVENT_PLAY = 4;
    const EVENT_DECLARE_GAME_OVER = 5;

    const KNOWLEDGE_NUMBER_MASK = 0xf;
    const KNOWLEDGE_COLOR_MASK = 0xf0;

    // card knowledge is recorded as a single int
    // bit allocation:
    // ... 0 0 0 0 0 0 0 0
    //             ^-^-^-^--- number information
    //     ^-^-^-^----------- color information

    // a card: {cardId: ,cardType: ,[knowledge]: }

    
        function Player(playerId) {"use strict";
            this.$Player_playerId = playerId;
            this.$Player_hand = [];
            this.$Player_knowledge = [];
            this.$Player_name = "";
            this.$Player_index = -1;
        }

        Object.defineProperty(Player.prototype,"getId",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Player_playerId;
        }});

        Object.defineProperty(Player.prototype,"setName",{writable:true,configurable:true,value:function(name) {"use strict";
            this.$Player_name = name;
        }});

        Object.defineProperty(Player.prototype,"getName",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Player_name;
        }});

        Object.defineProperty(Player.prototype,"getHand",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Player_hand;
        }});

        Object.defineProperty(Player.prototype,"setHand",{writable:true,configurable:true,value:function(hand) {"use strict";
            this.$Player_hand = hand;
        }});

        Object.defineProperty(Player.prototype,"setIndex",{writable:true,configurable:true,value:function(index) {"use strict";
            this.$Player_index = index;
        }});

        Object.defineProperty(Player.prototype,"getIndex",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Player_index;
        }});

        Object.defineProperty(Player.prototype,"removeCardAt",{writable:true,configurable:true,value:function(index) {"use strict";
            this.$Player_hand.splice(index, 1);
        }});

        Object.defineProperty(Player.prototype,"removeCardWithId",{writable:true,configurable:true,value:function(id) {"use strict";
            var idx;
            for (var i = 0; i < this.$Player_hand.length; i++) {
                if (this.$Player_hand[i].cardId === id) {
                    idx = i;
                    break;
                }
            }

            this.removeCardAt(idx);
        }});

        Object.defineProperty(Player.prototype,"draw",{writable:true,configurable:true,value:function(c) {"use strict";
            this.$Player_hand.push(c);
        }});

        Object.defineProperty(Player.prototype,"hint",{writable:true,configurable:true,value:function(hint, cardIds) {"use strict";
            var isColorHint = CardUtils.isColorHint(hint);
            if (isColorHint) {
                var color = CardUtils.getHintColor(hint);
            } else {
                var number = CardUtils.getHintNumber(hint);
            }
            for (var i = 0; i < this.$Player_hand.length; i++) {
                var c = this.$Player_hand[i];
                if (cardIds.indexOf(c.cardId) !== -1) {
                    // this card is affected
                    var k;
                    if (c.knowledge === undefined) {
                        k = 0;
                    } else {
                        k = c.knowledge;
                    }

                    if (isColorHint) {
                        k |= (color + 1) << 4;
                    } else {
                        k |= number;
                    }

                    c.knowledge = k;
                }
            }
        }});

        Object.defineProperty(Player.prototype,"getHintInfoForCard",{writable:true,configurable:true,value:function(cardId) {"use strict";
            var ci = {color: undefined, number: undefined};
            for (var i = 0; i < this.$Player_hand.length; i++) {
                var c = this.$Player_hand[i];
                if (c.cardId === cardId) {
                    // this card is affected
                    var number = c.knowledge & KNOWLEDGE_NUMBER_MASK;
                    var color = c.knowledge & KNOWLEDGE_COLOR_MASK;
                    if (number !== 0) {
                        ci.number = number;
                    }
                    if (color !== 0) {
                        ci.color = (color - 1) >> 4;
                    }

                    if (c.knowledge === undefined || (number === 0 && color === 0)) {
                        return undefined;
                    }
                }
            }
            return ci;
        }});
    

    
        function Htc() {"use strict";
            this.$Htc_isInErrorState = false;
            this.$Htc_errorMsg = "";
            this.$Htc_players = new Map();
            this.$Htc_turnIndexToPlayerId = [];

            this.$Htc_curPlayerView = undefined;
            this.$Htc_playerIterator = 0; /* This is actually an iterator based on the turn index */

            this.$Htc_board = [undefined, undefined, undefined, undefined, undefined];

            this.$Htc_turnIndex = 0;

            this.$Htc_lives = 0;
            this.$Htc_hints = 0;
            this.$Htc_cardsLeft = 0;

            this.$Htc_isReady = false;
        }

        Object.defineProperty(Htc.prototype,"consume",{writable:true,configurable:true,value:function(playersInGame, gameHistory, startingHints, startingLives, deckSize) {"use strict";
            Log.d(TAG, 'consume: %O', gameHistory);

            var players = this.$Htc_players;
            var board = this.$Htc_board;

            // the first few events are always guaranteed to be draw hand events...
            var i = 0;
            var curEvent = gameHistory[i];

            var hints = startingHints;
            var lives = startingLives;
            var cardsLeft = deckSize;

            while (curEvent !== undefined && curEvent.eventType === EVENT_DRAW_HAND) {
                var p = new Player(curEvent.playerId);

                for (var j = 0; j < playersInGame.length; j++) {
                    if (playersInGame[j].playerId === p.getId()) {
                        p.setName(playersInGame[j].playerName);
                    }
                }

                if (players.has(p.getId())) {
                    this.$Htc_setError("Invalid game history. The same player drew twice.");
                    return;
                }

                p.setIndex(players.size);

                players.set(p.getId(), p);
                p.setHand(curEvent.data);

                cardsLeft -= curEvent.data.length;
            
                curEvent = gameHistory[++i];

                this.$Htc_turnIndexToPlayerId.push(p.getId());
            }

            this.$Htc_curPlayerView = this.getPlayerAtIndex(0);

            for (; i < gameHistory.length; i++) {
                var e = gameHistory[i];
                this.consumeOne(e);
            }

            for (var player of players.values()) {
                var cardNames = [];
                var hand = player.getHand();
                for (var i = 0; i < hand.length; i++) {
                    cardNames.push(CardUtils.getCardName(hand[i].cardType));
                }
                Log.d(TAG, 'Player %d has %O', player.getId(), cardNames);
            }

            this.$Htc_isReady = true;

            this.$Htc_lives = lives;
            this.$Htc_hints = hints;
            this.$Htc_cardsLeft = cardsLeft;
        }});

        Object.defineProperty(Htc.prototype,"getPlayerAtIndex",{writable:true,configurable:true,value:function(index) {"use strict";
            return this.$Htc_players.get(this.$Htc_turnIndexToPlayerId[index]);
        }});

        Object.defineProperty(Htc.prototype,"consumeOne",{writable:true,configurable:true,value:function(e) {"use strict";
            Log.d(TAG, "e: %O", e);
            switch (e.eventType) {
                case EVENT_HINT:
                    this.$Htc_hints = e.hints;

                    this.$Htc_players.get(e.data.target).hint(e.data.hintType, e.data.affectedCards);
                    this.$Htc_turnIndex++;
                    break;
                case EVENT_PLAY:
                    this.$Htc_hints = e.hints;
                    this.$Htc_lives = e.lives;

                    if (e.playable) {
                        var boardIndex;
                        switch (CardUtils.getCardColor(e.played.cardType)) {
                            case CardUtils.Color.BLUE:
                                boardIndex = 0;
                                break;
                            case CardUtils.Color.GREEN:
                                boardIndex = 1;
                                break;
                            case CardUtils.Color.RED:
                                boardIndex = 2;
                                break;
                            case CardUtils.Color.WHITE:
                                boardIndex = 3;
                                break;
                            case CardUtils.Color.YELLOW:
                                boardIndex = 4;
                                break;
                        }

                        this.$Htc_board[boardIndex] = e.played;
                    }

                    var p = this.$Htc_players.get(e.playerId);
                    p.removeCardWithId(e.data.cardId);
                    p.draw(e.draw);
                    this.$Htc_turnIndex++;
                    this.$Htc_cardsLeft -= 1;
                    break;
                case EVENT_DISCARD:
                    this.$Htc_hints = e.hints;

                    var p = this.$Htc_players.get(e.playerId);
                    p.removeCardWithId(e.data.cardId);
                    p.draw(e.draw);
                    this.$Htc_turnIndex++;
                    this.$Htc_cardsLeft -= 1;
                    break;
                case EVENT_DECLARE_GAME_OVER:
                    break;
                case EVENT_DRAW_HAND:
                    this.$Htc_setError('Invalid game history. A player drew a hand in the middle of a game.');
                    break;
                default:
                    this.$Htc_setError('Unsupported game history version. Unrecognized event type: ' + e.eventType + '.');
                    break;
            }
        }});

        Object.defineProperty(Htc.prototype,"$Htc_setError",{writable:true,configurable:true,value:function(msg) {"use strict";
            this.$Htc_isInErrorState = true;
            this.$Htc_errorMsg = msg;
        }});

        Object.defineProperty(Htc.prototype,"toPrevPlayer",{writable:true,configurable:true,value:function() {"use strict";
            this.$Htc_playerIterator = this.$Htc_playerIterator === 0 ? this.getNumPlayers() - 1 : (this.$Htc_playerIterator - 1);
            this.$Htc_curPlayerView = this.getPlayerAtIndex(this.$Htc_playerIterator);
        }});

        Object.defineProperty(Htc.prototype,"toNextPlayer",{writable:true,configurable:true,value:function() {"use strict";
            this.$Htc_playerIterator = (this.$Htc_playerIterator + 1) % this.getNumPlayers();
            this.$Htc_curPlayerView = this.getPlayerAtIndex(this.$Htc_playerIterator);
        }});

        Object.defineProperty(Htc.prototype,"isInErrorState",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_isInErrorState;
        }});

        Object.defineProperty(Htc.prototype,"getErrorMessage",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_errorMsg;
        }});

        Object.defineProperty(Htc.prototype,"$Htc_cloneHand",{writable:true,configurable:true,value:function(hand) {"use strict";
            var clone = [];
            var len = hand.length;
            for (var i = 0; i < len; i++) {
                var c = hand[i];
                clone.push({cardId: c.cardId, cardType: c.cardType});
            }
            return clone;
        }});

        Object.defineProperty(Htc.prototype,"$Htc_buildPlayerInfo",{writable:true,configurable:true,value:function(player) {"use strict";
            var hinted = {};

            var hand = this.$Htc_cloneHand(player.getHand());
            for (var i = 0; i < hand.length; i++) {
                var c = hand[i];
                var info = player.getHintInfoForCard(c.cardId);
                if (info === undefined) continue;
                hinted[c.cardId] = info;
            }
            return {playerId: player.getId(), playerName: player.getName(), hand: hand, hinted: hinted, playerIndex: player.getIndex()};
        }});

        Object.defineProperty(Htc.prototype,"getSpecPlayer",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_buildPlayerInfo(this.$Htc_curPlayerView);
        }});

        Object.defineProperty(Htc.prototype,"getAllPlayers",{writable:true,configurable:true,value:function() {"use strict";
            var players = []
            for (var i = 0; i < this.getNumPlayers(); i++) {
                players.push(this.$Htc_buildPlayerInfo(this.getPlayerAtIndex(i)));
            }

            return players;
        }});

        Object.defineProperty(Htc.prototype,"isReady",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_isReady;
        }});

        Object.defineProperty(Htc.prototype,"getBoard",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_board;
        }});

        Object.defineProperty(Htc.prototype,"getNumPlayers",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_players.size;
        }});

        Object.defineProperty(Htc.prototype,"getTurnIndex",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_turnIndex;
        }});

        Object.defineProperty(Htc.prototype,"getHints",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_hints;
        }});

        Object.defineProperty(Htc.prototype,"getLives",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_lives;
        }});

        Object.defineProperty(Htc.prototype,"getCardsLeft",{writable:true,configurable:true,value:function() {"use strict";
            return this.$Htc_cardsLeft;
        }});
    ;

    return Htc;
});