import Deck from './deck';
import CardUtils from './../shared/card_utils';
import util from 'util';

export default class Game {
    constructor(players = 0) {
        const NUM_COLORS = 5;
        const INFINITY = 9001;

        this.numPlayers = players;
        this.turnIndex = 0;
        this.deck = new Deck();

        this.hints = 8;
        this.lives = 3;

        this.gameStarted = false;
        this.gameOver = false;
        this.log = true;
        this.validPlays = new Array(NUM_COLORS);

        this.turnsLeft = INFINITY;

        this.played = [];
        this.endangered = {};
        this.danger = [];

        for (var i = 0; i < this.validPlays.length; i++) {
            this.validPlays[i] = 1 << (i*5);
        }

        for (let c of CardUtils.FIVES) {
            this.danger[c] = true;
            this.endangered[c] = 1;
        }
    }

    addPlayer() {
        if (this.gameStarted) {
            throw "Can't add players after the game has started!";
        }
        this.numPlayers++;
    }

    removePlayer() {
        if (this.gameStarted) {
            throw "Can't remove players after the game has started!";
        }
        this.numPlayers--;
    }

    startGame() {
        if (this.numPlayers < 2 || this.numPlayers > 5) {
            throw "Invalid number of players: " + this.numPlayers;
        }
        this.gameStarted = true;
    }

    _d() {
        console.log("[Deck] " + util.format.apply(null, arguments));
    }

    getTurn() {
        return this.turnIndex;
    }

    drawHand(playerIndex) {
        if (this.turnIndex !== playerIndex) {
            throw util.format("Player %s tried to draw on player %s's turn", playerIndex, this.turnIndex);
        }
        var cards;
        if (this.numPlayers < 4) {
            cards = [
                this.deck.pop(),
                this.deck.pop(),
                this.deck.pop(),
                this.deck.pop(),
                this.deck.pop(),
            ]
        } else {
            cards = [
                this.deck.pop(),
                this.deck.pop(),
                this.deck.pop(),
                this.deck.pop(),
            ]
        }

        if (this.log) {
            var msg = "";
            for (let c of cards) {
                msg += CardUtils.getCardName(c) + ", ";
            }
            msg = msg.slice(0, -2);
            this._d("Player %d drew %s.", playerIndex, msg);
        }

        this._advanceTurn();
        return cards;
    }

    hint(playerIndex, toPlayerIndex, hint) {
        if (this.turnIndex != playerIndex) {
            throw util.format("Player %s tried to give a hint on player %s's turn", playerIndex, this.turnIndex);
        }

        if (this.hints == 0) {
            throw "Cannot give a hint when no hints available!";
        }
        this.hints--;

        if (this.log) {
            this._d("Player %d hinted player %d's %ss.", playerIndex, toPlayerIndex, CardUtils.getHint(hint));
        }

        this._advanceTurn();
    }

    play(playerIndex, card) {
        if (this.turnIndex != playerIndex) {
            throw util.format("Player %s tried to play %s on player %s's turn", playerIndex, CardUtils.getCardName(card), this.turnIndex);
        }

        if (this.log) {
            this._d("Player %d played %s.", playerIndex, CardUtils.getCardName(card));
        }

        var playable = false;
        for (var i = 0; i < this.validPlays.length; i++) {
            if (card === this.validPlays[i]) {
                var next = CardUtils.getNextPlayable(card, i);
                this.validPlays[i] = next;
                if (next === 0) {
                    this._checkForWin();
                }
                playable = true;
                this.played[card] = true;
                this._play(card);
                break;
            }
        }
        if (!playable) {
            this._loseLife();
            this._discard(card);
        }
        this._advanceTurn();
        return this._draw(playerIndex);
    }

    discard(playerIndex, card) {
        if (this.turnIndex != playerIndex) {
            throw util.format("Player %s tried to discard %s on player %s's turn", playerIndex, CardUtils.getCardName(card), this.turnIndex);
        }
        if (this.log) {
            this._d("Player %d discarded %s.", playerIndex, CardUtils.getCardName(card));
        }
        this._discard(card);
        this._gainHint();
        this._advanceTurn();
        return this._draw(playerIndex);
    }

    getLives() {
        return this.lives;
    }

    getHints() {
        return this.hints;
    }

    getNumPlayers() {
        return this.numPlayers;
    }

    isGameStarted() {
        return this.gameStarted;
    }

    isGameOver() {
        return this.gameOver;
    }

    isGameWon() {
        for (let c of this.validPlays) {
            if (c != 0) return false;
        }
        return true;
    }

    isEndangered(card) {
        return this.danger[card] !== undefined;
    }

    _draw(playerIndex) {
        if (this.deck.isEmpty()) return 0;
        var card = this.deck.pop();

        if (this.log) {
            this._d("Player %d drew a %s.", playerIndex, CardUtils.getCardName(card));
        }

        if (this.deck.isEmpty()) {
            this.turnsLeft = this.numPlayers;

            if (this.log) {
                this._d("Deck is empty!");
            }
        }

        return card;
    }

    _play(card) {
        delete this.endangered[card];
        delete this.danger[card];
    }

    _discard(card) {
        if (this.played[card] !== undefined) return; // unimportant discard

        var v = this.endangered[card];
        if (v === undefined) {
            if (CardUtils.isOne(card)) {
                this.endangered[card] = 2; // two more
            } else {
                this.endangered[card] = 1;
                this.danger[card] = true;
            }
        } else {
            if (v === 2) {
                this.endangered[card] = 1;
                this.danger[card] = true;
            } else {
                this.endangered[card] = 0;
            }
        }
    }

    _gainHint() {
        if (this.hints < 8) {
            this.hints++;
            if (this.log) {
                this._d("Hint gained. %d hints left.", this.hints);
            }
        }
    }

    _advanceTurn() {
        this.turnIndex = (this.turnIndex + 1) % this.numPlayers;
        this.turnsLeft--;
        if (this.turnsLeft == 0) {
            this._endGame();
        }
    }

    _loseLife() {
        if (!this.gameOver) {
            this.lives--;
            if (this.log) {
                this._d("Lost a life. %d lives left.", this.lives);
            }
            if (this.lives === 0) {
                this._endGame();
            }
        }
    }

    _isGameWon() {
        for (let c of this.validPlays) {
            if (c != 0) return false;
        }
        return true;
    }

    _checkForWin() {
        if (this._isGameWon()) {
            this._endGame();
        }
    }

    _endGame() {
        if (this.log) {
            this._d("The game has ended.");
        }
        this.gameOver = true;
    }

}