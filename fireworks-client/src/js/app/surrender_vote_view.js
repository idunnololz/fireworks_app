define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = 'SurrenderVoteView';

    var SurrenderVoteView = React.createClass({displayName: "SurrenderVoteView",
        getInitialState:function() {
            return {
                px: 0,
                py: 0,
                dragging: false,
                choice: "",
                enableVote: false,
            };
        },
        componentWillMount:function() {
            var pos = this.props.getStartPosition({width: 450, height: 200});
            this.setState({px: pos.left, py: pos.top, enableVote: this.props.allowPlayerToVote});
            Log.d(TAG, "Mounted.");
        },
        componentDidMount:function() {
            TweenLite.lagSmoothing(0);
            TweenLite.to(".progress-bar", 59, {width: 0, ease: Power0.easeNone, onComplete: function()  {
                this.props.onClose();
            }.bind(this)});
        },
        componentDidUpdate:function() {
            if (this.props.surrenderVotes.length === this.props.surrenderPlayers) {
                // vote is done... dismiss dialog in 5 seconds...
                setTimeout(function()  {
                    this.props.onClose();
                }.bind(this), 5000);
            }
        },
        // calculate relative position to the mouse and set dragging=true
        onMouseDown:function(e) {
            // only left mouse button
            if (e.button !== 0) return;
            var pos = $(this.getDOMNode()).offset();
            Log.d(TAG, "pos: %O", pos);
            this.setState({
                dragging: true,
                rel: {
                    x: e.pageX - pos.left,
                    y: e.pageY - pos.top
                }
            });
            e.stopPropagation();
            e.preventDefault();
        },
        onMouseUp:function(e) {
            this.setState({dragging: false});
            e.stopPropagation();
            e.preventDefault();
        },
        onMouseMove:function(e) {
            if (!this.state.dragging) return;
            this.setState({
                px: e.pageX - this.state.rel.x,
                py: e.pageY - this.state.rel.y
            });
            e.stopPropagation();
            e.preventDefault();
        },
        hideOptions:function() {
            $(".theme-button").prop("disabled", true);
            TweenLite.to(".options-container", 0.3, {height: 0, opacity: 0});
            TweenLite.to(".your-choice", 0.3, {autoalpha: 1, display:'block', height: '1vh', onComplete: function()  {
                //this.setState({enableVote: false});    
            }});
        },
        onNoClick:function() {
            this.setState({choice: "You voted no."});
            this.hideOptions();
            this.props.onNoClickHandler();
        },
        onYesClick:function() {
            this.setState({choice: "You voted yes."});
            this.hideOptions();
            this.props.onYesClickHandler();
        },
        render:function() {
            var px = this.state.px;
            var py = this.state.py;
            var votes = this.props.surrenderVotes;
            var numPlayers = this.props.surrenderPlayers;
            var enableVote = this.state.enableVote;
            var voteViews;

            voteViews = $.map(votes, function(val)  {
                return (React.createElement("div", {className: val == 1 ? "vote-yes" : "vote-no"}));
            });

            voteViews.push(
                React.createElement("div", {style: {flex: (numPlayers - votes.length) + " 0 0"}}
                )
            );

            return (
                React.createElement("div", {className: "surrender-vote-view", style: {left: px, top: py}, 
                    onMouseUp: this.onMouseUp, 
                    onMouseMove: this.onMouseMove, 
                    onMouseDown: this.onMouseDown}, 

                    React.createElement("p", null, "Surrender"), 
                    React.createElement("div", {className: "votes-container"}, voteViews), 
                    React.createElement("div", {className: "progress-bar"}), 
                    React.createElement("div", {className: enableVote ? "options-container" : "gone"}, 
                        React.createElement("button", {className: "theme-button", onClick: this.onNoClick}, "No"), 
                        React.createElement("button", {className: "theme-button", onClick: this.onYesClick}, "Yes")
                    ), 
                    React.createElement("p", {className: enableVote ? "choice-hidden your-choice" : "your-choice"}, this.state.choice)
                )
            );
        }
    });

    return SurrenderVoteView;
});