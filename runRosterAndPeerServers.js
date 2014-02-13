var PeerServer = require('peer').PeerServer;
var rosterServer = require('./rosterServer');



var ps = new PeerServer({
    port: 9000
});
console.log('Running peerjs server on port 9000...');

var rs = rosterServer({});
