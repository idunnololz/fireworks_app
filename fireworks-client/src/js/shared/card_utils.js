(function(exports) {
    const UNKNOWN_CARD = 0xF0000000;

    const BLUE_MASK = 0x1F;
    const GREEN_MASK = 0x3E0;
    const RED_MASK = 0x7C00;
    const WHITE_MASK = 0xF8000;
    const YELLOW_MASK = 0x1F00000;

    const BLUE_BIT_INDEX = 0;
    const GREEN_BIT_INDEX = 5;
    const RED_BIT_INDEX = 10;
    const WHITE_BIT_INDEX = 15;
    const YELLOW_BIT_INDEX = 20;

    const COLOR_NAMES = ["BLUE", "GREEN", "RED", "WHITE", "YELLOW"];
    const NUMBER_NAMES = ["ONE", "TWO", "THREE", "FOUR", "FIVE"];

    const COLOR_MASKS = [0x1F, 0x3E0, 0x7C00, 0xF8000, 0x1F00000];

    const BLUE_1 = 0x00000001;
    const BLUE_2 = 0x00000002;
    const BLUE_3 = 0x00000004;
    const BLUE_4 = 0x00000008;
    const BLUE_5 = 0x00000010;

    const GREEN_1 = 0x00000020;
    const GREEN_2 = 0x00000040;
    const GREEN_3 = 0x00000080;
    const GREEN_4 = 0x00000100;
    const GREEN_5 = 0x00000200;

    const RED_1 = 0x00000400;
    const RED_2 = 0x00000800;
    const RED_3 = 0x00001000;
    const RED_4 = 0x00002000;
    const RED_5 = 0x00004000;

    const WHITE_1 = 0x00008000;
    const WHITE_2 = 0x00010000;
    const WHITE_3 = 0x00020000;
    const WHITE_4 = 0x00040000;
    const WHITE_5 = 0x00080000;

    const YELLOW_1 = 0x00100000;
    const YELLOW_2 = 0x00200000;
    const YELLOW_3 = 0x00400000;
    const YELLOW_4 = 0x00800000;
    const YELLOW_5 = 0x01000000;

    const a = new Map();
    a.set(BLUE_1, ["card_blue_1", "card_s_blue_1"]);
    a.set(BLUE_2, ["card_blue_2", "card_s_blue_2"]);
    a.set(BLUE_3, ["card_blue_3", "card_s_blue_3"]);
    a.set(BLUE_4, ["card_blue_4", "card_s_blue_4"]);
    a.set(BLUE_5, ["card_blue_5", "card_s_blue_5"]);
    a.set(GREEN_1, ["card_green_1", "card_s_green_1"]);
    a.set(GREEN_2, ["card_green_2", "card_s_green_2"]);
    a.set(GREEN_3, ["card_green_3", "card_s_green_3"]);
    a.set(GREEN_4, ["card_green_4", "card_s_green_4"]);
    a.set(GREEN_5, ["card_green_5", "card_s_green_5"]);
    a.set(RED_1, ["card_red_1", "card_s_red_1"]);
    a.set(RED_2, ["card_red_2", "card_s_red_2"]);
    a.set(RED_3, ["card_red_3", "card_s_red_3"]);
    a.set(RED_4, ["card_red_4", "card_s_red_4"]);
    a.set(RED_5, ["card_red_5", "card_s_red_5"]);
    a.set(WHITE_1, ["card_white_1", "card_s_white_1"]);
    a.set(WHITE_2, ["card_white_2", "card_s_white_2"]);
    a.set(WHITE_3, ["card_white_3", "card_s_white_3"]);
    a.set(WHITE_4, ["card_white_4", "card_s_white_4"]);
    a.set(WHITE_5, ["card_white_5", "card_s_white_5"]);
    a.set(YELLOW_1, ["card_yellow_1", "card_s_yellow_1"]);
    a.set(YELLOW_2, ["card_yellow_2", "card_s_yellow_2"]);
    a.set(YELLOW_3, ["card_yellow_3", "card_s_yellow_3"]);
    a.set(YELLOW_4, ["card_yellow_4", "card_s_yellow_4"]);
    a.set(YELLOW_5, ["card_yellow_5", "card_s_yellow_5"]);

    const Color = {
        BLUE: 0,
        GREEN: 1,
        RED: 2,
        WHITE: 3,
        YELLOW: 4,
    };

    const Card = {
        BLUE_1: 0x00000001,
        BLUE_2: 0x00000002,
        BLUE_3: 0x00000004,
        BLUE_4: 0x00000008,
        BLUE_5: 0x00000010,

        GREEN_1: 0x00000020,
        GREEN_2: 0x00000040,
        GREEN_3: 0x00000080,
        GREEN_4: 0x00000100,
        GREEN_5: 0x00000200,

        RED_1: 0x00000400,
        RED_2: 0x00000800,
        RED_3: 0x00001000,
        RED_4: 0x00002000,
        RED_5: 0x00004000,

        WHITE_1: 0x00008000,
        WHITE_2: 0x00010000,
        WHITE_3: 0x00020000,
        WHITE_4: 0x00040000,
        WHITE_5: 0x00080000,

        YELLOW_1: 0x00100000,
        YELLOW_2: 0x00200000,
        YELLOW_3: 0x00400000,
        YELLOW_4: 0x00800000,
        YELLOW_5: 0x01000000,
    };

    exports.Color = Color;
    exports.Card = Card;
    
    exports.FIVES = [0x0010, 0x0200, 0x4000, 0x00080000, 0x01000000];

    exports.getCardName = function(id)  {
        var name = "";

        if ((id & BLUE_MASK) != 0) {
            name += COLOR_NAMES[0];
        } else if ((id & GREEN_MASK) != 0) {
            name += COLOR_NAMES[1];
            id >>= GREEN_BIT_INDEX;
        } else if ((id & RED_MASK) != 0) {
            name += COLOR_NAMES[2];
            id >>= RED_BIT_INDEX;
        } else if ((id & WHITE_MASK) != 0) {
            name += COLOR_NAMES[3];
            id >>= WHITE_BIT_INDEX;
        } else if ((id & YELLOW_MASK) != 0) {
            name += COLOR_NAMES[4];
            id >>= YELLOW_BIT_INDEX;
        }
        name += " ";

        if ((id & 0b11) != 0) {
            if (id == 0b1) {
                name += NUMBER_NAMES[0];
            } else {
                name += NUMBER_NAMES[1];
            }
        } else {
            if (id == 0b100) {
                name += NUMBER_NAMES[2];
            } else if (id == 0b1000) {
                name += NUMBER_NAMES[3];
            } else {
                name += NUMBER_NAMES[4];
            }
        }
        return name;
    }

    exports.getHint = function(hint)  {
        if (hint < 5) {
            return COLOR_NAMES[hint];
        }
        return NUMBER_NAMES[hint - 5 - 1];
    }

    exports.isColorHint = function(hint)  {
        return hint < 5;
    }

    exports.isNumberHint = function(hint)  {
        return hint >= 5 && hint < 10;
    }

    exports.getHintColor = function(hint)  {
        return hint;
    }

    exports.getHintNumber = function(hint)  {
        return hint - 5;
    }

    exports.colorToHint = function(color)  {
        return color;
    }

    exports.numberToHint = function(number)  {
        return number + 5;
    }

    exports.getNextPlayable = function(card, color)  {
        card = (card << 1) & COLOR_MASKS[color];
        return card;
    }

    exports.isOne = function(card)  {
        return card == 0x0001 || card == 0x0020 || card == 0x0400
            || card == 0x00008000 || card == 0x00100000;
    }

    exports.isUnknownCard = function(card)  {
        return card === UNKNOWN_CARD;
    }

    exports.getResourceNameForCard = function(card)  {
        if (a.has(card)) {
            return a.get(card)[0] + ".png";
        } else {
            return "card_back.png";
        }
    }

    exports.getResourceNameForSmallCard = function(card)  {
        if (a.has(card)) {
            return a.get(card)[1] + ".png";
        } else {
            return "card_back.png";
        }
    }

    exports.getCardColor = function(cardType)  {
        if ((cardType & BLUE_MASK) != 0) {
            return Color.BLUE;
        } else if ((cardType & GREEN_MASK) != 0) {
            return Color.GREEN;
        } else if ((cardType & RED_MASK) != 0) {
            return Color.RED;
        } else if ((cardType & WHITE_MASK) != 0) {
            return Color.WHITE;
        } else if ((cardType & YELLOW_MASK) != 0) {
            return Color.YELLOW;
        }
        throw "Invalid card type: " + cardType;
    }


    exports.getAllCardsWithColor = function(color, cards)  {
        var results = [];
        var mask = COLOR_MASKS[color];
        var len = cards.length;
        for (var i = 0; i < len; i++) {
            var c = cards[i];
            if (c === null) continue;
            if ((c.cardType & mask) != 0) {
                results.push(i);
            }
        }
        return results;
    }

    function numberOfLeadingZeros(i) {
        // HD, Figure 5-6
        if (i == 0)
            return 32;
        var n = 1;
        if (i >>> 16 == 0) { n += 16; i <<= 16; }
        if (i >>> 24 == 0) { n +=  8; i <<=  8; }
        if (i >>> 28 == 0) { n +=  4; i <<=  4; }
        if (i >>> 30 == 0) { n +=  2; i <<=  2; }
        n -= i >>> 31;
        return n;
    }

    exports.getCardNumber = function(cardType)  {
        return (((32 - numberOfLeadingZeros(cardType)) - 1) % 5) + 1;
    }

    exports.getAllCardsWithNumber = function(number, cards)  {
        var results = [];
        var len = cards.length;
        for (var i = 0; i < len; i++) {
            var c = cards[i];
            if (c === null) continue;
            if (exports.getCardNumber(c.cardType) === number) {
                results.push(i);
            }
        }
        return results;
    }

    exports.getAllCardResources = function()  {
        return a;
    }
})(typeof exports === 'undefined' ? this['CardUtils']={} : exports)