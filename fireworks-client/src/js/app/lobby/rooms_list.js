define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var RoomItem = React.createClass({displayName: "RoomItem",
        render:function() {
            var styles = this.props.styles;
            var room = this.props.room;        

            return (
                React.createElement("div", {className: "list-item selectable", onClick: this.props.onClick}, 
                    React.createElement("div", {className: "col", style: styles[0]}, room.gameId), 
                    React.createElement("div", {className: "resizable-spacer"}), 
                    React.createElement("div", {className: "col", style: styles[1]}, room.gameName), 
                    React.createElement("div", {className: "resizable-spacer"}), 
                    React.createElement("div", {className: "col", style: styles[2]}, room.numPlayers + "/" + room.maxPlayers), 
                    React.createElement("div", {className: "resizable-spacer"}), 
                    React.createElement("div", {className: "col", style: styles[3]}, room.status)
                )
            );
        }
    });

    var RoomsList = React.createClass({displayName: "RoomsList",
        getInitialState:function() {
            return {
                sizeRatio: [5, 75, 10, 10]
            };
        },
        componentDidMount:function() {
            $(".nano").nanoScroller();
            this.handleResizable();
        },
        componentDidUpdate:function() {
            $(".nano").nanoScroller();
            this.handleResizable();
        },
        onItemClick:function(gameId, e) {
            this.props.onRoomSelected(gameId);
        },
        handleResizable:function() {
            var $resizable = $('.resizable');
            $resizable.off('mousedown');

            var sizeRatio = this.state.sizeRatio;
            var that = this;

            $resizable.on('mousedown', function (e) {
                e.preventDefault(); // prevent selection...

                var $this = $(this);
                var index = parseInt($this.attr('data-index'));

                var tableWidth = $('.list-header').width();
                var tableLeft = $('.sortable').eq(index).position().left;
                var draggableWidth = $this.outerWidth();

                $(document).on('mouseup', function(e){
                    $(document).off('mouseup').off('mousemove');
                });
                $(document).on('mousemove', function(e){
                    var mx = e.pageX - tableLeft;
                    var newRatio = mx / (tableWidth - draggableWidth * 3) * 100;
                    if (newRatio < 5) {
                        newRatio = 5;
                    }
                    var otherNewRatio = sizeRatio[index] + sizeRatio[index + 1] - newRatio;
                    if (otherNewRatio < 5) {
                        otherNewRatio = 5;
                        newRatio = sizeRatio[index] + sizeRatio[index + 1] - otherNewRatio;
                    }
                    sizeRatio[index + 1] = otherNewRatio;
                    sizeRatio[index] = newRatio; 

                    that.setState({sizeRatio: sizeRatio});
                });
            });
        },
        render:function() {
            var styles = [];
            var ratio = this.state.sizeRatio;
            for (var i = 0; i < ratio.length; i++) {
                styles.push({
                    'flex': ratio[i] + ' 0 0'
                });
            }

            var roomItems = [];

            var rooms = this.props.rooms;
            for (var i = rooms.length - 1; i >= 0; i--) {
                var val = rooms[i];
                roomItems.push(
                    React.createElement(RoomItem, {
                        styles: styles, 
                        room: val, 
                        index: i, 
                        onClick: this.onItemClick.bind(this, val.gameId)}
                        )
                );
            }

            return (
                React.createElement("div", {className: "rooms-list"}, 
                    React.createElement("div", {className: "list-header "}, 
                        React.createElement("div", {className: "list-item"}, 
                            React.createElement("div", {className: "sortable col", style: styles[0]}, "ID"), 
                            React.createElement("div", {className: "resizable", "data-index": "0"}), 
                            React.createElement("div", {className: "sortable col", style: styles[1]}, "Room name"), 
                            React.createElement("div", {className: "resizable", "data-index": "1"}), 
                            React.createElement("div", {className: "sortable col", style: styles[2]}, "Players"), 
                            React.createElement("div", {className: "resizable", "data-index": "2"}), 
                            React.createElement("div", {className: "sortable col", style: styles[3]}, "Status")
                        )
                    ), 
                    React.createElement("div", {className: "list-body nano"}, 
                        React.createElement("div", {className: "nano-content"}, 
                            roomItems
                        )
                    )
                )
            );
        }
    });

    return RoomsList;
});