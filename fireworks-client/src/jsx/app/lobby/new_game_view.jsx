define(['jquery', 'React'], function ($, React) {
    var NewGameView = React.createClass({
        getInitialState() {
            return {
                roomName: this.props.defaultRoomName,
                gameType: "A",
            };
        },
        handleRoomNameChange(event) {
            this.setState({roomName: event.target.value});
        },
        handleSelectChange(event) {
            console.log(event);
            this.setState({gameType: event.target.value});
        },
        onNewGameClick() {
            this.props.onNewGameClickHandler(this.state.roomName, this.state.gameType);
        },
        render() {
            return (
                <div className="new-game-view">
                    <h1>New Game</h1>
                    <p>Room name</p>
                    <input className="input" type="text" value={this.state.roomName} onChange={this.handleRoomNameChange}/>
                    <p>Game type</p>
                    <div className="select-container">
                        <select className="theme-select" value={this.state.gameType} onChange={this.handleSelectChange}>
                            <option value="A">Standard</option>
                        </select>
                    </div>
                    <div className="options-container">
                        <button className="theme-button" onClick={this.props.onCancelClickHandler}>Cancel</button>
                        <button className="theme-button" onClick={this.onNewGameClick}>Make room</button>
                    </div>
                </div>
            );
        }
    });

    return NewGameView;
});