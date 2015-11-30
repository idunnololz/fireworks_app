define(['jquery', 'React', 'libs/tooltip'], function ($, React, ToolTip) {

    var animating = false;

    var MenuBar = React.createClass({
        getInitialState() {
            return {
            };
        },
        componentDidMount() {
            var $menuBarContainer = $('.menu-bar-container');
            if (!$menuBarContainer.tooltip('instance')) {
                $menuBarContainer.tooltip({
                    position: {my: "right-10", at: "left"}
                });

                // $(this.refs.info.getDOMNode()).tooltip({
                //     position: {my: "right-10", at: "left"},
                //     content: "Show hinted"
                // });
            }

            var img = new Image();
            img.src = 'res/ic_hide_hints.png';
            var img2 = new Image();
            img2.src = 'res/ic_info.png';
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
            if (animating) return;

            var ic = $(this.refs.infoImg.getDOMNode());
            var icContainer = $(this.refs.info.getDOMNode());
            var remove = ic.hasClass('hide-hints');

            animating = true;

            var completeHandler = () => {
                if (remove) {
                    ic.removeClass('hide-hints');
                    //icContainer.tooltip("option", "content", "Show hinted");
                } else {
                    ic.addClass('hide-hints');
                    //icContainer.tooltip("option", "content", "Hide hinted");
                }
                TweenLite.to(ic, 0.15, {rotationY:'+=90'});
                TweenLite.to(ic, 0.15, {scale: 1, delay: 0.15, onComplete: () => {
                    animating = false;
                }});
            };
            TweenLite.to(ic, 0.15, {scale: 1.2});
            TweenLite.to(ic, 0.15, {rotationY:'+=90', onComplete: completeHandler, delay: 0.15});

            var manager = this.props.manager;

            if (remove) {
                manager.hideAllHinted();
            } else {
                manager.showAllHinted();
            }
        },
        render() {
            return (
                <div className="menu-bar-container">
                    <div className="menu-bar">
                        <a className="item" href="javascript:;" ref="delete" onClick={this.onShowDiscardsClick} title="Discards">
                            <img src="res/ic_delete.png"></img>
                        </a>
                        <a className="item" href="javascript:;" ref="history" onClick={this.props.onHistoryClick} title="History">
                            <img src="res/ic_history.png"></img>
                        </a>
                        <a className="item" href="javascript:;" ref="info" onClick={this.onShowMyHintedClick} title="Toggle hints">
                            <div className="show-hints hide-hints" ref="infoImg"></div>
                        </a>
                    </div>
                </div>
            );
        }
    });

    return MenuBar;
});