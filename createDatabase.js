var request         = require( 'request' ),
    databaseName    = 'gibber_db',
    serverAddress   = 'http://localhost:5984/' + databaseName,
    names = [ 'gibber' ], // add more names if you want to just test the database
    lines = [
      "a = FM(); a.note(440); x = Drums('xoxo')",
      "b = Synth(); c = Seq( [440,880], 1/4, b); x = Drums('x*o*x*o')",
      "c = Mono(); c.fx.add( Reverb() ); d = Seq( [440,880], 1/4, c); x = Drums('x*o*x*o')",
      "d = Pluck({blend:.5}); d.fx.add( HPF(.4) ); e= ScaleSeq( Rndi(0,12), 1/16, d); x = Drums('xoxo')",
    ],
    pubCount = {}

var deleteDatabase = function(cb) {
  request({ 
    url:serverAddress,
    method:'DELETE' 
  }, function(e,r,b) { 
    console.log("DELETING DATABASE:",e,b);
    if(cb) cb() 
  })
}

var makeDatabase = function(cb) {
  request({ url:serverAddress, method:'PUT'}, function(e,r,b) {
    console.log("DATABASE MADE:", b); if(cb) cb()
  })
}

// by default, only one user, 'gibber', is made
var makeUsers = function(cb) {
  for( var i = 0; i < names.length; i++ ) {
    (function() {
      var name = names[i],
          _i = i;
          
      request.post({url:serverAddress, json:{
          _id: name,
          type: 'user',
          password:  name + name,
          joinDate:  [1, 12, 2013],
          website:  "http://www." + name + ".com",
          affiliation:  "UCSB",
          email:  name+'@'+name+'.com',
          following: [],
          friends: [],
        }},
        function (error, response, body) {
          if( error ) { 
            console.log( error ) 
          } else { 
            if(_i === names.length -1) {
              console.log("USERS MADE")
              if(cb) cb()
            }
          }
        }
      )
    })()
  }
}

// test publications
var makePubs = function(cb) {
  var maxPubs = 10
  for(var i = 0; i < maxPubs; i++) {
    (function() {
      var _i = i;
      var name = 'gibber', //names[ Math.floor( Math.random() * names.length ) ],
          line = lines[ Math.floor( Math.random() * lines.length ) ]
      
      //console.log(name, line)
               
      if( typeof pubCount[ name ] === 'undefined') { pubCount[ name ] = 0 } else { pubCount[ name ]++ }
      request.post({url:serverAddress, json:{
          _id: name + '/publications/pub' + pubCount[ name ],
          name: pubCount[ name ],
          author: name,
          type: 'publication',
          publicationDate: [1, 12, 2013],
          text: line,
        }},
        function (error, response, body) {
          if( error ) { 
            console.log( error ) 
          } else { 
            //console.log( body ) 
            if( _i === maxPubs - 1) {
              console.log( "PUBS MADE" )
              if(cb) cb()
            }
          }
        }
      )
    })()
  }
}

var makeDesign = function(cb) {
  // var design = {
  //   _id : "_design/" + databaseName,
  //   views : {
  //     foo : {
  //       map : "function(doc){ emit(doc._id, doc._rev) }"
  //     }
  //   }
  // }
  
  request.put({ 
    url: serverAddress + '/_design/test', 
    json: {
      "views": {
        "users": {
          "map": function(doc) {
            if (doc.type === 'user') emit(doc._id, doc._rev)
          }.toString(),
          "reduce": "_count"
        },
        "all": {
          "map": function(doc) {
            emit(doc._id, doc._rev)
          }.toString(),
        },
        "publications": {
          "map": function(doc) {
            if (doc.type === 'publication') {
              emit(doc.author, {
                text: doc.text,
                notes: doc.notes,
                tags: doc.tags
              })
            }
          }.toString()
        },
        "password": {
          "map": function(doc) {
            if (doc.type === 'user') emit(doc._id, doc.password)
          }.toString()
        },
        "tutorials": {
          "map": function(doc) {
            if (doc.type === 'publication' && doc.isTutorial) {
              emit(doc._id, {
                text: doc.text,
                tags: doc.tags,
                notes: doc.notes,
                publicationDate: doc.publicationDate,
                category: doc.tutorialCategory
              })
            }
          }.toString()
        },
        "recent": {
          "map": function(doc) {
            if (doc.type === 'publication' && doc.permissions) {
              var pd = [parseInt(doc.publicationDate[0]), parseInt(doc.publicationDate[1]), parseInt(doc.publicationDate[2]), doc.publicationDate[3]];
              emit(pd, {
                _id: doc._id,
                text: doc.text,
                tags: doc.tags,
                notes: doc.notes,
                publicationDate: doc.publicationDate
              });
            }
          }.toString()
        },
        "tagged": {
          "map": function(doc) {
            if (doc.permissions && doc.tags && doc.tags.length > 0) {
              emit(doc._id, doc.tags)
            }
          }.toString()
        },
        "demos": {
          "map": function(doc) {
            if (doc.type === 'publication' && doc.isDemo) {
              emit(doc._id, {
                text: doc.text,
                tags: doc.tags,
                notes: doc.notes,
                category: doc.demoCategory,
                publicationDate: doc.publicationDate
              })
            }
          }.toString()
        }
      }
    }
  },
  function(error, response, body) {
    if( error ) { 
      console.log( "CREATING DESIGN ERROR:", error ) 
    } else { 
      console.log( "CREATING DESIGN:", body ) 
      if(cb) cb()
    }
  })
}

var testDesign = function(cb) {
  request( serverAddress + '/_design/test/_view/publications', function(e,r,b) {
    console.log( "TESTING DESIGN:", b )
    if( cb ) cb()
  })
}

var testDatabase = function() {
  var next = 0,
      functions = [
        deleteDatabase,
        makeDatabase,
        makeUsers,
        makePubs,
        makeDesign,
        testDesign
      ]
      
  cb = function() {
    console.log( "NUM:", next )
    if( next <= functions.length - 1 ) {
      functions[ next++ ]( cb )
    }
  }
  cb()
}

testDatabase()