export default class Player {
    constructor(id, socket) {
        this.socket = socket;
        this.id = id;
        this.name = "";
        this.index = -1;
    }

    getId() {
        return this.id;
    }

    getSocketId() {
        return this.socket.id;
    }

    setName(name) {
        this.name = name;
    }

    getName() {
        return this.name;
    }

    setIndex(index) {
        this.index = index;
    }

    getIndex() {
        return this.index;
    }

    getSocket() {
        return this.socket;
    }
}