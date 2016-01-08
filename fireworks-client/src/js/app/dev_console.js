define(['jquery', 'React', 'libs/nano_scroller', 'app/log', 'app/prefs', 'app/secure'], function ($, React, nano, Log, Prefs, Secure) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = 'DevConsole';

    
        function Message(senderId, message) {"use strict";
            this.senderId = senderId;
            this.message = message;
        }
    

    var DevConsole = React.createClass({displayName: "DevConsole",
        getInitialState:function() {
            return {
                messages: [],
                baseAlpha: 0.5,
                hideInput: false,
            };
        },
        refreshKeepingMessages:function() {
            var initState = this.getInitialState();
            initState.messages = this.state.messages;
            this.replaceState(initState);
        },
        handleSubmit:function(e) {
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
        hideInput:function() {
            this.setState({hideInput: true});
        },
        showInput:function() {
            this.setState({hideInput: false});
        },
        focus:function() {
            $("#dev-console-input").focus();
        },
        componentWillMount:function() {
            this.props.socket.on('sendDevMessage', function(msg)  {
                Log.d(TAG, 'sendDevMessage: %O', msg);

                if (msg.what === 'unlockAdmin') {
                    if (msg.result) {
                        this.v('Login successful.');
                    } else {
                        this.v('Login unsuccessful.');
                    }
                }
            }.bind(this));

            this.v('Welcome to the developer console!');
            this.v("Type 'exit' to close.");
        },
        componentDidMount:function() {
            $(".nano").nanoScroller();
            setTimeout(function()  {
                this.focus();
            }.bind(this), 300);
        },
        componentDidUpdate:function() {
            $(".nano").nanoScroller();
            $(".message-content.nano").nanoScroller({ scroll: 'bottom' });
        },
        v:function(msg) {
            var messages = this.state.messages;
            messages.push({
                message: (
                    React.createElement("span", {className: "v"}, msg)
                )});
            this.setState({'messages': messages});
        },
        m:function(msg) {
            var messages = this.state.messages;
            messages.push({
                message: (
                    React.createElement("span", null, msg)
                )});
            this.setState({'messages': messages});
        },
        focus:function() {
            React.findDOMNode(this.refs.msgbox).focus();
        },
        render:function() {
            var msgViews = [];

            var messages = this.state.messages;
            for (var i = 0; i < messages.length; i++) {
                var m = messages[i];
                msgViews.push(
                    React.createElement("p", null, 
                        
                            m.senderName === undefined ? null : 
                            React.createElement("span", {className: "sender"}, 
                                m.senderName
                            ), 
                        
                        m.message
                    )
                );
            }

            return (
                React.createElement("form", {id: "dev-console", className: "dev-console", onSubmit: this.handleSubmit}, 
                    React.createElement("div", {className: "message-content nano"}, 
                        React.createElement("div", {className: "nano-content message-container"}, 
                            msgViews
                        )
                    ), 
                    React.createElement("input", {type: this.state.hideInput ? "password" : "text", id: "dev-console-input", className: "message-input", ref: "msgbox"}
                    )
                )
            );
        }
    });

    return DevConsole;
});