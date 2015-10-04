define(['jquery', 'React'], function ($, React) {
    var GameOverDialog =  React.createClass({
        generateElemForCard(card) {
            if (card === undefined) return undefined;
            return (
                <div>
                    <img className="card" src={"res/cards/" + CardUtils.getResourceNameForSmallCard(card.cardType)}/>
                </div>
            );
        },
        getTimeString(time) {
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
        onPlayAgainClick() {
            
        },
        render() {
            var board = this.props.board;
            var totalTime = this.props.totalTime;

            var time = this.getTimeString(totalTime);
            var score = 0;
            $.each(board, (index, val) => {
                if (val != undefined) {
                    score += CardUtils.getCardNumber(val.cardType) + 1;
                }
            });

            return (
                <div className="game-over-dialog">
                    <h1>Game over</h1>
                    <div className="card-container">
                        <div className="card-slot">
                            {this.generateElemForCard(board[0])}
                        </div>
                        <div className="card-slot">
                            {this.generateElemForCard(board[1])}
                        </div>
                        <div className="card-slot">
                            {this.generateElemForCard(board[2])}
                        </div>
                        <div className="card-slot">
                            {this.generateElemForCard(board[3])}
                        </div>
                        <div className="card-slot">
                            {this.generateElemForCard(board[4])}
                        </div>
                    </div>
                    <div className="stats-container">
                        <div className="stat-container">
                            <h2>Total score</h2>
                            <h3>{score}</h3>
                        </div>
                        <div className="spacer"></div>
                        <div className="stat-container">
                            <h2>Play time</h2>
                            <h3>{time}</h3>
                        </div>
                    </div>
                    <a href="javascript:;" onClick={this.onPlayAgainClick}>Play again</a>
                </div>
            );
        }
    });

    return GameOverDialog;
});