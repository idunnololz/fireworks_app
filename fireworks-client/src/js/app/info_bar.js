define(['jquery', 'React'], function ($, React) {
    var InfoBar = React.createClass({displayName: "InfoBar",
        getInitialState:function() {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0
            };
        },
        componentWillMount:function() {
        },
        componentDidMount:function() {
            setInterval(this.updateTime, 1000);
        },
        updateTime:function() {
            var hours = this.state.hours;
            var minutes = this.state.minutes;
            var seconds = this.state.seconds;
            seconds++;
            if (seconds === 60) {
                seconds = 0;
                minutes++;
            }
            if (minutes === 60) {
                minutes = 0;
                hours++;
            }
            this.setState({
                hours: hours,
                minutes: minutes,
                seconds: seconds
            });
        },
        render:function() {
            var hours = this.state.hours;
            var minutes = this.state.minutes;
            var seconds = this.state.seconds;
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

            return (
                React.createElement("div", {className: "info-bar"}, 
                    React.createElement("span", null, this.props.lives), 
                    React.createElement("span", {className: "lives"}), 
                    React.createElement("span", {className: "space"}, this.props.hints), 
                    React.createElement("span", {className: "hints"}), 
                    React.createElement("span", {style: {marginLeft:"4px"}}, formattedTime)
                )
            );
        }
    });

    return InfoBar;
});