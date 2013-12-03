var url = require('url');
var request = require('request');

options = {
  protocol: "http:",
  host: "search.twitter.com",
  pathname: '/search.json',
  query: { q: "codeschool"}
};

var searchURL = url.format(options);

var app; // Create Server Here
var express = require('express')
app = express.createServer();

app.get('/',function(req,response){
  request(searchURL).pipe(response)
})

app.listen(8080)