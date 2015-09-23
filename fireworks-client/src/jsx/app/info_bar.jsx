define(['jquery', 'React'], function ($, React) {
    var InfoBar = React.createClass({
        getInitialState() {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0
            };
        },
        componentWillMount() {
        },
        componentDidMount() {
            setInterval(this.updateTime, 1000);
        },
        updateTime() {
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
        render() {
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
                <div className="info-bar">
                    <span>{this.props.lives}</span>
                    <span className="lives"></span>
                    <span className="space">{this.props.hints}</span>
                    <span className="hints"></span>
                    <span style={{marginLeft:"4px"}}>{formattedTime}</span>
                </div>
            );
        }
    });

    return InfoBar;
});