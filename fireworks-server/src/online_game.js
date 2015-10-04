import Game from './game';
import Log from './log';

const TAG = "OnlineGame";

const STATE_OK = 1;
const STATE_NEED_PLAYERS = 2;

export default class OnlineGame extends Game {
    constructor(gameId, log = false) {
        super();
        this.log = log;
        this.players = {};
        this.playersArr = [];
        this.gameId = gameId;
        this.host = undefined;
        this.state = STATE_OK;
        this.cardCounter = 0;
        this.cardMap = new Map();

        this.spectators = [];

        this.history = [];
    }

    addPlayer(player) {
        if (this.isGameStarted()) {
            this.spectators.push(player);
            Log.d(TAG, "Added spectator with id " + player.getId());
        } else {
            super.addPlayer();
            var id = player.getId();
            if (this.log) {
                Log.d(TAG, "Added player with id " + id);
            }
            this.players[id] = player;
            if (this.host === undefined) {
                this.host = player;
            }

            this.playersArr.push(player);
        }
    }

    getAllPlayersInGame() {
        var ps = [];
        for (var key in this.players) {
            var p = this.players[key];
            ps.push({playerId: p.getId(), playerName: p.getName(), playerIndex: p.getIndex()});
        }
        return ps;
    }

    removePlayer(id) {
        if (this.isGameStarted()) {
            // although in the real game, players cannot simply leave, since we are making an online version
            // this is totally a possibility. To support this we need to support 'hotswapping'.
            this.state = STATE_NEED_PLAYERS;
        } else {
            super.removePlayer();
        }

        if (this.log) {
            Log.d(TAG, "Removed player with id " + id);
        }
        var removedPlayer = this.players[id];
        delete this.players[id];
        if (this.host !== undefined && removedPlayer !== undefined && 
            this.host.getId() === removedPlayer.getId()) {
            if (Object.keys(this.players).length) {
                // pick a new host if the host just left...
                this.host = this.players[Object.keys(this.players)[0]];
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
        this.players[playerId].getIndex();
    }

    startGame() {
        super.startGame();

        var len = this.playersArr.length;
        for (var i = 0; i < len; i++) {
            this.playersArr[i].setIndex(i);
        }
    }

    drawHand(playerId) {
        if (this.state === STATE_OK) {
            return this.transformCards(super.drawHand(this.players[playerId].getIndex()));
        } else {
            // handle issue...
        }
    }

    hint(playerId, targetPlayerId, hint) {
        if (this.state === STATE_OK) {
            return super.hint(this.players[playerId].getIndex(), this.players[targetPlayerId].getIndex(), hint);
        } else {
            // handle issue...
        }
    }

    play(playerId, cardId) {
        var cardObj = this.cardMap.get(cardId);
        if (cardObj === undefined) {
            Log.d(TAG, `Player with id ${playerId} tried to play invalid card with id ${cardId}.`);
        } else if (this.state === STATE_OK) {
            return this.transformCard(super.play(this.players[playerId].getIndex(), cardObj.cardType));
        } else {
            // handle issue...
        }
    }

    discard(playerId, cardId) {
        var cardObj = this.cardMap.get(cardId);
        if (cardObj === undefined) {
            Log.d(TAG, `Player with id ${playerId} tried to discard invalid card with id ${cardId}.`);
        } else if (this.state === STATE_OK) {
            return this.transformCard(super.discard(this.players[playerId].getIndex(), cardObj.cardType));
        } else {
            // handle issue...
        }
    }

    getHost() {
        return this.host;
    }

    getId() {
        return this.gameId;
    }

    getRealNumPlayers() {
        return Object.keys(this.players).length;
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
}