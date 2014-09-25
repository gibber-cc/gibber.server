gibber.server
=============

This is the server component for Gibber. To install in Gibber:

1. If you don't have node installed, install node: http://nodejs.org
2. Install and run CouchDB: http://docs.couchdb.org/en/latest/install/
3. cd into the top level of the main Gibber repo
4. Run `npm install gibber.server`. This will install gibber.server in the `node_modules` directory.
5. To create the initial gibber database, run: `node node_modules/gibber.server/createDatabase`.  

The dependencies installed with gibber.server are highly version specific in many cases, so don't go updating any of these modules.

To run the server, go to the top level of the Gibber repo (not the gibber.server) repo. 

`cd node_modules/gibber.server`

`node . 8080`

You can substitute a port of your choice for `8080` in the above line.
