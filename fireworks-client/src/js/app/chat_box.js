define(['jquery', 'React', 'libs/nano_scroller', 'app/log', 'app/prefs'], function ($, React, nano, Log, Prefs) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = 'ChatBox';
    const KEY_BG_ALPHA = 'chat_bg_alpha';

    
        function Message(senderName, senderId, message) {"use strict";
            this.senderName = senderName;
            this.senderId = senderId;
            this.message = message;
        }
    

    var ChatBox = React.createClass({displayName: "ChatBox",
        getInitialState:function() {
            return {
                messages: [],
                baseAlpha: Prefs.get(KEY_BG_ALPHA, 0.5)
            };
        },
        handleSubmit:function(e) {
            if (e.preventDefault) e.preventDefault();
            if (!this.props.playerInfo) return;

            var playerInfo = this.props.playerInfo;
            var $msgBox = $(React.findDOMNode(this.refs.msgbox));
            var msg = $msgBox.val();
            $msgBox.val('');

            if (msg.length === 0) {
                React.findDOMNode(this.refs.msgbox).blur();
            } else if (msg[0] === '/') {
                this.props.handleSpecialCommand(msg);
            } else {
                this.props.socket.emit('sendMessage', new Message(playerInfo.playerName, playerInfo.playerId, msg));
            }  
        },
        componentWillMount:function() {
            this.props.socket.on('sendMessage', function(msg)  {
                var messages = this.state.messages;
                messages.push(msg);
                Log.d(TAG, 'sendMessage: %O', msg);
                this.setState({'messages': messages});
            }.bind(this));
        },
        componentDidMount:function() {
            $(".nano").nanoScroller();
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
                React.createElement("form", {className: "chat-box", onSubmit: this.handleSubmit}, 
                    React.createElement("div", {className: "message-content nano", style: {background: 'rgba(0, 0, 0, ' + this.state.baseAlpha + ')'}}, 
                        React.createElement("div", {className: "nano-content message-container"}, 
                            msgViews
                        )
                    ), 
                    React.createElement("input", {className: "message-box", ref: "msgbox", style: {background: 'rgba(0, 0, 0, ' + (this.state.baseAlpha * 0.8) + ')'}}
                    )
                )
            );
        }
    });


    // $formSearch.submit((e) => {
    //     if (e.preventDefault) e.preventDefault();

    //     var data = $('#search-form :input').serializeArray();
    //     var term = data[0].value;

    //     const escapedInput = regExpEscape(term.trim());
    //     const lowercasedInput = term.trim().toLowerCase();

    //     loadData(function() {
    //         var found = false;
    //         championData.filter(function(element, index, array) {
    //             if (element.champion.toLowerCase() === lowercasedInput) {
    //                 window.location.href = '/champion/index.html?id=' + element.champion;
    //                 found = true;
    //             }
    //         });

    //         if (!found) {
    //             //window.location.href = '/summoner/index.html?search=' + escapedInput;
    //         }
    //     });


    //     // You must return false to prevent the default form behavior
    //     return false;
    // });

    return ChatBox;
});