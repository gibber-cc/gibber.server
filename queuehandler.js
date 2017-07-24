/* jshint node: true, couch: true, esversion: 6 */
/*eslint no-undef: 0, no-unused-vars: 0*/


var couch_module = require("./couch_module.js");
var queue = require("queue");

var q = queue();

function user_obj()
{
	this.create = User_Create;
	this.destroy = User_Destroy;
        this.notify = User_Notify;
        this.getnotifications = User_GetNotifications;
        this.sendfriendrequest = User_SendFriendRequest;
        this.acceptfriendrequest = User_AcceptFriendRequest;
        this.rejectfriendrequest = User_RejectFriendRequest;
        this.removefriend = User_RemoveFriend;
        this.follow = User_Follow;
        this.unfollow = User_Unfollow;
        this.notifyfollowers = User_NotifyFollowers;
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
        this.confirmuser = Group_ConfirmUser;
        this.rejectuser = Group_RejectUser;
	this.addpendinguser = Group_AddPendingUser;
	this.removeuser = Group_RemoveUser;
	this.checkuser = Group_CheckUser;
	this.checkowner = Group_CheckOwner;
	this.checkreadaccessfile = Group_CheckReadAccessFile;
	this.checkwriteaccessfile = Group_CheckWriteAccessFile;
}

function file_obj()
{
	this.publish = File_Publish;
        this.fork = File_Fork;
	this.edit = File_Edit;
	this.setmetadata = File_SetMetadata;
	this.setispublic = File_SetIsPublic;
        this.like = File_Like;
        this.unlike = File_Unlike;
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

var queuehandler = {
	user : user,
	group : group,
	file : file
};

module.exports = queuehandler;

var isempty = true;

q.concurrency = 1;
q.timeout = 3000;

q.on('success', function(result, job) {
  if(q.length == 0)
  	isempty = true;
  //console.log('job finished processing:', job.toString().replace(/\n/g, ''));
});


q.on("timeout", function(next, job)
		{
			console.log("job timed out:", job.toString().replace(/\n/g, ""));
			next();
		});

/*
 * This function is called automatically after pushing each task into the queue to ensure it is running.
 */
function ensurequeue()
{
	if(isempty)
	{
		isempty = false;
		q.start(function(err) {/*console.log('all done:');*/});
		//console.log("triggering ensurequeue");
	}
}

/* These functions act as a wrapper for the tasks defined in couch_module.js by pushing them into the queue and starting it with ensurequeue() */

/**
 * Creates a new user.
 * Response format: true if successful, false if failed.
 * @param {string} username - The name of the user to be created.
 * @param {string} password - The password of the user to be created.
 * @param {string} date - The current date.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_Create(username,password,date,email,website,affiliation,cb)
{
	q.push(function(queuecb){couch_module.user.create(username,password,date,email,website,affiliation,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Deletes a specified user.
 * Response format: true if successful, false if failed.
 * @param {string} username - The name of the user to be deleted.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_Destroy(username,cb)
{
	q.push(function(queuecb){couch_module.user.destroy(username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Notifies a specified user.
 * Response format: true if successful, false if failed.
 * @param {string} username - The name of the user to be notified.
 * @param {JSON} notificationdata - The notification data in JSON format.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_Notify(username,notificationdata,cb)
{
	q.push(function(queuecb){couch_module.user.notify(username,notificationdata,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Retrieves notifications for a specified user.
 * Response format: true if successful, false if failed.
 * @param {string} username - The name of the user
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_GetNotifications(username,cb)
{
	q.push(function(queuecb){couch_module.user.getnotifications(username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Adds two users to each other's friend lists
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the first user
 * @param {string} username1 - The name of the second user
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_DeleteAllNotifications(username,cb)
{
	q.push(function(queuecb){couch_module.user.deleteallnotifications(username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Sends friend request from username1 to username2
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user sending the request
 * @param {string} username2 - The name of the user to whom the request is being sent
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_SendFriendRequest(username1,username2,cb)
{
	q.push(function(queuecb){couch_module.user.sendfriendrequest(username1,username2,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Accepts friend request sent from username1 to username2
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user who sent the request
 * @param {string} username2 - The name of the user to whom the request is being sent
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_AcceptFriendRequest(username1,username2,cb)
{
	q.push(function(queuecb){couch_module.user.acceptfriendrequest(username1,username2,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Rejects friend request sent from username1 to username2
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user who sent the request
 * @param {string} username2 - The name of the user to whom the request is being sent
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_RejectFriendRequest(username1,username2,cb)
{
	q.push(function(queuecb){couch_module.user.rejectfriendrequest(username1,username2,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Removes a friend username2 from username1's friend list
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user who wants to remove a friend
 * @param {string} username2 - The name of the user who is to be removed
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_RemoveFriend(username1,username2,cb)
{
	q.push(function(queuecb){couch_module.user.removefriend(username1,username2,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Makes username1 a follower of username2
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user who requested the follow
 * @param {string} username2 - The name of the user who is to be followed
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_Follow(username1,username2,cb)
{
	q.push(function(queuecb){couch_module.user.follow(username1,username2,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Makes username1 no longer a follower of username2
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user who requested the unfollow
 * @param {string} username2 - The name of the user who is to be unfollowed
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_Unfollow(username1,username2,cb)
{
	q.push(function(queuecb){couch_module.user.unfollow(username1,username2,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Makes username1 no longer a follower of username2
 * Response format: true if successful, false if failed.
 * @param {string} username1 - The name of the user who requested the unfollow
 * @param {string} username2 - The name of the user who is to be unfollowed
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_NotifyFollowers(username,notificationdata,cb)
{
	q.push(function(queuecb){couch_module.user.notifyfollowers(username,notificationdata,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}


/**
 * Retrieves info for a specified user.
 * Response format: User info document.
 * @param {string} username - The name of the user whose info is to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckInfo(username,cb)
{
	//console.log("triggering queuepush of user_checkinfo");
	q.push(function(queuecb){couch_module.user.checkinfo(username,(err,response) => {cb(err,response); queuecb();});});
	console.log(q.length);
	ensurequeue();
}

/**
 * Changes password for a specified user.
 * Response format: true if successful, false if failed.
 * @param {string} username - The name of the user whose password is to be changed.
 * @param {string} newpwd - The new password.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_ChangePassword(username,newpwd,cb)
{
	q.push(function(queuecb){couch_module.user.create(username,newpwd,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Checks if the specified user is the owner of the specified file.
 * Response format: true if authorship verified, false otherwise.
 * @param {string} username - The name of the user.
 * @param {string} filename - The name of the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckIfAuthor(username,filename,cb)
{
	q.push(function(queuecb){couch_module.user.checkifauthor(username,filename,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Checks if the specified user or any groups they belong to are in the file's readaccess lists.
 * Response format: true if access verified, false otherwise.
 * @param {string} username - The name of the user.
 * @param {string} filename - The name of the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_AuthorizeRead(username,filename,cb)
{
	q.push(function(queuecb){couch_module.user.authorizeread(username,filename,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Checks if the specified user or any groups they belong to are in the file's writeaccess lists.
 * Response format: true if access verified, false otherwise.
 * @param {string} username - The name of the user.
 * @param {string} filename - The name of the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_AuthorizeWrite(username,filename,cb)
{
	q.push(function(queuecb){couch_module.user.authorizewrite(username,filename,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Return all files that a specified user can read.
 * Response format: Associative array of files.
 * @param {string} username - The name of the user whose readable files are to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckReadAccessAll(username,cb)
{
	q.push(function(queuecb){couch_module.user.checkreadaccessall(username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Return all files that a specified user can write.
 * Response format: Associative array of files.
 * @param {string} username - The name of the user whose writable files are to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckWriteAccessAll(username,cb)
{
	q.push(function(queuecb){couch_module.user.checkwriteaccessall(username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Return a specific file if the specified user can read it.
 * Response format: Associative array of files.
 * @param {string} username - The name of the user attempting to read the file.
 * @param {string} filename - The name of the file to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckReadAccessFile(username,filename,cb)
{
	q.push(function(queuecb){couch_module.user.checkreadaccessfile(username,filename,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Return a specific file if the specified user can write to it.
 * Response format: Associative array of files.
 * @param {string} username - The name of the user attempting to write to the file.
 * @param {string} filename - The name of the file to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckWriteAccessFile(username,filename,cb)
{
	q.push(function(queuecb){couch_module.user.checkwriteaccessfile(username,filename,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Creates a new file.
 * Response format: true if successful, false if failed.
 * @param {string} username - The name of the user creating the file
 * @param {string} filename - The name of the file to be created.
 * @param {string} text - The contents of the file.
 * @param {string} date - The current date.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_Publish(username,filename,text,date,ispublic,language,tags,notes,cb)
{
	q.push(function(queuecb){couch_module.file.publish(username,filename,text,date,ispublic,language,tags,notes,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Forks an existing file.
 * Response format: filedata if successful, false if failed.
 * @param {string} username - The name of the user requesting the fork
 * @param {string} newname - The new name of the file. Should be null if forking another user's file
 * @param {string} filename - The name of the file to be forked.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_Fork(username,newname,filename,cb)
{
	q.push(function(queuecb){couch_module.file.fork(username,newname,filename,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Edits the text in an existing file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the file to be edited.
 * @param {string} newtext - The new contents of the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_Edit(filename,newtext,cb)
{
	q.push(function(queuecb){couch_module.file.edit(filename,newtext,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Edits the metadata of an existing file [currently language,tags and notes]
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the file to be edited.
 * @param {string} newlanguage - The new language of the file.
 * @param {array} tags - The new tags to be added to the file. Pass this as an array of string(s).
 * @param {string} newnotes - The new notes of the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_SetMetadata(filename,newlanguage,newtags,newnotes,ispublic,isautoplay,cb)
{
	q.push(function(queuecb){couch_module.file.setmetadata(filename,newlanguage,newtags,newnotes,ispublic,isautoplay,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Sets a file as publicly viewable by anyone.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} newuser - The name of the user to be granted permission.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_SetIsPublic(filename,isPublic,cb)
{
	q.push(function(queuecb){couch_module.file.setispublic(filename,ispublic,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Like a file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} username - The name of the user liking the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_Like(filename,username,cb)
{
	q.push(function(queuecb){couch_module.file.like(filename,username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Unlike a file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} username - The name of the user unliking the file.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_Unlike(filename,username,cb)
{
	q.push(function(queuecb){couch_module.file.unlike(filename,username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Grants a user read access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} newuser - The name of the user to be granted permission.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_AddReadAccess(filename,newuser,cb)
{
	q.push(function(queuecb){couch_module.file.addreadaccess(filename,newuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Revokes a user's read access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} remuser - The name of the user whose permission is to be revoked
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_RemReadAccess(filename,remuser,cb)
{
	q.push(function(queuecb){couch_module.file.remreadaccess(filename,remuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Grants a user write access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} newuser - The name of the user to be granted permission.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_AddWriteAccess(filename,newuser,cb)
{
	q.push(function(queuecb){couch_module.file.addwriteaccess(filename,newuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Revokes a user's write access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} remuser - The name of the user whose permission is to be revoked
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_RemWriteAccess(filename,remuser,cb)
{
	q.push(function(queuecb){couch_module.file.remwriteaccess(filename,remuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Grants a group read access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} newgroup - The name of the group to be granted permission.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_AddGroupReadAccess(filename,newgroup,cb)
{
	q.push(function(queuecb){couch_module.file.addgroupreadaccess(filename,newgroup,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Revokes a group's read access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} remuser - The name of the group whose permission is to be revoked
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_RemGroupReadAccess(filename,remgroup,cb)
{
	q.push(function(queuecb){couch_module.file.remgroupreadaccess(filename,remgroup,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Grants a group write access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} newgroup - The name of the group to be granted permission.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_AddGroupWriteAccess(filename,newgroup,cb)
{
	q.push(function(queuecb){couch_module.file.addgroupwriteaccess(filename,newgroup,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Revokes a group's write access permissions for the specified file.
 * Response format: true if successful, false if failed.
 * @param {string} filename - The name of the relevant file.
 * @param {string} remuser - The name of the group whose permission is to be revoked
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function File_RemGroupWriteAccess(filename,remgroup,cb)
{
	q.push(function(queuecb){couch_module.file.remgroupwriteaccess(filename,remgroup,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Creates a new group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group to be created.
 * @param {string} owner - The owner of the group to be created.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_Create(groupname,owner,cb)
{
	q.push(function(queuecb){couch_module.group.create(groupname,owner,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Views the users belonging to a group.
 * Response format: object with two arrays for pending and confirmed members.
 * @param {string} groupname - The name of the group to be created.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_ViewUsers(groupname,cb)
{
	q.push(function(queuecb){couch_module.group.viewusers(groupname,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Deletes the specified group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group to be deleted.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_Destroy(groupname,cb)
{
	q.push(function(queuecb){couch_module.group.destroy(groupname,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Confirms a pending user in an existing group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} newuser - The name of the user to be confirmed.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_ConfirmUser(groupname,newuser,cb)
{
	q.push(function(queuecb){couch_module.group.confirmuser(groupname,newuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Removes a pending user's invitation to an existing group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} username - The name of the user whose invitation is to be removed
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_RejectUser(groupname,username,cb)
{
	q.push(function(queuecb){couch_module.group.rejectuser(groupname,username,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Adds a pending user to an existing group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} newuser - The name of the user to be added.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_AddPendingUser(groupname,newuser,cb)
{
	q.push(function(queuecb){couch_module.group.addpendinguser(groupname,newuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Removes a user from an existing group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} remuser - The name of the user to be removed.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_RemoveUser(groupname,remuser,cb)
{
	q.push(function(queuecb){couch_module.group.removeuser(groupname,remuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Checks if the specified user is a member of a group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} checkuser - The name of the user to be checked.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_CheckUser(groupname,checkuser,cb)
{
	q.push(function(queuecb){couch_module.group.checkuser(groupname,checkuser,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Checks if the specified user is the owner of a group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} checkuser - The name of the user to be checked.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_CheckOwner(groupname,checkowner,cb)
{
	q.push(function(queuecb){couch_module.group.checkowner(groupname,checkowner,(err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Return a specific file if the specified group can read it.
 * Response format: Associative array of files.
 * @param {string} groupname - The name of the group attempting to read the file.
 * @param {string} filename - The name of the file to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_CheckReadAccessFile(groupname, filename, cb)
{
	q.push(function(queuecb){couch_module.group.checkreadaccessfile(groupname, filename, (err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}

/**
 * Return a specific file if the specified group can write to it.
 * Response format: Associative array of files.
 * @param {string} groupname - The name of the group attempting to write to the file.
 * @param {string} filename - The name of the file to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_CheckWriteAccessFile(groupname, filename, cb)
{
	q.push(function(queuecb){couch_module.group.checkwriteaccessfile(groupname, filename, (err,response) => {cb(err,response); queuecb();});});
	ensurequeue();
}
