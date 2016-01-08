define(['jquery', 'React', 'app/log'], function ($, React, Log) {
    var ReactTransitionGroup = React.addons.CSSTransitionGroup;

    const TAG = 'TopBar';

    var TopBar = React.createClass({
        getInitialState() {
            return {
                showPlayerMenu: false,
            };
        },        
        componentDidUpdate(prevProps, prevState) {
            if (this.state.showPlayerMenu) {
                document.addEventListener('click', this.handleClickOutside, false);
            } else {
                document.removeEventListener('click', this.handleClickOutside, false);
            }
        },
        componentWillUnmount(){
            document.removeEventListener('click', this.handleClickOutside, false);
        },
        handleClickOutside(e) {
            if (React.findDOMNode(this.refs.playerMenu).contains(e.target)) {
                return;
            }
            this.close();
        },
        onPlayerInfoClick() {
            if (this.state.showPlayerMenu) return;

            var $playerMenu = $('.player-menu');
            var $playerButton = $('.player-button');


            var offset = $playerButton.offset();
            TweenLite.set($playerMenu, {top: offset.top + $playerButton.height(), right: 0});
            TweenLite.to($playerMenu, 0.3, {autoAlpha: 1});
            this.setState({showPlayerMenu: true});
        },
        close() {
            if (!this.state.showPlayerMenu) return;
            var $playerMenu = $('.player-menu');
            TweenLite.to($playerMenu, 0.3, {autoAlpha: 0});
            this.setState({showPlayerMenu: false});
        },
        render() {
            Log.d(TAG, "PlayerInfo: %O", this.props.playerInfo);
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
                    <div className="vertical-divider"></div>
                    <div className="vertical-spacer"></div>
                    <button className="player-button menu-button" 
                        onClick={this.onPlayerInfoClick}>{this.props.playerInfo.playerName}</button>

                    <div className="player-menu" style={{visibility: 'hidden'}} ref="playerMenu">
                        <button className="submenu-button" onClick={this.props.onLogoutClickHandler}>Log out</button>                    
                    </div>
                </div>
            );
        }
    });

    return TopBar;
});