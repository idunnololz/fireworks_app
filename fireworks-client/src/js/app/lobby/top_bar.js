define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = 'TopBar';

    var TopBar = React.createClass({displayName: "TopBar",
        getInitialState:function() {
            return {
                showPlayerMenu: false,
            };
        },        
        componentDidUpdate:function(prevProps, prevState) {
            if (this.state.showPlayerMenu) {
                document.addEventListener('click', this.handleClickOutside, false);
            } else {
                document.removeEventListener('click', this.handleClickOutside, false);
            }
        },
        componentWillUnmount:function(){
            document.removeEventListener('click', this.handleClickOutside, false);
        },
        handleClickOutside:function(e) {
            if (React.findDOMNode(this.refs.playerMenu).contains(e.target)) {
                return;
            }
            this.close();
        },
        onPlayerInfoClick:function() {
            if (this.state.showPlayerMenu) return;

            var $playerMenu = $('.player-menu');
            var $playerButton = $('.player-button');


            var offset = $playerButton.offset();
            TweenLite.set($playerMenu, {top: offset.top + $playerButton.height(), right: 0});
            TweenLite.to($playerMenu, 0.3, {autoAlpha: 1});
            this.setState({showPlayerMenu: true});
        },
        close:function() {
            if (!this.state.showPlayerMenu) return;
            var $playerMenu = $('.player-menu');
            TweenLite.to($playerMenu, 0.3, {autoAlpha: 0});
            this.setState({showPlayerMenu: false});
        },
        render:function() {
            Log.d(TAG, "PlayerInfo: %O", this.props.playerInfo);
            var value = this.state.value;
            return (
                React.createElement("div", {className: "top-bar"}, 
                    React.createElement("div", {className: "icon"}), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onNewGameClickHandler}, "New Game"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onHowToPlayClickHandler}, "How to Play"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onOptionsClickHandler}, "Options"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("button", {className: "menu-button", onClick: this.props.onAboutClickHandler}, "About"), 
                    React.createElement("div", {className: "vertical-divider"}), 
                    React.createElement("div", {className: "vertical-spacer"}), 
                    React.createElement("button", {className: "player-button menu-button", 
                        onClick: this.onPlayerInfoClick}, this.props.playerInfo.playerName), 

                    React.createElement("div", {className: "player-menu", style: {visibility: 'hidden'}, ref: "playerMenu"}, 
                        React.createElement("button", {className: "submenu-button", onClick: this.props.onLogoutClickHandler}, "Log out")
                    )
                )
            );
        }
    });

    return TopBar;
});