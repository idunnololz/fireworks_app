import Deck from '../src/deck';

var assert = require("assert");
describe('Deck', function() {
    describe('length()', () => {
        var deck = new Deck();
        it('should return 50 since the game has 50 cards to begin with', () => {
            assert.equal(deck.length(), 50);
        });
    });
    describe('pop()', () => {
        var deck = new Deck();
        it('should pop one card off of the top and return it', () => {
            var deckSize = deck.length();
            var card = deck.pop();
            assert.equal(deck.length(), deckSize - 1);
        });
    });
}); 