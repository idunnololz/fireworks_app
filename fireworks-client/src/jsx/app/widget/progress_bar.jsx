define(['React'], function (React) {

    var ProgressBar = React.createClass({
        render() {
            return (
                <div className="spinner">
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                </div>
            );
        }
    });

    return ProgressBar;
});