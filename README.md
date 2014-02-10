# ROSTER


This is the minimal roster implementation.  
It is volatile and simple.

The /ping calls create/update browser presence on the roster. A cookie sent by the server defines uniqueid.
Optional meta argument can be set to define browser client's properties (ex: nickname, avatar, webrtc id, email...)

The / call returns an array of known clients. Such calls don't update client status (so one can see the roster without taking part of it).

The /leave call wipes browser from the roster.

TODO:  
could automatically delete clients idle for more than x seconds...


## server HTTP interface

The server supports the following:

`/` - returns a JSON array of signed clients

`/ping` - creates/updates browser row in the roster. supports a query argument `meta` with custom metadata JSON to assign to the browser. the browser's row is returned

`/now` - returns the roster server's current timestamp

`/leave` - signs out of the roster. returns wether it was successful or not

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
