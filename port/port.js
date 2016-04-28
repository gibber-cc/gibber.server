var	queuehandler 	= require("../queuehandler.js"),
	request 	= require('request'),
	designURI 	= 'http://127.0.0.1:5984/gibbertest/_design/gibbertest/',
	url		= 'http://127.0.0.1:5984/gibbertest/';
	targetURI	= 'http://127.0.0.1:5984/gibber_testing8/_design/gibber';

function portusers()
{
	request({url: targetURI + '/_view/users',json: true}, function(err, res, body) 
	{
		if (!err)
		{
			console.log(body.rows[0].id+","+body.rows[0].value.password+","+body.rows[0].value.joinDate);
			for(var i=0;i<body.rows.length;i++)
			{
				queuehandler.user.create(body.rows[i].id,body.rows[i].value.password,body.rows[i].value.joinDate,body.rows[i].value.email,body.rows[i].value.website,body.rows[i].value.affiliation, function(){});
			}
		}	
		else
			console.log(err);
  	});
}


function portpubs()
{
	request({url: targetURI + '/_view/publications',json: true}, function(err, res, body) 
	{
		if (!err)
		{
			var username;
			var filename;
			console.log(body.rows[0].id.slice(0,body.rows[0].id.indexOf("/")));
			console.log(body.rows[0].id.slice(body.rows[0].id.lastIndexOf("/")+1,body.rows[0].id.length));
			console.log(body.rows[0]);
			for(var i=0;i<body.rows.length;i++)
			{
				//console.log(body.rows[i].value);
				username = body.rows[i].id.slice(0,body.rows[i].id.indexOf("/"));
				filename = body.rows[i].id.slice(body.rows[i].id.lastIndexOf("/")+1,body.rows[i].id.length);
				queuehandler.file.publish(username,filename,body.rows[i].value.text,body.rows[i].value.publicationDate,body.rows[i].value.language,body.rows[i].tags,body.rows[i].notes, function(){});
				queuehandler.file.setmetadata(body.rows[i].id,undefined,undefined,undefined,true,body.rows[i].value.isInstrument,function(){});
			}			
		}	
		else
			console.log(err);
  	});	
}



//portusers();
portpubs();


