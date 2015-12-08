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

    class Player {
        constructor(playerId) {
            this._playerId = playerId;
            this._hand = [];
            this._knowledge = [];
            this._name = "";
            this._index = -1;
        }

        getId() {
            return this._playerId;
        }

        setName(name) {
            this._name = name;
        }

        getName() {
            return this._name;
        }

        getHand() {
            return this._hand;
        }

        setHand(hand) {
            this._hand = hand;
        }

        setIndex(index) {
            this._index = index;
        }

        getIndex() {
            return this._index;
        }

        removeCardAt(index) {
            this._hand.splice(index, 1);
        }

        removeCardWithId(id) {
            var idx;
            for (var i = 0; i < this._hand.length; i++) {
                if (this._hand[i].cardId === id) {
                    idx = i;
                    break;
                }
            }

            this.removeCardAt(idx);
        }

        draw(c) {
            this._hand.push(c);
        }

        hint(hint, cardIds) {
            var isColorHint = CardUtils.isColorHint(hint);
            if (isColorHint) {
                var color = CardUtils.getHintColor(hint);
            } else {
                var number = CardUtils.getHintNumber(hint);
            }
            for (var i = 0; i < this._hand.length; i++) {
                var c = this._hand[i];
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
        }

        getHintInfoForCard(cardId) {
            var ci = {color: undefined, number: undefined};
            for (var i = 0; i < this._hand.length; i++) {
                var c = this._hand[i];
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
        }
    }

    class Htc {
        constructor() {
            this._isInErrorState = false;
            this._errorMsg = "";
            this._players = new Map();
            this._turnIndexToPlayerId = [];

            this._curPlayerView = undefined;
            this._playerIterator = 0; /* This is actually an iterator based on the turn index */

            this._board = [undefined, undefined, undefined, undefined, undefined];

            this._turnIndex = 0;

            this._lives = 0;
            this._hints = 0;
            this._cardsLeft = 0;

            this._isReady = false;
        }

        consume(playersInGame, gameHistory, startingHints, startingLives, deckSize) {
            Log.d(TAG, 'consume: %O', gameHistory);

            var players = this._players;
            var board = this._board;

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
                    this._setError("Invalid game history. The same player drew twice.");
                    return;
                }

                p.setIndex(players.size);

                players.set(p.getId(), p);
                p.setHand(curEvent.data);

                cardsLeft -= curEvent.data.length;
            
                curEvent = gameHistory[++i];

                this._turnIndexToPlayerId.push(p.getId());
            }

            this._curPlayerView = this.getPlayerAtIndex(0);

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

            this._isReady = true;

            this._lives = lives;
            this._hints = hints;
            this._cardsLeft = cardsLeft;
        }

        getPlayerAtIndex(index) {
            return this._players.get(this._turnIndexToPlayerId[index]);
        }

        consumeOne(e) {
            Log.d(TAG, "e: %O", e);
            switch (e.eventType) {
                case EVENT_HINT:
                    this._hints = e.hints;

                    this._players.get(e.data.target).hint(e.data.hintType, e.data.affectedCards);
                    this._turnIndex++;
                    break;
                case EVENT_PLAY:
                    this._hints = e.hints;
                    this._lives = e.lives;

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

                        this._board[boardIndex] = e.played;
                    }

                    var p = this._players.get(e.playerId);
                    p.removeCardWithId(e.data.cardId);
                    p.draw(e.draw);
                    this._turnIndex++;
                    this._cardsLeft -= 1;
                    break;
                case EVENT_DISCARD:
                    this._hints = e.hints;

                    var p = this._players.get(e.playerId);
                    p.removeCardWithId(e.data.cardId);
                    p.draw(e.draw);
                    this._turnIndex++;
                    this._cardsLeft -= 1;
                    break;
                case EVENT_DECLARE_GAME_OVER:
                    break;
                case EVENT_DRAW_HAND:
                    this._setError('Invalid game history. A player drew a hand in the middle of a game.');
                    break;
                default:
                    this._setError('Unsupported game history version. Unrecognized event type: ' + e.eventType + '.');
                    break;
            }
        }

        _setError(msg) {
            this._isInErrorState = true;
            this._errorMsg = msg;
        }

        toPrevPlayer() {
            this._playerIterator = this._playerIterator === 0 ? this.getNumPlayers() - 1 : (this._playerIterator - 1);
            this._curPlayerView = this.getPlayerAtIndex(this._playerIterator);
        }

        toNextPlayer() {
            this._playerIterator = (this._playerIterator + 1) % this.getNumPlayers();
            this._curPlayerView = this.getPlayerAtIndex(this._playerIterator);
        }

        isInErrorState() {
            return this._isInErrorState;
        }

        getErrorMessage() {
            return this._errorMsg;
        }

        _cloneHand(hand) {
            var clone = [];
            var len = hand.length;
            for (var i = 0; i < len; i++) {
                var c = hand[i];
                clone.push({cardId: c.cardId, cardType: c.cardType});
            }
            return clone;
        }

        _buildPlayerInfo(player) {
            var hinted = {};

            var hand = this._cloneHand(player.getHand());
            for (var i = 0; i < hand.length; i++) {
                var c = hand[i];
                var info = player.getHintInfoForCard(c.cardId);
                if (info === undefined) continue;
                hinted[c.cardId] = info;
            }
            return {playerId: player.getId(), playerName: player.getName(), hand: hand, hinted: hinted, playerIndex: player.getIndex()};
        }

        getSpecPlayer() {
            return this._buildPlayerInfo(this._curPlayerView);
        }

        getAllPlayers() {
            var players = []
            for (var i = 0; i < this.getNumPlayers(); i++) {
                players.push(this._buildPlayerInfo(this.getPlayerAtIndex(i)));
            }

            return players;
        }

        isReady() {
            return this._isReady;
        }

        getBoard() {
            return this._board;
        }

        getNumPlayers() {
            return this._players.size;
        }

        getTurnIndex() {
            return this._turnIndex;
        }

        getHints() {
            return this._hints;
        }

        getLives() {
            return this._lives;
        }

        getCardsLeft() {
            return this._cardsLeft;
        }
    };

    return Htc;
});