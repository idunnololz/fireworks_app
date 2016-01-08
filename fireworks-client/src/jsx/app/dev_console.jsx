define(['jquery', 'React', 'libs/nano_scroller', 'app/log', 'app/prefs', 'app/secure'], function ($, React, nano, Log, Prefs, Secure) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = 'DevConsole';

    class Message {
        constructor(senderId, message) {
            this.senderId = senderId;
            this.message = message;
        }
    }

    var DevConsole = React.createClass({
        getInitialState() {
            return {
                messages: [],
                baseAlpha: 0.5,
                hideInput: false,
            };
        },
        refreshKeepingMessages() {
            var initState = this.getInitialState();
            initState.messages = this.state.messages;
            this.replaceState(initState);
        },
        handleSubmit(e) {
            if (e.preventDefault) e.preventDefault();
            if (!this.props.playerInfo) return;

            var playerInfo = this.props.playerInfo;
            var $msgBox = $(React.findDOMNode(this.refs.msgbox));
            var msg = $msgBox.val();
            $msgBox.val('');

            //this.props.socket.emit('sendDevMessage', new Message(playerInfo.playerId, msg));

            if (this.state.hideInput) {
                this.showInput();
                var secure = Secure.getSecureFromPassword(this.state.userName, msg);

                Log.d(TAG, secure);

                this.props.socket.emit('unlockAdmin', {
                    'user': this.state.userName,
                    'pass': secure
                });
                return;
            }

            this.m(msg);

            var v = this.v;

            var args = msg.split(' ');
            switch (args[0]) {
                case 'login':
                    this.setState({userName: args[1]});
                    v("What's your password?");
                    this.hideInput();
                    break;
                case 'exit':
                    this.props.close();
                    break;
                case 'clearCookies':
                    Prefs.deleteAllCookies();
                    Prefs.load();
                    v("Cookies cleared.");
                    break;
                case 'broadcast':
                    this.props.socket.emit('broadcast', msg.substr(msg.indexOf(' ') + 1));
                    break;
            }
        },
        hideInput() {
            this.setState({hideInput: true});
        },
        showInput() {
            this.setState({hideInput: false});
        },
        focus() {
            $("#dev-console-input").focus();
        },
        componentWillMount() {
            this.props.socket.on('sendDevMessage', (msg) => {
                Log.d(TAG, 'sendDevMessage: %O', msg);

                if (msg.what === 'unlockAdmin') {
                    if (msg.result) {
                        this.v('Login successful.');
                    } else {
                        this.v('Login unsuccessful.');
                    }
                }
            });

            this.v('Welcome to the developer console!');
            this.v("Type 'exit' to close.");
        },
        componentDidMount() {
            $(".nano").nanoScroller();
            setTimeout(() => {
                this.focus();
            }, 300);
        },
        componentDidUpdate() {
            $(".nano").nanoScroller();
            $(".message-content.nano").nanoScroller({ scroll: 'bottom' });
        },
        v(msg) {
            var messages = this.state.messages;
            messages.push({
                message: (
                    <span className="v">{msg}</span>
                )});
            this.setState({'messages': messages});
        },
        m(msg) {
            var messages = this.state.messages;
            messages.push({
                message: (
                    <span>{msg}</span>
                )});
            this.setState({'messages': messages});
        },
        focus() {
            React.findDOMNode(this.refs.msgbox).focus();
        },
        render() {
            var msgViews = [];

            var messages = this.state.messages;
            for (var i = 0; i < messages.length; i++) {
                var m = messages[i];
                msgViews.push(
                    <p>
                        {
                            m.senderName === undefined ? null : 
                            <span className="sender">
                                {m.senderName}
                            </span>
                        }
                        {m.message}
                    </p>
                );
            }

            return (
                <form id="dev-console" className="dev-console" onSubmit={this.handleSubmit}>
                    <div className="message-content nano">
                        <div className="nano-content message-container">
                            {msgViews}
                        </div>
                    </div>
                    <input type={this.state.hideInput ? "password" : "text"} id="dev-console-input" className="message-input" ref="msgbox">
                    </input>
                </form>
            );
        }
    });

    return DevConsole;
});