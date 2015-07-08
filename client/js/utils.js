/*
  Some utility functions and objects.

  c. Mark Wagy 2014
*/

/* 
   constructor for Coord: a coordinate
*/
function Coord(opts) {
    if (opts['x']) {
	this.x = opts.x;
    } else {
	this.x = 0.0;
    }

    if (opts['y']) {
	this.y = opts.y;
    } else {
	this.y = 0.0;
    }
}


Coord.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ")";
};


/*
  Euclidean distance between coords
*/
Coord.distanceEuc = function(c1, c2) {
    return Math.sqrt(
	(c1.x-c2.x)*(c1.x-c2.x) + 
	(c1.y-c2.y)*(c1.y-c2.y));
};


/*
  get the minimum distance from a point to a line defined by two points
*/
Coord.minDistanceToLine = function(ptCoord, lineStartCoord, lineEndCoord) {
    var S = lineStartCoord;
    var T = lineEndCoord;
    var P = ptCoord;

    // slope of line between S and T
    var mST = (S.y - T.y)/(S.x - T.x);
    
    // intercept of line between S and T
    var bST = S.y - mST * S.x;


    // point we are looking for: the closest point on line ST from P
    var A = new Coord({});

    if (mST == 0) {
	// line is horizontal (and 1/m will be infinite)
	A.x = P.x;
	A.y = S.y;
    } else {
	// intercept of line between P and closest point on line, A
	var bPA = P.y + (1/mST)*P.x;

	A.x = (mST*bPA - mST*bST)/(1 + mST*mST);
	A.y = (-1/mST)*A.x + bPA;
    }


    var dist = Coord.distanceEuc(A, P);

    return dist;
};


/*
 returns true if coordinate 1 is within tol of coordinate 2,
 false otherwise
*/
Coord.closeEnoughTo = function(c1, c2, tol) {
    return Coord.distanceEuc(c1, c2) <= tol;
};



/* Grid */

function Grid(opts) { };

/*
 This function converts the row (N dim) and column (M dim) 
 numbers on a grid to a number of points on the grid from 
 left to right and top to bottom.
*/
Grid.elementIdxFromRowCol = function(gridRow, gridCol, N, M) {
    return gridRow*M + gridCol;
};


/*
 If we were to label points on an NxM grid left to right, top to bottom,
 this function converts the numbering of points to their respective
 row and column numbers
*/
Grid.rowColFromElementIdx = function(idx, N, M) {
    var row = Math.floor(idx/M);
    var col = idx % M;
    return [row, col];
};


/*
 get the row number for a given index into a grid
 (counting nodes from left to right, top to bottom)
*/
Grid.rowFromElementIdx = function(idx, N, M) {
    var rowcol = Grid.rowColFromElementIdx(idx, N, M);
    return rowcol[0];
};


/*
 pretty print a 2d matrix
*/
function ppMat(mat2d) {
    var s = "";
    var rowNum = mat2d.length;
    for (var rowidx=0; rowidx<rowNum; rowidx++) {
	var colNum = mat2d[rowidx].length;
	for (var colidx=0; colidx<colNum; colidx++) {
	    var val = mat2d[rowidx][colidx];
	    s = s.concat(val.toString()).concat(" ");
	}
	s = s.concat("\n");
    }
    return s.concat("\n");
};


/*
 pretty print lower triangular matrix
*/
function ppLTMat(mat2d) {
    var s = "";
    var rowNum = mat2d.length;
    for (var rowidx=0; rowidx<rowNum; rowidx++) {
	var colNum = mat2d[rowidx].length;
	for (var colidx=0; colidx<colNum; colidx++) {
	    var val = mat2d[rowidx][colidx];
	    if (colidx >= rowidx) {
		val = "-";
	    }
	    s = s.concat(val.toString()).concat(" ");
	}
	s = s.concat("\n");
    }
    return s.concat("\n");
};


/*
 some ammo functions
*/
function ammosub(v1, v2) {
    var vnew = new Ammo.btVector3(v1.x()-v2.x(), v1.y()-v2.y(), v1.z()-v2.z());
    return vnew;
};

function ammoadd(v1, v2) {
    var vnew = new Ammo.btVector3(v1.x()+v2.x(), v1.y()+v2.y(), v1.z()+v2.z());
    return vnew;
};

function ammoscale(v, a) {
    var vnew = new Ammo.btVector3(a*v.x(), a*v.y(), a*v.z());
    return vnew;
}

function ammoscaleX(v, a) {
    var vnew = new Ammo.btVector3(a*v.x(), v.y(), v.z());
    return vnew;
}

function ammoscaleZ(v, a) {
    var vnew = new Ammo.btVector3(v.x(), v.y(), a*v.z());
    return vnew;
}

function ammodist(v1, v2) {
    var dx = v1.x()-v2.x();
    var dy = v1.y()-v2.y();
    var dz = v1.z()-v2.z();
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function ammocross(a, b) {
    var x = a.y() * b.z() - a.z() * b.y();
    var y = a.z() * b.x() - a.x() * b.z();
    var z = a.x() * b.y() - a.y() * b.x();
    return new Ammo.btVector3(x, y, z);
}

function ammomidpt(a, b) {
    var x = (a.x() + b.x())/2;
    var y = (a.y() + b.y())/2;
    var z = (a.z() + b.z())/2;
    var midPointVec = new Ammo.btVector3(x,y,z);
    return midPointVec;
}

function pp(v) {
    return "[" + v.x() + " " + v.y() + " " + v.z() + "]";
}


function meanVal(lst) {
    if (lst.length > 0) {
	return lst.reduce(function (p, c) {return p+c;})/lst.length;
    }
    return 0;
};


/*
  Euclidean distance between vectors
*/
function distanceVal(v1, v2) {
    return Math.sqrt(
	(v1.x() - v2.x())*(v1.x() - v2.x()) + 
	(v1.y() - v2.y())*(v1.y() - v2.y()) + 
	(v1.z() - v2.z())*(v1.z() - v2.z()));
};


/*
 generate a unique id 
 from: http://stackoverflow.com/questions/12223529/create-globally-unique-id-in-javascript
 */
var generateUid = function () {

    var delim = "-";

    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }

    return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
};


var adjMatToDBString = function(adj_mat) {
    return "{{" + adj_mat.join("},{") + "}}";
};


var arrayToDBString = function(arr) {
    return "{" + arr.join(",") + "}";
};


function choose(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

