define(['libs/hashes.min', 'app/consts'], function(Hashes, Consts) {
    var SHA256 =  new Hashes.SHA256;
    return {
        getSecureFromPassword(username, pass) {
            return SHA256.hex(username + 'fireworks.com' + pass);
        }
    }
});