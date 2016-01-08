define(['app/consts', 'jquery', 'React', 'app/widget/text_field', 'app/log', 'app/secure', 'app/widget/progress_bar', 'app/widget/tooltip'], 
    function (Consts, $, React, TextField, Log, Secure, ProgressBar, Tooltip) {

    const TAG = "SignUpView";

    function isValidEmailAddress(emailAddress) {
        var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        return pattern.test(emailAddress);
    };


    const ERROR_NAME_IN_USE = 1;
    const ERROR_EMAIL_IN_USE = 2;

    var endpoint;
    if (Consts.PROD) {
        endpoint = Consts.PROD_ENDPOINT;
        //endpoint = "http://185.28.22.25:3000";
    } else {
        endpoint = "http://localhost:3000";
    }

    var SignUpView = React.createClass({displayName: "SignUpView",
        componentDidMount:function() {
            if (recaptchaLoaded) {
                grecaptcha.render('recaptcha', {hl: 'en', 'sitekey' : '6LfOBBMTAAAAAAvMvdimlPF-aAact95RrX0rQBIj', theme: 'dark'});
            } else {
                recaptchaLoadedListener = function()  {
                    grecaptcha.render('recaptcha', {
                        hl: 'en', 
                        sitekey: '6LfOBBMTAAAAAAvMvdimlPF-aAact95RrX0rQBIj', 
                        theme: 'dark'
                    });
                }
            }
        },
        showError:function(component, msg) {
            this.refs.tooltip.setText(msg);
            this.refs.tooltip.show(component);
        },
        clearError:function() {
            this.refs.tooltip.hide();
        },
        handleSubmit:function(e) {
            e.preventDefault();

            var refs = this.refs;

            var user = refs.username.getText().trim();
            var pass = refs.password.getText();
            var passConfirm = refs.passwordConfirm.getText();
            var email = refs.email.getText();
            var captcha = grecaptcha.getResponse();

            // check a few things before submitting

            // username constraint: need to be at least 4 characters long
            if (user.length < 4) {
                this.showError(refs.username, "Username must be at least 4 characters long");
                return;
            } else if (!/^[a-z0-9]+$/i.test(user)) {
                this.showError(refs.username, "Username must alphanumeric (i.e. made up of characters: a-z, A-Z, 0-9)");
                return;
            } else if (pass.length < 8) {
                this.showError(refs.password, "Password must be at least 8 characters long");
                return;
            } else if (pass !== passConfirm) {
                this.showError(refs.passwordConfirm, "Password must match");
                return;
            } else if (!isValidEmailAddress(email)) {
                this.showError(refs.email, "Invalid email");
                return;   
            } else if (Consts.PROD && captcha.length === 0) {
                this.showError(refs.recaptcha, "Please confirm you are not a robot");
                return;      
            }

            this.clearError(); 

            // show loading ui...
            var $view = $('.signup-view');
            var fliped = false;
            TweenLite.to($view, 0.3, {rotationY:180, onUpdate: function()  {
                var y = $view.prop('_gsTransform').rotationY;
                if (y >= 90 && !fliped) {
                    fliped = true;
                    TweenLite.set('.signup-back', {'z-index': 1, visibility: 'visible', rotationY: 180});
                }
            }});

            var addr = endpoint + "/register";

            // compute a few things...
            var secure = Secure.getSecureFromPassword(user, pass);

            $.post(addr, { 
                username: user, 
                password: secure,
                email: email,
            })
            .done(function(msg)  {
                Log.d(TAG, "Done: " + msg);
                TweenLite.to('.waiting-container', 0.3, {autoAlpha: 0});
                TweenLite.to('.complete-container', 0.3, {autoAlpha: 1});
            })
            .fail(function(xhr, textStatus, errorThrown)  {
                if (xhr.status === 400) {
                    var status = JSON.parse(xhr.responseText).err;
                    Log.d(TAG, "error: " + xhr.status);

                    var fliped = false;
                    TweenLite.to($view, 0.3, {rotationY: 0, onUpdate: function()  {
                        var y = $view.prop('_gsTransform').rotationY;
                        if (y <= 90 && !fliped) {
                            fliped = true;
                            TweenLite.set('.signup-back', {'z-index': -1, visibility: 'hidden'});
                        }
                    }, onComplete: function()  {
                    Log.d(TAG, "err: " + status);
                        if (status === ERROR_NAME_IN_USE) {
                            this.showError(refs.username, "An account with that username already exists");
                        } else if (status === ERROR_EMAIL_IN_USE) {
                            this.showError(refs.email, "An account is already using that email");
                        }
                    }.bind(this)});
                } else {
                    Log.d(TAG, "error[%d] " + textStatus, xhr.status);
                    // TODO handle when server down

                    TweenLite.to($view, 0.3, {rotationY: 0, onUpdate: function()  {
                        var y = $view.prop('_gsTransform').rotationY;
                        if (y <= 90 && !fliped) {
                            fliped = true;
                            TweenLite.set('.signup-back', {'z-index': -1, visibility: 'hidden'});
                        }
                    }});
                }
            }.bind(this));
        },
        render:function() {
            return (
                React.createElement("div", {className: "signup-view"}, 
                    React.createElement("div", {className: "signup-back"}, 
                        React.createElement("div", {className: "waiting-container"}, 
                            React.createElement("p", null, "One moment..."), 
                            React.createElement(ProgressBar, null)
                        ), 
                        React.createElement("div", {className: "complete-container"}, 
                            React.createElement("p", null, 
                                "Your account has been created successfully!"
                            ), 
                            React.createElement("a", {href: "/", className: "center theme-button"}, "Sign in")
                        )
                    ), 
                    React.createElement("form", {className: "signup-form", onSubmit: this.handleSubmit}, 
                        React.createElement("h1", null, "Sign Up"), 
                        React.createElement(TextField, {hint: "Username", ref: "username"}), 
                        React.createElement("div", {className: "spacer"}), 
                        React.createElement(TextField, {hint: "Password", type: "password", ref: "password"}), 
                        React.createElement("div", {className: "spacer"}), 
                        React.createElement(TextField, {hint: "Confirm Password", type: "password", ref: "passwordConfirm"}), 
                        React.createElement("div", {className: "spacer"}), 
                        React.createElement(TextField, {hint: "Email", ref: "email"}), 
                        React.createElement("div", {className: "spacer"}), 
                        React.createElement("div", {id: "recaptcha", ref: "recaptcha"}), 

                        React.createElement("div", {className: "options-container"}, 
                            React.createElement("button", {className: "theme-button"}, "Sign up")
                        ), 


                        React.createElement(Tooltip, {ref: "tooltip"})
                    )
                )
            );
        }
    });

    return SignUpView;
});