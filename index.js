// NOTE: COOKIES DON'T WORKING USING LOCALHOST, MUST USE 127.0.0.1.
// node node_modules/gibber.server 8080 '/www/gibber.libraries/'
var request         = require( 'request' ),
    connect         = require( 'connect' ),
    url             = require( 'url' ),
    fs              = require( 'fs' ),
    passport        = require( 'passport' ),
    express         = require( 'express' ),
    sharejs         = require( 'share' ),
    queuehandler    = require("./queuehandler.js"),
    shareCodeMirror = require( 'share-codemirror'),
    app             = express(),
    RedisStore      = require( 'connect-redis' )( express ),
    server          = require( 'http' ).createServer( app ),
    util            = require( 'util' ),
    LocalStrategy   = require( 'passport-local' ).Strategy,
    queryString     = require( 'querystring' ),
    //rtc             = require( './gibber_rtc.js' )( server, process.argv[4] ),
    nodemailer      = require( 'nodemailer' ),
    nano            = require("nano")("http://admin:admin@localhost:5984");
    blah            = nano.db.use("gibbertest");
    ssePusher       = require( 'sse-pusher'),
    pusher          = new ssePusher(),
    changesStream   = require('changes-stream'),
    transporter     = nodemailer.createTransport(),
    webServerPort   = process.argv[2] || 80, //second argument passed to command
    serverRoot      = process.argv[3] || __dirname + '/../../',
    users           = [],
    clients         = [],
    _url            = 'http://127.0.0.1:5984/gibbertest',
    designURI       = 'http://127.0.0.1:5984/gibbertest/_design/gibbertest/',
    searchURL       = 'http://127.0.0.1:5984/_fti/local/gibber/_design/fti/';

function initializeFeed()
{
        var changes = new changesStream({db:'http://127.0.0.1:5984/gibbertest',feed:'continuous',since:"now",include_docs:true});
        changes.on('readable', function() {
                var change = changes.read();
                if(change.doc.type == 'user')
                {
                        for(i=0;i<users.length;i++)
                        {
                                if(change.doc._id == users[i].username)
                                {
                                        //emit SSE
                                        console.log("SSE emitted for "+users[i].username);
                                        //console.log(clients[users[i].username].pusher.toString());
                                        clients[users[i].username].pusher(change.doc.notifications);
                                }
                        }
                }
        });
}

function findById(id, fn) {
  var idx = id;
  if (users[idx])
  {
    //console.log("deserialize returning not null")
    fn(null, users[idx]);
  }
  else {
    fn( null, null )
    //console.log("deserialize returning null")
  }
}

function findByUsername(username, fn)
{
	//console.log("searching for "+username);
	queuehandler.user.checkinfo(username,
	function(err,response)
	{
		if(response && !err)
		{
			//console.log("user has been found");
			var user = { username:response._id, password: response.password, id:users.length } // MUST GIVE A USER ID FOR SESSION MAINTENANCE
			//console.log(user);
			users.push( user )
			//console.log(users);
			return fn( null, user );
		}
		else
		{
			//console.log("user has not been found");
			return fn( null, null );
		}
    	});
}

/*TODO add tag functionality to couch_module (added to file_publish) then come back and stare at this*/
function findByTag( tag, fn ) {
   request(
    { uri:designURI + '_view/tagged', json: true },
    function(e,r,b) {
      // console.log(b.rows)
      var results = []
      if(b.rows && b.rows.length > 0) {
        for( var i = 0; i < b.rows.length; i++ ) {
          var row = b.rows[ i ]

          if( row.value.indexOf( tag ) > -1 ) results.push( row.key )
        }
      }
      return results
    }
  )
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser( function(user, done) {
 // console.log("serializing");
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  //console.log("deserializing atempt");
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        //console.log( user, username, password )
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Unknown user ' + username });
        }
        if (user.password != password) {
          return done(null, false, { message: 'Invalid password' });
        }
        return done(null, user);
      })
  }
));

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', ["http://127.0.0.1:8080"]);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
   // res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'false')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept')
  next();
}

var checkForREST = function( req, res, next ) {
  var arr = req.url.split('/');
  if( arr[1] === 'gibber' ) {
    arr.shift(); arr.shift(); // get rid of first two elements, the first / and gibber/
    var url = escapeString( arr.join('/') )
    request('http://127.0.0.1:5984/gibber/'+ url, function(err, response, body) {
      res.send( body )
      // res.redirect( 'http://gibber.mat.ucsb.edu/?url='+url, { loadFile: body } )
    })
  }else{
    next()
  }
}

var checkForVersion = function( req, res, next ) {
  var version = null,
      search = /\/(v(\d+))/.exec( req.originalUrl )

  if( search && search.length !== 0 ) {
    version = search[2]
    remove = search[1]

    req.url = req.url.slice( remove.length + 1 ) // remove version string from URL
  }

  req.gibberVersion = version

  next()
}

var entityMap = { "&": "%26", "'": '%27', "/": '%2F' };

function escapeString( string ) {
  return String( string ).replace(/[&<>"'\/]/g, function ( s ) {
    return entityMap[ s ];
  });
}

// var app = express();
var oneDay = 86400000;
app.engine('htm', require('ejs').renderFile);
app.configure( function() {
  app.set('views', serverRoot)
  app.set('view engine', 'ejs')
  //app.use(express.logger())
  app.use( express.cookieParser() )
  //app.use(express.methodOverride())
  app.use( express.session({ secret:'gibber gibberish gibbering'}) )
  //{ /* */ secret: 'gibber gibberish gibbering', expires:false, maxAge:10000000000 }) )
  app.use( express.bodyParser() )

  app.use( passport.initialize() )
  app.use( passport.session() )

  app.use( allowCrossDomain )

  app.use( checkForVersion )

  app.use( app.router )

  app.use( checkForREST )

  app.use( express.static( sharejs.scriptsDir ) )
  // serve share codemirror plugin
  app.use( express.static( shareCodeMirror.scriptsDir ) )

  app.use( express.static( serverRoot/*, { maxAge:oneDay } */ ) )

  app.use(function(err, req, res, next){
    console.error(err.stack);
    res.send(500, 'Something broke!');
  });

  //server sent events
  //app.use(pusher.handler('/notifications'));
})

app.get( '/', function(req, res){
  var path, version = null

  if( req.query ) {
    if( req.query.path || req.query.p ) {
      path = req.query.path || req.query.p
      if( path.indexOf('/publications') === -1 ) { // shorthand to leave publications out of url
        var arr = path.split( '/' )

        path = arr[0] + '/publications/' + arr[1]
      }

      request('http://127.0.0.1:5984/gibber/' + escapeString( path ), function(err, response, body) {
        var _body = JSON.parse( body )
        if( body && typeof body.error === 'undefined' ) {
          res.render( 'index', { loadFile:body, isInstrument:_body.isInstrument || 'false', gibberVersion: req.gibberVersion } )
        }else{
          res.render( 'index', { loadFile: JSON.stringify({ error:'path not found' }) })
        }
      })
    }else if( req.query.i ) {
      path = req.query.i

      if( path.indexOf('/publications') === -1 ) { // shorthand to leave publications out of url
        var arr = path.split( '/' )

        path = arr[0] + '/publications/' + arr[1]
      }

      request('http://127.0.0.1:5984/gibber/' + escapeString( path ), function(err, response, body) {
        var _body = JSON.parse( body )
        if( body && typeof body.error === 'undefined' ) {
          res.render( 'index', { loadFile:body, isInstrument:true, gibberVersion: req.gibberVersion } )
        }else{
          res.render( 'index', { loadFile: JSON.stringify({ error:'path not found' }) })
        }
      })
    }else if( req.query.u || req.query.user ) {
      path = req.query.u || req.query.user

      request( designURI + '_view/publications?key=%22'+path+'%22', function(e,r,_b) {
        res.render( 'instrumentBrowser', {
          user: path,
          userfiles:(JSON.parse(_b)).rows,
        });
      })
    }else{
      res.render( 'index', { loadFile:'null', isInstrument:'false', gibberVersion: req.gibberVersion } )
    }
  }
  // fs.readFile(serverRoot + "index.htm", function (err, data) {
  //   if (err) {
  //     next(err);
  //     return;
  //   }
  //   res.writeHead( 200, {
  //     'Content-Type': 'text/html',
  //     'Content-Length': data.length
  //   })

  //   res.end( data )
  // })
})

app.get( '/notifications', ( req, res, next ) => {
        var username = req.param('username');
        console.log(username);
        if(username!=undefined)
        {
                console.log(username+" has requested notifications. storing their pusher and handler now.");
                // create client-specific sse stream
                clients[username].pusher = ssePusher();
                // store sse middleware for client
                //req.client.handler = req.client.pusher.handler()
                clients[username].handler = clients[username].pusher.handler();
                // pass event stream object
                clients[username].handler( req, res, next )
                queuehandler.user.getnotifications(username, function(err,response) {
                        clients[username].pusher(response);
                });
        }
} )

app.post( '/userreadaccessall', function( req, res ) {
	if(!(req.isAuthenticated()))
	{
		res.send({ success:false, error:'you are not currently logged in.' })
	}
        else
        {
	        request({ uri:designURI + '_view/userreadaccessall', json: true }, function(e,r,b)
	        {
		        var results = []
		        if(b.rows && b.rows.length > 0)
		        {
			        for( var i = 0; i < b.rows.length; i++ )
			        {
				        var row = b.rows[ i ];
				        if( row.key.indexOf( req.user.username ) > -1 )
					        results.push( row.value )
			        }
		        }
                	res.send({ success:true, results: results })
	        });
        }
})

app.post( '/userwriteaccessall', function( req, res ) {
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	request({ uri:designURI + '_view/userwriteaccessall', json: true }, function(e,r,b)
	{
		var results = [];
		if(b.rows && b.rows.length > 0)
		{
			for( var i = 0; i < b.rows.length; i++ )
			{
				var row = b.rows[ i ];
				if( row.key.indexOf( req.user.username ) > -1 )
					results.push( row.value )
			}
		}
		res.send({ success:true, results: results })
      });
})

app.post( '/userreadaccessfile', function( req, res ) {
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	request({ uri:designURI + '_view/userreadaccessfile', json: true }, function(e,r,b)
	{
                console.log(req.body);
		var results = []
		if(b.rows && b.rows.length > 0)
		{
			for( var i = 0; i < b.rows.length; i++ )
			{
				var row = b.rows[ i ];
				if(( row.key[0] == req.user.username)&&(row.key[1] == req.body.filename))
					results.push( row.value )
			}
		}
		res.send({ success:true, results: results })
	});
})

app.post( '/userwriteaccessfile', function( req, res ) {
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	request({ uri:designURI + '_view/userwriteaccessfile', json: true }, function(e,r,b)
	{
		var results = []
		if(b.rows && b.rows.length > 0)
		{
			for( var i = 0; i < b.rows.length; i++ )
			{
				var row = b.rows[ i ]
				if(( row.key[0] == req.user.username)&&(row.key[1] == req.body.filename))
					results.push( row.value );
			}
		}
		res.send({ success:true, results: results })
	});
})

app.post( '/groupreadaccessall', function( req, res ) {
	console.log("groupreadaccessall?");
	//console.log(req.body.groupname);
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	else
		queuehandler.group.checkuser(req.body.groupname,req.user.username,function(err,response) {
			if(response == false)
			{
				res.send({ error:'you are not allowed to access this information.'})
			}
			else
			{
				console.log("user is authorized");
				request({ uri:designURI + '_view/groupreadaccessall', json: true }, function(e,r,b) {
				var results = [];
				if(b.rows && b.rows.length > 0)
				{
					for( var i = 0; i < b.rows.length; i++ )
					{
						var row = b.rows[ i ];
						console.log(row.key);
						//console.log([req.body.groupname,req.body.filename]);
						if( row.key == req.body.groupname)
							results.push( row.value._id )
					}
				}
				console.log(results);
				res.send({ results: results })
				});
			}
		});
})

app.post( '/groupwriteaccessall', function( req, res ) {
	console.log("groupreadaccessall?");
	//console.log(req.body.groupname);
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	else
		queuehandler.group.checkuser(req.body.groupname,req.user.username,function(err,response) {
			if(response == false)
			{
				res.send({ error:'you are not allowed to access this information.'})
			}
			else
			{
				console.log("user is authorized");
				request({ uri:designURI + '_view/groupwriteaccessall', json: true }, function(e,r,b) {
				var results = [];
				if(b.rows && b.rows.length > 0)
				{
					for( var i = 0; i < b.rows.length; i++ )
					{
						var row = b.rows[ i ];
						console.log(row.key);
						//console.log([req.body.groupname,req.body.filename]);
						if( row.key == req.body.groupname)
							results.push( row.value._id )
					}
				}
				console.log(results);
				res.send({ results: results })
				});
			}
		});
})

app.post('/fileaddreadaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.addreadaccess(req.body.filename,req.body.newuser,function(err, response)
			{
				if(!err)
					res.send({ response: response });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileremreadaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.remreadaccess(req.body.filename,req.body.newuser,function(err, response)
			{
				if(!err)
					res.send({ response: response });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileaddwriteaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.addwriteaccess(req.body.filename,req.body.newuser,function(err, response)
			{
				if(!err)
					res.send({ response: response });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileremwriteaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.remwriteaccess(req.body.filename,req.body.newuser,function(err, response)
			{
				if(!err)
					res.send({ response: response });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileaddgroupreadaccess', function(req, res){
	console.log("addgroupreadaccess")
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	//console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.addgroupreadaccess(req.body.filename,req.body.newgroup,function(err, response)
			{
				if(!err)
					res.send({ response: "group successfully authenticated to read file." });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileremgroupreadaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.remgroupreadaccess(req.body.filename,req.body.remgroup,function(err, response)
			{
				if(!err)
					res.send({ response: "group authentication successfully revoked." });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileaddgroupwriteaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.addgroupwriteaccess(req.body.filename,req.body.newgroup,function(err, response)
			{
				if(!err)
					res.send({ response: response });
				else
					res.send({err: err});
			});
		}
	}
	);
})

app.post('/fileremgroupwriteaccess', function(req, res){
	if(!(req.isAuthenticated()))
	{
		res.send({ error:'you are not currently logged in.' })
	}
	console.log(designURI +'_view/publications?key="'+req.body.filename+'"');
	request({uri:designURI +'_view/publications?key="'+req.body.filename+'"'}, function(e,r,b)
	{
		b = JSON.parse(b);
		console.log(b["total_rows"]);
		if(b.rows[0].value.author == req.user.username)
		{
			console.log("user authenticated to modify permissions.");
			queuehandler.file.remgroupwriteaccess(req.body.filename,req.body.remgroup,function(err, response)
			{
				if(!err)
					res.send({ response: response });
				else
					res.send({err: err});
			});
		}
	}
	);
})



app.get( '/tag', function( req, res ) {
  if( req.query.tag ) {
    request(
      { uri:designURI + '_view/tagged', json: true },
      function(e,r,b) {
        var results = []
        if(b.rows && b.rows.length > 0) {
          for( var i = 0; i < b.rows.length; i++ ) {
            var row = b.rows[ i ]

            if( row.value.indexOf( req.query.tag ) > -1 ) results.push( row.key )
          }
        }
        res.send({ results: results })
      }
    )
  }
})

app.get( '/recent', function( req, res ) {
  request(
    { uri:designURI + '_view/recent?descending=true&limit=20', json: true },
    function(e,r,b) {
      res.send({ results: b.rows })
    }
  )
})

app.get( '/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
})

app.post( '/requestPassword', function(req, res){
  request( 'http://127.0.0.1:5984/gibber/' + req.body.username, function(e,r,_b) {
    var data = JSON.parse( _b ),
        password = data.password,
        email = data.email

    if( typeof email === 'undefined' || email === '' ) {
      res.send({ result:'fail', msg:'You did not specify an email account for password reminders. Please contact an administrator if you need access to this account.'})
    }else{
      transporter.sendMail({
        from: 'gibber@gibber.mat.ucsb.edu',
        to: email,
        subject:'gibber password reminder',
        text:'As requested, your gibber password is ' + password + '.'
      })
      res.send({ result:'success', msg:'An email with your password been sent to ' + email })
    }
  })
})

app.get( '/login', function(req, res){
  // console.log(" LOGIN?  ")
  res.render( 'login_start', { user: req.user, message:'login' /*req.flash('error')*/ });
})

app.get( '/loginStatus', function( req, res ) {
  if( req.isAuthenticated() ) {
    res.send({ username: req.user.username })
  }else{
    res.send({ username: null })
  }
})

// app.post( '/test', function(req, res, next){
//   console.log("TESTING", req.user, req.isAuthenticated() )
//   next()
//   res.render( 'login_start', { user: req.user, message: req.flash('error') });
// })

app.post( '/retrieve', function( req, res, next ) {
  // console.log( req.body )
  var suffix = req.body.address.replace(/\//g, '%2F'),
      _url = 'http://127.0.0.1:5984/gibber/' + suffix


  if( _url.indexOf('%2Fpublications') === -1 ) { // shorthand to leave publications out of url
    var arr = _url.split( '/' )

    _url = arr[0] + '%2Fpublications%2F' + arr[1]
  }

  _url += suffix.indexOf('?') > -1 ? "&revs_info=true" : "?revs_info=true"

  request( _url, function(e,r,b) {
    //console.log( e, b )
    res.send( b )
  })
})

app.get( '/create_publication', function( req, res, next ) {
  //console.log( req.user )
  res.render( 'create_publication', { user: req.user, message:'publication' } );
})

app.post( '/publish', function( req, res, next ) {
if( !(req.isAuthenticated()) ) {
    res.send({ error:'you are not currently logged in.' })
	}
  var date = new Date(),
      day  = date.getDate(),
      month = date.getMonth() + 1,
      year = date.getFullYear(),
      time = date.toLocaleTimeString()

	queuehandler.file.publish(req.user.username,req.body.filename,req.body.code,[year,month,day,time],req.body.ispublic,req.body.language,req.body.tags,req.body.notes,
	function(err,response)
	{
		if(err)
			res.send({error:"unable to publish file."}); //TODO: detailed error messages
		else
                {
		        request({ uri:designURI + '_view/publications?key="'+req.user.username+"/publications/"+req.body.filename+'"', json: true }, function(e,r,b)
		        {
			        //b = JSON.parse(b);
			        var results = [];
			        console.log(b.rows);
			        results = b.rows[0];
			        /*if(b.rows && b.rows.length > 0)
			        {
				        for(i=0;i<b.rows.length;i++)
				        {
					        if(b.rows[i].id == req.body.filename)
						        results = b.rows[i];
				        }
			        }*/
			        res.send({ success: true, filedata: results.value });
		        });
			//res.send({success:true, msg:"successfully published file.", filename: req.user.username+"/publications/"+req.body.filename}); //TODO: respond properly when file successfully published
                }
	}
	);
})

app.post( '/filesetmetadata', function( req, res, next ) {
if( !(req.isAuthenticated()) ) {
    res.send({ error:'you are not currently logged in.' })
	}
	queuehandler.user.authorizewrite(req.user.username,req.body.filename,function(err1,response1)
	{
		queuehandler.file.setmetadata(req.body.filename,req.body.newlanguage,req.body.newtags,req.body.newnotes,req.body.ispublic,req.body.isautoplay,function(err,response)
		{
			if(err)
				res.send({success:false, error:"unable to edit file metadata."});
			else
                        {
                                console.log(req.body.filename);
                                request({ uri:designURI + '_view/publications?key="'+"/publications/"+req.body.filename+'"', json: true }, function(e,r,b)
		                {
			                //b = JSON.parse(b);
                                        if(!e)
                                        {
			                        var results = [];
			                        console.log(b.rows);
			                        results = b.rows[0];
			                        res.send({ success: true, filedata: results.value });
                                        }
                                        else
                                        {
                                                console.log("error retrieving file");
                                        }
		                });
                        }

		}
		);
	});
})

//review this fn.
app.post( '/update', function( req, res, next ) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.user.authorizewrite(req.user.username,req.body.filename,function(err1,response1)
	{
		if(response1 == true)
			queuehandler.file.edit(req.body.filename,req.body.newtext,function(err2,response2)
			{
				if(err2)
					res.send({error:"Unable to update file."});
				else
					res.send({success:true, msg:"Successfully updated file."});
			});
		else
			res.send({error:"User authorization failed. You are not permitted to update this file."});
	});
})

app.post('/userreadfile', function (req, res, next) {
	var checkpublic = false;
	request({ uri:designURI + '_view/publications?key="'+req.body.filename+'"', json: true }, function(e,r,b)
	{
		//b = JSON.parse(b);
		var results = [];
		console.log(req.body.filename);
		if(b.rows && b.rows.length > 0)
		{
			for(i=0;i<b.rows.length;i++)
			{
				console.log(b.rows[i].id);
				console.log(b.rows[i].value.isPublic);
				if(b.rows[i].value.isPublic == "true")
				{
					results = b.rows[i];
					checkpublic = true;
				}
			}
		}
		console.log(results);
		if(checkpublic == true)
			res.send({ filedata: results[0].value });
		else
		{
			if(!(req.isAuthenticated()))
				res.send({ error:'You are not currently logged in.' })
			else
				queuehandler.user.authorizeread(req.user.username,req.body.filename,function(err1,response1)
				{
					if(response1 == true)
					{
						//retrieve file to read
						console.log("beginning file retrieval");
						request({ uri:designURI + '_view/publications?key="'+req.body.filename+'"', json: true }, function(e,r,b)
						{
							//b = JSON.parse(b);
							var results = [];
							console.log(b.rows);
							results = b.rows[0];
							/*if(b.rows && b.rows.length > 0)
							{
								for(i=0;i<b.rows.length;i++)
								{
									if(b.rows[i].id == req.body.filename)
										results = b.rows[i];
								}
							}*/
							res.send({ results: results })
						});
					}
					else
						res.send({error:"User authorization failed. You are not permitted to read this file."});
				});
		}
	});
})

app.post( '/createNewUser', function( req, res, next ) {
  var date = new Date(),
      day  = date.getDate(),
      month = date.getMonth() + 1,
      year = date.getFullYear(),
      time = date.toLocaleTimeString()
  queuehandler.user.create(req.body.username, req.body.password, [year,month,day,time], req.body.email, req.body.website, req.body.affiliation,
    function (error, response) {
      if( error ) {
        console.log( error )
        res.send({ msg: 'The server was unable to create your account' })
      } else {
        res.send({ msg:'User account created' })
      }
    }
  )
})

app.post('/usercheckinfo', function(req, res, next) {
        if(!(req.isAuthenticated()))
                res.send({error:'you are not currently logged in.'})
        queuehandler.user.checkinfo(req.user.username, function(err, response) {
                if(err)
                        res.send({error:"unable to retrieve user info"});
                else
                        res.send({success:true,response:response});
        })
})

app.post('/groupcreate', function(req, res, next) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.group.create(req.body.groupname,req.user.username,function(err, response)
	{
		if(err)
			res.send({error:"unable to create group."});
		else
			res.send({success:true, msg:"successfully created group."});
	});
})

app.post('/groupviewusers', function(req, res, next) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.group.viewusers(req.body.groupname,function(err, response)
	{

		if(err)
			res.send({error:"unable to create group."});
		else
			res.send({success:true, response:response});
	});
})

app.post('/groupaddpendingusers', function(req, res, next) {
        var userindexes=[];
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.group.checkowner(req.body.groupname,req.user.username,function(err1, response1)
	{
		if(err1)
                {
                        //console.log("unauth error starts here");
                        //console.log(err1);
                        //console.log(response1);
			res.send({error:"you are not authorized to add users."});
                }
		else
		{
			req.body.newusers.forEach(function(newuser,index)
			{
				queuehandler.group.addpendinguser(req.body.groupname,newuser,function(err2, response2)
				{
					if(err2)
					{
						res.send({error:"unable to add user to group."});
						console.log(response2);
					}
					else
                                        {
                                                var notificationdata = {type:"GROUP_INVITE",groupname:req.body.groupname,source:req.user.username};
                                                queuehandler.user.notify(newuser,notificationdata,function(err3,response3){
                                                        if(err3)
                                                        {
                                                                res.send({error:"unable to notify user"});
                                                        }
                                                        else
                                                        {
                 						res.send({success:true, msg:"successfully added pending user to group and sent notification."});
                                                        }
                                                });
                                        }
				});
			})
		}
	});
})

app.post('/groupconfirmuser', function(req, res, next) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.group.confirmuser(req.body.groupname, req.user.username, function(err1, response1) {
                if(!err1)
                {
                        res.send({msg:"user successfully confirmed"});
                }
                else
                {
                        res.send({error:"unable to confirm user"});
                }
        });
})

app.post('/groupremoveuser', function(req, res, next) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.group.checkowner(req.body.groupname,req.user.username,function(err1, response1)
	{
		if(err1)
			res.send({error:"you are not authorized to remove users."});
		else
		{
			queuehandler.group.removeuser(req.body.groupname,req.body.remuser,function(err2, response2)
			{
				if(err2)
				{
					res.send({error:"unable to remove user from group."});
					console.log(response2);
				}
				else
					res.send({msg:"successfully removed user from group."});
			});
		}

	});

})

app.post('/groupdestroy', function(req, res, next) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
        if(req.body.groupname)
        {
	        queuehandler.group.checkowner(req.body.groupname,req.user.username,function(err1, response1)
	        {
		        if(err1)
			        res.send({error:"you are not authorized to destroy this group."});
		        else
		        {
			        queuehandler.group.destroy(req.body.groupname,function(err2, response2)
			        {
				        if(err2)
				        {
					        res.send({error:"unable to destroy group."});
					        console.log(response2);
				        }
				        else
					        res.send({success:true, msg:"successfully destroyed group."});
			        });
		        }
	        });
        }
        else
        {
                res.send({msg:"group name field missing"});
        }

})

app.post('/userdestroy', function(req, res, next) {
	if(!(req.isAuthenticated()))
		res.send({ error:'you are not currently logged in.' })
	queuehandler.user.destroy(req.user.username,function(err,response) {
		if(err)
			res.send({error:"unable to destroy user."})
		else
			res.send({msg:"successfully destroyed user."})
	});

})

app.get( '/welcome', function( req, res, next ) {
  res.render( 'welcome', {
    user:req.user
  })
})

app.get( '/preferences', function( req, res, next ) {
  res.render( 'preferences', {
    user:req.user
  })
})

app.get( '/documentation', function( req, res, next ) {
  res.render( 'docs', {
    user:req.user
  })
})
app.get( '/help', function( req, res, next ) {
  res.render( 'help', {
    user:req.user
  })
})
app.get( '/docs/', function( req,res,next ) {
  res.render( '../docs/output/'+req.query.group+'/'+req.query.file+'.htm' )
})
app.get( '/credits', function( req,res,next ) {
  res.render( 'credits' )
})

// adds inspect function to .ejs templates, used in browser .ejs to dynamically inject js
app.locals.inspect = require('util').inspect;

app.get( '/browser', function( req, res, next ) {
  var demos = {}
  request( designURI + '_view/demos', function(e,r,b) {
    var audio = [], visual = [], audiovisual = [], demoRows = JSON.parse( b ).rows

    for( var i =0; i < demoRows.length; i++ ) {
      var cat, row = demoRows[ i ]

      cat = row.value.category || 'audiovisual'

      switch( cat ) {
        case 'Visual': visual.push( row ); break;
        case 'Audio' : audio.push(  row ); break;
        default: audiovisual.push(  row ); break;
      }
    }

    demos.visual = visual; demos.audio = audio; demos.audiovisual = audiovisual;

    request( { uri:designURI + '_view/recent?descending=true&limit=20', json: true },
      function(__e,__r,__b) {
        var recent = []
        for( var i = 0; i < __b.rows.length; i++ ){
          //console.log( __b.rows[i].value )
          recent.push( __b.rows[i].value )
        }
        request( designURI + '_view/tutorials', function(e,r,b) {
          // console.log( (JSON.parse(b)).rows )
          var _audio = [], _3d = [], _2d = [], _misc=[], demoRows = JSON.parse( b ).rows

            for( var i =0; i < demoRows.length; i++ ) {
            var cat = 'misc', row = demoRows[ i ]
            //console.log( row )
            if( row.key.split('*').length > 0 ) {
              cat = row.key.split('*')[1]
              switch( cat ) {
                case '2d' :
                  _2d.push( row ); break;
                case '3d' : _3d.push( row ); break;
                case 'audio' : _audio.push( row ); break;
                default:
                  _misc.push( row ); break;
              }
            }
          }

          if( req.user ) {
            //console.log("USER ACCOUNT")
            request({
              uri:designURI + '_view/publications?key=%22'+req.user.username+'%22',
              json:true
            },
            function(e,r,_b) {
              //console.log(_b)
              res.render( 'browser', {
                user: req.user,
                demos:demos,
                audio:_audio,
                _2d:_2d,
                _3d:_3d,
                misc:_misc,
                userfiles:_b.rows,
                recent: recent,
              });
            })
          }else{
            //console.log("NO USER ACCOUNT")
            res.render( 'browser', {
              user: null,
              demos: demos,
              audio: _audio,
              _2d: _2d,
              _3d: _3d,
              misc: _misc,
              userfiles:[],
              recent:recent,
            });
          }
        });
      })
  })
})


app.post( '/userfiles', function( req,res,next ) {
  if( req.user && req.user.username ) {
    request({
      uri:designURI + '_view/publications?key=%22'+req.user.username+'%22',
      json:true
    },
    function(e,r,_b) {
      res.send({
        files:_b.rows,
      });
    })
  }else{
    res.send({ msg:'No user is logged in. Cannot retrieve userfiles.' })
  }
})

app.get( '/chat', function( req, res, next ) {
  var result = {}
  if( !req.user ) {
    result.error = "You must log in (create an account if necessary) before using chat."
    res.send( result )
  }else{
    res.render( 'chat' )
  }
})

app.get( '/demos', function( req, res, next ) {
  request( designURI + '_view/demos', function(e,r,b) {
    var audio = [], visual = [], audiovisual = [], demoRows = JSON.parse( b ).rows

    for( var i =0; i < demoRows.length; i++ ) {
      var cat, row = demoRows[ i ]

      cat = row.demoCategory || 'audiovisual'

      switch( cat ) {
        case 'visual': visual.push( row ); break;
        case 'audio' : audio.push(  row ); break;
        default: audiovisual.push( row );  break;
      }
    }

    res.render( 'demos', { audio:audio, visual:visual, audiovisual:audiovisual})
  })
})

app.post( '/deleteUserFile', function( req, res, next ) {
  var fileInfo = req.body
  console.log( fileInfo )
})

app.post( '/search', function( req, res, next) {
  var result = {},
      query = queryString.escape(req.body.query), filter = req.body.filter,
      url = searchURL + filter + "?q="+query

  console.log( "SEARCH REQUEST", url )

  if( typeof query === 'undefined' || typeof filter === 'undefined') {
    result.error = 'Search query or search type is undefined.'
    res.send( result )
    return
  }

  var pubs = [], count = 0

  request({ 'url':url }, function(e,r,b) {
    //console.log( b )
    b = JSON.parse( b )
    if( b && b.rows && b.rows.length > 0 ) {
      //result.rows = b.rows
      //res.send( result )
      for( var i = 0; i < b.rows.length; i++ ) {
        !function() {
          var num = i,
              pubID = b.rows[ i ].id,
              suffix = pubID.replace(/\//g, '%2F'),
              _url = 'http://127.0.0.1:5984/gibber/' + suffix

          _url += suffix.indexOf('?') > -1 ? "&revs_info=false" : "?revs_info=false"

          request( _url, function(e,r,_b) {
            _b = JSON.parse( _b )

            delete _b.text

            pubs[ num ] = JSON.stringify( _b )

            if( ++count === b.rows.length  ) sendResults()

          })

        }()
      }

      function sendResults() {
        res.send({ rows: pubs, totalRows:b.total_rows })
      }
    }else{
      if( b.reason ) {
        res.send({ error:b.reason })
      }else{
        res.send({ rows:[] })
      }
    }
  })
  //request({ url:searchURL, json:})
  /*request({ url: esUrl , json:{
      "query": {
          "filtered" : {
              "query" : {
                  "query_string" : {
                      "query" : req.body.query
                  }
              }
          }
      },
  }}, function(e,r,b) {
    console.log("SEARCH RESULTS:", b )
    var result = {}
    if(b) {
      if( b.hits ) {
        for(var i = 0; i < b.hits.hits. length; i++ ) {
          console.log( b.hits.hits[i] )
          if( b.hits.hits[i]._id )
            result[ b.hits.hits[i]._id ] = b.hits.hits[i]._source.text
          //console.log("RESULT " + i + ":", b.hits.hits[i]._id, b.hits.hits[i]._source.text )
        }
      }else{
        result.noresults = "No matches were found for your query."
      }
    }else{
      if( b ) {
        result.error = b.indexOf('error') > -1 ? "The gibber database appears to be down. Please contact an administrator" : "No hits were found"
      }else{
        result.error = "The search database is offline. Please, please, please report this to admin@gibber.cc"
        console.log(e, r)
      }
    }

    res.send(result)
  })*/
})

app.post( '/login', function( req, res, next )
{
        passport.authenticate( 'local', function( err, user, info ) {
        //var data = {}
        //console.log( "LOGGING IN... ", user, err, info )
        if (err) { return next( err ) }
        if (!user)
        {
                res.send({ error:'Your username or password is incorrect. Please try again.' })
        }
        else
        {
                req.logIn( user, function() {
                res.send({ success: true, username: user.username })
                //associate client with user for notifications
                req.client.uid = user.username;
                clients[user.username] = req.client;
        });
        }
  })( req, res, next );
})

app.get('/logout', function(req, res, next){
  if( req.user ) {
	console.log(users);
    users.splice(users.lastIndexOf(req.user),1);
	console.log(users);
    req.logout();
    res.send({ success: true, msg:'logout complete' })
  }else{
    //console.log( "There wasn't any user... " )
    res.send({ msg:'you aren\t logged in... how did you even try to logout?' })
  }

  //res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

nodemailer.sendmail = true
server.listen( webServerPort )
//rtc.init()
initializeFeed();
