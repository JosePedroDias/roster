(function() {

    var ajax = function(uri, cb) {
        if (!cb) { cb = function() {}; }
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('POST', uri, true);
        var cbInner = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                return cb(null, JSON.parse(xhr.response));
            }
            cb('error requesting ' + uri);
        };
        xhr.onload  = cbInner;
        xhr.onerror = cbInner;
        xhr.send(null);
    };



    window.roster = function(o) {
        var api = {};
        var onEnter  = o.onEnter;
        var onChange = o.onChange;
        var onLeave  = o.onLeave;

        var uri = [
            'http://',
            o.domain,
            ':',
            o.port || 4444
        ].join('');

        api.all = function(cb) {
            ajax(uri + '/', cb);
        };

        api.ping = function(meta) {
            var u = uri + '/ping';
            if (meta) {
                u = [u, '?meta=', encodeURIComponent( JSON.stringify(meta) )].join('');
            }
            ajax(u, api._process);
        };

        api.leave = function() {
            if (this.timer) {
                clearTimeout(this.timer);
                delete this.timer;
            }

            ajax(uri + '/leave');   
        };

        api.resume = function(meta) {
            this.ping(meta);

            if (this.timer) { return; }

            this.timer = setInterval(
                function() {
                    api.ping();
                },
                o.interval || 30000
            );
        };

        api._others = {};

        api._process = function(err, newState) {
            var name, o, O, others = {};
            for (var i = 0, f = newState.length; i < f; ++i) {
                o = newState[i];
                name = (o.meta && o.meta.name) ? o.meta.name : o.uid;
                others[name] = o;
                O = api._others[name];
                if (O) {
                    if (!o.meta && !O.meta) {}
                    else if ( (!o.meta && O.meta) ||
                              (!O.meta && o.meta) ||
                              (o.meta.toString() !== O.meta.toString()) ) {
                        if (onChange) {
                            onChange(o);
                        }
                    }
                    delete api._others[name];
                }
                else {
                    if (onEnter) {
                        onEnter(o);
                    }
                }
            }
            for (name in api._others) {
                if (onLeave) {
                    onLeave(api._others[name]);
                }
            }
            api._others = others;
        };

        api.others = function() {
            return Object.keys(this._others);
        },

        api.get = function(name) {
            return this._others[name];
        },

        api.resume(o.meta);

        return api;
    };

})();
