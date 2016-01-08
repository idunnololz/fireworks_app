define(['jquery', 'React', 'app/log', 'app/prefs'], function ($, React, Log, Prefs) {
    
    const TAG = 'OptionsView';

    var OptionsView = React.createClass({displayName: "OptionsView",
        getInitialState:function() {
            return {
                prefs: {
                    chat_bg_alpha: 0.5,
                    b$realistic_card_order: false,
                    animation_speed: 1,
                },
                dirty: new Set()
            };
        },
        componentWillMount:function() {
            var p = this.state.prefs;
            $.extend(p, Prefs.prefs);
                Log.d(TAG, "prefs: %O", Prefs.prefs);
            this.setState({prefs: p});
        },
        componentDidUpdate:function() {
        },
        handleSubmit:function(e) {
            if (e.preventDefault) e.preventDefault();
        },
        handleRangeChange:function(key, e) {
            this.state.dirty.add(key);
            this.state.prefs[key] = e.target.value / 100;
            this.setState();
        },
        handleCheckChange:function(key, e) {
            Log.d(TAG, e.target.checked);
            this.state.dirty.add(key);
            this.state.prefs[key] = e.target.checked;
            this.setState();
        },
        handleCheckChangeFixedValue:function(key, vals, e) {
            // assigns true and false to two different values, changing the preference to vals[0] on #t, vals[1] on #f
            this.state.dirty.add(key);
            this.state.prefs[key] = vals[e.target.checked ? 0 : 1];
            this.setState();
        },
        onOkClick:function(e) {
            // commit changes...
            var prefs = this.state.prefs;
            this.state.dirty.forEach(function(key) {
                Prefs.set(key, prefs[key]);
            });

            this.props.onOkClickHandler();
        },
        render:function() {
            var prefs = this.state.prefs;
            return (
                React.createElement("form", {className: "options-view", onSubmit: this.handleSubmit}, 
                    React.createElement("h1", null, "Options"), 
                    React.createElement("h2", null, "Basic Options"), 
                    React.createElement("h3", null, "Message box opacity"), 
                    React.createElement("input", {
                        type: "range", value: prefs['chat_bg_alpha'] * 100, 
                        min: "0", max: "100", onChange: this.handleRangeChange.bind(this, 'chat_bg_alpha')}), 
                    React.createElement("div", {className: "option-item"}, 
                        React.createElement("input", {
                            id: "c1", 
                            type: "checkbox", 
                            name: "order", 
                            checked: prefs['b$realistic_card_order'], 
                            onChange: this.handleCheckChange.bind(this, 'b$realistic_card_order')}), 
                        React.createElement("label", {htmlFor: "c1"}, React.createElement("span", null)), 
                        React.createElement("p", null, 
                            React.createElement("b", null, "Use 'realistic card ordering'."), " When enabled, all cards in other player's hands will be ordered" + ' ' + 
                            "as in real life. That is, their right most card will be seen by you as the left most and vise versa."
                        )
                    ), 
                    React.createElement("h2", null, "Veteran Options"), 
                    React.createElement("div", {className: "option-item"}, 
                        React.createElement("input", {
                            id: "c2", 
                            type: "checkbox", 
                            checked: prefs[Prefs.KEY_ANIMATION_SPEED] !== 1, 
                            onChange: this.handleCheckChangeFixedValue.bind(this, Prefs.KEY_ANIMATION_SPEED, [0.5, 1])}), 
                        React.createElement("label", {htmlFor: "c2"}, React.createElement("span", null)), 
                        React.createElement("p", null, 
                            React.createElement("b", null, "Speed up animations."), " When enabled, game animations will play at 2x speed."
                        )
                    ), 
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