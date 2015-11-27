define(['jquery', 'React'], function ($, React) {
    var $c;
    var curProgress = 0;
    var nextProgress = 0;
    var waitingProgress = -1;
    const ANIMATION_DURATION = 300.0;
    var animating = false;

    const RESOURCE_DIR = "res/";

    var ResourceLoader = React.createClass({
        getInitialState() {
            return {
            };
        },
        componentDidMount() {
            this.load(() => {
                this.props.onLoaded();
            }, (progress) => {
                this.updateProgress(progress);
            });
        },
        load(cb, progressCb) {
            function preload(arr, cb, progress) {
                var done = 0;
                var promises = [];
                for (var i = 0; i < arr.length; i++) {
                    (function(url, promise) {
                        var img = new Image();
                        img.onload = function() {
                            done++;
                            promise.resolve();
                            progress(done / arr.length);
                        };
                        img.src = url;
                    })(arr[i], promises[i] = $.Deferred());
                }
                $.when.apply($, promises).done(function() {
                    cb();
                });
            }
            var res = [];
            CardUtils.getAllCardResources().forEach((val) => {
                res.push(RESOURCE_DIR + "cards/" + val[0] + ".png");
                res.push(RESOURCE_DIR + "cards/" + val[1] + ".png");
            });
            preload(res, cb, progressCb);
        },
        updateProgress(progress) {
            if ($c === undefined) {
                $c = $('#pie-progress-bar');
                if ($c === undefined) {
                    return;
                }

                var ctx = $c[0].getContext('2d');
                var width = ctx.canvas.clientWidth;
                var height = ctx.canvas.clientHeight;
                ctx.canvas.width  = width;
                ctx.canvas.height = height;
            }

            var curTime = new Date().getTime();
            if (animating) {
                // we are already animating... ignore
                if (progress > waitingProgress) {
                    // remember we did try to update
                    waitingProgress = progress;
                    return;
                }
            }

            animating = true;
            nextProgress = progress;

            var that = this;

            function animateProgress(cp, np, t) {
                var startTime = t;
                function a() {
                    var deltaT = new Date().getTime() - startTime;

                    if (deltaT >= ANIMATION_DURATION) {
                        curProgress = np;
                        that.drawProgress(curProgress, curProgress, 0);
                        if (waitingProgress > curProgress) {
                            nextProgress = waitingProgress;
                            waitingProgress = -1;
                            animateProgress(curProgress, nextProgress   , new Date().getTime());
                        } else {
                            animating = false;
                        }
                    } else {
                        that.drawProgress(cp, np, deltaT / ANIMATION_DURATION);
                        setTimeout(a, 16);
                    }
                }
                a();
            }

            // draw the initial frame
            this.drawProgress(curProgress, nextProgress, 0);

            // kick off the animation
            animateProgress(curProgress, nextProgress, curTime);
        },
        drawProgress(curProgress, nextProgress, t) {
            // t is a time ratio, where 0 denotes the start of an animation and 1 denotes the completion...
            var ctx = $c[0].getContext('2d');
            var width = ctx.canvas.clientWidth;
            var height = ctx.canvas.clientHeight;
            
            var thickness = width * (1/8);

            var radius = (height/3 - thickness/2 - 1);
            if (radius <= 0) return;

            ctx.clearRect(0, 0, width, height);

            // font size:
            var baseFontSize = 18;
            var largeFont = Math.round(baseFontSize * 3);

            // draw text...
            ctx.globalAlpha = 0.97;
            ctx.fillStyle = "#FFFFFF";
            ctx.font='100 ' + baseFontSize + 'px Roboto';
            ctx.textAlign="center";
            ctx.fillText('Loading...', Math.round(width/2), Math.round(height/2) - (largeFont / 2));

            ctx.font='700 ' + largeFont + 'px Roboto';
            ctx.fillText(Math.round(nextProgress * 100) + '%', Math.round(width/2), Math.round(height/2) + (largeFont/2));

            ctx.lineWidth = thickness;
            ctx.strokeStyle = "#FFFFFF";
            ctx.globalAlpha = 0.05;

            ctx.beginPath();
            ctx.arc(width/2, height/2, radius, 0, 2 * Math.PI);
            ctx.stroke();

            // draw current progress...
            ctx.globalAlpha = 0.90;
            ctx.beginPath();
            ctx.arc(width/2, height/2, radius, 0, (2 * Math.PI) * curProgress);
            ctx.stroke();

            ctx.lineWidth = thickness + 10 * (1 - t);
            ctx.globalAlpha = 0.75 * t;
            ctx.beginPath();
            ctx.arc(width/2, height/2, radius + 20 * (1 - t), (2 * Math.PI) * curProgress, (2 * Math.PI) * nextProgress);
            ctx.stroke();
        },
        render() {
            return (
                <div className="load-container">
                    <canvas id="pie-progress-bar"></canvas>
                </div>
            );
        }
    });

    return ResourceLoader;
});