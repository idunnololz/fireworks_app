import util from 'util';

module.exports.d = function() {
    var tag = Array.prototype.shift.call(arguments);
    console.log("[" + tag + "] " + util.format.apply(null, arguments));
}

module.exports.w = function() {
    var tag = Array.prototype.shift.call(arguments);
    console.warn("[" + tag + "] " + util.format.apply(null, arguments));
}