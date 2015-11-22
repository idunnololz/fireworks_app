define(['jquery', 'React', 'libs/nano_scroller'], function ($, React) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    class Message {
        constructor(senderName, senderId, message) {
            this.senderName = senderName;
            this.senderId = senderId;
            this.message = message;
        }
    }

    var ChatBox = React.createClass({
        getInitialState() {
            return {
                messages: []
            };
        },
        handleSubmit(e) {
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
        componentWillMount() {
            this.props.socket.on('sendMessage', (msg) => {
                var messages = this.state.messages;
                messages.push(msg);
                console.log(msg);
                this.setState({'messages': messages});
            });
        },
        componentDidMount() {
            $(".nano").nanoScroller();
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
                <form className="chat-box" onSubmit={this.handleSubmit}>
                    <div className="message-content nano">
                        <div className="nano-content message-container">
                            {msgViews}
                        </div>
                    </div>
                    <input className="message-box" ref="msgbox">
                    </input>
                </form>
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