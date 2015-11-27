define(['jquery', 'React', 'app/log', 'app/prefs'], function ($, React, Log, Prefs) {
    
    const TAG = 'OptionsView';

    var OptionsView = React.createClass({displayName: "OptionsView",
        getInitialState:function() {
            return {
                prefs: {
                    chat_bg_alpha: 0.5,
                },
                dirty: new Set()
            };
        },
        componentWillMount:function() {
            var p = this.state.prefs;
            $.extend(p, Prefs.prefs);
            this.setState({prefs: p});
        },
        componentDidUpdate:function() {
        },
        handleRangeChange:function(key, e) {
            this.state.dirty.add(key);
            this.state.prefs[key] = e.target.value / 100;
            this.setState();
        },
        onOkClick:function(e) {
            // commit changes...
            var prefs = this.state.prefs;
            for (var key of this.state.dirty) {
                Prefs.set(key, prefs[key]);
            }

            this.props.onOkClickHandler();
        },
        render:function() {
            var prefs = this.state.prefs;
            return (
                React.createElement("div", {className: "options-view"}, 
                    React.createElement("h1", null, "Options"), 
                    React.createElement("h2", null, "Basic Options"), 
                    React.createElement("h3", null, "Message box opacity"), 
                    React.createElement("input", {type: "range", value: prefs['chat_bg_alpha'] * 100, min: "0", max: "100", onChange: this.handleRangeChange.bind(this, 'chat_bg_alpha')}), 
                    React.createElement("h2", null, "Veteran Options"), 
                    React.createElement("div", {className: "options-container"}, 
                        React.createElement("button", {className: "theme-button", onClick: this.props.onCancelClickHandler}, "Cancel"), 
                        React.createElement("button", {className: "theme-button", onClick: this.onOkClick}, "Ok")
                    )
                )
            );
        }
    });

    return OptionsView;
});