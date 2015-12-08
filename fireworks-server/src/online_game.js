import Game from './game';
import Log from './log';

const TAG = "OnlineGame";

const STATE_OK = 1;
const STATE_NEED_PLAYERS = 2;

const STATUS_WAITING = 1;
const STATUS_PLAYING = 2;

const VOTE_DURATION = 60 * 1000; // 60 seconds
const TIME_BETWEEN_VOTES = 60 * 1000; // 60 seconds

export default class OnlineGame extends Game {
    constructor(gameId, name, log = false) {
        super();
        this.log = log;
        this.players = new Map();
        this.playersArr = [];
        this.gameId = gameId;
        this.host = undefined;
        this.state = STATE_OK;
        this.cardCounter = 0;
        this.cardMap = new Map();
        this.gameName = name;

        this.status = STATUS_WAITING;

        this.spectators = new Map();

        this.history = [];

        this.playerCapacity = 5;

        this.tag = undefined;

        // vars for the surrender feature
        this._isVoting = false;
        this.votes = [];
        this.voteExpiryTime = 0;
        this.nextVoteTime = 0;
        this.votesFor = 0;
        this.voteSuccess = false;

        this._startTime = 0;
    }

    getStartTime() {
        return this._startTime;
    }

    isSpectator(playerId) {
        return this.spectators.has(playerId);
    }

    isVoting() {
        if ((new Date).getTime() > this.voteExpiryTime) this._isVoting = false;
        return this._isVoting;
    }

    getVotes() {
        return this.votes;
    }

    vote(v /* 0 for no, 1 for yes*/) {
        if (!this.isVoting()) {
            var curTime = (new Date).getTime();
            // if this is the first vote do check if vote can be started, then do setup work...
            if (curTime < this.nextVoteTime) {
                // nope...
                return false;
            }
            this._isVoting = true;
            this.votes = [];
            this.voteExpiryTime = curTime + VOTE_DURATION;
            this.nextVoteTime = this.voteExpiryTime + TIME_BETWEEN_VOTES;
            this.votesFor = 0;
        }
        this.votes.push(v);
        this.votesFor += v;

        if (this.votes.length >= this.getRealNumPlayers()) {
            if (this.getVoteResult() === 1) {
                // game over!
                this.voteSuccess = true;
            }
            this._isVoting = false; // everyone has voted
        }

        return true;
    }

    // Return 0 for still waiting. 1 for yes. -1 for no.
    getVoteResult() {
        if (this.voteSuccess) return 1;
        if (!this.isVoting()) {
            return 0;
        }
        return this.votesFor / this.getRealNumPlayers() < 0.7 ? 0 : 1;
    }

    setTag(tag) {
        this.tag = tag;
    }

    getTag(tag) {
        return this.tag;
    }

    getStatus() {
        return this.status;
    }

    getPlayerCapacity() {
        return this.playerCapacity;
    }

    getName() {
        return this.gameName;
    }

    getPlayers() {
        return this.playersArr;
    }

    // 1 = regular join
    // 2 = spectator
    addPlayer(player) {
        if (this.isGameStarted()) {
            this.spectators.set(player.getId(), player);
            Log.d(TAG, "Added spectator with id " + player.getId());
            return 2;
        } else {
            super.addPlayer();
            var id = player.getId();
            if (this.log) {
                Log.d(TAG, "Added player with id " + id);
            }
            this.players.set(id, player);
            if (this.host === undefined) {
                this.host = player;
            }

            this.playersArr.push(player);
            return 1;
        }
    }

    getAllPlayersInGame() {
        var ps = [];
        var len = this.playersArr.length;
        for (var i = 0; i < len; i++) {
            var p = this.playersArr[i];
            ps.push({playerId: p.getId(), playerName: p.getName(), playerIndex: p.getIndex()});
        }
        return ps;
    }

    removePlayer(id) {
        if (this.isSpectator(id)) {
            this.spectators.delete(id);
        } else if (this.isGameStarted()) {
            // although in the real game, players cannot simply leave, since we are making an online version
            // this is totally a possibility. To support this we need to support 'hotswapping'.
            this.state = STATE_NEED_PLAYERS;
        } else {
            super.removePlayer();
        }

        if (this.log) {
            Log.d(TAG, "Removed player with id " + id);
        }
        var removedPlayer = this.players.get(id);
        this.players.delete(id);
        if (this.host !== undefined && removedPlayer !== undefined && 
            this.host.getId() === removedPlayer.getId()) {
            if (this.players.size > 0) {
                // pick a new host if the host just left...
                this.host = this.players.values().next().value;
            } else {
                this.host = undefined;
            }
        }
        var index = this.playersArr.indexOf(removedPlayer);
        if (index > -1) {
            this.playersArr.splice(index, 1);
        }
    }

    getIndex(playerId) {
        this.players.get(playerId).getIndex();
    }

    startGame() {
        super.startGame();

        this._startTime = new Date().getTime();

        this.status = STATUS_PLAYING;

        var len = this.playersArr.length;
        for (var i = 0; i < len; i++) {
            this.playersArr[i].setIndex(i);
        }
    }

    drawHand(playerId) {
        if (this.state === STATE_OK) {
            return this.transformCards(super.drawHand(this.players.get(playerId).getIndex()));
        } else {
            // handle issue...
            Log.d(TAG, `Game in unhandled state: ${this.state}`);
        }
    }

    hint(playerId, targetPlayerId, hint) {
        if (this.state === STATE_OK) {
            try {
                return super.hint(this.players.get(playerId).getIndex(), this.players.get(targetPlayerId).getIndex(), hint);
            } catch (e) {
                return e;
            }
        } else {
            // handle issue...
            Log.d(TAG, `Game in unhandled state: ${this.state}`);
        }
    }

    play(playerId, cardId) {
        var cardObj = this.cardMap.get(cardId);
        if (cardObj === undefined) {
            Log.d(TAG, `Player with id ${playerId} tried to play invalid card with id ${cardId}.`);
        } else if (this.state === STATE_OK) {
            return this.transformCard(super.play(this.players.get(playerId).getIndex(), cardObj.cardType));
        } else {
            // handle issue...
            Log.d(TAG, `Game in unhandled state: ${this.state}`);
        }
    }

    discard(playerId, cardId) {
        var cardObj = this.cardMap.get(cardId);
        if (cardObj === undefined) {
            Log.d(TAG, `Player with id ${playerId} tried to discard invalid card with id ${cardId}.`);
        } else if (this.state === STATE_OK) {
            return this.transformCard(super.discard(this.players.get(playerId).getIndex(), cardObj.cardType));
        } else {
            // handle issue...
            Log.d(TAG, `Game in unhandled state: ${this.state}`);
        }
    }

    getHost() {
        return this.host;
    }

    getId() {
        return this.gameId;
    }

    getRealNumPlayers() {
        return this.players.size;
    }

    transformCard(card) {
        if (card === 0) return null;
        var cardObj = {cardId: this.cardCounter++, cardType: card};
        this.cardMap.set(cardObj.cardId, cardObj);
        return cardObj;
    }

    transformCards(arr) {
        return arr.map((o) => {
            var cardObj = {cardId: this.cardCounter++, cardType: o};
            this.cardMap.set(cardObj.cardId, cardObj);
            return cardObj;
        });
    }

    getCardWithId(cardId) {
        return this.cardMap.get(cardId);
    }

    pushEvent(event) {
        this.history.push(event);
    }

    getHistoryForPlayer(player) {
        if (this.isSpectator(player.getId())) {
            return this.history;
        } else {
            // we need to censor the player's draws

            // TODO
            return [];
        }
    }
}