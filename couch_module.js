/* jshint node: true, couch: true, esversion: 6 */
/*eslint no-undef: 0, no-unused-vars: 0*/

var nano = require("nano")("http://admin:admin@localhost:5984");
var blah = nano.db.use("gibbertest");

function user_obj()
{
	this.create = User_Create;
	this.destroy = User_Destroy;
        this.notify = User_Notify;
        this.getnotifications = User_GetNotifications;
        this.deleteallnotifications = User_DeleteAllNotifications;
        this.addfriend = User_AddFriend;
	this.checkinfo = User_CheckInfo;
	this.changepassword = User_ChangePassword;
	this.checkifauthor = User_CheckIfAuthor;
	this.authorizeread = User_AuthorizeRead;
	this.authorizewrite = User_AuthorizeWrite;
	this.checkreadaccessall = User_CheckReadAccessAll;
	this.checkwriteaccessall = User_CheckWriteAccessAll;
	this.checkwriteaccessfile = User_CheckWriteAccessFile;
	this.checkreadaccessfile = User_CheckReadAccessFile;
}

function group_obj()
{
	this.create = Group_Create;
        this.viewusers = Group_ViewUsers;
	this.destroy = Group_Destroy;
        this.addpendinguser = Group_AddPendingUser;
	this.confirmuser = Group_ConfirmUser;
        this.rejectuser = Group_RejectUser;
	this.removeuser = Group_RemoveUser;
	this.checkuser = Group_CheckUser;
	this.checkowner = Group_CheckOwner;
	this.checkreadaccessfile = Group_CheckReadAccessFile;
	this.checkwriteaccessfile = Group_CheckWriteAccessFile;
}

function file_obj()
{
	this.publish = File_Publish;
	this.edit = File_Edit;
	this.setmetadata = File_SetMetadata;
	this.setispublic = File_SetIsPublic;
	this.addreadaccess = File_AddReadAccess;
	this.remreadaccess = File_RemReadAccess;
	this.addwriteaccess = File_AddWriteAccess;
	this.remwriteaccess = File_RemWriteAccess;
	this.addgroupreadaccess = File_AddGroupReadAccess;
	this.remgroupreadaccess = File_RemGroupReadAccess;
	this.addgroupwriteaccess = File_AddGroupWriteAccess;
	this.remgroupwriteaccess = File_RemGroupWriteAccess;
}

var user = new user_obj();
var group = new group_obj();
var file = new file_obj();

var couch_module = {
	user : user,
	group : group,
	file : file
};

module.exports = couch_module;

function User_Create(username,password,date,email,website,affiliation,cb)
{
	var result = false;
	blah.insert({"type": "user","password": password,"grouplist":[],"joinDate": date,"website": website,"affiliation": affiliation,"email": email,"following": [],"friends": []}, username, function(err, body) {
	if (!err)
		cb(err,true);
	else
		cb(err,false);
	});
}


function User_CheckInfo(username,cb)
{
	//console.log("user checkinfo is triggering");
	var result = {};
	blah.get(username, { revs_info: true }, function(err, body) {
	if(!err)
		result = body;
	cb(err,result);
	});
}

/*This function, and all other functions that modify a document work by using the get function to find the appropriate document, reading it and then overwriting it with the modified values.*/
function User_ChangePassword(username,newpwd,cb)
{
	var result = false;
	var newbody = {"type": "user","password": password,"grouplist":[],"joinDate": date,"website": "","affiliation": "","email": "","following": [],"friends": []};
	blah.get(username, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newbody = body;
		newbody.password = newpwd;
		blah.insert(newbody, username, function(err2, body) {
		if (!err2)
		{
			result = true;
			cb(err2,result);
		}
		});
	}
	cb(err1,result);
	});
}

function User_Destroy(username,cb)
{
	var result = false;
	blah.get(username, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		blah.destroy(username, body._rev, function(err2, body) {
		if (!err2)
		{
			result = true;
			cb(err2,result);
		}
		});
	}
	cb(err1,result);
	});
}

function User_Notify(username,notificationdata,cb)
{
        console.log("username is "+username);
        var result = false;
        blah.get(username, { revs_info: true }, function(err1,body1) {
        if(!err1)
        {
                var newnotifications = [];
                if(body1.notifications!=undefined)
                {
                        newnotifications = body1.notifications.slice();
                }
                newnotifications.push(notificationdata);
                newfile = body1;
                newfile.notifications = newnotifications.slice();
                console.log(newfile);
                blah.insert(newfile,username,function(err2,body2) {
                if(!err2)
                {
                        console.log(username+" notifications updated");
                        result = true;
                        cb(err1, result);
                }
                else
                {
                        console.log("failed to write user notification data");
                        cb(err2,result);
                }
                });
        }
        else
        {
                console.log("failed to read target user data");
                cb(err1,result);
        }
        });
}

function User_GetNotifications(username,cb)
{
        var notifications=[];
        blah.get(username, {revs_info: true}, function(err1,body1) {
                if(!err1)
                {
                        if(body1.notifications!=undefined)
                        {
                                notifications = body1.notifications;
                        }
                        cb(err1,notifications);
                }
                else
                {
                        console.log("unable to retrieve user notifications");
                        cb(err1,notifications);
                }
        });
}

function User_DeleteAllNotifications(username,cb)
{
        var notifications=[];
        var result = false;
        blah.get(username, {revs_info: true}, function(err1,body1) {
                if(!err1)
                {
                        body1.notifications = notifications.slice();
                        blah.insert(body1,username,function(err2,body2) {
                                if(!err1)
                                {
                                        console.log("successfully wiped all notifications");
                                        result = true;
                                        cb(err2,result);
                                }
                                else
                                {
                                        console.log("failed to wipe all notifications");
                                        cb(err2,result);
                                }

                        });
                }
                else
                {
                        console.log("unable to find user");
                        cb(err1,result);
                }
        });
}

function User_AddFriend(username1,username2,cb)
{
        var result1=false;
        var result2=false;
        blah.get(username1, {revs_info: true}, function(err1,body1) {
                if(!err1)
                {
                        var friends=[];
                        if(body1.friends!=undefined)
                        {
                                body1.friends = friends.slice;
                        }
                        body1.friends.push(username2);
                        blah.insert(body1,username1,function(err2,body2) {
                                if(!err1)
                                {
                                        result1=true;
                                }
                                else
                                {
                                        console.log("couldn't add user 2 to user1's friend list");
                                }
                        })
                }
                else
                {
                        console.log("couldn't find user1");
                }
        })
        blah.get(username2, {revs_info: true}, function(err1,body1) {
                if(!err1)
                {
                        var friends=[];
                        if(body1.friends!=undefined)
                        {
                                body1.friends = friends.slice;
                        }
                        body1.friends.push(username1);
                        blah.insert(body1,username2,function(err2,body2) {
                                if(!err1)
                                {
                                        result2=true;
                                }
                                else
                                {
                                        console.log("couldn't add user1 to user2's friend list");
                                }
                        })
                }
                else
                {
                        console.log("couldn't find user2");
                }
        })
        if(result1&&result2)
        {
                cb({err:"add friend operation succeeded"},true);
        }
        else
        {
                cb({err:"add friend operation probably did not succeed"},false);
        }
}

function User_CheckIfAuthor(username,filename,cb)
{
	var verified = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		console.log(newfile);
		if(newfile.author == username)
		{
			verified = true;
			console.log("authorship verified");
		}
	}
	cb(err1,verified);
	});
}

function User_AuthorizeRead(username,filename,cb)
{
	var verified = false;
	//var user_grouplist = [];
	var filebody = null;
	blah.get(username, { revs_info: true }, function(err1, body1) {
	if (!err1 && filename!=undefined)
	{
		var user_grouplist = body1.grouplist;
		blah.get(filename, { revs_info: true }, function(err2, body2) {
		if(!err2)
		{
			if(body2.isPublic == true)
				verified = true;
			else
			{
				if(body2.readaccess.indexOf(username)!=-1)
				{
					verified = true;
					console.log("verified has been set to true");
				}
				else
				{
					console.log(body1);
					for(i=0;i<body1.grouplist.length;i++)
					{
						if(body2.groupreadaccess.indexOf(user_grouplist[i])!=-1)
						{
							verified = true;
							console.log("verified has been set to true");
						}
					}
				}
			}
		}
		cb(err1,verified);
		console.log("the verified status for authorizeRead is "+verified);
		});
	}
	else
	{
		if(!err1)
			err1 = "filename undefined";
		cb(err1,verified);
	}
	});
}

function User_AuthorizeWrite(username,filename,cb)
{
	var verified = false;
	//var user_grouplist = [];
	var filebody = null;
	blah.get(username, { revs_info: true }, function(err1, body1) {
	if (!err1 && filename!=undefined)
	{
		var user_grouplist = body1.grouplist;
		blah.get(filename, { revs_info: true }, function(err2, body2) {
		if(!err2)
		{
			console.log("retrieved file, checking writeaccess...");
			if(body2.writeaccess.indexOf(username)!=-1)
			{
				verified = true;
				console.log("verified has been set to true");
			}
			else
			{
				console.log("user not found in write list, checking groups....");
				for(i=0;i<body1.grouplist.length;i++)
				{
					if(body2.groupwriteaccess.indexOf(user_grouplist[i])!=-1)
					{
						verified = true;
						console.log("verified has been set to true");
					}
				}
			}
		}
		else
		{
			console.log("failed to retrieve file");
			console.log(err2);
		}
		cb(err1,verified);
		console.log("the verified status for authorizeWrite is "+verified);
		});

	}
	else
	{
		if(!err1)
			err1 = "filename undefined";
		cb(err1,verified);
	}
	});
}

function User_CheckReadAccessAll(username, cb)
{
	var response = [];
	blah.view("gibbertest", "userreadaccessall", {"key":username},function(err, body) {
	if (!err)
		body.rows.forEach(function(doc) {response.push(doc.value);});
	cb(err,response);
	});
}

function User_CheckWriteAccessAll(username, cb)
{
	var response = [];
	blah.view("gibbertest", "userwriteaccessall", {"key":username},function(err, body) {
	if (!err)
		body.rows.forEach(function(doc) {response.push(doc.value);});
	cb(err,response);
	});
}

function User_CheckReadAccessFile(username, filename, cb)
{
	var response = [];
	blah.view("gibbertest", "userreadaccessfile", {"key":[username,filename]},function(err, body) {
	if (!err)
		body.rows.forEach(function(doc) {response.push(doc.value);});
	cb(err,response);
	});
}

function User_CheckWriteAccessFile(username, filename, cb)
{
	var response = [];
	blah.view("gibbertest", "userwriteaccessfile", {"key":[username,filename]},function(err, body) {
	if (!err)
		body.rows.forEach(function(doc) {response.push(doc.value);});
	cb(err,response);
	});
}

function File_Publish(username,filename,text,date,ispublic,language,tags,notes,cb)
{
        if(ispublic==undefined)
        {
                ispublic = false;
        }
        if(tags==undefined)
        {
                tags=[];
        }
        if(language==undefined)
        {
                language="";
        }
	blah.insert({type: "publication", "author": username, "isPublic": ispublic,"isAutoplay":false,"readaccess":[username],"writeaccess":[username],"groupreadaccess":[],"groupwriteaccess":[],"publicationDate":date, "lastModified":date, "language": language, "tags": tags, "notes": notes, "text":text}, username+"/publications/"+filename, function(err, body) {
	var result = false;
	if (!err)
		result = true;
	cb(err,result);
	});
}

function File_Edit(filename,newtext,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		newfile.text = newtext;
		var date = new Date(),day  = date.getDate(),month = date.getMonth() + 1,year = date.getFullYear(),time = date.toLocaleTimeString();
		newfile.lastModified = [year,month,day,time];
		blah.insert(newfile, filename, function(err2, body) {
	if (!err2)
	{
		result = true;
		cb(err2,result);
	}
	});
	}
	cb(err1,result);
	});
}

function File_SetMetadata(filename,newlanguage,newtags,newnotes,ispublic,isautoplay,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		//TODO: check for null and set defaults so all arguments don't have to be populated
		newfile = body;
		if(newlanguage!=undefined)
			newfile.language = newlanguage;
		if(newnotes!=undefined)
			newfile.notes = newnotes;
		if(newtags!=undefined)
			newfile.tags = newtags.slice();
		if(ispublic!=undefined)
			newfile.isPublic = ispublic;
		if(isautoplay!=undefined)
			newfile.isAutoplay = isautoplay;
		var date = new Date(),day  = date.getDate(),month = date.getMonth() + 1,year = date.getFullYear(),time = date.toLocaleTimeString();
		newfile.lastModified = [year,month,day,time];
		blah.insert(newfile, filename, function(err2, body) {
	                if (!err2)
	                {
		                result = true;
		                cb(err2,newfile);
	                }
                        else
                        {
                                cb(err2,result);
                        }
	        });
	}
        else
        {
	        cb(err1,result);
        }
	});
}

function File_SetIsPublic(filename,isPublic,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		newfile.isPublic = isPublic;
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
		{
			result = true;
			cb(err2,result);
		}
		});
	}
	cb(err1,result);
	});
}

function File_AddReadAccess(filename,newuser,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		if (newfile.readaccess.indexOf(newuser) == -1)
			newfile.readaccess.push(newuser);
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
			result = true;
		cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function File_RemReadAccess(filename,remuser,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		var i = newfile.readaccess.indexOf(remuser);
		if(i != -1)
			newfile.readaccess.splice(i, 1);
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
			result = true;
		cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function File_AddWriteAccess(filename,newuser,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		if (newfile.writeaccess.indexOf(newuser) == -1)
			newfile.writeaccess.push(newuser);
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
			result = true;
		cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function File_RemWriteAccess(filename,remuser,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		var i = newfile.writeaccess.indexOf(remuser);
		if(i != -1)
			newfile.writeaccess.splice(i, 1);
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
			result = true;
		cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function File_AddGroupReadAccess(filename,newgroup,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		if (newfile.groupreadaccess.indexOf(newgroup) == -1)
			newfile.groupreadaccess.push(newgroup);
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
		{
			result = true;
		}
		cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function File_RemGroupReadAccess(filename,remgroup,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body)
	{
		if (!err1)
		{
			newfile = body;
			var i = newfile.groupreadaccess.indexOf(remgroup);
			if(i != -1)
				newfile.groupreadaccess.splice(i, 1);
			blah.insert(newfile, filename, function(err2, body) {
			if(!err2)
				result = true;
			cb(err2,result);
			});
		}
		else
			cb(err1,result);
	});
}

function File_AddGroupWriteAccess(filename,newgroup,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		if (newfile.groupwriteaccess.indexOf(newgroup) == -1)
			newfile.groupwriteaccess.push(newgroup);
		blah.insert(newfile, filename, function(err2, body)
		{
			if(!err2)
				result = true;
			cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function File_RemGroupWriteAccess(filename,remgroup,cb)
{
	var result = false;
	var newfile = {type: "publication", "author": "", "isPublic":"","readaccess":"","writeaccess":"","groupreadaccess":[],"groupwriteaccess":[],"publicationDate":"","lastModified":"","language":"","tags":"","notes":"","text":""};
	blah.get(filename, { revs_info: true }, function(err1, body) {
	if (!err1)
	{
		newfile = body;
		var i = newfile.groupwriteaccess.indexOf(remgroup);
		if(i != -1)
			newfile.groupwriteaccess.splice(i, 1);
		blah.insert(newfile, filename, function(err2, body) {
		if (!err2)
			result = true;
		cb(err2,result);
		});
	}
	else
		cb(err1,result);
	});
}

function Group_Create(groupname,owner,cb)
{
	blah.insert({"owner": owner,"type": "group","members": [owner], "pendingmembers":[]}, owner+"/groups/"+groupname, function(err, body) {
	var result = false;
	if (!err)
	{
		var newbody = {"type": "user","password": "","grouplist":[],"joinDate": "","website": "","affiliation": "","email": "","following": [],"friends": []}
		blah.get(owner, { revs_info: true }, function(err3, body3) {
		if (!err3)
		{
			newbody = body3;
			//console.log(newbody);
			newbody.grouplist.push(owner+"/groups/"+groupname);
			blah.insert(newbody, owner, function(err4, body4) {
			if (!err4)
			{
				console.log("successfully edited user grouplist");
				result = true;
				cb(err4,result);
			}
			else
			{
				cb(err4,result);
				//console.log(err4);
			}
			});
		}
		else
		{
			cb(err3,result);
			//console.log(err3);
		}
		});
		result = true;
	}
	cb(err,result);
	});
}

function Group_ViewUsers(groupname,cb)
{
        console.log("groupviewusers");
        var result;
        try
        {
                blah.get(groupname, {revs_info:true}, function(err1,body1){
                        if(!err1)
                        {
                                result = {pendingmembers:body1.pendingmembers, members:body1.members};
                        }
                        else
                        {
                                result = false;

                        }
                        cb(err1,result);
                });
        }
        catch(err)
        {
                console.log("viewgroupusers failed");
                cb(err,result);
        }
}

function Group_Destroy(groupname,cb)
{
        console.log("groupname "+groupname);

        try
        {
	        blah.get(groupname, { revs_info: true }, function(err1, body1) {
                        //first remove group from grouplist of all members
                        body1.members.forEach(function(member) {
                                blah.get(member, {revs_info: true}, function(err2, body2) {
                                        body2.grouplist.splice(body2.grouplist.indexOf(groupname),1);
                                        blah.insert(body2, member, function(err3, body3) {
                                                if(err3)
                                                {
                                                        console.log("error deleting from grouplist of member. proceeding...");
                                                }
                                        });
                                });
                        });
	                blah.destroy(groupname, body1._rev, function(err3, body3) {
	                        var result = false;
	                        if (!err3)
		                        result = true;
	                        cb(err3,result);
	                });
	        });
        }
        catch(err)
        {
                console.log("couldn't find group");
                cb(err,null);
        }
}

function Group_AddPendingUser(groupname,newuser,cb)
{
        var result = false;
        try
        {
                blah.get(groupname, { revs_info: true }, function(err1, body1) {
                        if(!err1)
                        {
                                updatedGroup = body1;
                                try{updatedGroup.pendingmembers.push(newuser);}
                                catch(err) {console.log("no pending members field?");}
                                //push updated group to db
                                blah.insert(updatedGroup, groupname, function(err2, body2) {
                                        if(!err2)
                                        {
                                                //everything's okay, i guess?
                                                result = true;
                                                cb(err2, result);
                                        }
                                        else
                                        {
                                                console.log("error when pushing updated group with pending members");
                                                cb(err2, result);
                                        }
                                });
                        }
                        else
                        {
                                console.log("error retrieving group to add pending members");
                                cb(err1, result);
                        }
                });
        }
        catch(err)
        {
                console.log("couldn't find group");
                cb(err,null);
        }
}

function Group_ConfirmUser(groupname,newuser,cb)
{
        console.log("couch_module confirmuser"+newuser);
	var result = false;
        try
        {
	        blah.get(groupname, { revs_info: true }, function(err1, body1) {
	                if (!err1)
	                {
		                updatedGroup = body1;
                                userIndex = updatedGroup.pendingmembers.indexOf(newuser)
		                if(userIndex>-1)
                                {
                                        //add to members
                                        try{updatedGroup.members.push(newuser);}
                                        catch(err) {console.log("no  members field?");}
                                        //remove from pending members
                                        updatedGroup.pendingmembers.splice(userIndex,1);
		                        blah.insert(updatedGroup, groupname, function(err2, body2) {
		                                var result = false;
		                                if (!err2)
		                                {
			                                //adding to user grouplist
			                                var newbody = {"type": "user","password": "","grouplist":[],"joinDate": "","website": "","affiliation": "","email": "","following": [],"friends": []}
			                                blah.get(newuser, { revs_info: true }, function(err3, body3) {
			                                if (!err3)
			                                {
				                                newbody = body3;
				                                console.log(newbody);
				                                try {
                                                                newbody.grouplist.push(groupname);
                                                                for(var i=0;i<newbody.notifications.length;i++)
                                                                {
                                                                        if((newbody.notifications[i].type=="GROUP_INVITE")&&(newbody.notifications[i].groupname==groupname))
                                                                        {
                                                                                newbody.notifications.splice(i,1);
                                                                                break;
                                                                        }
                                                                }
                                                                }
				                                catch(err) { console.log("things have gone terribly wrong."); }
				                                blah.insert(newbody, newuser, function(err4, body4) {
				                                if (!err4)
				                                {
					                                console.log("successfully edited user grouplist");
					                                result = true;
					                                cb(err4,result);
				                                }
				                                else
				                                {
					                                cb(err4,result);
					                                console.log(err4);
				                                }
				                                });
			                                }
			                                else
			                                {
				                                cb(err3,result);
				                                console.log(err3);
			                                }
			                                });
			                                //result = true;
		                                }
		                                else
		                                {
			                                cb(err2,result);
			                                console.log(err2);
		                                }
		                        });
                                }
                                else
                                {
                                        cb("error: no such pending member", result);
                                }
	                }
	                else
	                {
		                cb(err1,result);
		                console.log("can't find group?????");
		                console.log(err1);
	                }
	        });
        }
        catch(err)
        {
                console.log("unable to find group");
                cb(err,null);
        }
}

function Group_RejectUser(groupname,username,cb)
{
        var result=false;
        blah.get(groupname,{revs_info:true},function(err1,body1){
                if(!err1)
                {
                        userIndex = body1.pendingmembers.indexOf(username);
                        if(userIndex>-1)
                        {
                                body1.pendingmembers.splice(userIndex,1);
                        }
                        blah.insert(body1,groupname,function(err2,body2) {
                                if(!err2)
                                {
                                        blah.get(username,{revs_info:true},function(err3,body3){
                                                if(!err3)
                                                {
                                                        try
                                                        {
                                                                var newbody = body3;
                                                                try{
                                                                for(var i=0;i<newbody.notifications.length;i++)
                                                                {
                                                                        if((newbody.notifications[i].type=="GROUP_INVITE")&&(newbody.notifications[i].groupname==groupname))
                                                                        {
                                                                                newbody.notifications.splice(i,1);
                                                                                break;
                                                                        }
                                                                }
                                                                console.log(newbody);
                                                                }
                                                                catch(err){console.log(err)}
                                                                blah.insert(newbody,username,function(err4,body4){
                                                                        if(!err4)
                                                                        {
                                                                                result = true;
                                                                                cb(err4,result);
                                                                        }
                                                                        else
                                                                        {
                                                                                console.log(err4);
                                                                                cb(err4,result);
                                                                        }
                                                                })
                                                        }
                                                        catch(err){console.log(err);}
                                                }
                                                else
                                                {
                                                        cb(err3,result);
                                                }
                                        })
                                }
                                else
                                {
                                        cb(err2,result);
                                }
                        })
                }
                else
                {
                        cb(err1,result);
                }
        });
}

function Group_RemoveUser(groupname,remuser,cb)
{
	var newfile = {"owner": "","type": "group","members": []};
	var index = -1;
	blah.get(groupname, function(err, body) {
	if (!err)
	{
		newgroup = body;
		try{
		for(i=0;i<newgroup.members.length;i++)
		{
			if(newgroup.members[i] == remuser)
			{
				index = i;
				break;
			}
		}
		if (index > -1)
		{
			newgroup.members.splice(index, 1);
		}
		}
		catch(err) { console.log("things have gone terribly wrong."); }
		blah.insert(newgroup, groupname, function(err, body) {
		var result = false;
		if(!err)
		{
			//remove group from user list
			var newbody = {"type": "user","password": "","grouplist":[],"joinDate": "","website": "","affiliation": "","email": "","following": [],"friends": []};
			blah.get(remuser, { revs_info: true }, function(err1, body) {
			if (!err1)
			{
				newbody = body;
				try{
				for(i=0;i<newbody.grouplist.length;i++)
				{
					if(newbody.grouplist[i] == groupname)
					{
						index = i;
						break;
					}
				}
				if (index > -1)
				{
					newbody.grouplist.splice(index, 1);
				}
				}
				catch(err) { console.log("things have gone terribly wrong."); }
				blah.insert(newbody, remuser, function(err2, body) {
				if (!err2)
				{
					result = true;
				}
				});
			}
			});
			//result = true;
		}
		cb(err,result);
		});
	}
	});
}

function Group_CheckUser(groupname,checkuser,cb)
{
	var newfile = {"owner": "","type": "group","members": []};
	var found = false;
	blah.get(groupname, function(err, body) {
	if (!err)
	{
		newgroup = body;
		for(i=0;i<newgroup.members.length;i++)
		{
			if(newgroup.members[i] == checkuser)
			{
				found = true;
				break;
			}
		}
	}
	cb(err,found);
	});
}

function Group_CheckOwner(groupname,checkowner,cb)
{
	var found = false;
	blah.get(groupname, function(err, body) {
	        if (!err)
	        {
		        newgroup = body;
                        console.log("newgroup owner "+newgroup.owner);
                        console.log("checkowner "+checkowner);
		        if(newgroup.owner == checkowner)
			        found = true;
	        }
                else
                {
                        console.log(groupname);
                        console.log("checkowner error"+err);
                }
	        cb(err,found);
	});
}

function Group_CheckReadAccessFile(groupname, filename, cb)
{
	var response = [];
	blah.view("gibbertest", "groupreadaccessfile", {"key":[groupname,filename]},function(err, body) {
	if(!err)
	{
		body.rows.forEach(function(doc) {response.push(doc.value);});
	}
	cb(err,response);
	});
}

function Group_CheckWriteAccessFile(groupname, filename, cb)
{
	var response = [];
	blah.view("gibbertest", "groupwriteaccessfile", {"key":[groupname,filename]},function(err, body) {
	if(!err)
	{
		body.rows.forEach(function(doc) {response.push(doc.value);});
	}
	cb(err,response);
	});
}
