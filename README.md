# ROSTER


This is the minimal roster implementation.  
It is volatile and simple.



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
var r = roster({domain:'127.0.0.1', port:4444, interval:10000});

r.ping({name:'Johnny'});

r.all(function(err, data) {
	if (err) { return alert(err); }
	console.log(data);
});
```

notice the interval parameter.
pings are automatically sent every interval time.
defaults to 30 seconds (30000).

`r.all(cb_fn)` - returns current roster state (array of browsers)

`r.ping([meta_obj])` - updates browser state

`r.leave()` - signs out browser
