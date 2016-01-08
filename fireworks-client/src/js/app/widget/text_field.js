define(['app/consts', 'jquery', 'React', 'app/log'], function (Consts, $, React, Log) {

    const TAG = "TextField";

    var TextField = React.createClass({displayName: "TextField",
        getInitialState:function() {
            return {
                value: "",
                expanded: true,
            };
        },
        shrinkHint:function() {
            if (this.state.expanded) {
                var $hint = $(React.findDOMNode(this.refs.hint));
                TweenLite.to($hint, 0.3, {autoAlpha: 0.7, scale: 0.7, y: Math.round(-$hint.outerHeight() * 0.6), ease: Power1.easeInOut});
                this.setState({expanded: false});
            }
        },
        expandHint:function() {
            if (!this.state.expanded && this.state.value.length === 0) {
                var $hint = $(React.findDOMNode(this.refs.hint));
                TweenLite.to($hint, 0.3, {autoAlpha: 1, scale: 1, y: 0, ease: Power1.easeInOut});
                this.setState({expanded: true});
            }
        },
        onFocus:function(e) {
            if (this.props.onFocus) {
                this.props.onFocus(e);
            }
            this.shrinkHint();
        },
        onBlur:function(e) {
            if (this.props.onBlur) {
                this.props.onBlur(e);
            }
            this.expandHint();
        },
        handleChange:function(event) {
            this.setState({value: event.target.value});
        },
        getText:function() {
            return this.state.value;
        },
        setText:function(t) {
            this.setState({value: t});

            if (t.length === 0) {
                this.expandHint();
            } else {
                this.shrinkHint();
            }
        },
        render:function() {
            return (
                React.createElement("div", {className: "text-field"}, 
                    React.createElement("div", {className: "hint-container"}, 
                        React.createElement("span", {className: "hint", ref: "hint"}, this.props.hint)
                    ), 
                    React.createElement("input", {
                        className: "input", 
                        type: this.props.type === undefined ? "text" : this.props.type, 
                        onFocus: this.onFocus, 
                        onBlur: this.onBlur, 
                        onChange: this.handleChange, 
                        value: this.state.value})
                )
            );
        }
    });

    return TextField;
});