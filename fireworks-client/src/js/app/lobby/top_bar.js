define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var TopBar = React.createClass({displayName: "TopBar",
        getInitialState:function() {
            return {
            };
        },
        render:function() {
            var value = this.state.value;
            return (
                React.createElement("div", {className: "top-bar"}, 
                    React.createElement("div", {className: "icon"}), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("a", {className: "menu-button", href: "javascript:;", onClick: this.props.onNewGameClickHandler}, "New Game"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("a", {className: "menu-button", href: "javascript:;"}, "How to Play"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("a", {className: "menu-button", href: "javascript:;"}, "Options"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("a", {className: "menu-button", href: "javascript:;"}, "About")
                )
            );
        }
    });

    return TopBar;
});