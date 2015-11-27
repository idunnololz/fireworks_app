define(['jquery', 'React'], function ($, React) {
    var AboutView = React.createClass({displayName: "AboutView",
        getInitialState:function() {
            return {
            };
        },
        componentDidUpdate:function() {
            $(".nano").nanoScroller();
        },
        render:function() {
            return (
                React.createElement("div", {className: "about-view"}, 
                    React.createElement("h1", null, "About"), 
                    React.createElement("p", null, 
                        "Fireworks the game."
                    ), 
                    React.createElement("p", null, 
                        "Version 0.1.0. Open alpha."
                    ), 
                    React.createElement("p", null, 
                        "Game created by Gary Guo."
                    ), 
                    React.createElement("div", {className: "options-container"}, 
                        React.createElement("button", {className: "theme-button", onClick: this.props.onOkClickHandler}, "Ok")
                    )
                )
            );
        }
    });

    return AboutView;
});