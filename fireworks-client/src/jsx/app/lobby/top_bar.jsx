define(['jquery', 'React'], function ($, React) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    var TopBar = React.createClass({
        getInitialState() {
            return {
            };
        },
        render() {
            var value = this.state.value;
            return (
                <div className="top-bar">
                    <div className="icon"></div>
                    <div className="vertical-divider"></div>
                    <button className="menu-button" onClick={this.props.onNewGameClickHandler}>New Game</button>
                    <div className="vertical-divider"></div>
                    <button className="menu-button" onClick={this.props.onHowToPlayClickHandler}>How to Play</button>
                    <div className="vertical-divider"></div>
                    <button className="menu-button" onClick={this.props.onOptionsClickHandler}>Options</button>
                    <div className="vertical-divider"></div>
                    <button className="menu-button" onClick={this.props.onAboutClickHandler}>About</button>
                </div>
            );
        }
    });

    return TopBar;
});