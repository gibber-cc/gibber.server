var request = require('request');


request.post({url:'http://127.0.0.1:8080/createNewUser',form:{username:"stein", password:"steinstein"}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})

request.post({url:'http://127.0.0.1:8080/createNewUser',form:{username:"user5", password:"user5user5"}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})

request.post({url:'http://127.0.0.1:8080/login',jar:true,form:{username:"stein", password:"steinstein"}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})

setTimeout(function() {
request.post({url:'http://127.0.0.1:8080/groupcreate',jar:true,form:{groupname:"testgroup"}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})
},3000);



setTimeout(function() {
request.post({url:'http://127.0.0.1:8080/groupaddpendingusers',jar:true,form:{groupname:"stein/groups/testgroup", newusers:["user5"]}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})
},3000);

request.post({url:'http://127.0.0.1:8080/logout',jar:true,form:{}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})


setTimeout(function() {
request.post({url:'http://127.0.0.1:8080/login',jar:true,form:{username:"user5", password:"user5user5"}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})
},4000);

setTimeout(function() {
request.post({url:'http://127.0.0.1:8080/groupconfirmuser',jar:true,form:{groupname:"stein/groups/testgroup"}}, function (error, response, body) {
	if (!error && response.statusCode == 200) {
	console.log(body);
	//console.log(response);
	}
	else
	{
		console.log(error);
		//console.log(response);
	}
})
},5000);
