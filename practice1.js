var express = require('express');
var app = express(); // Create Server Here

app.get('/',function(req,response){
  response.write(""+(parseInt(req.query.a)+parseInt(req.query.b)));
  response.end();
});

app.listen(8080);