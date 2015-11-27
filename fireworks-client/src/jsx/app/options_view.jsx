define(['jquery', 'React', 'app/log', 'app/prefs'], function ($, React, Log, Prefs) {
    
    const TAG = 'OptionsView';

    var OptionsView = React.createClass({
        getInitialState() {
            return {
                prefs: {
                    chat_bg_alpha: 0.5,
                },
                dirty: new Set()
            };
        },
        componentWillMount() {
            var p = this.state.prefs;
            $.extend(p, Prefs.prefs);
            this.setState({prefs: p});
        },
        componentDidUpdate() {
        },
        handleRangeChange(key, e) {
            this.state.dirty.add(key);
            this.state.prefs[key] = e.target.value / 100;
            this.setState();
        },
        onOkClick(e) {
            // commit changes...
            var prefs = this.state.prefs;
            for (var key of this.state.dirty) {
                Prefs.set(key, prefs[key]);
            }

            this.props.onOkClickHandler();
        },
        render() {
            var prefs = this.state.prefs;
            return (
                <div className="options-view">
                    <h1>Options</h1>
                    <h2>Basic Options</h2>
                    <h3>Message box opacity</h3>
                    <input type="range" value={prefs['chat_bg_alpha'] * 100} min="0" max="100" onChange={this.handleRangeChange.bind(this, 'chat_bg_alpha')}/>
                    <h2>Veteran Options</h2>
                    <div className="options-container">
                        <button className="theme-button" onClick={this.props.onCancelClickHandler}>Cancel</button>
                        <button className="theme-button" onClick={this.onOkClick}>Ok</button>
                    </div>
                </div>
            );
        }
    });

    return OptionsView;
});