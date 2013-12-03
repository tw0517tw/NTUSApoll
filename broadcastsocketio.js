var express = require('express');
var app = express.createServer();
var socket = require('socket.io');
var io = socket.listen(app);

io.sockets.on('connection', function(client) {
  console.log("Client connected...");
  client.on('question',function(data){
   	client.broadcast.emit("question",data); 
  });
  // listen here
});