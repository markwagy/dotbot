/* objects for dot bot designs */


/*
  an element of a substrate
*/
function Element(id) {
    this.id = id;
    this.coord = new Coord({});
}


Element.prototype.setCoord = function(coord) {
    this.coord = coord;
};


Element.prototype.getCoord = function() {
    return this.coord;
};



/*
  constructor for a Substrate
*/
function Substrate(N, M) {
    /*
      opts should have N and M parameters, which represent the number of rows
      and columns, respectively, of the substrate design matrix.
      though note that the adjacency matrix will be N*M by N*M
     */
    this.N = N; // rows
    this.M = M; // cols

    this.initAdjacencyMatrix(this.N, this.M);
    this.initElements(this.N * this.M);
}


/*
 getter for adjacency matrix
*/
Substrate.prototype.getAdjacencyMatrix = function() {
    return this.adj_mat;
};


Substrate.prototype.zeroAdjacencyMatrix = function() {
    for (var i=0; i<this.N*this.M; i++) {
	for (var j=0; j<this.N*this.M; j++) {
	    this.adj_mat[i][j] = 0;
	}
    }
};


/*
  initialize elements
*/
Substrate.prototype.initElements = function(howMany) {
    this.elements = new Array();
    for (var i=0; i<howMany; i++) {
	this.elements[i] = new Element(i);
    }
};


/*
  initialize the substrate's adjacency matrix
*/
Substrate.prototype.initAdjacencyMatrix = function(N, M) {
    this.adj_mat = new Array();
    for (var i=0; i<N*M; i++) {
	this.adj_mat[i] = new Array();
	for (var j=0; j<N*M; j++) {
	    this.adj_mat[i][j] = 0;
	}
    }
};


/*
  get the element index from the substrate row and column index
 TODO: replace with Grid.elementIdxFromRowCol
*/
Substrate.prototype.elementIdxFromRowCol = function(substrateRow, substrateCol) {
    return substrateRow*this.M + substrateCol;
};


/*
  get the row and column index in the substrate for the given element index
 TODO: replace with Grid.rowColFromElementIdx
*/
Substrate.prototype.rowColFromElementIdx = function(idx) {
    var row = Math.floor(idx/this.M);
    var col = idx % this.M;
    return [row, col];
};


/*
Substrate.prototype.addConnection = function(fromSubstrateRow, fromSubstrateCol, 
					     toSubstrateRow,   toSubstrateCol) {
    var adjMatFromIdx = this.elementIdxFromRowCol(fromSubstrateRow, fromSubstrateCol);
    var adjMatToIdx   = this.elementIdxFromRowCol(toSubstrateRow,   toSubstrateCol  );
    this.adj_mat[adjMatFromIdx][adjMatToIdx] = 1;
    this.adj_mat[adjMatToIdx][adjMatFromIdx] = 1; // technically not necessary, but being safe
}
*/


Substrate.prototype.addConnection = function(fromId, toId) {
    this.adj_mat[fromId][toId] = 1;
    this.adj_mat[toId][fromId] = 1;
};


/*
substrate.prototype.removeConnection = function(fromSubstrateRow, fromSubstrateCol, 
						toSubstrateRow,   toSubstrateCol) {
    var adjMatFromIdx = this.elementIdxFromRowCol(fromSubstrateRow, fromSubstrateCol);
    var adjMatToIdx   = this.elementIdxFromRowCol(toSubstrateRow,   toSubstrateCol  );
    this.adj_mat[adjMatFromIdx][adjMatToIdx] = 0;
    this.adj_mat[adjMatToIdx][adjMatFromIdx] = 0; // technically not necessary, but being safe
}
*/


Substrate.prototype.removeConnection = function(fromId, toId) {
    this.adj_mat[fromId][toId] = 0;
    this.adj_mat[toId][fromId] = 0;
};


Substrate.prototype.addCoord = function(n, m, coord) {
    var idx = this.elementIdxFromRowCol(n, m);
    this.elements[idx].setCoord(coord);
};


/*
 get the horizontal "neighbor" on a grid in the direction 
 of the vector from "fromCoord" to "toCoord"
 @return a two element array of row and col grid indices of neighbor
*/
Substrate.prototype.getHorizontalNeighborInCoordDirection = function(elIdx, fromCoord, toCoord) {
    var rowcol = this.rowColFromElementIdx(elIdx);
    var row = rowcol[0];
    var col = rowcol[1];
    var neighborRow = row; // not moving in vertical dir
    var neighborCol = 0; 
    if (toCoord.x > fromCoord.x) {
	neighborCol = col + 1;
    } else {
	neighborCol = col - 1;
    }
    return [neighborRow, neighborCol];
};


/*
 get the vertical "neighbor" on a grid in the direction 
 of the vector from "fromCoord" to "toCoord"
 @return a two element array of row and col grid indices of neighbor
*/
Substrate.prototype.getVerticalNeighborInCoordDirection = function(elIdx, fromCoord, toCoord) {
    var rowcol = this.rowColFromElementIdx(elIdx);
    var row = rowcol[0];
    var col = rowcol[1];
    var neighborRow = 0; 
    var neighborCol = col; // not moving in vertical dir
    if (toCoord.y > fromCoord.y) {
	neighborRow = row + 1;
    } else {
	neighborRow = row - 1;
    }
    return [neighborRow, neighborCol];    
};


Substrate.prototype.getCoordsFromElementIds = function(elIds) {
    var coords = [];
    for (var i=0; i<elIds.length; i++) {
	coords.push(this.elements[elIds[i]].getCoord());
    }
    return coords;
};


Substrate.prototype.getCoordsClosestToLine = function(beginCoord, endCoord) {
    var elIds = this.getElementsClosestToLine(beginCoord, endCoord);
    return this.getCoordsFromElementIds(elIds);
};


/*
 get a list of element ids that are closest to the line
 defined by the given coordinates
*/
Substrate.prototype.getElementsClosestToLine = function(beginCoord, endCoord) {
    var pathPointIds = new Array();

//    var S = beginCoord;
    var Sid = this.closestSubstrateElementToPoint(beginCoord);
    var S = this.elements[Sid].getCoord();
//    var T = endCoord;
    var Tid = this.closestSubstrateElementToPoint(endCoord);
    var T = this.elements[Tid].getCoord();

    var tolerance = 0.05;
    var Pid  = this.closestSubstrateElementToPoint(S);

    pathPointIds.push(Pid);

    var Pcoord = S;
    while (!Coord.closeEnoughTo(Pcoord, T, tolerance)) {
	var verticalNeighborRowCol;
	var vNeighborIdx;
	var vNeighborCoord;

	var horizontalNeighborRowCol = this.getHorizontalNeighborInCoordDirection(Pid, S, T);
	if (horizontalNeighborRowCol[1] > this.M-1 || horizontalNeighborRowCol[1] < 0) {
	    // no more horizontal neighbors
	    verticalNeighborRowCol   = this.getVerticalNeighborInCoordDirection(Pid, S, T);
	    vNeighborIdx = this.elementIdxFromRowCol(verticalNeighborRowCol[0],
							 verticalNeighborRowCol[1]);
	    vNeighborCoord = this.elements[vNeighborIdx].getCoord();
	    pathPointIds.push(vNeighborIdx);
	    Pcoord = vNeighborCoord;
	    Pid = vNeighborIdx;
	    continue;
	} 
	var hNeighborIdx = this.elementIdxFromRowCol(horizontalNeighborRowCol[0],
						     horizontalNeighborRowCol[1]);
	var hNeighborCoord = this.elements[hNeighborIdx].getCoord();
	var hNeighborDist = Coord.minDistanceToLine(hNeighborCoord, S, T);

	verticalNeighborRowCol   = this.getVerticalNeighborInCoordDirection(Pid, S, T);
	if (verticalNeighborRowCol[0] > this.N-1 || verticalNeighborRowCol[0] < 0) {
	    // no more vertical neighbors
	    pathPointIds.push(hNeighborIdx);
	    Pid = hNeighborIdx;
	    Pcoord = hNeighborCoord;
	    continue;
	}
	vNeighborIdx = this.elementIdxFromRowCol(verticalNeighborRowCol[0],
						     verticalNeighborRowCol[1]);
	vNeighborCoord = this.elements[vNeighborIdx].getCoord();
	var vNeighborDist = Coord.minDistanceToLine(vNeighborCoord, S, T);

	if (hNeighborDist < vNeighborDist) {
	    pathPointIds.push(hNeighborIdx);
	    Pid = hNeighborIdx;
	    Pcoord = hNeighborCoord;
	} else {
	    pathPointIds.push(vNeighborIdx);
	    Pcoord = vNeighborCoord;
	    Pid = vNeighborIdx;
	}
    }
    return pathPointIds;
};


/*
  Given an x and y coordinate, get the index of the substrate element
  that is closest to the coordinates (in the form of a 2 element list)
*/
Substrate.prototype.closestSubstrateElementToPoint = function(inputCoord) {
    var closestCoord = new Coord({});
    var closestDist  = 1000000000;
    var closestIdx = -1;
    for (var i=0; i<this.elements.length; i++) {
	var currCoord = this.elements[i].getCoord();
	var currDist = Coord.distanceEuc(inputCoord, currCoord);
	if (currDist < closestDist) {
	    closestDist = currDist;
	    closestCoord = currCoord;
	    closestIdx = i;
	}
    }
    return closestIdx;
};

