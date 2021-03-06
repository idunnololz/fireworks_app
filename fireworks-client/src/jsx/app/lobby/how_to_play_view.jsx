define(['jquery', 'React'], function ($, React) {
    var HowToPlay = React.createClass({
        getInitialState() {
            return {
            };
        },
        componentDidUpdate() {
            $(".nano").nanoScroller();
        },
        render() {
            return (
                <div className="how-to-play-view">
                    <h1>How To Play</h1>
                    <div className="instructions-container nano">
                        <div className="instructions nano-content">
                            <h2>Goal of the game</h2>
                            <p>
                                Hanabi is a cooperative game, i.e. a game where the players do not play against each other but
                                work together towards a common goal. In this case they are absent minded firework
                                manufacturers who accidentally mixed up powders, fuses and rockets from a firework display.
                                The show is about to start and panic is setting in. They have to work together to stop the
                                show becoming a disaster! The pyrotechnicians have to put together 5 fireworks, 1 white, 1
                                red, 1 blue, 1 yellow, 1 green), by making series rising in number (1, 2, 3, 4, 5) with the same
                                coloured cards.
                            </p>
                            <h2>The game</h2>
                            <p>
                                The game starts off with 8 hint tokens and 3 life tokens. The host begins the game. The players then take their turn
                                going in a clockwise direction. On a player's turn, a player must complete one, and only one, of the
                                following three actions (you are not allowed to skip your turn):
                                Note: When it is a player’s turn, his teammates cannot comment or try to influence him.
                            </p>
                            <ol>
                                <li>Give a hint.</li>
                                <li>Discard a card.</li>
                                <li>Play a card.</li>
                            </ol>
                            <p>
                                If there are 2 or 3 players, each player receives 5 cards. If there are 4 or 5 players, each player
                                receives 4 cards.
                            </p>
                            <h3>1. Giving a hint</h3>
                            <p>
                                In order to carry out this task, the player has to take a blue token from the lid of the box (he
                                puts it at the side with the red tokens). He can then tell a teammate something about the cards
                                that this player has in his hand.
                                <br/>
                                Two types of information can be given:
                                <br/><br/>
                                Information about one colour (and only one)<br/>
                                Examples : « You have a red card here » or « You have two green cards, here and here»
                                or « You have two black cards, there and there ».
                                <br/><br/>
                                Information about a value (and only one)<br/>
                                Examples : «You have a card with a value of 5 here » or « You have two cards with a
                                value of 1 there and there » or « You have two cards with a value of 4 there and there».
                                Important : The player must give complete information : If a player has two green
                                cards, the informer cannot only point to one of them!
                                <br/><br/>
                                Note: This action cannot be performed if there are no more hint tokens.
                                The player has to perform another action.
                            </p>
                            <h3>2. Discarding a card</h3>
                            <p>
                                Performing this task allows a blue token to be returned to the lid of the box. The
                                player discards a card from his hand and puts it in the discard pile (next to the box,
                                face up). He then takes a new card and adds it to his hand without looking at it.
                                <br/><br/>
                                Note: This action cannot be performed if all the blue tokens are in the lid of the box.
                                The player has to perform another action.
                            </p>
                            <h3>3. Playing a card</h3>
                            <p>
                                The player takes a card from his hand and puts it in front of him.
                                <br/>
                                Two options are possible:
                                <br/><br/>
                                The card either begins or completes a firework and it is then added to this firework.
                                <br/><br/>
                                Or the card does not complete any firework : it is then discarded and a red token is
                                added to the lid of the box.
                                <br/><br/>
                                The player then takes a new card and adds it to their hand without looking at it.
                                <br/><br/>
                                How the fireworks are made up:
                                There can only be one firework of each colour. The cards for a firework have to be
                                placed in rising order (1, then 2, then 3, then 4 and finally 5).
                                There can only be one card of each value in each firework (so 5 cards in total).
                                <br/><br/>
                                BONUS for a complete firework
                                When a player completes a firework – i.e. he plays the card with a value of 5 – he puts
                                a blue token back in the lid of the box. This addition is free; the player does not need
                                to discard a card. This bonus is lost if all the blue tokens are already in the box.
                            </p>
                            <h2>End of the game</h2>
                            <p>
                                There are 3 ways to end the game of Hanabi :
                                <br/><br/>
                                The game ends immediately and is lost if the third red token is placed in the lid of the
                                box.
                                <br/><br/>
                                The game ends immediately and it is a stunning victory if the firework makers manage
                                to make the 5 fireworks before the cards run out. The players are then awarded the
                                maximum score of 25 points.
                                <br/><br/>
                                The game ends if a firework maker takes the last card from the pile: each player plays
                                one more time, including the player who picked up the last card. The players cannot
                                pick up cards during this last round (as the pile is empty).
                                <br/><br/>
                                Once this last round is complete, the game ends and the players can then add up their
                                scores.
                            </p>
                            <h2>Score</h2>
                            <p>
                                In order to calculate their scores, the players add up the largest value card for each of
                                the 5 fireworks.
                                <br/>
                                Example : 3 points + 4 points + 4 points + 5 points + 2 points for a total of 18 points.
                                <br/><br/>
                                Artistic impression is determined by the Firework Manufacturers International
                                Federation reference scale:
                                <br/><br/>
                            </p>
                            <table>
                                <tr><td style={{'padding-right':'16px'}}>Points</td><td>Overall impression</td></tr>
                                <tr><td>&lt;=5</td><td><strong>Horrible</strong>, booed by the crowd...</td></tr>
                                <tr><td>6-10</td><td><strong>Mediocre</strong>, just a spattering of applause.</td></tr>
                                <tr><td>11-15</td><td><strong>Honourable</strong>, but will not be remembered for very long...</td></tr>
                                <tr><td>16-20</td><td><strong>Excellent</strong>, crowd pleasing.</td></tr>
                                <tr><td>21 - 24</td><td><strong>Amazing</strong>, will be remembered for a very long time!</td></tr>
                                <tr><td>25</td><td><strong>Legendary</strong>, everyone left speechless, stars in their eyes</td></tr>
                            </table>
                        </div>
                    </div>
                    <div className="options-container">
                        <button className="theme-button" onClick={this.props.onOkClickHandler}>Ok</button>
                    </div>
                </div>
            );
        }
    });

    return HowToPlay;
});