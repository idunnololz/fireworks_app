define(['jquery', 'React'], function ($, React) {
    var JoinGameView = React.createClass({
        getInitialState() {
            return {
            };
        },
        onJoinGameClick(e) {
            this.props.onJoinGameClickHandler(this.props.roomInfo.name, this.props.roomInfo.gameId);
        },
        render() {
            var info = this.props.roomInfo;
            var players = info.players;
            var playersView = $.map(players, (val) => {
                return (
                    <div className="player-obj">
                        {val.playerName}
                    </div>
                );
            });

            return (
                <div className="join-game-view">
                    <h1>Join Game</h1>
                    <p>{info.name}</p>
                    <h2>Players</h2>
                    <div className="players-list">{playersView}</div>
                    <div className="options-container">
                        <a className="theme-button" href="javascript:;" onClick={this.props.onCancelClickHandler}>Cancel</a>
                        <a className="theme-button" href="javascript:;" onClick={this.onJoinGameClick}>Join game</a>
                    </div>
                </div>
            );
        }
    });

    return JoinGameView;
});