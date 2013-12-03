function init(scope){
	var app = scope['app'];
	var db = scope['db'];
	var dbc = scope['dbc'];
	var ObjectID = scope.ObjectID;
	var util = scope['util'];
	console.log("yoyoyo initapp");
	app.get('/',function(req, res){
		if(!util.ipIsAllowed(req,res)) return;
		res.render('poll.ejs',{});
	})
	app.get('/admin/login',function(req, res){
		if(!util.ipIsAllowed(req,res)) return;
		res.render('login.ejs',{error: null});
	})
	app.get('/admin',function(req, res){
		if(util.accessDenied(req,res)) return;
		res.render('admin.ejs',{section: null, vote: null});
	})
	app.get('/admin/:section?',function(req, res){
		if(util.accessDenied(req,res)) return;
		res.render('admin.ejs',{section:req.params.section, vote: null});
	})
	app.get('/admin/vote/:id',function(req, res){
		if(util.accessDenied(req,res)) return;
		dbc['votes'].findOne({_id: new ObjectID(req.params.id)},function(err,doc){
			res.render('admin.ejs',{section:"vote", vote: doc});
		});
	})
	if(scope['clearDB']){
		setTimeout(function(){
		for(var i in dbc){
			dbc[i].remove();
		}
		console.log('clear');
		},5000);
	}
}

module.exports.init_frontend = init;