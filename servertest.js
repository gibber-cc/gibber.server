var request = require('request');

request.post({url:'http://127.0.0.1:8080/login',form:{username:"stein", password:"stein"}}, function (error, response, body) {
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
