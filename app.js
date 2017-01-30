var express  = require('express');
var app      = express(); 								
var port  	 = 3000; 				

app.use(express.static(__dirname + '/client')); 		// statics

app.listen(port);
console.log("Neil's server is running on on port " + port);
