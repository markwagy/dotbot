/* design palette for robot joints */

/* 
   dependencies:
   - jQuery
   - D3
*/

/*
 TODO:
 - add text to the active circle, such as "keep" to indicate that
   the user has to "up mouse" over that circle in order to keep the path
*/

/*
function Point(x,y) {
    this.x = x;
    this.y = y;
}
*/


/* 
   A palette on which to draw robot joint connections
*/
function RobotPalette(drawable, dom_element,  dim, opts) {

    this.drawable = drawable;
    this.w = dim;
    this.h = dim;

    if (opts['N']) {
	this.N = opts.N;
    } else {
	this.N = 8;
    }
    if (opts['M']) {
	this.M = opts.M;
    } else {
	this.M = 7;
    }

    this.substrate = new Substrate(this.N, this.M);

    // padding around substrate drawing space
    this.paddingX = this.w/this.M/2;
    this.paddingY = this.h/this.N/2;
//    console.log("padding x=" + this.paddingX + ", padding y=" + this.paddingY);
    this.scaleX = d3noconflict.scale.linear()
	.domain([0,this.w])
	.range([this.paddingX, this.w-this.paddingX]);
    this.scaleY = d3noconflict.scale.linear()
	.domain([0,this.h])
	.range([this.paddingY, this.h-this.paddingY]);

    this.jointRadius = this.w/this.M/10;

    this.mouseIsDown = false;

    this.dom_element = dom_element;
};


RobotPalette.prototype.getN = function() {
    return this.N;
};


RobotPalette.prototype.getM = function() {
    return this.M;
};


/*
  get the position of each substrate element 
  and overwrite its Coord object accordingly
*/
RobotPalette.prototype.getSubstratePosVals = function(width, height, N, M) {
    var vals = [];
    var segY = height/(N-1);
    var segX = width/(M-1);
    var prevY = 0;
    var prevX = 0;
    for (var i=0; i<N; i++) {
	var currY = i*segY;
	var scaledY = this.scaleY(currY);
	for (var j=0; j<M; j++) {
	    var currX = j*segX;
	    var scaledX = this.scaleX(currX);
	    this.substrate.addCoord(i, j, new Coord({"x": currX, "y": currY}));
	    vals.push(
		{
		    "x": scaledX, 
		    "y": scaledY, 
		    "row": i, 
		    "col": j, 
		    "classval": this.substrate.elementIdxFromRowCol(i, j)
		});
	}
    }
    return vals;
};


RobotPalette.prototype.toggleCanvasEvents = function() {
    var svgObj = this.getDesignSVGObj();
    var pointerEvents = svgObj.style("pointer-events");
    if (pointerEvents == "none") {
	svgObj.style("pointer-events", "auto");
	//console.log("turning ON pointer events");
    } else {
	svgObj.style("pointer-events", "none");
	//console.log("turning OFF pointer events");
    }
};


RobotPalette.prototype.jointMouseOver = function(d, i) {
    if (!this.drawable) { return; }

    var circle = d3noconflict.select(d3noconflict.event.target);
    circle.attr("fill", "lightgreen").attr("r", this.jointRadius*1.5);

    if (this.mouseIsDown) {
	var svg = this.getDesignSVGObj();
	circle.attr("r", this.jointRadius*2).attr("fill", "green");
	var x = circle.attr("cx");
	var y = circle.attr("cy");
    }
};


RobotPalette.prototype.getSubstrate = function(){
    return this.substrate;
};


RobotPalette.prototype.jointMouseDown = function(d, i) {
    if (!this.drawable) { return; }

    this.mouseIsDown = true;

    var circle = d3noconflict.select(d3noconflict.event.target);

    this.getDesignSVGObj().append("line")
	.attr(
	    {
		"x1": circle.attr("cx"),
		"y1": circle.attr("cy"),
		"x2": circle.attr("cx"),
		"y2": circle.attr("cy"),
		"stroke": "gray",
		"stroke-width": 8,
		"fill": "none"
	    })
	.style("stroke-dasharray", ("3", "3"))
	.style("pointer-events", "none");

    this.getDesignSVGObj().selectAll("path")
	.attr("id", "keep");

};


RobotPalette.prototype.jointMouseUp = function(d, i) {
    if (!this.drawable) { return; }

    //console.log("joint mouse up");
    d3noconflict.selectAll("path#tentative").attr("id", "keep");
    this.mouseIsDown = false;

};


RobotPalette.prototype.jointMouseOut = function(d, i) {
    if (!this.drawable) { return; }

    d3noconflict.select(d3noconflict.event.target)
	.attr("r", this.jointRadius).attr("fill", "lightGray");

    // reset pointer events for canvas
    this.getDesignSVGObj().attr("pointer-events", "auto");
};


RobotPalette.prototype.getDesignSVGObj = function() {
    return d3noconflict.select(this.dom_element).select("svg");
};


RobotPalette.prototype.drawSubstrate = function(svg) {
    obj = this;
    var substratePointPos = this.getSubstratePosVals(
	this.w, this.h, 
	this.N, this.M);

    this.getDesignSVGObj().selectAll("circle")
	.data(substratePointPos).enter().append("circle")
	.attr(
	    {
		"cx": function(d,i) { return d.x; },
		"cy": function(d,i) { return d.y; },
		"r": this.jointRadius,
		"fill": "lightgray",
		"data-group": function(d, i) {
		    return "tmp";
		},
		"data-row": function (d) { return d.row; },
		"data-col": function (d) { return d.col; },
		"class": function(d) { return d.classval; }
	    })
	.on("mousedown", this.jointMouseDown.bind(this))
	.on("mouseup",   this.jointMouseUp.bind(this))
	.on("mouseover", this.jointMouseOver.bind(this))
	.on("mouseout", this.jointMouseOut.bind(this));
};


RobotPalette.prototype.pathFunction = d3noconflict.svg.line()
    .x(function(d) {return this.scaleX(d.x);})
    .y(function(d) {return this.scaleY(d.y);})
    .interpolate("linear");


RobotPalette.prototype.removeTentativePaths = function() {
	this.getDesignSVGObj().select("path#tentative").data([]).exit().remove();    
};


RobotPalette.prototype.canvasMouseMove = function() {
    if (!this.drawable) { return; }

    if (this.mouseIsDown) {
	var m = d3noconflict.mouse(d3noconflict.event.target);
	this.getDesignSVGObj().select("line")
	    .attr("x2", m[0])
	    .attr("y2", m[1])
	    .attr("id", "drawing")
	    .attr("pointer-events", "none");

	this.removeTentativePaths();

	var lineObj = this.getDesignSVGObj()
		.selectAll("line");
	if (lineObj[0].length > 0) {
	    var startX = lineObj.attr("x1");
	    var startY = lineObj.attr("y1");
	    var startCoord = new Coord({"x": startX, "y": startY});
	    var endCoord   = new Coord({"x": m[0],   "y": m[1]});
	    var substrateElIds = 
		    this.substrate.getElementsClosestToLine(startCoord, endCoord);
	    var coordsClosestToLine = 
		    this.substrate.getCoordsFromElementIds(substrateElIds);
//		    this.substrate.getCoordsClosestToLine(startCoord, endCoord);
	    this.getDesignSVGObj()
		.append("path")
		.attr("d", this.pathFunction(coordsClosestToLine))
		.attr("stroke", "black")
		.attr("stroke-width", 8)
		.attr("fill", "none")
		.attr("data-ids", function(d) { 
		    return substrateElIds;
		})
		.attr("id", "tentative")
		.style("pointer-events", "none");
	}
    }
};


RobotPalette.prototype.canvasMouseUp = function() {
    if (!this.drawable) { return; }

    $(this.dom_element + " line").remove();
    $("svg path#tentative").remove();
};


RobotPalette.prototype.canvasMouseClick = function() {
    if (!this.drawable) { return; }
};


RobotPalette.prototype.draw = function() {
    var obj = this;

    var sampleSVG = d3noconflict.select(this.dom_element)
        .append("svg")
        .attr("width",  this.w)
        .attr("height", this.h)
	.style("border", "1px solid black");

    this.getDesignSVGObj()
	.on("mousemove", this.canvasMouseMove.bind(this))
	.on("mouseup",  this.canvasMouseUp.bind(this))
	.on("click", this.canvasMouseClick.bind(this));

    this.drawSubstrate();

    if (this.showCSYS) {
	this.drawCoord(this._svg, data.viewport);
    }

};


RobotPalette.prototype.addIdStringToAdjacencyMatrix = function(idString) {
    var spl = idString.split(",");
    var fromId = parseInt(spl[0]);
    for (var i=1; i<spl.length; i++) {
	var toId = parseInt(spl[i]);
	this.substrate.addConnection(fromId, toId);
	fromId = toId;
    }
};


RobotPalette.prototype.drawingFromAdjacencyMatrix = function(adj_mat) {
    var A = adj_mat;
    var svg = this.getDesignSVGObj();
    var th = this;
    for (var row=0; row<adj_mat.length; row++) {
	for (var col=0; col<row; col++) {
	    if (A[row][col] == 1) {
		//var fromRowCol = this.substrate.rowColFromElementIdx(row);
		//var toRowCol   = this.substrate.rowColFromElementIdx(col);

		var cxFrom = $(this.dom_element + " circle." + col).attr("cx");
		var cyFrom = $(this.dom_element + " circle." + col).attr("cy");

		var cxTo = $(this.dom_element + " circle." + row).attr("cx");
		var cyTo = $(this.dom_element + " circle." + row).attr("cy");

		// TODO: here
		// draw sumpin

		svg.append("line")
		    .attr(
			{
			    "x1": cxFrom,
			    "y1": cyFrom,
			    "x2": cxTo,
			    "y2": cyTo,
			    "stroke": "black",
			    "stroke-width": 4,
			    "fill": "none"
			})
		    .style("pointer-events", "none");
	    }
	}
    }
};


/* 
 obtain an adjacency matrix of the connections illustrated in design palette 
 */
RobotPalette.prototype.adjacencyMatrixFromSVGDrawing = function() {

    this.substrate.zeroAdjacencyMatrix();

    var paths = this.getDesignSVGObj().selectAll("path#keep");
    var tmpThis = this;
    paths.each(function() {
	var idString = d3noconflict.select(this).attr("data-ids");
	tmpThis.addIdStringToAdjacencyMatrix(idString);
    });
//    console.log(ppLTMat(this.substrate.getAdjacencyMatrix()));
    return this.substrate.getAdjacencyMatrix();
};
