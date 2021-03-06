var ObjectID = require('mongodb').ObjectID;
var TokenChars=[['0','1','2','3','4','5','6','7','8','9'],[]];
for(var uu = 0; uu < 26; uu++) TokenChars[1].push(String.fromCharCode(uu+97));

module.exports.ipIsAllowed = function(request, response){
	var patt1=new RegExp("140.112."+".*");
	console.log(request.ip);
	var ip = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
	if(!(ip=="127.0.0.1" || patt1.test(ip.toString()))){
		response.end(module.exports.errorObj("IP "+ ip + " is not in the allowed net area"));
		return false
	}
	return true;
}

module.exports.dateToFormat = function(date) {
	if(!date) date = new Date();
    var d = date.getDate();
    var m = date.getMonth() + 1;
    var y = date.getFullYear();
    var h = date.getHours();
    var mm = date.getMinutes();
    return '' + y + '-' + (m<=9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d) + ' '
    + (h <= 9 ? '0' + h : h) +':'+(mm <= 9 ? '0' + mm : mm) ;
}

module.exports.errorObj = function(msg){
	return JSON.stringify({error:msg});
}

module.exports.updateObject= function(raw, replace, replacing){
	for(var i in raw){
		if(i=='_id') replace[i] = new ObjectID(replace[i]);
		if(replace[i]) raw[i] = replace[i];
	}
	if(replacing){
		for(var i in replace){
			raw[i] = replace[i];
		}	
	}
	return raw;
}

module.exports.accessDenied = function(request,response){
	if(!request.session){
		console.log("Access Denied.");
		response.end('{error: "Access Denied"}');
		return true;
	}
	return false;
}

module.exports.generateToken = function(len){
	if(!len) len = 16;
	var result = ""
	for(var i=0; i < len; i++){
		var tkc = Math.floor(i/4)%2;
		result+=TokenChars[tkc][Math.floor(Math.random()*TokenChars[tkc].length)];
	}
	return result;
}
