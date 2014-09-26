gibber.server
=============

This is the server component for Gibber. To install in Gibber:

1. If you don't have node installed, install node: http://nodejs.org
2. Install and run CouchDB: http://docs.couchdb.org/en/latest/install/
3. cd into the top level of the main Gibber repo
4. Run `npm install gibber.server`. This will install gibber.server in the `node_modules` directory of the Gibber repo.
5. To create the initial gibber database, run: `node node_modules/gibber.server/createDatabase`.  

The dependencies installed with gibber.server are highly version specific in many cases, so don't go updating any of these modules.

To run the server, go to the top level of the Gibber repo that you installed `gibber.server` into, and run the following:

`cd node_modules/gibber.server`

`node . 8080`

You can substitute a port of your choice for `8080` in the above line. Now, if everything turns out OK, you can open `127.0.0.1:8080` in a browser and Gibber will be running.

However, most likely you'll need one final step. In the `environment.js` file of the main Gibber repo, there's a property called `SERVER_URL`. You'll need to set this to whatever the IP address is of the server your running. Or, if you're running gibber.server and Gibber in your browser on the same machine, just set this value to be `127.0.0.1`.

Note to self:ejs must be version 0.8.4... using ~0.8.4 will mess things up.