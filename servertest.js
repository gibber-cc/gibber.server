var request = require('request');

/*
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
})*/
/*
request.post({url:'http://127.0.0.1:8080/login',form:{username:"stein", password:"steinstein"}}, function (error, response, body) {
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
*/

request.post({url:'http://127.0.0.1:8080/publish',form:{filename:"steinfile", code:"john doe", language:"english",tags:["testfile"],notes:"thesearenotes"}}, function (error, response, body) {
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




