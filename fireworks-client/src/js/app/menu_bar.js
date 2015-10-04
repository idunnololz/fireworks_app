define(['jquery', 'React'], function ($, React) {
    var MenuBar = React.createClass({displayName: "MenuBar",
        getInitialState:function() {
            return {
            };
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
        render:function() {
            return (
                React.createElement("div", {className: "menu-bar-container"}, 
                    React.createElement("div", {className: "menu-bar"}, 
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "delete", onClick: this.onShowDiscardsClick}, 
                            React.createElement("img", {src: "res/ic_delete.png"})
                        ), 
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "history"}, 
                            React.createElement("img", {src: "res/ic_history.png"})
                        ), 
                        React.createElement("a", {className: "item", href: "javascript:;", ref: "info"}, 
                            React.createElement("img", {src: "res/ic_info.png"})
                        )
                    )
                )
            );
        }
    });

    return MenuBar;
});