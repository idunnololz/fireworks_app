define(['jquery', 'React'], function ($, React) {
    var InfoBar = React.createClass({displayName: "InfoBar",
        getInitialState:function() {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0
            };
        },
        componentDidMount:function() {
            setInterval(this.updateTime, 1000);

            $('.info-bar').tooltip({
                position: {at: "center", my: 'center bottom-20'},
            });
        },
        componentDidUpdate:function(prevProps, prevState) {
            if (prevProps.lives > this.props.lives) {
                // lives went down... make lives flash for a bit...
                var $lifeCount = $(React.findDOMNode(this.refs.lifeCount));
                $lifeCount.css('animation', 'anim-flash-red 0.3s 0s 10 alternate');
            } else if (prevProps.lives < this.props.lives) {
                console.log("Wtf... We can't gain lives...");
            }
            if (prevProps.hints < this.props.hints) {
                var $hintCount = $(React.findDOMNode(this.refs.hintCount));
                $hintCount.css('animation', 'anim-flash-green 0.3s 0s 10 alternate');
            }
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
        getTime:function() {
            return {hours: this.state.hours, minutes: this.state.minutes, seconds: this.state.seconds};
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
                    React.createElement("div", {className: "centered-container", ref: "lifeCount"}, 
                        React.createElement("span", null, this.props.cardsLeft), 
                        React.createElement("span", {className: "deck", title: "Cards left"})
                    ), 
                    React.createElement("div", {className: "space centered-container", ref: "lifeCount"}, 
                        React.createElement("span", null, this.props.lives), 
                        React.createElement("span", {className: "lives", title: "Lives"})
                    ), 
                    React.createElement("span", {className: "space"}, this.props.hints), 
                    React.createElement("span", {className: "hints", ref: "hintCount", title: "Hints"}), 
                    React.createElement("span", {style: {marginLeft:"4px"}}, formattedTime)
                )
            );
        }
    });

    return InfoBar;
});