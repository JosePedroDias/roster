var http = require('http'),
    url  = require('url'),
    fs   = require('fs');



var PORT = 4444;

var rosterClientContent = fs.readFileSync('rosterClient.js').toString();
var roster = [];



var now = function() {
	return new Date().valueOf();
};

var rnd = function() {
	return Math.floor( Math.random() * 1000000 ) + '';
};

var findInArr = function(arr, key, value) {
	for (var i = 0, f = arr.length, o; i < f; ++i) {
		o = arr[i];
		if (o[key] === value) { return o; }
	}
};

var getSingleCookie = function(cookie, name) {
	if (!cookie) { return; }
	var idx = cookie.indexOf(name + '=');
	if (idx === -1) { return; }
	idx += name.length + 1;
	var idx2 = cookie.indexOf(';', idx);
	var v;
	if (idx2 === -1) {
		v = cookie.substring(idx);
	}
	else {
		v = cookie.substring(idx, idx2);
	}
	return v.trim();
};



http.createServer(function(req, resp) {
	var u = url.parse(req.url, true);

	/*console.log([
		'pathname:', u.pathname, '\n',
		'query:',    JSON.stringify(u.query), '\n\n'
	].join(''));*/

	var mimeType = 'application/json';
	var code = 200;
	var content = '';
	var cookie;
	var client;
	var meta;
	switch (u.pathname) {
		case '/':
			content = roster;
			break;

		case '/ping':
			cookie = getSingleCookie(req.headers.cookie, 'roster');
			if ('meta' in u.query) {
				meta = u.query.meta;
				try {
					meta = JSON.parse( meta );
				} catch (ex) {}
			}
			if (cookie && (client = findInArr(roster, 'uid', cookie))) {
				client.lastSeen = now();
				if (meta !== undefined) {
					client.meta = meta;
				}
				content = client;
			}
			else {
				cookie = rnd();
				client = {
					uid:       cookie,
					lastSeen:  now(),
					ip:        req.connection.remoteAddress,
					userAgent: req.headers['user-agent'],
					meta:      meta
				};
				roster.push(client);
				content = client;
			}
			break;

		case '/now':
			content = now();
			break;

		case '/leave':
			client = findInArr(roster, 'uid', getSingleCookie(req.headers.cookie, 'roster'));
			if (!client) {
				content = 'not found. ignoring leave request...';
			}
			else {
				roster.splice(roster.indexOf(client), 1);
				content = 'client left';
			}
			break;

		case '/client.js':
			mimeType = 'text/javascript';
			content = rosterClientContent;
			break;

		default:
			content = 404;
			code    = 404;
	}

	var headers = {
		'Access-Control-Allow-Origin':      req.headers.origin,// || req.headers.referer,
		'Access-Control-Allow-Credentials': 'true',
		'Content-Type':                     mimeType
	};
	if (cookie) { headers['Set-Cookie'] = 'roster=' + cookie; }
	resp.writeHead(code, headers);
	resp.end( mimeType === 'application/json' ? JSON.stringify(content) : content );
}).listen(PORT);

console.log('Running roster on port %d...', PORT);
