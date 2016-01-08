export default class Player {
    constructor(id, socket) {
        this._socket = socket;
        this._id = id;
        this._name = "";
        this._index = -1;
        this._location = -1;
        this._chatRoomId = '';
        this._isAdmin = false;
        this._isGuest = true;
    }

    getId() {
        return this._id;
    }

    getSocketId() {
        return this._socket.id;
    }

    setName(name) {
        this._name = name;
    }

    getName() {
        return this._name;
    }

    setIndex(index) {
        this._index = index;
    }

    getIndex() {
        return this._index;
    }

    getSocket() {
        return this._socket;
    }

    setLocation(loc) {
        this._location = loc;
    }

    setChatRoomId(chatRoomId) {
        this._chatRoomId = chatRoomId;
    }

    getChatRoomId() {
        return this._chatRoomId;
    }

    setIsAdmin(val) {
        this._isAdmin = val;
    }

    isAdmin() {
        return this._isAdmin;
    }

    setIsGuest(val) {
        this._isGuest = val;
    }

    isGuest() {
        return this._isGuest;
    }
}