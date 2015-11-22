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
                    <a className="menu-button" href="javascript:;" onClick={this.props.onNewGameClickHandler}>New Game</a>
                    <div className="vertical-divider"></div>
                    <a className="menu-button" href="javascript:;">How to Play</a>
                    <div className="vertical-divider"></div>
                    <a className="menu-button" href="javascript:;">Options</a>
                    <div className="vertical-divider"></div>
                    <a className="menu-button" href="javascript:;">About</a>
                </div>
            );
        }
    });

    return TopBar;
});