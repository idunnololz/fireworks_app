define(['jquery', 'React'], function ($, React) {
    var AboutView = React.createClass({
        getInitialState() {
            return {
            };
        },
        componentDidUpdate() {
            $(".nano").nanoScroller();
        },
        render() {
            return (
                <div className="about-view">
                    <h1>About</h1>
                    <p>
                        Fireworks the game.
                    </p>
                    <p>
                        Version 0.1.0. Open alpha.
                    </p>
                    <p>
                        Game created by Gary Guo.
                    </p>
                    <div className="options-container">
                        <button className="theme-button" onClick={this.props.onOkClickHandler}>Ok</button>
                    </div>
                </div>
            );
        }
    });

    return AboutView;
});