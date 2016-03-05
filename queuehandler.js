/* jshint node: true, couch: true, esversion: 6 */
/*eslint no-undef: 0, no-unused-vars: 0*/


var couch_module = require("./couch_module.js");
var queue = require("queue");
 
var q = queue();

function user_obj()
{
	this.create = User_Create;
	this.destroy = User_Destroy;
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
	this.destroy = Group_Destroy;
	this.adduser = Group_AddUser;
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

var queuehandler = {
	user : user,
	group : group,
	file : file
};

module.exports = queuehandler;

var isempty = true;

q.concurrency = 1;
q.timeout = 3000; 


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
		isempty = !isempty;
		q.start(function(err) {/*console.log('all done:');*/});
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
function User_Create(username,password,date,cb)
{
	q.push(function(queuecb){couch_module.user.create(username,password,date,(err,response) => {cb(err,response); queuecb();});});
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
 * Retrieves info for a specified user.
 * Response format: User info document. 
 * @param {string} username - The name of the user whose info is to be retrieved.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function User_CheckInfo(username,cb)
{
	q.push(function(queuecb){couch_module.user.checkinfo(username,(err,response) => {cb(err,response); queuecb();});});
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
function File_Publish(username,filename,text,date,language,tags,notes,cb)
{
	q.push(function(queuecb){couch_module.file.publish(username,filename,text,date,language,tags,notes,(err,response) => {cb(err,response); queuecb();});});
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
function File_SetMetadata(filename,newlanguage,newtags,newnotes,cb)
{
	q.push(function(queuecb){couch_module.file.setmetadata(filename,newlanguage,newtags,newnotes,(err,response) => {cb(err,response); queuecb();});});
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
 * Adds a user to an existing group.
 * Response format: true if successful, false if failed.
 * @param {string} groupname - The name of the group.
 * @param {string} newuser - The name of the user to be added.
 * @param {function} cb - The callback function in the form of cb(err,response).
 */
function Group_AddUser(groupname,newuser,cb)
{
	q.push(function(queuecb){couch_module.group.adduser(groupname,newuser,(err,response) => {cb(err,response); queuecb();});});
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


