/**
 * Required Modules
 */
var express = require('express.io');
var path = require('path');
var util = require('util');
var redis = require('redis');
var url = require('url');

/**
 * Configuration Settings
 */
var config = {
	port: process.env.PORT || 3000,
	redis: {
		host: '',
		port: 6379,
		pass: ''
	}
};

/**
 * Redis Clients
 */
var client = redis.createClient(config.redis.port, config.redis.host);
client.auth(config.redis.pass);

/**
 * Configure the app
 */
var app = express().http().io();

app.configure(function(){
	app.set('port', config.port);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.cookieParser());
});

// Configuration options during development
app.configure('development', function(){
	app.use(express.errorHandler());
});

// Send the client html.
app.get('/', function(req, res) {
	(function(res) {
		client.get("draft_status", function(err, reply) {
			if (reply == 1) {
				res.render('draft');
			}
			else {
				res.render('index');
			}
		});
	})(res);
});

// Get the client setup once it connects.
app.io.sockets.on('connection', function(socket) {
	console.log('Socket.IO: Client Connected, ID => %s', socket.id);

	socket.on('disconnect', function() {
		console.log('Socket.IO: Client Disconnected, ID => %s', socket.id);
	});

	// check if draft is running?
	client.get("draft_status", function(err, reply) {
		if (reply != null && reply == 1) {
			// draft is running ---
		}
		else {
			client.get("draft_redirect", function(err, reply) {
				setTimeout(function() {
					socket.emit('redirect', reply);
				}, 15000);
			});
		}
	});
	
	// if so emit initial draft table
	// if so emit initial draft remaining players
	client.get("draft_table", function(err, reply) {
		if (err) {
			console.log("Redis.ERROR: " + err);
		}

		if (reply != null) {
			socket.emit('draft table', reply);
		}
	});

	client.get("draft_players", function(err, reply) {
		if (err) {
			console.log("Redis.ERROR: " + err);
		}

		if (reply != null) {
			socket.emit('draft players', reply)
		}
	});

	client.get("draft_progress", function(err, reply) {
		if (err) {
			console.log("Redis>ERROR: " + err);
		}

		if (reply != null) {
			socket.emit('draft progress', reply);
		}
	});
});

// Start listening
app.listen(config.port);


// Setup Redis Client
var sub = redis.createClient(config.redis.port, config.redis.host);
sub.auth(config.redis.pass);

// subscribe to redis channel for updates
sub.on('message', function(channel, message) {
	console.log('Redis.Sub: Received %s on %s', message, channel);

	var object = JSON.parse(message);

	if (object.event == 'pick') {
		app.io.broadcast('draft pick', object.round, object.team, object.player, object.player_id, object.selector);
	}
	else if (object.event == 'progress') {
		app.io.broadcast('draft progress', object.percent);
	}
});
sub.subscribe('draftevents', function() {
	console.log('Redis.Sub: Subscribed Successfully!');
});
