var championData = require('../src/res/champion.json');
championData = championData.data;

for (var k in championData) {
    var http = require('http');

    var options = {
        host: 'http://52.88.69.35:5000',
        port: '80',
        path: '/api/champion/outlier/' + championData[k].key,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    var req = http.request(options, function(res) {
        console.log("res");
    });

    // write the request parameters
    req.write('post=data&is=specified&like=this');
    req.end();

    console.log();
}