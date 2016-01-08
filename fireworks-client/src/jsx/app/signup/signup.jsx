require(['app/consts', 'jquery', 'React', 'libs/socket.io', 'app/signup/signup_view', 'app/log'], 
    function (Consts, $, React, io, SignUpView, Log) {

    var endpoint;
    if (Consts.PROD) {
        endpoint = "https://murmuring-mountain-5923.herokuapp.com";
        //endpoint = "http://185.28.22.25:3000";
    } else {
        endpoint = "http://localhost:3000";
    }

    const TAG = "SignUp";

    const SCENE_INTRO = -1;
    const SCENE_CARD_STACKING = 0;
    const SCENE_CARD_DROPPING = 1;
    const SCENE_HAND_HIDDEN = 2;

    const NUM_SCENES = 3;

    const SCENE_TIME = 8000;

    var SignUpUi = React.createClass({
        getInitialState() {
            return {
                scene: SCENE_HAND_HIDDEN, //SCENE_INTRO,
                timerId: 0,
            };
        },
        componentDidMount() {
            setInterval(this.changeScene, SCENE_TIME);
            this.animate();
        },
        componentDidUpdate(prevProps, prevState) {
            if (prevState.scene !== this.state.scene) {
                Log.d(TAG, "Scene changed: " + this.state.scene);
                this.animate();
            }
        },
        shouldComponentUpdate(nextProps, nextState) {
            return nextState.scene !== this.state.scene;
        },
        animate() {
            switch (this.state.scene) {
                case SCENE_INTRO:
                    TweenLite.from('.logo', 1, {autoAlpha: 0});
                    TweenLite.from('.slogan', 1, {autoAlpha: 0, delay: 0.5});
                    break;
                case SCENE_CARD_STACKING:
                    var $c1 = $('.c1');
                    var $c2 = $('.c2');
                    var $caption = $('.caption');

                    TweenLite.from($c1, 0.3, {y: 1000, x: 100, delay: 0.3});
                    TweenLite.from($c2, 0.3, {y: 1000, x: 100, delay: 0.6});

                    TweenLite.to($c1, 40, {y: -300, x: -100, delay: 0.6});
                    TweenLite.to($c2, 40, {y: -200, x: -50, delay: 0.9});

                    TweenLite.from($caption, 0.3, {delay: 1.2, autoAlpha: 0, x:-$caption.outerWidth()});
                    break;
                case SCENE_CARD_DROPPING:
                    var ctx;
                    var imgs = [];
                    var w, h;
                    var canvas = React.findDOMNode(this.refs.cardDropCanvas);
                    var $content = $(React.findDOMNode(this.refs.content));
                    var canvasW, canvasH;
                    var $caption = $('.caption');

                    var redraw = (img) => {
                        ctx.clearRect(0, 0, canvasW, canvasH);
                        var len = imgs.length;
                        for (var i = 0; i < len; i++) {
                            var img = imgs[i];
                            var hw = img.width / 2;
                            var hh = img.height / 2;
                            //ctx.save();
                            ctx.translate(img.xpos, img.ypos);
                            ctx.translate(hw, hh);
                            ctx.scale(img.scale, img.scale);
                            ctx.globalAlpha = img.alpha;
                            ctx.drawImage(img, -hw, -hh);
                            ctx.setTransform(1,0,0,1,0,0); 
                        }
                    };


                    ctx = canvas.getContext("2d");
                    w = $content.outerWidth();
                    h = $content.outerHeight();
                    canvasW = ctx.canvas.width  = canvas.clientWidth ;
                    canvasH = ctx.canvas.height = canvas.clientHeight;
                    var id = setInterval(() => {
                        var img = new Image();
                        img.src = "/res/cards/" + CardUtils.getResourceNameForCard(1 << Math.floor(Math.random() * 25));
                        img.xpos = w * Math.random() - 240; // 240 = widthOfCard * 1.5 / 2
                        img.ypos = h * Math.random() - 336;
                        img.alpha = 0;
                        img.scale = 1.5;
                        imgs.push(img);

                        img.onload = () => {
                            var tl = new TimelineMax({onComplete:() => {
                                // do stuff on complete...
                                var pos = imgs.indexOf(img);
                                imgs.splice(pos, 1);
                            }});
                            TweenLite.to(img, 2, {scale: 0.4});
                            tl.to(img, 0.6, {alpha: 1})
                              .to(img, 1.4, {alpha: 0}); // animate...
                        }
                    }, 200);
                    
                    TweenLite.ticker.addEventListener("tick", redraw);
                    TweenLite.from($caption, 0.3, {delay: 1, autoAlpha: 0});

                    this.setState({timerId: id, redraw: redraw});
                    break;
                case SCENE_HAND_HIDDEN:
                    var fliped = false;
                    var $handContainer = $(".hand-inner-container");
                    var $captionContainer = $('.caption-container');
                    var $caption = $('.caption');

                    var halfTime = SCENE_TIME/2000;

                    TweenLite.from($handContainer, 0.3, {autoAlpha: 0});
                    TweenLite.to($handContainer, 0.5, {delay: halfTime, rotationY:180, onUpdateParams:["{self}"], onUpdate: (tl) => {
                        var y = $handContainer.prop('_gsTransform').rotationY;
                        if (y >= 90 && !fliped) {
                            fliped = true;
                            TweenLite.set('.back', {'z-index': 1});
                            TweenLite.set($captionContainer, {rotationY: 180, 'z-index': 1});
                            $caption.text("But you cannot see your own cards.");
                        }
                    }});
                    break;
            }
        },
        cleanup() {
            switch (this.state.scene) {
                case SCENE_CARD_DROPPING:
                    clearInterval(this.state.timerId);
                    TweenLite.ticker.removeEventListener("tick", this.state.redraw);
                    break;
            }
        },
        changeScene() {            
            var $content = $('.content');

            var scene = this.state.scene;

            // fade the scene out...
            TweenLite.to($content, 0.3, {opacity: 0, onComplete: () => {
                TweenLite.set($content, {opacity: 1}); 
                this.setState({scene: (this.state.scene + 1) % NUM_SCENES});    
            }});

            // do cleanup
            this.cleanup(scene);
        },
        render() {
            var content;
            switch (this.state.scene) {
                case SCENE_INTRO:
                    content = (
                        <div className="intro-outer-container" key="SCENE_INTRO">
                            <div className="intro-inner-container">
                                <div className="logo"/>
                                <h2 className="slogan">A card game like no other</h2>
                            </div>
                        </div>
                    );
                    break;
                case SCENE_CARD_STACKING:
                    content = (
                        <div className="card-stack-outer-container" key="SCENE_CARD_STACKING">
                            <h3 className="caption">Play cards sequentially to earn points.</h3>
                            <div className="card-stack-inner-container">
                                <div className="c1"/>
                                <div className="c2"/>
                            </div>
                        </div>
                    );
                    break;
                case SCENE_CARD_DROPPING:
                    content = [
                        <canvas className="card-drop-canvas" ref="cardDropCanvas" key="SCENE_CARD_DROPPING">
                        </canvas>,
                        <div className="card-drop-container">
                            <h3 className="caption">Cooperate with others to win the game.</h3>
                        </div>
                    ];
                    break;
                case SCENE_HAND_HIDDEN:
                    content = (
                        <div className="hand-outer-container">
                            <div className="hand-inner-container">
                                <div className="first card-container">
                                    <div className="card back"/>
                                    <div className="card c1"/>
                                </div>
                                <div className="card-container">
                                    <div className="card back"/>
                                    <div className="card c2"/>
                                </div>
                                <div className="card-container">
                                    <div className="card back"/>
                                    <div className="card c3"/>
                                </div>
                                <div className="card-container">
                                    <div className="card back"/>
                                    <div className="card c4"/>
                                </div>
                                <div className="card-container">
                                    <div className="card back"/>
                                    <div className="card c5"/>
                                </div>

                                <div className="caption-container">
                                    <h3 className="caption">You can see the cards of teammates...</h3>
                                </div>
                            </div>
                        </div>
                    );
                    break;
            }

            return (
                <div className="sign-up-ui">
                    <div className="content" ref="content">
                        {content}
                    </div>
                    <div className="signup-view-container">
                        <SignUpView />
                    </div>
                </div>
            );
        }
    });

    var gameUi = React.render(
        <SignUpUi />,
        $("#main")[0]
    );
});