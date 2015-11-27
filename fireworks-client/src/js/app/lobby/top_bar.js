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
                    React.createElement("button", {className: "menu-button", onClick: this.props.onNewGameClickHandler}, "New Game"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onHowToPlayClickHandler}, "How to Play"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onOptionsClickHandler}, "Options"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onAboutClickHandler}, "About")
                )
            );
        }
    });

    return TopBar;
});