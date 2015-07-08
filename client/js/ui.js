/* stuff directly related to painting the client UI */

function HistoryPanel(config) {
    this.config = config;
    this.bestConfig = null;
}


HistoryPanel.prototype.draw = function(winnerPanelDOMId) {

    var th = this;

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function () {
	if (xmlhttp.readyState==4 && xmlhttp.status==200) {
	    var historical_designs = [];
	    var httpResponseObj = JSON.parse(xmlhttp.responseText);
	    var configs = httpResponseObj.configs;

	    for (var i=0; i<th.config.num_historical_designs && i<configs.length; i++) {
		$("#history_text").text("Some random past designs:");
		var id_str = "history" + i;
		var hist_margin = 2;
		var hist_svg_width = th.config.history_dim;
		var spacing = hist_margin*2 + hist_svg_width;
		$("#history").append(
		    '<span id=' + id_str + ' class="historical_design" style="left: ' + spacing*i + 'px;"></span>'
		);

		// create palette and give it the current div id to draw on
		var rp = new RobotPalette(false, "span#" + id_str, th.config.history_dim, th.config);
		historical_designs.push(rp);
		rp.draw();
		rp.drawingFromAdjacencyMatrix(configs[i].config_adj_mat);
		var distance = Math.round(100*configs[i].config_distance)/100;
		var historyDim = th.config.history_dim;
		$("span#" + id_str).append(
		    '<span class="historical_distance" style="left:' + spacing/5 + 
			'px; top: ' + historyDim + 'px;" data-distance=' + distance + '>' + 
			distance + '</span>');
	    }

	    // draw "winner" panel
	    if (httpResponseObj.best_config['config_adj_mat']) {
		var bestConfig = httpResponseObj.best_config;
		var wp = new RobotPalette(false, th.config.winner_dom_id, th.config.winner_dim, th.config);
		wp.draw();
		wp.drawingFromAdjacencyMatrix(bestConfig.config_adj_mat);
		$("#winner").css("border-width", "3px");
		$("#winner").find("p").text('best so far');
		$("#winner").append('<div>' + '&nbsp;&nbsp;&nbsp;' + Math.round(bestConfig.config_distance*100)/100  + '</div');
	    } else {
		
	    }
	}

    };

    var url = this.config.get_configs_base_url + 
	    this.config.num_historical_designs + "/" + 
	    this.config.N + "/" + this.config.M;
    xmlhttp.open("GET", url, true);

    xmlhttp.send();
};


HistoryPanel.prototype.clearDesigns = function() {
    $("#history .historical_design").remove();
    $("#winner").find("svg").remove();
    $("#winner").find("div").remove();
};


HistoryPanel.prototype.redraw = function() {
    this.clearDesigns();
    this.draw();
};


HistoryPanel.prototype.getBestConfig = function() {
    return this.bestConfig;
};

