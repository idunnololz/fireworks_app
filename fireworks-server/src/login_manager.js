var pg = require('pg');
var crypto = require('crypto');

export default class LoginManager {
    constructor() {
    }

    connect() {
    }

    authenticate(userName, password, onAuthenticated) {
        if (process.env.DATABASE_URL === undefined) {
            var Secret = require('./secret');
            process.env.DATABASE_URL = Secret.url;
        }
        pg.connect(process.env.DATABASE_URL, function(err, client, done) {
            if(err) {
                return console.error('error fetching client from pool', err);
            }
            client.query("SELECT * FROM admin WHERE username='idunnololz'", (err, result) => {
                done();
                if (err !== null) {
                    console.log("Error while trying to authenticate: " + err);
                    return;
                }
                var rows = result.rows;
                if (rows.length !== 1) onAuthenticated(false);

                var salt = rows[0].salt;
                var pass = rows[0].pass;

                var hash = crypto.createHash('sha256').update(salt + password).digest('base64');

                onAuthenticated(hash === pass);
            })
        });
    }

    end() {
    }
}