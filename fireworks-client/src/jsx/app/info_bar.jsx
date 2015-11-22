define(['jquery', 'React'], function ($, React) {
    var InfoBar = React.createClass({
        getInitialState() {
            return {
                hours: 0,
                minutes: 0,
                seconds: 0
            };
        },
        componentDidMount() {
            setInterval(this.updateTime, 1000);
        },
        componentDidUpdate(prevProps, prevState) {
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
        getTime() {
            return {hours: this.state.hours, minutes: this.state.minutes, seconds: this.state.seconds};
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
                    <div className="centered-container" ref="lifeCount">
                        <span>{this.props.cardsLeft}</span>
                        <span className="deck"></span>
                    </div>
                    <div className="space centered-container" ref="lifeCount">
                        <span>{this.props.lives}</span>
                        <span className="lives"></span>
                    </div>
                    <span className="space">{this.props.hints}</span>
                    <span className="hints" ref="hintCount"></span>
                    <span style={{marginLeft:"4px"}}>{formattedTime}</span>
                </div>
            );
        }
    });

    return InfoBar;
});