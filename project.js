// Retrieve
var MongoClient = require('mongodb').MongoClient;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/exampleDb", function(err, db) {
  if(err) { return console.dir(err); }

	var collection = db.collection('test');
	db.test.remove();
	var docs = [{mykey:1}, {mykey:2}, {mykey:3}];
	
	collection.insert(docs, {w:1}, function(err, result){
		collection.find().toArray(function(err, items) {
			console.log(items);
		})
	});
	
	collection.insert(docs, {w:1}, function(err, result) {
		collection.find().toArray(function(err, items) {
		console.log(items);
	}));
	
    var stream = collection.find({mykey:{$ne:2}}).stream();
    stream.on("data", function(item) {
		console.log(""+item);
	});
    stream.on("end", function() {});

    collection.findOne({mykey:1}, function(err, item) {});

});
var express = require('express');
var app = express(); // Create Server Here

app.get('/',function(req,response){
  response.write(""+(parseInt(req.query.a)+parseInt(req.query.b)));
  response.end();
});

app.listen(8080);