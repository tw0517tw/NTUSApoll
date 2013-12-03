var express = require('express');
var app = express.createServer();

app.get('/tweets',function(request,response){
  response.sendfile(__dirname + "/tweets.html");
});
app.listen(8080);