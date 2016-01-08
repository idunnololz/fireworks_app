define(['React'], function (React) {

    var ProgressBar = React.createClass({displayName: "ProgressBar",
        render:function() {
            return (
                React.createElement("div", {className: "spinner"}, 
                    React.createElement("div", {className: "bounce1"}), 
                    React.createElement("div", {className: "bounce2"}), 
                    React.createElement("div", {className: "bounce3"})
                )
            );
        }
    });

    return ProgressBar;
});