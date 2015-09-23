import Game from '../src/game';
import assert from 'assert';

describe('Game', function() {
    
    var getTestGame = () => {
        return new Game(5);
    }

    it('testSimple: should play two simple rounds of valid cards', () => {
        var game = getTestGame();
        game.play(0, 0x0020);
        game.play(1, 0x0040);
        game.play(2, 0x0080);
        game.play(3, 0x0100);
        game.play(4, 0x0200);

        game.play(0, 0x0001);
        game.play(1, 0x0002);
        game.play(2, 0x0004);
        game.play(3, 0x0008);
        game.play(4, 0x0010);

        assert.equal(game.getLives(), 3);
    });

    it('testLoseLife: should play such that lives are lost', () => {
        var game = getTestGame();
        game.play(0, 0x0020);
        game.play(1, 0x0040);
        game.play(2, 0x0080);
        game.play(3, 0x0100);
        game.play(4, 0x0800);

        assert.equal(game.getLives(), 2);

        game.play(0, 0x0400);
        game.play(1, 0x0800);
        game.play(2, 0x0800);

        assert.equal(game.getLives(), 1);
    });

    it('testGameOver: should play incorrectly and all lives should be lost', () => {
        var game = getTestGame();
        game.play(0, 0x0020);
        game.play(1, 0x0040);
        game.play(2, 0x0800);
        game.play(3, 0x0800);
        game.play(4, 0x0800);

        assert(game.isGameOver());

        game = getTestGame();
        game.play(0, 0x0800);
        game.play(1, 0x0800);
        game.play(2, 0x0800);
        game.play(3, 0x0800);
        game.play(4, 0x0800);

        assert(game.isGameOver());
    });

    it('testHandDraw: tests drawing...', () => {
        var game = getTestGame();
        game.drawHand(0);
        game.drawHand(1);
        game.drawHand(2);
        game.drawHand(3);
        game.drawHand(4);

        assert(!game.isGameOver());
    });

    it('testLoseOnTurns: tests a game lose as a result of lack of turns', () => {
        var game = getTestGame();
        var count = 0;
        var lastCard = 1;
        for (; count < 55;) {
            for (var i = 0; i < 5; i++) {
                assert(!game.isGameOver());
                var card = game.discard(i, lastCard);
                lastCard = card;
                count++;
            }
        }

        assert(game.isGameOver());
    });

    it('testGameWon', () => {
        var game = getTestGame();
        game.play(0, 0x0001);
        game.play(1, 0x0002);
        game.play(2, 0x0004);
        game.play(3, 0x0008);
        game.play(4, 0x0010);

        game.play(0, 0x0020);
        game.play(1, 0x0040);
        game.play(2, 0x0080);
        game.play(3, 0x0100);
        game.play(4, 0x0200);

        game.play(0, 0x0400);
        game.play(1, 0x0800);
        game.play(2, 0x1000);
        game.play(3, 0x2000);
        game.play(4, 0x4000);

        game.play(0, 0x00008000);
        game.play(1, 0x00010000);
        game.play(2, 0x00020000);
        game.play(3, 0x00040000);
        game.play(4, 0x00080000);

        game.play(0, 0x00100000);
        game.play(1, 0x00200000);
        game.play(2, 0x00400000);
        game.play(3, 0x00800000);
        game.play(4, 0x01000000);

        assert(game.isGameOver());
        assert(game.isGameWon());
        assert.equal(3, game.getLives());
    });

    it('testEndanged', () => {
        var game = getTestGame();
        assert(game.isEndangered(0x0010));
        assert(game.isEndangered(0x0200));
        assert(game.isEndangered(0x4000));
        assert(game.isEndangered(0x00080000));
        assert(game.isEndangered(0x01000000));

        game.discard(0, 0x0001);
        assert(!game.isEndangered(0x0001));
        game.discard(1, 0x0001);
        assert(game.isEndangered(0x0001));
        game.play(2, 0x0001);
        assert(!game.isEndangered(0x0001));

        game = getTestGame();
        game.play(0, 0x0001);
        assert(!game.isEndangered(0x0001));
        game.discard(1, 0x0001);
        assert(!game.isEndangered(0x0001));
        game.discard(2, 0x0001);
        assert(!game.isEndangered(0x0001));

        game.play(3, 0x0002);
        game.play(4, 0x0004);
        game.play(0, 0x0008);
        assert(game.isEndangered(0x0010));
        game.play(1, 0x0010);
        assert(!game.isEndangered(0x0010));
    });
}); 