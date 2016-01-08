define(['jquery', 'React', 'app/log', 'app/widget/text_field', 'app/widget/tooltip', 'app/secure', 'app/widget/progress_bar'], 
function ($, React, Log, TextField, Tooltip, Secure, ProgressBar) {

    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var TAG = "SignInView";

    var SignInView = React.createClass({displayName: "SignInView",
        getInitialState:function() {
            return {
                valueChanged: false,
                state: 0,
                signingIn: false,
            };
        },
        componentWillReceiveProps:function(nextProps) {
            this.refs.name.setText(nextProps.playerInfo.playerName);
        },
        showError:function(component, msg) {
            this.refs.tooltip.setText(msg);
            this.refs.tooltip.show(component);
        },
        clearError:function() {
            this.refs.tooltip.hide();
        },
        onSignInGuest:function(e) {
            e.preventDefault();
            var socket = this.props.socket;
            var name = this.refs.name.getText();
            socket.once('setName', function(msg)  {
                if (msg) {
                    // name OK! Proceed...
                    this.props.pageController.setPlayerName(name);
                    this.props.pageController.loginSuccess();
                } else {
                    // name taken!
                    // TODO
                }
            }.bind(this));
            socket.emit('setName', {preferredName: name});
        },
        onSignIn:function(e) {
            e.preventDefault();

            var refs = this.refs;
            var user = this.refs.username.getText();
            var pass = this.refs.password.getText();
            var socket = this.props.socket;

            if (user.length < 4) {
                this.showError(this.refs.username, "Username must be at least 4 characters long")
            } else {
            }

            if (user.length < 4) {
                this.showError(refs.username, "Username must be at least 4 characters long");
                return;
            } else if (!/^[a-z0-9]+$/i.test(user)) {
                this.showError(refs.username, "Username must alphanumeric (i.e. made up of characters: a-z, A-Z, 0-9)");
                return;
            } else if (pass.length < 8) {
                this.showError(refs.password, "Password must be at least 8 characters long");
                return;
            }
            
            this.clearError();

            var secure = Secure.getSecureFromPassword(user, pass);

            socket.once('login', function(msg)  {
                Log.d(TAG, "OnLogin response: %O", msg);
                if (msg.result) {
                    // TODO login success
                    this.props.pageController.setPlayerName(user);
                    this.props.pageController.loginSuccess();
                } else {
                    // TODO login failure
                }

                this.setState({signingIn: false});
            }.bind(this));
            socket.emit('login', {user: user, pass: secure});
            this.setState({signingIn: true});
        },
        useAccount:function() {
            if (this.state.state === -1) return;

            var $content = $('.sign-in-inner-container');
            var $left = $('.left-side');
            var $right = $('.right-side');

            var xOff = Math.round(($content.outerWidth() - $left.outerWidth(true)) / 2);

            if (this.state.state === 1) {
                TweenLite.to($left, 0.3, {autoAlpha: 1});
            }
            TweenLite.to($right, 1, {autoAlpha: .33});
            TweenLite.to($content, 0.3, {x: xOff});
            this.setState({state: -1});
        },
        useGuest:function() {
            if (this.state.state === 1) return;

            var $content = $('.sign-in-inner-container');
            var $left = $('.left-side');
            var $right = $('.right-side');

            var xOff = Math.round(($right.outerWidth(true) - $content.outerWidth()) / 2);

            var $content = $('.sign-in-inner-container');
            var $left = $('.left-side');
            var $right = $('.right-side');

            if (this.state.state === -1) {
                TweenLite.to($right, 0.3, {autoAlpha: 1});
            }
            TweenLite.to($left, 1, {autoAlpha: .33});
            TweenLite.to($content, 0.3, {x: xOff});
            this.setState({state: 1});
        },
        render:function() {
            var value = this.state.value;

            var signInButton;
            if (!this.state.signingIn) {
                signInButton = (
                    React.createElement("button", {className: "theme-button"}, "Sign in")
                );
            } else {
                signInButton = (
                    React.createElement("button", {className: "theme-button"}, React.createElement(ProgressBar, null))
                );
            }

            return (
                React.createElement("div", {className: "sign-in-view"}, 
                    React.createElement("div", {className: "logo-small"}), 
                    React.createElement("h1", null, "Sign in to play"), 
                    React.createElement("div", {className: "sign-in-inner-container"}, 
                        React.createElement("form", {className: "left-side", onSubmit: this.onSignIn}, 
                            React.createElement("h2", {className: "sign-in-account-text"}, 
                                "Sign in with account"
                            ), 
                            React.createElement(TextField, {hint: "Username", ref: "username", onFocus: this.useAccount}), 
                            React.createElement(TextField, {hint: "Password", type: "password", ref: "password", onFocus: this.useAccount}), 
                            signInButton
                        ), 
                        React.createElement("div", {className: "vertical-divider"}, " "), 
                        React.createElement("form", {className: "right-side", onSubmit: this.onSignInGuest}, 
                            React.createElement("h2", null, 
                                "Enter as a guest"
                            ), 
                            React.createElement(TextField, {hint: "Name", ref: "name", onFocus: this.useGuest}), 
                            React.createElement("button", {className: "theme-button"}, "Go")
                        ), 
                        React.createElement(Tooltip, {ref: "tooltip"})
                    ), 
                    React.createElement("div", {className: "sign-up-banner-container"}, 
                        React.createElement("p", null, "Don't have an account?"), 
                        React.createElement("p", {className: "low-margin"}, "Sign up ", React.createElement("a", {href: "/signup.html"}, "here"))
                    )
                )
            );
        }
    });

    return SignInView;
});