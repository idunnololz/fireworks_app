define(['jquery', 'React', 'libs/nano_scroller'], function ($, React) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    
        function Message(senderName, senderId, message) {"use strict";
            this.senderName = senderName;
            this.senderId = senderId;
            this.message = message;
        }
    

    var ChatBox = React.createClass({displayName: "ChatBox",
        getInitialState:function() {
            return {
                messages: []
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
                console.log(msg);
                this.setState({'messages': messages});
            }.bind(this));
        },
        componentDidMount:function() {
            $(".nano").nanoScroller();
        },
        componentDidUpdate:function() {
            $(".nano").nanoScroller();
            $(".nano").nanoScroller({ scroll: 'bottom' });
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
                    React.createElement("div", {className: "message-content nano"}, 
                        React.createElement("div", {className: "nano-content message-container"}, 
                            msgViews
                        )
                    ), 
                    React.createElement("input", {className: "message-box", ref: "msgbox"}
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