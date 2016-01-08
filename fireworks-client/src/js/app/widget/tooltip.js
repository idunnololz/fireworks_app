define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var Tooltip = React.createClass({displayName: "Tooltip",
        getInitialState:function() {
            return {};
        },
        show:function(component) {
            var $tooltip = $('.tooltip-container');
            var $elem = $(React.findDOMNode(component));

            var marginTop = ($elem.outerHeight() - $tooltip.outerHeight()) / 2;

            var newY = Math.round(parseInt($elem.css('marginTop'), 10) + $elem.position().top + marginTop);

            if ($tooltip.css('visibility') === 'hidden') {
                TweenLite.set($tooltip, {x:-$tooltip.outerWidth(), y:newY});
                TweenLite.to($tooltip, 0.3, {autoAlpha: 1});
            } else {
                TweenLite.to($tooltip, 0.3, {autoAlpha: 1, x:-$tooltip.outerWidth(), y:newY});
            }   
        },
        hide:function() {
            var $tooltip = $('.tooltip-container');
            if ($tooltip.css('visibility') === 'hidden') {
                // do nothing...
            } else {
                TweenLite.to($tooltip, 0.3, {autoAlpha: 0});
            }   
        },
        setText:function(t) {
            $('.text').text(t);
        },
        render:function() {
            return (
                React.createElement("div", {className: "tooltip-container", style: {visibility: 'hidden'}}, 
                    React.createElement("div", {className: "tooltip"}, 
                        React.createElement("div", {className: "error"}), 
                        React.createElement("p", {className: "text"}, "This is a tooltip.")
                    ), 

                    React.createElement("div", {className: "arrow-right"}
                    )
                )         
            );
        }
    });

    return Tooltip;
});