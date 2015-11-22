define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var SignInView = React.createClass({displayName: "SignInView",
        getInitialState:function() {
            return {
                value: (this.props.playerInfo === undefined ? "" : this.props.playerInfo.playerName),
                valueChanged: false
            };
        },
        componentWillReceiveProps:function(nextProps) {
            if (!this.state.valueChanged) {
                this.setState({value: nextProps.playerInfo.playerName});
            }
        },
        handleChange: function(event) {
            this.setState({value: event.target.value});
        },
        handleSignIn: function(e) {
            var socket = this.props.socket;
            var handler = function(msg)  {
                if (msg) {
                    // name OK! Proceed...
                    this.props.pageController.setPlayerName(this.state.value);
                    this.props.pageController.loginSuccess();
                } else {
                    // name taken!
                    // TODO
                }
                socket.removeListener('setName', handler);
            }.bind(this);
            socket.on('setName', handler);
            socket.emit('setName', {preferredName: this.state.value});
        },
        render:function() {
            var value = this.state.value;
            return (
                React.createElement("div", {className: "sign-in-view"}, 
                    React.createElement("div", {className: "left-side"}, 
                        React.createElement("p", null, 
                            "We don’t have a login system yet. So just give youself a name and join the game."
                        )
                    ), 
                    React.createElement("div", {className: "vertical-divider"}, " "), 
                    React.createElement("div", {className: "right-side"}, 
                        React.createElement("form", {className: "sign-in-form"}, 
                            React.createElement("p", null, 
                                "Give yourself a name"
                            ), 
                            React.createElement("input", {className: "name-input", type: "text", value: value, onChange: this.handleChange})
                        ), 
                        React.createElement("a", {className: "theme-button", href: "javascript:;", onClick: this.handleSignIn}, "Go")
                    )
                )
            );
        }
    });

    return SignInView;
});