import Player from './player';

export default class PlayerManager {
    constructor() {
        this.playersById = {};
        this.playersBySocketId = {};
    }

    addPlayer(p) {
        this.playersById[p.getId()] = p;
        this.playersBySocketId[p.getSocketId()] = p;
    }

    removePlayer(p) {
        delete this.playersById[p.getId()];
        delete this.playersBySocketId[p.getSocketId()];
    }

    getPlayerWithSocketId(socketId) {
        return this.playersBySocketId[socketId];
    }

    getPlayerWithId(id) {
        return this.playersById[id];
    }
}