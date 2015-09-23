export default class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.populate();
        this.shuffle();
    }

    populate() {
        var arr = [
            0x00000001,
            0x00000001,
            0x00000001,
            0x00000002,
            0x00000002,
            0x00000004,
            0x00000004,
            0x00000008,
            0x00000008,
            0x00000010,
            0x00000020,
            0x00000020,
            0x00000020,
            0x00000040,
            0x00000040,
            0x00000080,
            0x00000080,
            0x00000100,
            0x00000100,
            0x00000200,
            0x00000400,
            0x00000400,
            0x00000400,
            0x00000800,
            0x00000800,
            0x00001000,
            0x00001000,
            0x00002000,
            0x00002000,
            0x00004000,
            0x00008000,
            0x00008000,
            0x00008000,
            0x00010000,
            0x00010000,
            0x00020000,
            0x00020000,
            0x00040000,
            0x00040000,
            0x00080000,
            0x00100000,
            0x00100000,
            0x00100000,
            0x00200000,
            0x00200000,
            0x00400000,
            0x00400000,
            0x00800000,
            0x00800000,
            0x01000000,
        ];
        for (var i = 0; i < arr.length; i++) {
            this.cards[i] = arr[i];
        }
    }

    shuffle() {
        var len = this.cards.length;
        for (var i = 0; i < len; i++) {
            var swap = this.cards[i];
            var rand = Math.floor((Math.random() * (len - i)) + i);
            this.cards[i] = this.cards[rand];
            this.cards[rand] = swap;
        }
    }

    pop() {
        return this.cards.pop();
    }

    length() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }
}