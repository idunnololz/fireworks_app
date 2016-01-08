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

    var SignUpUi = React.createClass({displayName: "SignUpUi",
        getInitialState:function() {
            return {
                scene: SCENE_HAND_HIDDEN, //SCENE_INTRO,
                timerId: 0,
            };
        },
        componentDidMount:function() {
            setInterval(this.changeScene, SCENE_TIME);
            this.animate();
        },
        componentDidUpdate:function(prevProps, prevState) {
            if (prevState.scene !== this.state.scene) {
                Log.d(TAG, "Scene changed: " + this.state.scene);
                this.animate();
            }
        },
        shouldComponentUpdate:function(nextProps, nextState) {
            return nextState.scene !== this.state.scene;
        },
        animate:function() {
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

                    var redraw = function(img)  {
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
                    var id = setInterval(function()  {
                        var img = new Image();
                        img.src = "/res/cards/" + CardUtils.getResourceNameForCard(1 << Math.floor(Math.random() * 25));
                        img.xpos = w * Math.random() - 240; // 240 = widthOfCard * 1.5 / 2
                        img.ypos = h * Math.random() - 336;
                        img.alpha = 0;
                        img.scale = 1.5;
                        imgs.push(img);

                        img.onload = function()  {
                            var tl = new TimelineMax({onComplete:function()  {
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
                    TweenLite.to($handContainer, 0.5, {delay: halfTime, rotationY:180, onUpdateParams:["{self}"], onUpdate: function(tl)  {
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
        cleanup:function() {
            switch (this.state.scene) {
                case SCENE_CARD_DROPPING:
                    clearInterval(this.state.timerId);
                    TweenLite.ticker.removeEventListener("tick", this.state.redraw);
                    break;
            }
        },
        changeScene:function() {            
            var $content = $('.content');

            var scene = this.state.scene;

            // fade the scene out...
            TweenLite.to($content, 0.3, {opacity: 0, onComplete: function()  {
                TweenLite.set($content, {opacity: 1}); 
                this.setState({scene: (this.state.scene + 1) % NUM_SCENES});    
            }.bind(this)});

            // do cleanup
            this.cleanup(scene);
        },
        render:function() {
            var content;
            switch (this.state.scene) {
                case SCENE_INTRO:
                    content = (
                        React.createElement("div", {className: "intro-outer-container", key: "SCENE_INTRO"}, 
                            React.createElement("div", {className: "intro-inner-container"}, 
                                React.createElement("div", {className: "logo"}), 
                                React.createElement("h2", {className: "slogan"}, "A card game like no other")
                            )
                        )
                    );
                    break;
                case SCENE_CARD_STACKING:
                    content = (
                        React.createElement("div", {className: "card-stack-outer-container", key: "SCENE_CARD_STACKING"}, 
                            React.createElement("h3", {className: "caption"}, "Play cards sequentially to earn points."), 
                            React.createElement("div", {className: "card-stack-inner-container"}, 
                                React.createElement("div", {className: "c1"}), 
                                React.createElement("div", {className: "c2"})
                            )
                        )
                    );
                    break;
                case SCENE_CARD_DROPPING:
                    content = [
                        React.createElement("canvas", {className: "card-drop-canvas", ref: "cardDropCanvas", key: "SCENE_CARD_DROPPING"}
                        ),
                        React.createElement("div", {className: "card-drop-container"}, 
                            React.createElement("h3", {className: "caption"}, "Cooperate with others to win the game.")
                        )
                    ];
                    break;
                case SCENE_HAND_HIDDEN:
                    content = (
                        React.createElement("div", {className: "hand-outer-container"}, 
                            React.createElement("div", {className: "hand-inner-container"}, 
                                React.createElement("div", {className: "first card-container"}, 
                                    React.createElement("div", {className: "card back"}), 
                                    React.createElement("div", {className: "card c1"})
                                ), 
                                React.createElement("div", {className: "card-container"}, 
                                    React.createElement("div", {className: "card back"}), 
                                    React.createElement("div", {className: "card c2"})
                                ), 
                                React.createElement("div", {className: "card-container"}, 
                                    React.createElement("div", {className: "card back"}), 
                                    React.createElement("div", {className: "card c3"})
                                ), 
                                React.createElement("div", {className: "card-container"}, 
                                    React.createElement("div", {className: "card back"}), 
                                    React.createElement("div", {className: "card c4"})
                                ), 
                                React.createElement("div", {className: "card-container"}, 
                                    React.createElement("div", {className: "card back"}), 
                                    React.createElement("div", {className: "card c5"})
                                ), 

                                React.createElement("div", {className: "caption-container"}, 
                                    React.createElement("h3", {className: "caption"}, "You can see the cards of teammates...")
                                )
                            )
                        )
                    );
                    break;
            }

            return (
                React.createElement("div", {className: "sign-up-ui"}, 
                    React.createElement("div", {className: "content", ref: "content"}, 
                        content
                    ), 
                    React.createElement("div", {className: "signup-view-container"}, 
                        React.createElement(SignUpView, null)
                    )
                )
            );
        }
    });

    var gameUi = React.render(
        React.createElement(SignUpUi, null),
        $("#main")[0]
    );
});