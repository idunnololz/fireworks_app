define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var Tooltip = React.createClass({
        getInitialState() {
            return {};
        },
        show(component) {
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
        hide() {
            var $tooltip = $('.tooltip-container');
            if ($tooltip.css('visibility') === 'hidden') {
                // do nothing...
            } else {
                TweenLite.to($tooltip, 0.3, {autoAlpha: 0});
            }   
        },
        setText(t) {
            $('.text').text(t);
        },
        render() {
            return (
                <div className="tooltip-container" style={{visibility: 'hidden'}}>
                    <div className="tooltip">
                        <div className="error"/>
                        <p className="text">This is a tooltip.</p>
                    </div>

                    <div className="arrow-right">
                    </div>
                </div>         
            );
        }
    });

    return Tooltip;
});