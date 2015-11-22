define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var RoomItem = React.createClass({
        render() {
            var styles = this.props.styles;
            var room = this.props.room;        

            return (
                <div className={"list-item selectable"} onClick={this.props.onClick}>
                    <div className="col" style={styles[0]}>{room.gameId}</div>
                    <div className="resizable-spacer"></div>
                    <div className="col" style={styles[1]}>{room.gameName}</div>
                    <div className="resizable-spacer"></div>
                    <div className="col" style={styles[2]}>{room.numPlayers + "/" + room.maxPlayers}</div>
                    <div className="resizable-spacer"></div>
                    <div className="col" style={styles[3]}>{room.status}</div>
                </div>
            );
        }
    });

    var RoomsList = React.createClass({
        getInitialState() {
            return {
                sizeRatio: [5, 75, 10, 10]
            };
        },
        componentDidMount() {
            $(".nano").nanoScroller();
            this.handleResizable();
        },
        componentDidUpdate() {
            $(".nano").nanoScroller();
            this.handleResizable();
        },
        onItemClick(gameId, e) {
            this.props.onRoomSelected(gameId);
        },
        handleResizable() {
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
        render() {
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
                    <RoomItem
                        styles={styles}
                        room={val}
                        index={i}
                        onClick={this.onItemClick.bind(this, val.gameId)}
                        />
                );
            }

            return (
                <div className="rooms-list">
                    <div className="list-header ">
                        <div className="list-item">
                            <div className="sortable col" style={styles[0]}>ID</div>
                            <div className="resizable" data-index="0"></div>
                            <div className="sortable col" style={styles[1]}>Room name</div>
                            <div className="resizable" data-index="1"></div>
                            <div className="sortable col" style={styles[2]}>Players</div>
                            <div className="resizable" data-index="2"></div>
                            <div className="sortable col" style={styles[3]}>Status</div>
                        </div>
                    </div>
                    <div className="list-body nano">
                        <div className="nano-content">
                            {roomItems}
                        </div>
                    </div>
                </div>
            );
        }
    });

    return RoomsList;
});