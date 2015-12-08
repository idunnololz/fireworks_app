define(['app/consts'], function(Consts) {
    return {
        d: function()  {
            if (!Consts.PROD) {
                var params = Array.prototype.slice.call(arguments);
                var tag = params.shift();
                params[0] = "[" + tag + "] " + params[0];
                console.log.apply(console, params);
            }
        },
        w: function()  {
            var params = Array.prototype.slice.call(arguments);
            var tag = params.shift();
            params[0] = "[" + tag + "] " + params[0];
            console.warn.apply(console, params);
        },
        e: function()  {
            var params = Array.prototype.slice.call(arguments);
            var tag = params.shift();
            params[0] = "[" + tag + "] " + params[0];
            console.error.apply(console, params);
        }
    }
});