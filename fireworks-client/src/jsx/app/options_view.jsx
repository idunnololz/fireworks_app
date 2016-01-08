define(['jquery', 'React', 'app/log', 'app/prefs'], function ($, React, Log, Prefs) {
    
    const TAG = 'OptionsView';

    var OptionsView = React.createClass({
        getInitialState() {
            return {
                prefs: {
                    chat_bg_alpha: 0.5,
                    b$realistic_card_order: false,
                    animation_speed: 1,
                },
                dirty: new Set()
            };
        },
        componentWillMount() {
            var p = this.state.prefs;
            $.extend(p, Prefs.prefs);
                Log.d(TAG, "prefs: %O", Prefs.prefs);
            this.setState({prefs: p});
        },
        componentDidUpdate() {
        },
        handleSubmit(e) {
            if (e.preventDefault) e.preventDefault();
        },
        handleRangeChange(key, e) {
            this.state.dirty.add(key);
            this.state.prefs[key] = e.target.value / 100;
            this.setState();
        },
        handleCheckChange(key, e) {
            Log.d(TAG, e.target.checked);
            this.state.dirty.add(key);
            this.state.prefs[key] = e.target.checked;
            this.setState();
        },
        handleCheckChangeFixedValue(key, vals, e) {
            // assigns true and false to two different values, changing the preference to vals[0] on #t, vals[1] on #f
            this.state.dirty.add(key);
            this.state.prefs[key] = vals[e.target.checked ? 0 : 1];
            this.setState();
        },
        onOkClick(e) {
            // commit changes...
            var prefs = this.state.prefs;
            this.state.dirty.forEach((key)=> {
                Prefs.set(key, prefs[key]);
            });

            this.props.onOkClickHandler();
        },
        render() {
            var prefs = this.state.prefs;
            return (
                <form className="options-view" onSubmit={this.handleSubmit}>
                    <h1>Options</h1>
                    <h2>Basic Options</h2>
                    <h3>Message box opacity</h3>
                    <input 
                        type="range" value={prefs['chat_bg_alpha'] * 100} 
                        min="0" max="100" onChange={this.handleRangeChange.bind(this, 'chat_bg_alpha')}/>
                    <div className="option-item">
                        <input 
                            id="c1"
                            type="checkbox" 
                            name="order" 
                            checked={prefs['b$realistic_card_order']}
                            onChange={this.handleCheckChange.bind(this, 'b$realistic_card_order')}/>
                        <label htmlFor="c1"><span></span></label>
                        <p>
                            <b>Use &#39;realistic card ordering&#39;.</b> When enabled, all cards in other player&#39;s hands will be ordered 
                            as in real life. That is, their right most card will be seen by you as the left most and vise versa.
                        </p>
                    </div>
                    <h2>Veteran Options</h2>
                    <div className="option-item">
                        <input 
                            id="c2"
                            type="checkbox" 
                            checked={prefs[Prefs.KEY_ANIMATION_SPEED] !== 1}
                            onChange={this.handleCheckChangeFixedValue.bind(this, Prefs.KEY_ANIMATION_SPEED, [0.5, 1])}/>
                        <label htmlFor="c2"><span></span></label>
                        <p>
                            <b>Speed up animations.</b> When enabled, game animations will play at 2x speed.
                        </p>
                    </div>
                    <div className="options-container">
                        <button className="theme-button" onClick={this.props.onCancelClickHandler}>Cancel</button>
                        <button className="theme-button" onClick={this.onOkClick}>Ok</button>
                    </div>
                </form>
            );
        }
    });

    return OptionsView;
});