# ROSTER


This is the minimal roster implementation.  
It is volatile and simple.

The `/ping` calls create/update browser presence on the roster. A cookie sent by the server defines uniqueid.
Optional meta argument can be set to define browser client's properties (ex: nickname, avatar, webrtc id, email...)

The `/` call returns an array of known clients. Such calls don't update client status (so one can see the roster without taking part of it).

The `/leave` call wipes browser from the roster.

The `/now` call returns the server timestamp, so you can correct different time zone timestamps.



# compatibility

Compatibility should be the same as [peerjs](http://peerjs.com/) (beta chrome and firefox releases).

Additionally firefox now requires one to visit a domain so its cookies get stored (bummer).
If your firefox client is constantly creating new connections you must visit the domain of the roster first (once per session, FML?!).



## server HTTP interface

The server supports the following:

`/` - returns a JSON array of signed clients

`/ping` - creates/updates browser row in the roster. supports a query argument `meta` with custom metadata JSON to assign to the browser. the browser's row is returned

`/now` - returns the roster server's current timestamp

`/leave` - signs out of the roster. returns whether it was successful or not

`/client.js` - serves a JS client interface for using the roster via XHR CORS requests



## client JS interface

example:

```javascript
var r = roster({
    domain:   '127.0.0.1',
    port:     4444,
    interval: 10000,
    onEnter: function(o) {
        console.log('enter', o);
    },
    onChange: function(o) {
        console.log('change', o);
    },
    onLeave: function(o) {
        console.log('leave', o);
    }
});

r.ping({name:'Johnny'});

r.all(function(err, data) {
    if (err) { return alert(err); }
    console.log(data);
});

r.others();
// ["Anne", "Greg"];

r.get('Greg')
/*
{   "uid": "cz886ntn21c8",
    "lastSeen": 1391995733799,
    "meta": {"name": "Greg"},
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:26.0) Gecko/20100101 Firefox/26.0"   }
*/
```

notice the interval parameter.
pings are automatically sent every interval time.
defaults to 30 seconds (30000).

`r.all(cb_fn)` - returns current roster state (array of browsers)

`r.ping([meta_obj])` - updates browser state. meta_obj is optional

`r.leave()` - signs out browser

`r.resume()` - signs in browser again

`r.others()` - returns array of others' names

`r.get(name_str)` - get roster data for the given name

You get access to the metadata sent by the original client exposed in the meta attribute.

You can also make use of the attribute lmeta to store additional knowledge about the clients (such as webrtc connections and such).  
On roster updates lmeta stays untouched (unlike most of the client data).
