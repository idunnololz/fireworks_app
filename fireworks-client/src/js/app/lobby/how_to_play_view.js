define(['jquery', 'React'], function ($, React) {
    var HowToPlay = React.createClass({displayName: "HowToPlay",
        getInitialState:function() {
            return {
            };
        },
        componentDidUpdate:function() {
            $(".nano").nanoScroller();
        },
        render:function() {
            return (
                React.createElement("div", {className: "how-to-play-view"}, 
                    React.createElement("h1", null, "How To Play"), 
                    React.createElement("div", {className: "instructions-container nano"}, 
                        React.createElement("div", {className: "instructions nano-content"}, 
                            React.createElement("h2", null, "Goal of the game"), 
                            React.createElement("p", null, 
                                "Hanabi is a cooperative game, i.e. a game where the players do not play against each other but" + ' ' +
                                "work together towards a common goal. In this case they are absent minded firework" + ' ' +
                                "manufacturers who accidentally mixed up powders, fuses and rockets from a firework display." + ' ' +
                                "The show is about to start and panic is setting in. They have to work together to stop the" + ' ' +
                                "show becoming a disaster! The pyrotechnicians have to put together 5 fireworks, 1 white, 1" + ' ' +
                                "red, 1 blue, 1 yellow, 1 green), by making series rising in number (1, 2, 3, 4, 5) with the same" + ' ' +
                                "coloured cards."
                            ), 
                            React.createElement("h2", null, "The game"), 
                            React.createElement("p", null, 
                                "The game starts off with 8 hint tokens and 3 life tokens. The host begins the game. The players then take their turn" + ' ' +
                                "going in a clockwise direction. On a player's turn, a player must complete one, and only one, of the" + ' ' +
                                "following three actions (you are not allowed to skip your turn):" + ' ' +
                                "Note: When it is a player’s turn, his teammates cannot comment or try to influence him."
                            ), 
                            React.createElement("ol", null, 
                                React.createElement("li", null, "Give a hint."), 
                                React.createElement("li", null, "Discard a card."), 
                                React.createElement("li", null, "Play a card.")
                            ), 
                            React.createElement("p", null, 
                                "If there are 2 or 3 players, each player receives 5 cards. If there are 4 or 5 players, each player" + ' ' +
                                "receives 4 cards."
                            ), 
                            React.createElement("h3", null, "1. Giving a hint"), 
                            React.createElement("p", null, 
                                "In order to carry out this task, the player has to take a blue token from the lid of the box (he" + ' ' +
                                "puts it at the side with the red tokens). He can then tell a teammate something about the cards" + ' ' +
                                "that this player has in his hand.", 
                                React.createElement("br", null), 
                                "Two types of information can be given:", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Information about one colour (and only one)", React.createElement("br", null), 
                                "Examples : « You have a red card here » or « You have two green cards, here and here»" + ' ' +
                                "or « You have two black cards, there and there ».", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Information about a value (and only one)", React.createElement("br", null), 
                                "Examples : «You have a card with a value of 5 here » or « You have two cards with a" + ' ' +
                                "value of 1 there and there » or « You have two cards with a value of 4 there and there»." + ' ' +
                                "Important : The player must give complete information : If a player has two green" + ' ' +
                                "cards, the informer cannot only point to one of them!", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Note: This action cannot be performed if there are no more hint tokens." + ' ' +
                                "The player has to perform another action."
                            ), 
                            React.createElement("h3", null, "2. Discarding a card"), 
                            React.createElement("p", null, 
                                "Performing this task allows a blue token to be returned to the lid of the box. The" + ' ' +
                                "player discards a card from his hand and puts it in the discard pile (next to the box," + ' ' +
                                "face up). He then takes a new card and adds it to his hand without looking at it.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Note: This action cannot be performed if all the blue tokens are in the lid of the box." + ' ' +
                                "The player has to perform another action."
                            ), 
                            React.createElement("h3", null, "3. Playing a card"), 
                            React.createElement("p", null, 
                                "The player takes a card from his hand and puts it in front of him.", 
                                React.createElement("br", null), 
                                "Two options are possible:", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "The card either begins or completes a firework and it is then added to this firework.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Or the card does not complete any firework : it is then discarded and a red token is" + ' ' +
                                "added to the lid of the box.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "The player then takes a new card and adds it to their hand without looking at it.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "How the fireworks are made up:" + ' ' +
                                "There can only be one firework of each colour. The cards for a firework have to be" + ' ' +
                                "placed in rising order (1, then 2, then 3, then 4 and finally 5)." + ' ' +
                                "There can only be one card of each value in each firework (so 5 cards in total).", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "BONUS for a complete firework" + ' ' +
                                "When a player completes a firework – i.e. he plays the card with a value of 5 – he puts" + ' ' +
                                "a blue token back in the lid of the box. This addition is free; the player does not need" + ' ' +
                                "to discard a card. This bonus is lost if all the blue tokens are already in the box."
                            ), 
                            React.createElement("h2", null, "End of the game"), 
                            React.createElement("p", null, 
                                "There are 3 ways to end the game of Hanabi :", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "The game ends immediately and is lost if the third red token is placed in the lid of the" + ' ' +
                                "box.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "The game ends immediately and it is a stunning victory if the firework makers manage" + ' ' +
                                "to make the 5 fireworks before the cards run out. The players are then awarded the" + ' ' +
                                "maximum score of 25 points.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "The game ends if a firework maker takes the last card from the pile: each player plays" + ' ' +
                                "one more time, including the player who picked up the last card. The players cannot" + ' ' +
                                "pick up cards during this last round (as the pile is empty).", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Once this last round is complete, the game ends and the players can then add up their" + ' ' +
                                "scores."
                            ), 
                            React.createElement("h2", null, "Score"), 
                            React.createElement("p", null, 
                                "In order to calculate their scores, the players add up the largest value card for each of" + ' ' +
                                "the 5 fireworks.", 
                                React.createElement("br", null), 
                                "Example : 3 points + 4 points + 4 points + 5 points + 2 points for a total of 18 points.", 
                                React.createElement("br", null), React.createElement("br", null), 
                                "Artistic impression is determined by the Firework Manufacturers International" + ' ' +
                                "Federation reference scale:", 
                                React.createElement("br", null), React.createElement("br", null)
                            ), 
                            React.createElement("table", null, 
                                React.createElement("tr", null, React.createElement("td", {style: {'padding-right':'16px'}}, "Points"), React.createElement("td", null, "Overall impression")), 
                                React.createElement("tr", null, React.createElement("td", null, "<=5"), React.createElement("td", null, React.createElement("strong", null, "Horrible"), ", booed by the crowd...")), 
                                React.createElement("tr", null, React.createElement("td", null, "6-10"), React.createElement("td", null, React.createElement("strong", null, "Mediocre"), ", just a spattering of applause.")), 
                                React.createElement("tr", null, React.createElement("td", null, "11-15"), React.createElement("td", null, React.createElement("strong", null, "Honourable"), ", but will not be remembered for very long...")), 
                                React.createElement("tr", null, React.createElement("td", null, "16-20"), React.createElement("td", null, React.createElement("strong", null, "Excellent"), ", crowd pleasing.")), 
                                React.createElement("tr", null, React.createElement("td", null, "21 - 24"), React.createElement("td", null, React.createElement("strong", null, "Amazing"), ", will be remembered for a very long time!")), 
                                React.createElement("tr", null, React.createElement("td", null, "25"), React.createElement("td", null, React.createElement("strong", null, "Legendary"), ", everyone left speechless, stars in their eyes"))
                            )
                        )
                    ), 
                    React.createElement("div", {className: "options-container"}, 
                        React.createElement("button", {className: "theme-button", onClick: this.props.onOkClickHandler}, "Ok")
                    )
                )
            );
        }
    });

    return HowToPlay;
});