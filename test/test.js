var assert = require('assert');
var request = require('request');

describe('Basic User Functions', function() {
  describe('#userbasicfns()', function() {
    it('should create user without error', function(done) {
	request.post({url:'http://127.0.0.1:8080/createNewUser',form:{username:"stein", password:"steinstein"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('should create user without error', function(done) {
	request.post({url:'http://127.0.0.1:8080/createNewUser',form:{username:"sarah", password:"sarahsarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('should create user without error', function(done) {
	request.post({url:'http://127.0.0.1:8080/createNewUser',form:{username:"sarah", password:"sarahsarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to login', function(done) {
	request.post({url:'http://127.0.0.1:8080/login',jar:true,form:{username:"stein", password:"steinstein"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to publish file', function(done) {
	request.post({url:'http://127.0.0.1:8080/publish',jar:true,form:{filename:"steinfile", code:"john doe", language:"english",tags:["testfile"],notes:"thesearenotes"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to edit file body', function(done) {
	request.post({url:'http://127.0.0.1:8080/update',jar:true,form:{filename:"gibbertest/publications/steinsteinfile", newtext:"jane doe"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to edit metadata', function(done) {
	request.post({url:'http://127.0.0.1:8080/filesetmetadata',jar:true,form:{filename:"gibbertest/publications/steinsteinfile",newtags:"thisisatag",newlanguage:"spanish",ispublic:false,isautoplay:false}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('userreadaccessall', function(done) {
	request.post({url:'http://127.0.0.1:8080/userreadaccessall',jar:true}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('userwriteaccessall', function(done) {
	request.post({url:'http://127.0.0.1:8080/userwriteaccessall',jar:true}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('userreadaccessfile', function(done) {
	request.post({url:'http://127.0.0.1:8080/userreadaccessfile',jar:true,form:{filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('userwriteaccessfile', function(done) {
	request.post({url:'http://127.0.0.1:8080/userwriteaccessfile',jar:true,form:{filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('fileaddreadaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileaddreadaccess',jar:true,form:{filename:"gibbertest/publications/steinsteinfile",newuser:"sarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('fileremreadaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileremreadaccess',jar:true,form:{filename:"gibbertest/publications/steinsteinfile",newuser:"sarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('fileaddwriteaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileaddwriteaccess',jar:true,form:{filename:"gibbertest/publications/steinsteinfile",newuser:"sarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('fileremwriteaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileremwriteaccess',jar:true,form:{filename:"gibbertest/publications/steinsteinfile",newuser:"sarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('groupcreate', function(done) {
	request.post({url:'http://127.0.0.1:8080/groupcreate',jar:true,form:{newgroup:"steingroup"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('groupdestroy', function(done) {
	request.post({url:'http://127.0.0.1:8080/groupdestroy',jar:true,form:{groupname:"gibbertest/groups/steingroup"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('groupcreate', function(done) {
	request.post({url:'http://127.0.0.1:8080/groupcreate',jar:true,form:{newgroup:"steingroup"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('groupadduser', function(done) {
	request.post({url:'http://127.0.0.1:8080/groupaddusers',jar:true,form:{groupname:"gibbertest/groups/steingroup",newusers:["sarah","user1"]}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    /*it('groupremoveuser', function(done) {
	request.post({url:'http://127.0.0.1:8080/groupremoveuser',jar:true,form:{groupname:"gibbertest/groups/steingroup",remuser:"sarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });*/
    it('file_addgroupreadaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileaddgroupreadaccess',jar:true,form:{newgroup:"gibbertest/groups/steingroup",filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    /*it('file_remgroupreadaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileremgroupreadaccess',jar:true,form:{remgroup:"gibbertest/groups/steingroup",filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });*/
    it('file_addgroupwriteaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileaddgroupwriteaccess',jar:true,form:{newgroup:"gibbertest/groups/steingroup",filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    /*it('file_remgroupwriteaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileremgroupwriteaccess',jar:true,form:{remgroup:"gibbertest/groups/steingroup",filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });*/
    it('attempting to logout', function(done) {
	request.get({url:'http://127.0.0.1:8080/logout',jar:true}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to login', function(done) {
	request.post({url:'http://127.0.0.1:8080/login',jar:true,form:{username:"sarah", password:"sarahsarah"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to edit file body', function(done) {
	request.post({url:'http://127.0.0.1:8080/update',jar:true,form:{filename:"gibbertest/publications/steinsteinfile", newtext:"jane sarah doe"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to retrieve file', function(done) {
	request.post({url:'http://127.0.0.1:8080/userreadfile',jar:true,form:{filename:"gibbertest/publications/steinsteinfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to publish file', function(done) {
	request.post({url:'http://127.0.0.1:8080/publish',jar:true,form:{filename:"sarahfile", code:"sarah blasko", language:"english",tags:["testfile"],notes:"thesearenotes"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('file_addgroupreadaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileaddgroupreadaccess',jar:true,form:{newgroup:"gibbertest/groups/steingroup",filename:"gibbertest/publications/sarahsarahfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('file_addgroupwriteaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/fileaddgroupwriteaccess',jar:true,form:{newgroup:"gibbertest/groups/steingroup",filename:"gibbertest/publications/sarahsarahfile"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to logout', function(done) {
	request.get({url:'http://127.0.0.1:8080/logout',jar:true}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to login', function(done) {
	request.post({url:'http://127.0.0.1:8080/login',jar:true,form:{username:"stein", password:"steinstein"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to check groupreadaccess', function(done) {
	request.post({url:'http://127.0.0.1:8080/groupreadaccessall',jar:true,form:{groupname:"gibbertest/groups/steingroup"}}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });
    it('attempting to destroy user', function(done) {
	request.post({url:'http://127.0.0.1:8080/userdestroy',jar:true}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			done();
		}
		else
		{
			console.log(error);
		}
	})
    });	
  });
});

