define(['jquery', 'React'], function ($, React) {
    var LeaveGameDialog = React.createClass({
        render() {
            return (
                <div className="theme-dialog">
                    <p>Do you really want to leave this game?</p>
                    <div className="options-container" style={{'margin-top': '1vh'}}>
                        <button className="theme-button" onClick={this.props.onCancelClick}>Cancel</button>
                        <button className="theme-button" onClick={this.props.onOkClick}>Leave</button>
                    </div>
                </div>
            );
        }
    });

    return LeaveGameDialog;
});