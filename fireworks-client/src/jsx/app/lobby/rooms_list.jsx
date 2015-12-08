define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const STATUS_WAITING = 1;
    const STATUS_PLAYING = 2;

    const TAG = 'RoomsList';

    var RoomItem = React.createClass({
        render() {
            var styles = this.props.styles;
            var room = this.props.room;    

            var status;
            var enterRoomText;

            switch (room.status) {
                case STATUS_WAITING:
                    status = "Waiting";
                    enterRoomText = 'Join Game';
                    break;
                case STATUS_PLAYING:
                    status = "Playing";
                    enterRoomText = 'Spectate';
                    break;
                default:
                    status = "Unknown";
                    break;
            }    

            return (
                <div className={"list-item selectable"} onClick={this.props.onClick}>
                    <div className="col" style={styles[0]}>{room.gameId}</div>
                    <div className="resizable-spacer"></div>
                    <div className="col" style={styles[1]}>{room.gameName}</div>
                    <div className="resizable-spacer"></div>
                    <div className="col" style={styles[2]}>{room.numPlayers + "/" + room.maxPlayers}</div>
                    <div className="resizable-spacer"></div>
                    <div className="col" style={styles[3]}>{status}</div>
                    <button className="join-game-button" onClick={this.props.onJoinGameClick}>{enterRoomText}</button>
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
        onJoinGameClickHandler(gameId, e) {
            this.props.onJoinGame(gameId);
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

                var tableWidth = $('.join-game-button').offset().left - $('.list-header').offset().left;
                var tableLeft = $('.sortable').eq(index).offset().left;
                var draggableWidth = $this.outerWidth();

                $(document).on('mouseup', function(e){
                    $(document).off('mouseup').off('mousemove');
                });
                $(document).on('mousemove', function(e){
                    // flex doesn't count padding so we need to account for this
                    var mx = e.pageX - tableLeft - 20;  // 20 = padding per element
                    var newRatio = mx / (tableWidth - draggableWidth * 3 - 80) * 100; // 80 = total padding (4 items * 20 padding)
                    //Log.d(TAG, "e: %O, tl: %f mx: %f new ratio: %f", e, tableLeft, mx, newRatio);
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
                        onJoinGameClick={this.onJoinGameClickHandler.bind(this, val.gameId)}
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
                            <button className="join-game-button sync-button" onClick={this.props.onRefreshClickHandler}></button>
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