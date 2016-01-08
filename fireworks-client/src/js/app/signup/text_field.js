define(['app/consts', 'jquery', 'React', 'app/log'], function (Consts, $, React, Log) {

    const TAG = "TextField";

    var TextField = React.createClass({displayName: "TextField",
        getInitialState:function() {
            return {
                value: "",
                expanded: true,
            };
        },
        onFocus:function(e) {
            if (this.state.expanded) {
                var $hint = $(React.findDOMNode(this.refs.hint));
                TweenLite.set($hint, {transformOrigin:"0% 0%"}); 
                TweenLite.to($hint, 0.3, {autoAlpha: 0.7, scale: 0.7, y: -$hint.outerHeight() * 0.6, ease: Power1.easeInOut});
                this.setState({expanded: false});
            }
        },
        onBlur:function(e) {
            if (this.state.value.length === 0) {
                var $hint = $(React.findDOMNode(this.refs.hint));
                TweenLite.to($hint, 0.3, {autoAlpha: 1, scale: 1, y: 0, ease: Power1.easeInOut});
                this.setState({expanded: true});
            }1
        },
        handleChange:function(event) {
            this.setState({value: event.target.value});
        },
        getValue:function() {
            return this.state.value;
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