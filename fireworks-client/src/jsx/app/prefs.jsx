define(function() {

    if (!String.prototype.startsWith) {
        (function() {
            'use strict'; // needed to support `apply`/`call` with `undefined`/`null`
            var defineProperty = (function() {
                // IE 8 only supports `Object.defineProperty` on DOM elements
                try {
                    var object = {};
                    var $defineProperty = Object.defineProperty;
                    var result = $defineProperty(object, object, object) && $defineProperty;
                } catch(error) {}
                return result;
            }());
            var toString = {}.toString;
            var startsWith = function(search) {
                if (this == null) {
                    throw TypeError();
                }
                var string = String(this);
                if (search && toString.call(search) == '[object RegExp]') {
                    throw TypeError();
                }
                var stringLength = string.length;
                var searchString = String(search);
                var searchLength = searchString.length;
                var position = arguments.length > 1 ? arguments[1] : undefined;
                // `ToInteger`
                var pos = position ? Number(position) : 0;
                if (pos != pos) { // better `isNaN`
                    pos = 0;
                }
                var start = Math.min(Math.max(pos, 0), stringLength);
                // Avoid the `indexOf` call if no match is possible
                if (searchLength + start > stringLength) {
                    return false;
                }
                var index = -1;
                while (++index < searchLength) {
                    if (string.charCodeAt(start + index) != searchString.charCodeAt(index)) {
                        return false;
                    }
                }
                return true;
            };
            if (defineProperty) {
                defineProperty(String.prototype, 'startsWith', {
                    'value': startsWith,
                    'configurable': true,
                    'writable': true
                });
            } else {
                String.prototype.startsWith = startsWith;
            }
        }());
    }

    var Prefs = {
        KEY_ANIMATION_SPEED: 'animation_speed',
        prefs: {},
        loaded: false,
        isCookiesEnabled() {
            return navigator.cookieEnabled;
        },
        getCookie(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1);
                if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
            }
            return "";
        },
        setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        },
        deleteAllCookies() {
            var cookies = document.cookie.split(";");

            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i];
                var eqPos = cookie.indexOf("=");
                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        },
        stringStartsWith(string, prefix) {
            return string.slice(0, prefix.length) == prefix;
        },
        load() {
            this.prefs = {};
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1);
                var kv = c.split('=');
                if (kv[0].startsWith('b$')) {
                    this.prefs[kv[0]] = kv[1][0] === 't' ? true : false;
                } else {
                    this.prefs[kv[0]] = kv[1];
                }
            }
            this.loaded = true;
        },
        isLoaded() {
            return this.loaded;
        },
        get(key) {
            if (this.isLoaded) this.load();
            return this.prefs[key];
        },
        get(key, defaultVal) {
            var val = this.prefs[key];
            return val === undefined ? defaultVal : val;
        },
        set(key, val) {
            if (this.isLoaded) this.load();
            this.prefs[key] = val;
            this.setCookie(key, val, 14);   // two week expiry time...
        }
    };

    return Prefs;
});