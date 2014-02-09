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
			ajax(u);
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

		api.resume(o.meta);

		return api;
	};

})();
