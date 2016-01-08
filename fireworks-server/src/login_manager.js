var pg = require('pg');
var crypto = require('crypto');
var async = require('async');
var rand = require('csprng');

if (process.env.DATABASE_URL === undefined) {
    var Secret = require('./secret');
    process.env.DATABASE_URL = Secret.url;
}

/*
create table admin (
        id int primary key not null,
        username varchar(64),
        pass varchar(64),
        salt varchar(64),
        email varchar(128)
);

insert into admin values (0, 'hello', 'sdf324fr32424', '2343erewr23432r', 'yoyoyoyo@yo.com');
insert into admin values (1, 'yoyo', 'sdf324fr32424', '2343erewr23432r', 'yoyo@yo.com');

create table users (
    id serial primary key,
    username varchar(64),
    pass varchar(64),
    salt varchar(64),
    email varchar(128),
    verify_hash varchar(64)
);
*/

export default class LoginManager {
    constructor() {
    }

    connect() {/* do nothing */}

    _doQuery(query, arr, onComplete) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            client.query(query, arr, (err, result) => {
                done();
                if (err !== null) {
                    console.log("Error while trying to authenticate: " + err);
                    return;
                }

                onComplete(err, result);
            })
        });
    }

    authenticate(userName, password, onAuthenticated) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            client.query("SELECT * FROM admin WHERE username=$1", [userName], (err, result) => {
                done();
                if (err !== null) {
                    console.log("Error while trying to authenticate: " + err);
                    return;
                }
                var rows = result.rows;
                if (rows.length !== 1) {
                    onAuthenticated(false);
                    return;
                }

                var salt = rows[0].salt;
                var pass = rows[0].pass;

                var hash = crypto.createHash('sha256').update(salt + password).digest('base64');

                onAuthenticated(hash === pass);
            })
        });
    }

    isNameTaken(desiredUserName, cb) {
        var l = desiredUserName.toLowerCase();
        this._doQuery("select * from users where username=$1;", [l], (err, result) => {
            cb(result.rows.length !== 0);
        });
    }

    isEmailTaken(desiredEmail, cb) {
        var l = desiredEmail.toLowerCase();
        this._doQuery("select * from users where email=$1;", [l], (err, result) => {
            cb(result.rows.length !== 0);
        });
    }

    /*
     * cb = (err, result) => {...}
     */
    signUp(username, password, email, cb) {
        async.parallel([
            (cb) => {
                this.isNameTaken(username, (b) => {
                    if (b) {
                        cb(LoginManager.ERROR_NAME_IN_USE, null);
                    } else {
                        cb(null, b);
                    }
                });
            },
            (cb) => {
                this.isEmailTaken(email, (b) => {
                    if (b) {
                        cb(LoginManager.ERROR_EMAIL_IN_USE, null);
                    } else {
                        cb(null, b);
                    }
                });
            }
        ],
        (err, results) => {
            if (err) {
                cb(err, null);
                return;
            }
            // we are good, let's make insert the entry into the table!

            // first we need to generate a salt for the user
            var salt = rand(200, 36);
            var saltedPass = crypto.createHash('sha256').update(salt + password).digest('base64');

            var l = email.toLowerCase();
            var userLower = username.toLowerCase();

            this._doQuery("insert into users(username,pass,salt,email) values ($1,$2,$3,$4)",
                [userLower, saltedPass, salt, l], (err, result) => {

                if (err) {
                    return console.error('error adding account to table', err);
                }

                cb(null, null);
            });

        });
    }

    signIn(username, password, onAuthenticated) {
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            client.query("SELECT * FROM users WHERE username=$1", [username], (err, result) => {
                done();
                if (err !== null) {
                    console.log("Error while trying to authenticate: " + err);
                    return;
                }
                var rows = result.rows;
                if (rows.length !== 1) {
                    onAuthenticated(false);
                    return;
                }

                var salt = rows[0].salt;
                var pass = rows[0].pass;

                var hash = crypto.createHash('sha256').update(salt + password).digest('base64');
                console.log(hash);
                console.log(pass);

                onAuthenticated(hash === pass);
            })
        });
    }

    verifyEmail(username, email) {
        // TODO generate verification hash and update db table
        var verifyHash = rand(200, 36);

        // generate verification email
        var transport = nodemailer.createTransport(smtpTransport({
            host: 'sub4.mail.dreamhost.com',
            port: 465,
            secure: true,
            auth: {
                user: 'messages-noreply@idunnololz.com',
                pass: 'iPZEnhKQ'
            }
        }));

        var verifyLink = 'http://fireworks.idunnololz.com/verify.html?username=' + username + '&hash=' + verifyHash;

        var mailOptions = {
            from: 'Fireworks <messages-noreply@idunnololz.com>', // sender address
            to: email, // list of receivers
            subject: 'RESPONSE REQUIRED: Please verify your email address‏', // Subject line
            text: 
                'Greetings ' + username + 
                ',\n\nPlease click the link below to verify your email address with Fireworks:\n\n' +
                verifyLink +
                '\n\nVerifying your email address ensures an extra layer of security for your account.' +
                ' We know we have the correct info on file should you need assistance with your account.' +
                'GL;HF,\nFireworks pro', // plaintext body
            html:
                'Greetings <font color="#ed3029"><b>' + username + '</b></font>' + 
                ',<br><br>Please click the link below to verify your email address with Fireworks:<br><br>' +
                '<a href="' + verifyLink + '" target="_blank"><strong>' + verifyLink + '</strong></a>' +
                '<br><br>Verifying your email address ensures an extra layer of security for your account.' +
                ' We know we have the correct info on file should you need assistance with your account.<br><br>' +
                'GL;HF,<br>Fireworks pro', // html body
        };

        // send mail with defined transport object
        transport.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
    }

    end() {/* do nothing */}
}

LoginManager.ERROR_NAME_IN_USE = 1;
LoginManager.ERROR_EMAIL_IN_USE = 2;