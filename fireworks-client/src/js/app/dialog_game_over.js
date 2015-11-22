define(['jquery', 'React'], function ($, React) {
    var GameOverDialog =  React.createClass({displayName: "GameOverDialog",
        generateElemForCard:function(card) {
            if (card === undefined) return undefined;
            return (
                React.createElement("div", null, 
                    React.createElement("img", {className: "card", src: "res/cards/" + CardUtils.getResourceNameForSmallCard(card.cardType)})
                )
            );
        },
        getTimeString:function(time) {
            var hours = time.hours;
            var minutes = time.minutes;
            var seconds = time.seconds;
            var formattedTime = "";

            if (hours !== 0) {
                formattedTime += hours + ":";
                if (minutes === 0) {
                    formattedTime += "00:";
                } else if (minutes > 0 && minutes < 10) {
                    formattedTime += "0" + minutes + ":";
                } else {
                    formattedTime += minutes + ":";
                }
            } else {
                if (minutes === 0) {
                    formattedTime += "0:";
                } else {
                    formattedTime += minutes + ":";
                }
            }

            if (seconds === 0) {
                formattedTime += "00";
            } else if (seconds > 0 && seconds < 10) {
                formattedTime += "0" + seconds;
            } else {
                formattedTime += seconds;
            }
            return formattedTime;
        },
        onPlayAgainClick:function() {
            
        },
        render:function() {
            var board = this.props.board;
            var totalTime = this.props.totalTime;

            var time = this.getTimeString(totalTime);
            var score = 0;
            $.each(board, function(index, val)  {
                if (val != undefined) {
                    score += CardUtils.getCardNumber(val.cardType);
                }
            });

            return (
                React.createElement("div", {className: "game-over-dialog"}, 
                    React.createElement("h1", null, "Game over"), 
                    React.createElement("div", {className: "card-container"}, 
                        React.createElement("div", {className: "card-slot"}, 
                            this.generateElemForCard(board[0])
                        ), 
                        React.createElement("div", {className: "card-slot"}, 
                            this.generateElemForCard(board[1])
                        ), 
                        React.createElement("div", {className: "card-slot"}, 
                            this.generateElemForCard(board[2])
                        ), 
                        React.createElement("div", {className: "card-slot"}, 
                            this.generateElemForCard(board[3])
                        ), 
                        React.createElement("div", {className: "card-slot"}, 
                            this.generateElemForCard(board[4])
                        )
                    ), 
                    React.createElement("div", {className: "stats-container"}, 
                        React.createElement("div", {className: "stat-container"}, 
                            React.createElement("h2", null, "Total score"), 
                            React.createElement("h3", null, score)
                        ), 
                        React.createElement("div", {className: "spacer"}), 
                        React.createElement("div", {className: "stat-container"}, 
                            React.createElement("h2", null, "Play time"), 
                            React.createElement("h3", null, time)
                        )
                    ), 
                    React.createElement("a", {href: "javascript:;", onClick: this.onPlayAgainClick}, "Play again")
                )
            );
        }
    });

    return GameOverDialog;
});