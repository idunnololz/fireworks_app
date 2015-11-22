define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var SignInView = React.createClass({
        getInitialState() {
            return {
                value: (this.props.playerInfo === undefined ? "" : this.props.playerInfo.playerName),
                valueChanged: false
            };
        },
        componentWillReceiveProps(nextProps) {
            if (!this.state.valueChanged) {
                this.setState({value: nextProps.playerInfo.playerName});
            }
        },
        handleChange: function(event) {
            this.setState({value: event.target.value});
        },
        handleSignIn: function(e) {
            var socket = this.props.socket;
            var handler = (msg) => {
                if (msg) {
                    // name OK! Proceed...
                    this.props.pageController.setPlayerName(this.state.value);
                    this.props.pageController.loginSuccess();
                } else {
                    // name taken!
                    // TODO
                }
                socket.removeListener('setName', handler);
            };
            socket.on('setName', handler);
            socket.emit('setName', {preferredName: this.state.value});
        },
        render() {
            var value = this.state.value;
            return (
                <div className="sign-in-view">
                    <div className="left-side">
                        <p>
                            We don’t have a login system yet. So just give youself a name and join the game.
                        </p>
                    </div>
                    <div className="vertical-divider"> </div>
                    <div className="right-side">
                        <form className="sign-in-form">
                            <p>
                                Give yourself a name
                            </p>
                            <input className="name-input" type="text" value={value} onChange={this.handleChange}/>
                        </form>
                        <a className="theme-button" href="javascript:;" onClick={this.handleSignIn}>Go</a>
                    </div>
                </div>
            );
        }
    });

    return SignInView;
});