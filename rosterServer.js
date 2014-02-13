var http = require('http'),
    url  = require('url'),
    fs   = require('fs');



// utils

var clone = function(o) {
    return JSON.parse( JSON.stringify(o) );
};

var now = function() {
    return new Date().valueOf();
};

var rnd = function() {
    return ( Math.floor( Math.random() * Math.pow(36, 12) ) ).toString(36); // 12 random [0-9a-z] characters
};

var findInArr = function(arr, key, value) {
    for (var i = 0, f = arr.length, o; i < f; ++i) {
        o = arr[i];
        if (o[key] === value) { return o; }
    }
};

var findInArrIdx = function(arr, key, value) {
    for (var i = 0, f = arr.length, o; i < f; ++i) {
        o = arr[i];
        if (o[key] === value) { return i; }
    }
    return -1;
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



var rosterServer = function(o) {
    // default options

    if (!o.httpPort) {
        o.httpPort = 4444;
    }

    if (!o.onEnter) {
        o.onEnter = function(req, o) {
            o.ip = req.connection.remoteAddress;
            o.userAgent = req.headers['user-agent'];
        };
    }

    if (!o.maxIdleTime) {
        o.maxIdleTime = 10 * 1000; // 10s
    }

    if (!o.checkIdleTime) {
        o.checkIdleTime = 6 * 1000; // 6s
    }



    var rosterClientContent = fs.readFileSync('rosterClient.js').toString();
    var roster = [];
    var nextIdleCheck = now() - 1;



    http.createServer(function(req, resp) {
        var u = url.parse(req.url, true);

        /*console.log([
            'pathname:', u.pathname, '\n',
            'query:',    JSON.stringify(u.query), '\n\n'
        ].join(''));*/

        var mimeType = 'application/json';
        var code = 200;
        var content = '';
        var cookie, client, meta, idx, t;

        t = now();

        if (t > nextIdleCheck) {
            nextIdleCheck = t + o.checkIdleTime;
            for (var i = 0, f = roster.length; i < f; ++i) {
                client = roster[i];
                if (client.lastSeen < t - o.maxIdleTime) {
                    --f;
                    roster.splice(i, 1);
                    console.log('LEAVE %s %s', client.uid, client.meta ? JSON.stringify(client.meta) : '');
                }
            }
        }

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
                idx = findInArrIdx(roster, 'uid', cookie);
                if (cookie && idx !== -1) {
                    client = roster[idx];
                    client.lastSeen = t;
                    if (meta !== undefined) {
                        client.meta = meta;
                    }
                }
                else {
                    cookie = rnd();
                    client = {
                        uid:       cookie,
                        lastSeen:  t,
                        meta:      meta
                    };
                    o.onEnter(req, client);
                    roster.push(client);
                    idx = roster.length - 1;
                    console.log('ENTER %s %s\n%s', client.uid, client.meta ? JSON.stringify(client.meta) : '', client.userAgent);
                }
                content = clone(roster);
                content.splice(idx, 1);
                break;

            case '/now':
                content = t;
                break;

            case '/leave':
                client = findInArr(roster, 'uid', getSingleCookie(req.headers.cookie, 'roster'));
                if (!client) {
                    content = {
                        error: 'not found. ignoring leave request...'
                    };
                }
                else {
                    roster.splice(roster.indexOf(client), 1);
                    content = {
                        messsage: 'client left'
                    };
                    console.log('LEAVE %s', client.uid, client.meta ? JSON.stringify(client.meta) : '');
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
    }).listen(o.httpPort);

    console.log('Running roster on port %d...', o.httpPort);
};

module.exports = rosterServer;
