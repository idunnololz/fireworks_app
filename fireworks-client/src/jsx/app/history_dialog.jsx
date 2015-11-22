define(['jquery', 'React'], function ($, React) {

    const EVENT_DRAW_HAND = 1;
    const EVENT_HINT = 2;
    const EVENT_DISCARD = 3;
    const EVENT_PLAY = 4;

    var HistoryItem = React.createClass({
        debugClick() {
            console.log('history item: ');
            console.log(this.props.event);
        },
        appendCard(arr, cardType) {
            var color = CardUtils.getCardColor(cardType);
            var number = CardUtils.getCardNumber(cardType);

            switch (color) {
                case CardUtils.Color.BLUE:
                    arr.push(
                        <span className="blue">{number}</span>
                    );
                    break;
                case CardUtils.Color.GREEN:
                    arr.push(
                        <span className="green">{number}</span>
                    );
                    break;
                case CardUtils.Color.RED:
                    arr.push(
                        <span className="red">{number}</span>
                    );
                    break;
                case CardUtils.Color.WHITE:
                    arr.push(
                        <span className="white">{number}</span>
                    );
                    break;
                case CardUtils.Color.YELLOW:
                    arr.push(
                        <span className="yellow">{number}</span>
                    );
                    break;
            }
        },
        render() {
            var styles = this.props.styles;
            var thisPlayerId = this.props.playerInfo.playerId;

            var manager = this.props.manager;
            var event = this.props.event;
            var eventIndex = this.props.eventIndex;
            var playerName = manager.getPlayerWithId(event.playerId).playerName;
            var actionName;
            var desc;

            switch (event.eventType) {
                case EVENT_DRAW_HAND:
                    actionName = "Draw hand";

                    // data contains the 5 cards...
                    if (event.playerId === thisPlayerId) {
                        // this is us so we don't know what we drew
                        desc = "Drew 5 cards.";
                    } else {
                        var cards = event.data;
                        desc = ["Drew "];

                        $.each(cards, (index, val) => {
                            this.appendCard(desc, val.cardType);
                            
                            if (index !== cards.length - 1) {
                                desc.push(', ');
                            } else {
                                desc.push('.');
                            }
                        });
                    }
                    break;
                case EVENT_HINT:
                    actionName = "Hint";

                    var hintType = event.data.hintType;
                    desc = [];
                    desc.push("Hinted " + manager.getPlayerWithId(event.data.target).playerName + "'s ");
                    
                    if (CardUtils.isColorHint(hintType)) {
                        var color = CardUtils.getHintColor(hintType);
                        switch (color) {
                            case CardUtils.Color.BLUE:
                                desc.push(
                                    <span className="blue">blue</span>
                                );
                                break;
                            case CardUtils.Color.GREEN:
                                desc.push(
                                    <span className="green">green</span>
                                );
                                break;
                            case CardUtils.Color.RED:
                                desc.push(
                                    <span className="red">red</span>
                                );
                                break;
                            case CardUtils.Color.WHITE:
                                desc.push(
                                    <span className="white">white</span>
                                );
                                break;
                            case CardUtils.Color.YELLOW:
                                desc.push(
                                    <span className="yellow">yellow</span>
                                );
                                break;
                        }
                        desc.push(" cards.");
                    } else {
                        desc.push(<span className="bold">{CardUtils.getHintNumber(hintType)}</span>);
                        desc.push("s.");
                    }

                    break;
                case EVENT_DISCARD:
                    desc = [];
                    actionName = "Discard";

                    var cardDiscarded = event.discarded.cardType;
                    desc.push("Discarded ");

                    this.appendCard(desc, cardDiscarded);
                    desc.push(".");
                    break;
                case EVENT_PLAY:
                    desc = [];
                    actionName = "Play";

                    var card = event.played.cardType;
                    if (event.playable) {
                        desc.push("Played ");
                    } else {
                        desc.push("Tried to play ");
                    }

                    this.appendCard(desc, card);
                    desc.push(".");
                    break;
                default:
                    actionName = "Unknown";
                    break;
            }            

            return (
                <div className={"history-item" + (eventIndex % 2 == 0 ? " even" : " odd")} onClick={this.debugClick}>
                    <div style={styles[0]}>{eventIndex}</div>
                    <div style={styles[1]}>{playerName}</div>
                    <div style={styles[2]}>{actionName}</div>
                    <div style={styles[3]}>{desc}</div>
                    <div style={styles[4]}>Show move</div>
                </div>
            );
        }
    });

    var HistoryList = React.createClass({
        getInitialState() {
            return {
                sizeRatio: [6, 24, 10, 45, 15]
            };
        },
        render() {
            var styles = [];
            var ratio = this.state.sizeRatio;
            for (var i = 0; i < ratio.length; i++) {
                styles.push({
                    'flex': ratio[i] + ' 0 0'
                });
            }
            
            var historyItems = [];

            var history = this.props.history;
            for (var i = history.length - 1; i >= 0; i--) {
                var val = history[i];
                historyItems.push(
                    <HistoryItem
                        playerInfo={this.props.playerInfo}
                        event={val}
                        eventIndex={i}
                        styles={styles}
                        manager={this.props.manager}
                        />
                );
            }

            return (
                <div className="history">
                    <div className="history-header">
                        <div className="history-item">
                            <div className="col" style={styles[0]}>#</div>
                            <div className="col" style={styles[1]}>Player</div>
                            <div className="col" style={styles[2]}>Action</div>
                            <div className="col" style={styles[3]}>Details</div>
                            <div className="col" style={styles[4]}>Show move</div>
                        </div>
                    </div>
                    <div className="history-body nano">
                        <div className="nano-content">
                            {historyItems}
                        </div>
                    </div>
                </div>
            );
        }
    });

    var HistoryDialog = React.createClass({
        render() {
            // history is this.props.history
            return (
                <div className="history-dialog">
                    <div className="header">
                        <h1>History</h1>
                    </div>
                    <HistoryList
                        history={this.props.history}
                        manager={this.props.manager}
                        playerInfo={this.props.playerInfo}
                        />
                    <a href="javascript:;" onClick={this.props.onDoneClick}>Done</a>
                </div>
            );
        }
    });

    return HistoryDialog;
});