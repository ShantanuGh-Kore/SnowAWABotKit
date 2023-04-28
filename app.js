var Application = require("./lib/app");
var Server      = require("./lib/server");
var sdk         = require("./lib/sdk");
var config      = require("./config");
require('log-timestamp');

var app    = new Application(null, config);
var server = new Server(config, app);

server.start();
sdk.registerBot(require('./snowConversation.js'));