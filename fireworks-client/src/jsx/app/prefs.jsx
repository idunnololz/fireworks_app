define(function() {
    var Prefs = {
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
        load() {
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1);
                var kv = c.split('=');
                this.prefs[kv[0]] = kv[1];
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