define(['jquery', 'React'], function ($, React) {
    var LeaveGameDialog = React.createClass({displayName: "LeaveGameDialog",
        render:function() {
            return (
                React.createElement("div", {className: "theme-dialog"}, 
                    React.createElement("p", null, "Do you really want to leave this game?"), 
                    React.createElement("div", {className: "options-container", style: {'margin-top': '1vh'}}, 
                        React.createElement("button", {className: "theme-button", onClick: this.props.onCancelClick}, "Cancel"), 
                        React.createElement("button", {className: "theme-button", onClick: this.props.onOkClick}, "Leave")
                    )
                )
            );
        }
    });

    return LeaveGameDialog;
});