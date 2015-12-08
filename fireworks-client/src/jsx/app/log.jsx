define(['app/consts'], function(Consts) {
    return {
        d: () => {
            if (!Consts.PROD) {
                var params = Array.prototype.slice.call(arguments);
                var tag = params.shift();
                params[0] = "[" + tag + "] " + params[0];
                console.log.apply(console, params);
            }
        },
        w: () => {
            var params = Array.prototype.slice.call(arguments);
            var tag = params.shift();
            params[0] = "[" + tag + "] " + params[0];
            console.warn.apply(console, params);
        },
        e: () => {
            var params = Array.prototype.slice.call(arguments);
            var tag = params.shift();
            params[0] = "[" + tag + "] " + params[0];
            console.error.apply(console, params);
        }
    }
});