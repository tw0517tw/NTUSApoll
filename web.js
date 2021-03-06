var mongodb = require('mongodb');
var cookieStore = require('cookie-sessions');
var mongodbServer;
var mongoUri = 'mongodb://localhost/mydb';
if(process.env.NODE_ENV|| true){	
	mongoUri="mongodb://ntusa3:yxul4dj4au4a83@paulo.mongohq.com:10058/app20024734";
}
var db;
var ObjectID = require('mongodb').ObjectID;
var dbc = {};
var KEY = null;
var CANDY = null;
var vote_class = null;
var express = require('express');
var app = express();
var util = require('./util.js')
var fs = require('fs');
var removeCallback = function(err,result){}
var updateCallback = function(err,result){}
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(express.multipart());
	app.use(express.cookieParser());
	app.use(cookieStore({ secret: 'FredChien' }));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

var tokens;
var KEY;
var CANDY;

var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
db = new Db('app20024734',new Server("paulo.mongohq.com",10058,{auto_reconnect: true,poolsize: 100}, {w:0, native_parser: false}) );
db.open(function(err, db) {
	db.authenticate('ntusa3','yxul4dj4au4a83',function(err,result){
		if(err)
			console.log(""+err);
		console.log("Remote Database Connected");
	});
});

//	db = ddb;
//	console.log("Database ready.", err);
	db.collection('contact', function(err, collection) {
		tokens = collection;
		//collection.remove();
		dbc['tokens'] = collection;
	});
	db.collection('key',function(err, collection){
		KEY = collection;
		dbc['admin_users'] = collection;
		//collection.remove();
		KEY.insert({key: '0304',id:'b00902055'},function(err,data){console.log(err,data);});
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

	var path = __dirname + "/public/avatar/" + request.query._id + ".jpg";
	//console.log(""+docs[ff]['id']);
	try
	{
		fs.unlinkSync(path);
	}
	catch(err)
	{
		console.log(err);
	}
	//console.log("remove "+docs['ename']);

	CANDY.remove({_id:new ObjectID(request.query._id)},removeCallback);
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
	data = CANDY.findOne({ename:ename,cname:cname, classid: id},function(err,data){
		if(data){
			response.end("{error:'already exists'}");
		}
		else{
			CANDY.insert({ename: ename,cname:cname,no:request.query.no,pic:pic,vote:0, dis_vote:0,classid:id},function(err,data){
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
/*app.get('/remove',function(request,response){	//?name=XXX
	var name = request.query.name;
	var path = __dirname + "/public/avatar/" +name +".jpg"
	fs.unlinkSync(path);
})*/

app.get('/admin/class/remove',function(request,response){	//?_id = XXX 還沒清大頭貼檔案
	if(util.accessDenied(request,response))	return;
	var classid_query = {classid:request.query._id};
	console.log(classid_query);
	dbc['tokens'].remove(classid_query,removeCallback);
	CANDY.find(classid_query).toArray(function(err,docs){
		console.log("this is the removed list: ",docs);
		for(var ff in docs){
			var path = __dirname + "/public/avatar/" + docs[ff]['_id'] + ".jpg";
			console.log(""+docs[ff]['id']);
			try
			{
				fs.unlinkSync(path);
			}
			catch(err)
			{
				console.log(err);
			}
			console.log("remove "+docs['ename']);
			CANDY.remove({_id:docs[ff]._id},removeCallback);
		}
	});
	vote_class.remove({_id: new ObjectID(request.query._id)},removeCallback);
	response.end('Removed');
})

app.post('/admin/class/update',function(request,response){	//?_id =XXX & engname = XXX,& chiname = OOO & start 2013/01/01 & end 2013/12/31
	if(util.accessDenied(request,response))	return;
	/* {engname, chiname, _id, start_at, end_at, created_at} */
	request.body.start_at = new Date(request.body.start_at);
	request.body.end_at = new Date(request.body.end_at);
	
	var data = vote_class.findOne({_id: new ObjectID(request.body._id)},function(err,data){
		util.updateObject(data,request.body, true);
		data.start_at = util.dateToFormat(data.start_at);
		data.end_at = util.dateToFormat(data.end_at);
		vote_class.update({_id:data._id}, data, updateCallback);
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


app.get('/admin/class/add',function(request,response){	//?engname = XXX & chiname = OOO & start 2013/01/01 14:00:00 & end 2013/12/31 14:25:00 & votemax
	if(util.accessDenied(request,response))	return;
	var classname = request.query.engname;
	var chiname = request.query.chiname;
	var start = request.query.start_at? new Date(request.query.start_at) : new Date();
	var end = request.query.end_at? new Date(request.query.end_at) : new Date();
	var addtime = new Date();
	var votemax = (request.query.votemax) ? request.query.votemax : 1;
	start = util.dateToFormat(start);
	end = util.dateToFormat(end);

	data = vote_class.findOne({engname:classname,chiname:chiname},function(err,data){
		if(data){
			response.end(util.errorObj("already exists"));
		}
		else{
			vote_class.insert({engname:classname,chiname:chiname,construct_time:addtime,start_at:start,end_at:end,votemax:votemax,invalid:0},function(err,data){
				if(data){
					console.log("inserted")
					response.end(JSON.stringify(data));
				}
				else
					response.end(util.errorObj(err))
			})

		}
	})
})

app.get('/admin/class/all',function(request,response){	//?engname = XXX & chiname = OOO
	if(util.accessDenied(request,response))	return;
	vote_class.find({}).sort({start_at:-1}).toArray(function(err,docs){
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
		if(!vote.serial) vote_class.update({_id:vote._id}, {'$set': {serial: 1}}, function(eerr,ddoc){});
		else vote_class.update({_id:vote._id}, {'$inc': {serial: 1}}, function(eerr,ddoc){});
		var insert_i = 0;
		if(!vote.serial) vote.serial = 1;
		else vote.serial++;
		for(var i_token=0;i_token<random_number;i_token++){
			var a = Math.PI;
			var rand = util.generateToken();
			tokens_generated.push(rand);
			tokens.insert({
				classid: vote._id.toString(),	
				token: rand,
				created_at: new Date(),
				validate: true
			}, function(err, data) {
				if (data) {
					++insert_i;
					console.log('Inserted #'+(insert_i) +' token '+tokens_generated[insert_i]);
				} else {
					return response.end("{success: false}");
				}
				if(insert_i==random_number-1){
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
				vote_class.findOne({_id:new ObjectID(doc['classid'])}, function(err, vote){
					if(vote){
						var time = new Date();
						if(new Date(vote['end_at']) < time || time < new Date(vote['start_at'])) return response.end(util.errorObj("投票時段錯誤"));
						dbc['candidates'].find({classid: vote._id.toString()}).sort(['no']).toArray(function(err,candies){
							response.end(JSON.stringify({classid:doc['classid'],validate:doc['validate'],vote_class:vote,doc:doc,candies: candies}));
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
	var dis_candy = request.query.dis_candy;

	tokens.findOne({ token: token},function(err, token_data){
		console.log(err,token_data);
		if(err||!token_data) return response.end(util.errorObj('Token invalid or db failed'));
		if(token_data['validate']==true){
			vote_class.findOne({_id:new ObjectID(token_data['classid'])},function(err,vote){
				if(vote==null){
				 console.log("Null vote", vote, token_data, err);
				 return response.end(util.errorObj("Vote "+token_data['classid']+" not found"));	
				}		
				token_data['validate'] = false;
				tokens.save(token_data,function(err,doc){});
				console.log("Try Vote ", vote);
				var time = new Date();
				var end_at = new Date(vote['end_at']);
				var start_at = new Date(vote['start_at']);
				if(end_at < time || time < start_at) return response.end(util.errorObj("Too late"));
				if(candy.length > parseInt(vote.votemax?vote.votemax:1) && vote.agree!="on") return response.end(util.errorObj("人數過多"));
				if(dis_candy.length > 0 && vote.agree!="on") return response.end(util.errorObj("不開放不同意選項"));
				var classid = vote._id.toString();
				var candy_repeat;
				candy_repeat = [];
				for(var i in candy){
					var c = candy[i];
					CANDY.findOne({_id: new ObjectID(c) ,classid: classid},function(err,candy_data){
						console.log("Update Candy Vote ", candy_data);
						if(!candy_data) return;
						if(candy_repeat[candy_data._id.toString()]) return; 
						candy_repeat[candy_data._id.toString()] = true;
						CANDY.update({_id: candy_data._id}, {'$inc':{vote:1}},function(err,doc){});
					});
				}
				if(candy.length==0 && (vote.agree!="on" || dis_candy.length==0)){
					vote_class.update({_id:new ObjectID(token_data['classid'])},{'$inc':{invalid:1}},function(err,doc){});
					console.log('didnot vote');
				}
				for(var i in dis_candy){
					CANDY.findOne({_id: new ObjectID(dis_candy[i]) ,classid:classid},function(err,candy_data){
						console.log("Update Candy Disvote ", candy_data);
						CANDY.update({_id: candy_data._id}, {'$inc':{dis_vote:1}},function(err,doc){});
					});
				}
				return response.end(JSON.stringify({success:true,data:token_data}));
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

app.listen(process.env.PORT || 8080);