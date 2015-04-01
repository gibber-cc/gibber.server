// Realtime Communication module for Gibber

module.exports = function( Server, shouldGabber ) {
  
var Duplex = require( 'stream' ).Duplex,
    livedb = require( 'livedb' ),
    sharejs = require( 'share' ),
    backend = livedb.client( livedb.memory() ),
    share = sharejs.server.createClient({
      backend: backend
    }),
    coreAudio = require( 'node-core-audio' );
    //AudioContext = require('web-audio-api').AudioContext,


var Rtc = {
  rooms : { 
    'Gibber' : {
      clients : [],
      password: null
    }
  },
  users : {},
  usersByNick : {},
  wsLibServer : require('ws').Server,
  socket  : null,
  shareSocket: null,
  server: Server,
  audioContext: null,
  audioNode: null,
  phase: 0,
  blockSize: 1024,
  currentAudioTime:null,
  init : function() {
    Rtc.socket = new Rtc.wsLibServer({ server:Server })
    
    Rtc.socket.on( 'connection', Rtc.onClientConnection )
    
    // this.audioContext = new AudioContext()
    // this.audioNode = this.audioContext.createScriptProcessor(this.blockSize, 2, 2, this.audioContext.sampleRate)
    // this.audioNode.onaudioprocess = this.audioCallback.bind( this )
    // this.audioNode.connect( this.audioContext.destination )
    if( shouldGabber ) {
      var engine = coreAudio.createNewAudioEngine();
      engine.addAudioCallback( Rtc.audioCallback );
      engine.setOptions({ framesPerBuffer:1024, interleaved:true, outputChannels:2, inputChannels:1 })
    }
  },
  audioCallback: function() { Rtc.phase += 1024 },
  
  onClientConnection: function( client ) {
    if( Rtc.users[ client.ip ] ) return
    
    console.log( client.upgradeReq.headers.origin )
    client.ip = client.upgradeReq.headers.origin//client.handshake.address.address
    client.stream = null
    
    console.log( 'CONNECTION', client.ip )
    Rtc.users[ client.ip ] = client
  
    var msg = { connection: true }
  
    client.send( JSON.stringify( msg ) )
    
    client.shareIsInitialized = false
    
    if( !client.shareIsInitialized ) {
      Rtc.shareInitForClient( client )
    }
    
    client.on( 'message', function( _msg ) {
      var msg = JSON.parse( _msg )
      
      if( typeof msg.a !== 'undefined' ) { // ugh. only way to identify share.js msg currently.
        msg.cmd = 'share'
      }
      
      console.log( "MESSAGE", msg, msg.cmd )
      
      Rtc.handlers[ msg.cmd ]( client, msg )
    })
    
    client.on( 'close', function() { // TODO: only fires when window is closed... this is a clientside problem
      console.log("CLIENT LEAVING CHAT")
      if( Rtc.rooms[ client.room ]  ) {
        var idx = Rtc.rooms[ client.room ].clients.indexOf( client )
        if( client.room ) {
          Rtc.rooms[ client.room ].clients.splice( idx , 1 )
          var notification = JSON.stringify( { msg:'departure', nick:client.nick } )
          Rtc.sendToRoom( notification, client.room )
        }
      }
      
      delete Rtc.users[ client.ip ]
      
      if( client.stream ) {
        client.stream.push( null )
        client.stream.emit( 'close' )
        console.log( 'client went away' )
        client.close()
        //return client.close( reason )
      }
    })
  },
  shareInitForClient: function( client ) {
    client.stream = new Duplex({ objectMode: true })
    
    client.stream._write = function(chunk, encoding, callback) {
      //console.log( 's->c ', chunk )
      client.send( JSON.stringify(chunk) )
      return callback()
    }
    
    client.stream._read = function() {}
    
    client.stream.headers = client.upgradeReq.headers
    
    client.stream.remoteAddress = client.upgradeReq.connection.remoteAddress
    
    share.listen( client.stream )
    // return share.listen( stream )
  },
  sendall : function( msg ) {
    for( var ip in Rtc.users ) {
      Rtc.users[ ip ].send( msg )
    }
  },
  heartbeat : function() {
    var time = Date.now()
    for( var room in Rtc.rooms ) {
      if( room !== 'Gibber' ) {
        !function() {
          var _room = Rtc.rooms[ room ],
              roomName = room
              
          if( time - _room.timestamp > 3000 && _room.clients.length === 0 ) {
            console.log( 'deleting room', roomName )
            delete Rtc.rooms[ roomName ]
            var msg = { msg:'roomDeleted', room:roomName }
            Rtc.sendall( JSON.stringify( msg ) )
          }
        }() 
      }
    }
    setTimeout( Rtc.heartbeat, 10000 ) 
  },
  sendToRoom : function( msg, roomName ) {
    if( roomName && msg ) {
      var room = Rtc.rooms[ roomName ]
      if( room ) {
        room.timestamp = Date.now()
        for( var i = 0; i < room.clients.length; i++ ){
          var client = room.clients[ i ]
          if( client ) {
            client.send( msg )
          }
        }
        return true
      }
    }
    return false
  },
  
  handlers : {
    share : function( client, msg ) {
      client.stream.push( msg )
    },
    register : function( client, msg ) {
      client.nick = msg.nick
      
      Rtc.usersByNick[ client.nick ] = client
      
      console.log("REGISTERED", client.nick )

      var msg = { msg:'registered', nickRegistered: client.nick }

      client.send( JSON.stringify( msg ) )
    },
     
    joinRoom : function( client, msg ) {
      var response = null, occupants = []

      if( Rtc.rooms[ msg.room ] ) {
        if( Rtc.rooms[ msg.room ].password !== null ) {
          if( Rtc.rooms[ msg.room ].password === msg.password ) {
            client.room = msg.room

            for( var i = 0; i < Rtc.rooms[ msg.room ].clients.length; i++ ) {
              occupants.push( Rtc.rooms[ msg.room ].clients[ i ].nick )
            }
            if( Rtc.rooms[ msg.room ].clients.indexOf( client ) === -1 ) {
              Rtc.rooms[ msg.room ].clients.push( client )
            }
            response = { msg:'roomJoined', roomJoined: msg.room, occupants:occupants }

            notification = JSON.stringify( { msg:'arrival', nick:client.nick } )

            Rtc.sendToRoom( notification, msg.room )
          }else{
            response = { msg:'roomJoined', roomJoined:null, error:'ERROR: The password you submitted to join ' + msg.room + ' was incorrect.' }
          }
        }else{
          client.room = msg.room

          for( var i = 0; i < Rtc.rooms[ msg.room ].clients.length; i++ ) {
            occupants.push( Rtc.rooms[ msg.room ].clients[ i ].nick )
          }

          if( Rtc.rooms[ msg.room ].clients.indexOf( client ) === -1 ) {
            Rtc.rooms[ msg.room ].clients.push( client )
          }

          response = { msg:'roomJoined', roomJoined: msg.room, occupants:occupants }

          notification = JSON.stringify( { msg:'arrival', nick:client.nick } )

          Rtc.sendToRoom( notification, msg.room )
        }
      }else{
        response = { msg:'roomJoined', roomJoined: null, error:"ERROR: There is no room named " + msg.room + '.' }
      }

      client.send( JSON.stringify( response ) )
    },

    leaveRoom : function( client, msg ) {
      var response = null, notification

      if( Rtc.rooms[ msg.room ] ) {
        var idx = Rtc.rooms[ msg.room ].clients.indexOf( client )

        if( idx > -1 ) {
          Rtc.rooms[ msg.room ].clients.splice( idx, 1 )

          response = { msg:'roomLeft', roomLeft: msg.room }
          
          notification = JSON.stringify( { msg:'departure', nick:client.nick } )

          Rtc.sendToRoom( notification, msg.room )
        }else{
          response = { msg:'roomLeft', roomLeft: null, error:'ERROR: The server tried to remove you from a room you weren\'t in' }
        }
      }else{
        response = { msg:'roomLeft', roomLeft: null, error:'ERROR: The server tried to remove you from a room that doesn\'t exist.' }
      }

      client.send( JSON.stringify( response ) )
    },
    
    message : function( client, msg ) {
      var room = Rtc.rooms[ client.room ], result = false, response = null, _msg = null
      
      // console.log("CLIENT NICK", client.nick)
      _msg = JSON.stringify({ msg:'incomingMessage', incomingMessage:msg.text, nick:msg.user }) 
       
      result = Rtc.sendToRoom( _msg, client.room )

      if( result ) {
        response = { msg:'messageSent', messageSent: msg.text, nick:client.nick }
      }else{
        response = { msg:'messageSent', messageSent:null, error:'ERROR: You tried to send a message without joining a chat room!' }
      }

      client.send( JSON.stringify( response ) )
    },
    
    // Chat.broadcast( 'code to be executed')
    broadcast: function( client, msg ) {
      var room = Rtc.rooms[ client.room ], result = false, response = null, _msg = null
      
      _msg = JSON.stringify({ msg:msg.cmd, value:msg.value, from:msg.user }) 
       
      result = Rtc.sendToRoom( _msg, client.room )
    },
    collaborationRequest: function( client, msg ) {
      var from = msg.from, 
          to = msg.to,
          room = Rtc.rooms[ client.room ]

      for( var i = 0; i < room.clients.length; i++ ){
        var _client = room.clients[ i ]
        if( _client.nick === to ) {
          _client.send( JSON.stringify( { msg:'collaborationRequest', from:client.nick, enableRemoteExecution:msg.enableRemoteExecution } ) )
          break;
        }
      }
    },
    collaborationResponse: function( client, msg ) {
      var to = msg.to, room = Rtc.rooms[ client.room ]

      for( var i = 0; i < room.clients.length; i++ ){
        var _client = room.clients[ i ]
        if( _client.nick === to ) {
          _client.send( JSON.stringify({ msg:'collaborationResponse', from:client.nick, response:msg.response }) )
          break;
        }
      } 
    },
    shareCreated: function( client, msg ) {
      // GE.Share.openDoc( msg.shareName )
      var to = msg.to, room = Rtc.rooms[ client.room ]
      for( var i = 0; i < room.clients.length; i++ ){
        var _client = room.clients[ i ]
        if( _client.nick === to ) {
          _client.send( JSON.stringify({ msg:'shareReady', from:client.nick, shareName:msg.shareName }) )
          break;
        }
      } 
    },
    createRoom : function( client, msg ) {
      var response = null, room = null, success = false

      if( typeof Rtc.rooms[ msg.name ] === 'undefined' ) {
        Rtc.rooms[ msg.name ] = {
          clients : [],
          password: msg.password || null,
          timestamp: Date.now()
        }
        success = true
        response = { msg:'roomCreated', roomCreated: msg.room } 
      }else{
        response = { msg:'roomCreated', roomCreated: null, error:'ERROR: A room with that name already exists' }
      }

      client.send( JSON.stringify( response ) )
      
      if( success ) {
        var msg = { msg:'roomAdded', roomAdded:msg.room }
        Rtc.sendall( JSON.stringify( msg ) )
      }
    },

    listRooms : function( client, msg ) {
      var response = {}
      for( var key in Rtc.rooms ) {
        response[ key ]  = { 
          password: Rtc.rooms[ key ].password !== null,
          userCount : Rtc.rooms[ key ].clients.length
        }
      }

      client.send( JSON.stringify({ msg:'listRooms', rooms:response }) )
    },

    logout : function( client, msg ) {
      var response = null,
          idx = Rtc.rooms[ client.room ].clients.indexOf( client )

      if( idx > -1 ) {

      }
    },

    listUsers : function( client, msg ) {
      var reponse = null, _users = []
      for( var key in Rtc.users ) {
        _users.push( Rtc.users[ key ].nick )
      }

      response = { msg:'listUsers', users:_users }

      client.send( JSON.stringify( response ) )
    },

    remoteExecution : function( client, msg ) {
      var to = Rtc.usersByNick[ msg.to ],
          _msg = {
            from: msg.from,
            selectionRange : msg.selectionRange,
            code: msg.code,
            msg: 'remoteExecution',
            shareName:msg.shareName 
          }
      
      to.send( JSON.stringify( _msg ) )
    },
    
    tick: function( client, msg ) {
      var out = {
        masterAudioTime: Rtc.currentAudioTime,
        masterAudioPhase: Rtc.phase,
        msg:'tock'
      }
      
      //var time = process.hrtime()
      
      //console.log( "OUT", Rtc.phase, time[0], time[1] )
      //setTimeout( function() {
      client.send( JSON.stringify( out ) )
      //}, 100 )
    },
    
    'gabber.start' : function( client, msg ) {
      var room = Rtc.rooms[ msg.gabberName ]
      
      msg = JSON.stringify( { msg:'gabber.start' } )
            
      for( var i = 0; i < room.clients.length; i++ ) {
        room.clients[ i ].send( msg )
      }
    },
    
    'gabber.Ki' : function( client, msg ) {
      var room = Rtc.rooms[ msg.gabberName ]
      
      msg.msg = msg.cmd             
      for( var i = 0; i < room.clients.length; i++ ) {
        room.clients[ i ].send( JSON.stringify( msg ) )
      }
    },
    
    'gabber.Kp' : function( client, msg ) {
      var room = Rtc.rooms[ msg.gabberName ]
      
      msg.msg = msg.cmd
      for( var i = 0; i < room.clients.length; i++ ) {
        room.clients[ i ].send( JSON.stringify( msg ) )
      }
    },
    
    gabber: function( client, msg ) {
      // JSON.stringify({ 
      //   gabberName:     Gabber.name,
      //   from:           Account.nick,
      //   selectionRange: obj.selection,
      //   code:           obj.code,
      //   shouldExecute:  Gabber.enableRemoteExecution,
      //   shouldDelay:    true
      // })
      // form: { code: from: selectionRange: gabberName: shouldExecute: shouldDelay: }
      var room = Rtc.rooms[ msg.gabberName ]
      
      msg.msg = 'gabber'
      
      msg = JSON.stringify( msg )
      
      //console.log("GABBER MESSAGE RECEIVED", msg, room.clients.length )
      
      for( var i = 0; i < room.clients.length; i++ ) {
        if( room.clients[ i ] !== client ) {
          room.clients[ i ].send( msg )
        }
      }
    },
  }
}

return Rtc
}