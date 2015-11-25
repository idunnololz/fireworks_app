define(['jquery', 'React'], function ($, React) {
    var NewGameView = React.createClass({displayName: "NewGameView",
        getInitialState:function() {
            return {
                roomName: this.props.defaultRoomName,
                gameType: "A",
            };
        },
        handleRoomNameChange:function(event) {
            this.setState({roomName: event.target.value});
        },
        handleSelectChange:function(event) {
            console.log(event);
            this.setState({gameType: event.target.value});
        },
        onNewGameClick:function() {
            this.props.onNewGameClickHandler(this.state.roomName, this.state.gameType);
        },
        render:function() {
            return (
                React.createElement("div", {className: "new-game-view"}, 
                    React.createElement("h1", null, "New Game"), 
                    React.createElement("p", null, "Room name"), 
                    React.createElement("input", {className: "input", type: "text", value: this.state.roomName, onChange: this.handleRoomNameChange}), 
                    React.createElement("p", null, "Game type"), 
                    React.createElement("div", {className: "select-container"}, 
                        React.createElement("select", {className: "theme-select", value: this.state.gameType, onChange: this.handleSelectChange}, 
                            React.createElement("option", {value: "A"}, "Standard")
                        )
                    ), 
                    React.createElement("div", {className: "options-container"}, 
                        React.createElement("button", {className: "theme-button", onClick: this.props.onCancelClickHandler}, "Cancel"), 
                        React.createElement("button", {className: "theme-button", onClick: this.onNewGameClick}, "Make room")
                    )
                )
            );
        }
    });

    return NewGameView;
});