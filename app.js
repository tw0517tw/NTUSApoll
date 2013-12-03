var mongodb = require('mongodb');
var cookieStore = require('cookie-sessions');
var mongodbServer = new mongodb.Server('localhost', 27017, { auto_reconnect: true, poolSize: 10 });
var db = new mongodb.Db('mydb', mongodbServer);
var ObjectID = require('mongodb').ObjectID;
var dbc = {};
var KEY = null;
var CANDY = null;
var vote_class = null;
var express = require('express');
var app = express();
var util = require('./util.js')
var fs = require('fs');

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(cookieStore({ secret: 'FredChien' }));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

db.open(function () {
	console.log("db opened");
	db.collection('contact', function(err, collection) {
		tokens = collection;
		//collection.remove();
		dbc['tokens'] = collection;
	});
	db.collection('key',function(err, collection){
		KEY = collection;
		dbc['admin_users'] = collection;
		//collection.remove();
		//KEY.insert({key: '0304',id:'b00902055'},function(err,data){console.log(err,data);});
	})
	db.collection('candy',function(err, collection){
		CANDY = collection;
		dbc['candidates'] = collection;
		//collection.remove();
		//KEY.insert({key: '0304',id:'b00902055'},function(err,data){console.log(err,data);});
	})

	db.collection('vote_class',function(err,collection){
		vote_class = collection;
		dbc['votes'] = collection;
		//collection.remove();
		//console.log("dbaa sc",err);
	})
});


app.post('/admin/login',function(request,response){	// /admin?key = XXX&id=XXX
	if(!util.ipIsAllowed(request,response)) return;
	data = KEY.findOne({key:request.body.pass,id:request.body.id},function(err,data){
		if(data){
			request.session = {valid: 'true'}
			response.redirect('/admin');
			console.log("Someone logined.  " + request.ip);
			response.end();
		}else{
			response.render('login.ejs',{error: "帳號或密碼錯誤"});
			response.end();
		}
	});
})

app.get('/admin/logout',function(request,response){
	//request.session.destroy();
	request.session = null;
	response.send("Bye~");
})

require("./frontend.js").init_frontend({app:app,db:db,dbc:dbc,ObjectID:ObjectID,util:util});

/* Candidate.Update */
app.get('/admin/candy/update',function(request,response){	//?_id =XXX & ename = XXX & cname = OOO & pic = XXX & id = 
	if(util.accessDenied(request,response))	return;
	var data = CANDY.findOne({_id:new ObjectID(request.query._id)},function(err,data){
		if(!data['no']) data['no'] = 1;
		util.updateObject(data,request.query);
		console.log(data);
		CANDY.save(data,{safe:true},function(err,doc){
			console.log(err,doc);
			response.end(JSON.stringify(data));
		});
	});
});

/* Candidate.Remove */
app.get('/admin/candy/remove',function(request,response){	//?_id = XXX
	if(util.accessDenied(request,response))	return;
	CANDY.remove({_id:new ObjectID(request.query._id)},1);
	response.end('{success:true}');	
	
})

/* Candidate.Add */
app.get('/admin/candy/add',function(request,response){	//?ename = XXX & cname = OOO & pic = XXX & classid = 
	if(util.accessDenied(request,response))	return;
	
	var ename = request.query.ename;
	var cname = request.query.cname;
	var pic = request.query.pic;
	var id = request.query.classid;
	//var s
	data = CANDY.findOne({ename:ename,cname:cname},function(err,data){
		if(data){
			response.end("{error:'already exists'}");
		}
		else{
			CANDY.insert({ename: ename,cname:cname, no: request.query.no,pic:pic,vote:0,classid:id},function(err,data){
				if(data){
					console.log("inserted")
					response.end(JSON.stringify(data));
				}
				else
					console.log("err")
				response.end(JSON.stringify(err));
			})

		}
	})
})

/* Candidate.All */
app.get('/admin/candy/all',function(request,response){
	if(util.accessDenied(request,response))	return;
	
	if(request.query.classid){
		CANDY.find({classid: request.query.classid}).toArray(function(err,docs){
			response.end(JSON.stringify(docs));
		});	
	}else{
		CANDY.find({}).toArray(function(err,docs){
			response.end(JSON.stringify(docs));
		});	
	}
})

/* Class.Remove */ // ALTERED
app.get('/admin/class/remove',function(request,response){	//?_id = XXX 還沒清大頭貼檔案
	if(util.accessDenied(request,response))	return;

	contact.remove({classid:request.query._id},1);
	CANDY.find({classid: request.query._id}).toArray(function(err,docs){
		for(var i=0;i<docs.length;i++){
			var path = __dirname + "/public/avator/" + docs[i]['_id'] + ".jpg";
			fs.unlink(path,function(err){
				console.log("remove "+docs['ename']);
			});	
		}
	});
	CANDY.remove({classid: request.query._id},1);
	vote_class.remove({_id: new ObjectID(request.query._id)},1);
	response.end('Removed');
})

app.post('/admin/class/update',function(request,response){	//?_id =XXX & engname = XXX,& chiname = OOO & start 2013/01/01 & end 2013/12/31
	if(util.accessDenied(request,response))	return;
	/* {engname, chiname, _id, start_at, end_at, created_at} */
	var data = vote_class.findOne({_id: new ObjectID(request.body._id)},function(err,data){
		util.updateObject(data,request.body, true);
		vote_class.update({_id:data._id}, data);
		response.end(JSON.stringify(data));
	});	
})

app.get('/admin/class/search',function(request,response){	//?cname=XXX
	if(util.accessDenied(request,response))	return;
	var name = request.query.cname;
	vote_class.find({chiname:name},function(err,data){
		data.toArray(function(err,docs){
			console.log(docs);
		})
	})
	var patt1=new RegExp(".*"+name+".*");
	vote_class.find({chiname:patt1}).toArray(function(err,docs){
		response.end(JSON.stringify(docs));
	});	
})


app.get('/admin/class/add',function(request,response){	//?engname = XXX & chiname = OOO & start 2013/01/01 & end 2013/12/31 & votemax
	if(util.accessDenied(request,response))	return;
	var classname = request.query.engname;
	var chiname = request.query.chiname;
	var start = new Date(request.query.start);
	var end = new Date(request.query.end);
	var addtime = new Date();
	var votemax = (request.query.votemax) ? request.query.votemax : 1;

	data = vote_class.findOne({engname:classname,chiname:chiname},function(err,data){
		if(data){
			response.end("already exists");
		}
		else{
			vote_class.insert({engname:classname,chiname:chiname,construct_time:addtime,start_at:start,end_at:end,votemax:votemax},function(err,data){
				if(data){
					console.log("inserted")
					response.end(JSON.stringify(data));
				}
				else
					console.log("err")
			})

		}
	})
})

app.get('/admin/class/all',function(request,response){	//?engname = XXX & chiname = OOO
	if(util.accessDenied(request,response))	return;
	vote_class.find({}).toArray(function(err,docs){
		response.end(JSON.stringify(docs));
	});	
})


app.get('/admin/class/:classid/tokens/gen',function(request,response){	//?classid=voting_class
	if(util.accessDenied(request,response))	return;
	classid= request.params.classid,	
	random_number= request.query.number
	tokens_generated = [];
	vote_class.findOne({_id: new ObjectID(classid)}, function(err, vote){
		if(!vote) return response.end('{error:"Class not found"}');
		if(!vote.serial) vote_class.update({_id:vote._id}, {'$set': {serial: 1}});
		else vote_class.update({_id:vote._id}, {'$inc': {serial: 1}});
		
		for(var i=0;i<random_number;i++){
			var a = Math.PI;
			var rand = util.generateToken();
			tokens_generated.push(rand);
			tokens.insert({
				classid: request.params.classid,	
				token: rand,
				validate: true
			}, function(err, data) {
				if (data) {
					console.log('Inserted #'+i +' token '+rand);
				} else {
					response.end("{success: false}");
				}
				if(i==random_number-1){
					//response.setHeader('Content-disposition', 'attachment; filename=token_'+Date.now()+'.txt');
					result = "<b>"+vote.chiname + ' ' + vote.engname+"</b> 投票序號<br /><br />";
					result += "生成時間: " + Date.now().toString()+"<br /><br />";
					result += "批次: #" +vote.serial+"<br /><br />";
					result += "<hr />";
					result += "<style>table{border-collapse:collapse;} td{padding: 10px; border:1px solid #CCC;}</style>";
					result += "<table cellpadding=10 border-collapsing- cellspacing=0>";
					for(var j = 0; j<random_number; j+=4){
						result += "<tr>";
						if(!tokens_generated[j+1]) tokens_generated[j+1] = '';
						if(!tokens_generated[j+2]) tokens_generated[j+2] = '';
						if(!tokens_generated[j+3]) tokens_generated[j+3] = '';
						result+= "<td>"+tokens_generated[j]+"</td><td>"+tokens_generated[j+1]+"</td><td>"+tokens_generated[j+2]+"</td>"+"<td>"+tokens_generated[j+3]+"</td>";
						result += "</tr>";
					}
					result += "</table>";
					response.end(result);
				}
			});	
}
});
});


app.get('/admin/class/:classid/tokens', function(request, response) {
	if(util.accessDenied(request,response))	return;
	tokens.find({classid: request.params.classid}).toArray(function(err,docs){
		response.end(JSON.stringify(docs));
	});		
});	

app.get('/token/validate',function(request,response){
	if(!util.ipIsAllowed(request,response)) return;
	tokens.findOne({ token: request.query.token}, function(err, doc){
		if(err)
			console.log(err);
		if(doc){
			if(doc['validate']){
				console.log("Validate " + request.query.token + ", ");
				vote_class.findOne({_id:new ObjectID(doc['classid'])}, function(err, vote_doc){
					if(vote_doc){
						dbc['candidates'].find({classid: vote_doc._id.toString()}).sort(['no']).toArray(function(err,candies){
							response.end(JSON.stringify({classid:doc['classid'],validate:doc['validate'],vote_class:vote_doc,doc:doc,candies: candies}));
						});
					}else{
						response.end(JSON.stringify({error:"該序號無效",errno:2}));		
					}
				});
			}else{
				console.log("Validate " + request.query.token + ", false");
				response.end(JSON.stringify({error:"序號已使用",errno:1}));	
			}
		}else{
			console.log("Validate " + request.query.token + ", false");
			response.end(JSON.stringify({error:"序號不存在",errno:0}));
		}

	})
});


app.get('/do_vote',function(request,response){	//?token=XXX&candy[]=_id&classid=XXX
	if(!util.ipIsAllowed(request,response)) return;

	var token = request.query.token;
	var candy = request.query.candy;
	var classid = request.query.classid;

	tokens.findOne({ token: token},function(err, data){
		console.log(err,data);
		if(err||!data) return response.end(util.errorObj('Token invalid or db failed'));
		if(data['validate']==true){
			data['validate'] = false;
			tokens.save(data,function(err,doc){});
			var time = new Date();
			var endtime = new Date(data['end_at']);
			if(endtime < time) return response.end("Too late");
			
			vote_class.findOne({_id:new ObjectID(data['classid'])},function(err,vote){
				if(vote['end_at'] < time || time < vote['start_at']) return response.end("Too late");
				for(var i=0;i<candy.length;i++)
					CANDY.findOne({_id: new ObjectID(candy[i]) ,classid:classid},function(err,data){
						CANDY.update({'$inc':{'vote':1}},function(err,doc){});
					})
				return response.end(JSON.stringify({success:true,data:data}));
			});
		}else{
			response.end(util.errorObj("Voted"));
		}
	}
	)	
})

//	/5?token=193749

app.post('/admin/upload',function(request,response){	//?_id = _id
	if(util.accessDenied(request,response))	return;
	
	fs.readFile(request.files.displayImage.path,function(err,data){
		var newPath = __dirname + "/public/avatar/" + request.body._id +".jpg";
		fs.writeFile(newPath,data,function(err){
			response.redirect("back");
		})
	})
})

app.listen(8080);