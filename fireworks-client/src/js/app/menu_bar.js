define(['jquery', 'React', 'libs/tooltip'], function ($, React, ToolTip) {
    var MenuBar = React.createClass({displayName: "MenuBar",
        getInitialState:function() {
            return {
            };
        },
        componentDidMount:function() {
            $('.menu-bar-container').tooltip({
                position: {my: "right-10", at: "left"}
            });
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
            var manager = this.props.manager;
            manager.getThisPlayerRef().showHinted();
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
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "info", onClick: this.onShowMyHintedClick, title: "Show hinted"}, 
                            React.createElement("img", {src: "res/ic_info.png"})
                        )
                    )
                )
            );
        }
    });

    return MenuBar;
});