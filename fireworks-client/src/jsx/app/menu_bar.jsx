define(['jquery', 'React'], function ($, React) {
    var MenuBar = React.createClass({
        getInitialState() {
            return {
            };
        },
        getPositionOf(refName) {
            return $(React.findDOMNode(this.refs[refName])).offset();
        },
        getSizeOf(refName) {
            var $elem = $(React.findDOMNode(this.refs[refName]));
            return {width: $elem.innerWidth(), height: $elem.innerHeight()};
        },
        onShowDiscardsClick(e) {
            var manager = this.props.manager;
            manager.getGameBoardRef().showDiscards();
        },
        onShowMyHintedClick(e) {
            var manager = this.props.manager;
            manager.getThisPlayerRef().showHinted();
        },
        render() {
            return (
                <div className="menu-bar-container">
                    <div className="menu-bar">
                        <a className="item" href="javascript:;" ref="delete" onClick={this.onShowDiscardsClick}>
                            <img src="res/ic_delete.png"></img>
                        </a>
                        <a className="item" href="javascript:;" ref="history" onClick={this.props.onHistoryClick}>
                            <img src="res/ic_history.png"></img>
                        </a>
                        <a className="item" href="javascript:;" ref="info" onClick={this.onShowMyHintedClick}>
                            <img src="res/ic_info.png"></img>
                        </a>
                    </div>
                </div>
            );
        }
    });

    return MenuBar;
});