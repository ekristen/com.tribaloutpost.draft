var socket = io.connect();

socket.on('connect', function() {
	$("span#connected").addClass('btn-success');
	$("span#connected").text("Connected");

	// TODO TODO TODO
	// pop-up modal on first visit telling them
	// to not refresh updates are automatic

	$(document).trigger("add-alerts", {
		message: "Welcome to the TribalOutpost.com Draft Headquarters, messages will appear here and disappear automatically",
		priority: "info"
	});

});

socket.on('disconnect', function() {
	$("span#connected").removeClass('btn-success');
	$("span#connected").addClass('btn-danger');
	$("span#connected").text('Disconnected');
});


socket.on('draft table', function(html) {
	$("div#draft-table div.content").html(html);
});

socket.on('draft players', function(html) {
	$("div#draft-players div.content").html(html);
});

socket.on('draft pick', function(round, team, player, player_id, selector) {
	$("li#" + player_id).remove();

	$("td#" + selector).text(player);

	$(document).trigger('add-alerts', {
		message: 'Player "' + player + '" was picked by team "' + team + '" during round ' + round,
		priority: "warning"
	});
});

socket.on('draft progress', function(percent) {
	$("div#draft-progress div.progress div.bar").width(percent + '%');
	$("div#draft-progress div.progress div.bar").text(percent + '%');
});

socket.on('notice', function(message) {

});

socket.on('redirect', function(url) {
	window.location = url;
});

