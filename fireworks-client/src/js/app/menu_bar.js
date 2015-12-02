define(['jquery', 'React', 'libs/tooltip'], function ($, React, ToolTip) {

    var animating = false;

    var MenuBar = React.createClass({displayName: "MenuBar",
        getInitialState:function() {
            return {
            };
        },
        componentDidMount:function() {
            var $menuBarContainer = $('.menu-bar-container');
            if (!$menuBarContainer.tooltip('instance')) {
                $menuBarContainer.tooltip({
                    position: {my: "right-10", at: "left"}
                });
            }

            var img = new Image();
            img.src = 'res/ic_hide_hints.png';
            var img2 = new Image();
            img2.src = 'res/ic_info.png';
        },
        getPositionOf:function(refName) {
            return $(React.findDOMNode(this.refs[refName])).offset();
        },
        getSizeOf:function(refName) {
            var $elem = $(React.findDOMNode(this.refs[refName]));
            return {width: $elem.innerWidth(), height: $elem.innerHeight()};
        },
        onShowDiscardsClick:function(e) {
            var manager = this.props.manager;
            manager.getGameBoardRef().showDiscards();
        },
        onShowMyHintedClick:function(e) {
            if (animating) return;

            var ic = $(this.refs.infoImg.getDOMNode());
            var icContainer = $(this.refs.info.getDOMNode());
            var remove = ic.hasClass('hide-hints');

            animating = true;

            var completeHandler = function()  {
                if (remove) {
                    ic.removeClass('hide-hints');
                    //icContainer.tooltip("option", "content", "Show hinted");
                } else {
                    ic.addClass('hide-hints');
                    //icContainer.tooltip("option", "content", "Hide hinted");
                }
                TweenLite.to(ic, 0.15, {rotationY:'+=90'});
                TweenLite.to(ic, 0.15, {scale: 1, delay: 0.15, onComplete: function()  {
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
        render:function() {
            return (
                React.createElement("div", {className: "menu-bar-container"}, 
                    React.createElement("div", {className: "menu-bar"}, 
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "delete", onClick: this.onShowDiscardsClick, title: "Discards"}, 
                            React.createElement("img", {src: "res/ic_delete.png"})
                        ), 
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "history", onClick: this.props.onHistoryClick, title: "History"}, 
                            React.createElement("img", {src: "res/ic_history.png"})
                        ), 
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "info", onClick: this.onShowMyHintedClick, title: "Toggle hints"}, 
                            React.createElement("div", {className: "show-hints hide-hints", ref: "infoImg"})
                        )
                    )
                )
            );
        }
    });

    return MenuBar;
});