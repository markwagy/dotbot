/*
  depends on:
  - groups.js (mine)
  - THREE.js
  - Ammo.js
*/

// scaler from "index space" to "simulation space"
// i.e. the number of units in simulation space that 
// each index increment takes from the drawing
var GLOBAL_SCALER = 5.0;


/************************************************************
GridPos
************************************************************/
function GridPos(row, col) {
    this.row = row;
    this.col = col;
}


GridPos.isXOriented = function(gridPos1, gridPos2) {
    if (gridPos1.row == gridPos2.row) {
	return true;
    } else {
	return false;
    }
};


GridPos.isZOriented = function(gridPos1, gridPos2) {
    if (gridPos1.col == gridPos2.col) {
	return true;
    } else {
	return false;
    }
};



/************************************************************
Segment
************************************************************/

/*
function Segment(
    length, radius, center, rotationKey, 
    mass, nodeFromId, nodeToId, 
    fromPosition, toPosition) {
    this.length = length;
    this.radius = radius;
    this.center = center;
    // rotation key is either the string "x" or "z"
    this.rotationKey = rotationKey;
    this.mass = mass;
    this.nodeFromId = nodeFromId;
    this.nodeToId = nodeToId;
    // "from" and "to" positions are the positions
    // (arbitrary, except in relation to nodeFrom and nodeTo)
    // that define the endpoints of the segment (for the sake of joints)
    this.fromPosition = fromPosition;
    this.toPosition = toPosition;
}
*/

function Segment(radius, mass, botPos, topPos, botNode, topNode) {
    this.radius  = radius;
    this.mass    = mass;
    this.botPos  = botPos;
    this.topPos  = topPos;
    this.topNode = topNode;
    this.botNode = botNode;
    this.isXOriented = Segment.isXOriented(topNode, botNode);
}


Segment.isXOriented = function(node1, node2) {
    var gridPos1 = node1.getGridPos();
    var gridPos2 = node2.getGridPos();
    return GridPos.isXOriented(gridPos1, gridPos2);
};


Segment.prototype.toString = function() {
    return "Segment\nCenter: (" + 
	this.center.x() + "," + this.center.y() + "," + this.center.z() + ")\nLength: " + 
	this.length + "\nTop: (" +
	this.topPos.x() + "," + this.topPos.y() + "," + this.topPos.z() +
	")\nBottom: (" + 
	this.botPos.x() + "," + this.botPos.y() + "," + this.botPos.z() + 
	")\n";
};


/* getters */

Segment.prototype.getLength = function() {
    return ammodist(this.topPos, this.botPos);
};


Segment.prototype.getRadius = function() {
    return this.radius;
};


Segment.prototype.getCenter = function() {
    return ammomidpt(this.topPos, this.botPos);
};


Segment.prototype.getMass = function() {
    return this.mass;
};


/*
 get "top" node
*/
Segment.prototype.getTNode = function() {
    return this.topNode;
};


/*
 get "bottom" node
*/
Segment.prototype.getBNode = function() {
    return this.botNode;
};


Segment.prototype.getBPos = function() {
    return this.botPos;
};


Segment.prototype.getTPos = function() {
    return this.topPos;
};


Segment.prototype.setRigidBody = function(rigidBody) {
    this.rigidBody = rigidBody;
};


Segment.prototype.getRigidBody = function(rigidBody) {
    return this.rigidBody;
};


Segment.prototype.isHorizontal = function() {
    return this.isXOriented;
};




/************************************************************
Joint
************************************************************/


function Joint(segment, node, segPos, nodePos, segRotAxis, nodeRotAxis, 
	       minLimit, maxLimit, enabled, angleOffset, isBottom) {
    this.segment = segment;
    this.node = node;
    this.segmentPosition = segPos;
    this.nodePosition = nodePos;
    this.segRotAxis = segRotAxis;
    this.nodeRotAxis = nodeRotAxis;
    this.limits = [minLimit, maxLimit];
    this.enabled = enabled;
    // phase value is set after construction
    this.phaseValue = 0.0;
    // angle offset is the amount that we need to add to the joint angle such that 
    // it is "zero" with respect to the way the hinge is configured
    this.angleOffset = angleOffset;
    this.isBottom = isBottom;

    if (this.isBottom) {
	/*
	  i don't know why, but bottom and top joints are naturally
	  out of phase by 180 degs. this is my way around it.
	*/
	this.phaseValue += 3.1415;
    }

};


Joint.prototype.getWorldObject = function() {
    return this.worldJointObject;
};


Joint.prototype.getSegment = function() {
    return this.segment;
};


Joint.prototype.getNode = function() {
    return this.node;
};


Joint.prototype.getSegmentPosition = function() {
    return this.segmentPosition;
};


Joint.prototype.getNodePosition = function() {
    return this.nodePosition;
};


/*
 @deprecated
*/
Joint.prototype.getSegmentOrientation = function() {
    return this.getSegmentRotAxis();
};


Joint.prototype.getSegmentRotAxis = function() {
    return this.segRotAxis;
};


/*
 @deprecated
*/
Joint.prototype.getNodeOrientation = function() {
    return this.getNodeRotAxis();
};


Joint.prototype.getNodeRotAxis = function() {
    return this.nodeRotAxis;
};


Joint.prototype.setWorldObjectPointer = function(worldPtr) {
    this.worldJointObject = worldPtr;
};


Joint.getHorizontalRotationAxis = function() {
    return new Ammo.btVector3(0,0,1);
};


Joint.getVerticalRotationAxis = function() {
    return new Ammo.btVector3(1,0,0);
};


Joint.prototype.getLimits = function () {
    return this.limits;
};


Joint.prototype.getAngleOffset = function() {
    return this.angleOffset;
};


Joint.prototype.setAngleOffset = function(ang) {
    this.angleOffset = ang;
};


Joint.prototype.setPhase = function(phase) {
    this.phaseValue = phase;
    if (this.isBottom) {
	this.phaseValue += 3.1415;
    }
};


Joint.prototype.actuate = function(timeValue) {
    var FORCE = 1;
//    var FORCE = 0.2;
//    var VEL = 0.1;
    var VEL = 10;
    var freq = 1.5;

    var currAngle = -this.getAngleOffset() + this.worldJointObject.getHingeAngle();
    var currAngleDeg = currAngle*180/Math.PI;

    var sinval = Math.sin(Math.PI*2*timeValue*freq + this.phaseValue);

    var angDesiredDeg = (this.getAngleOffset()*180/Math.PI + this.getLimits()[0])*sinval*.5;
    var angDesiredRad = Math.PI*angDesiredDeg/180;

//    console.log("sin: " + sinval + "angle: " + currAngleDeg + ", desired: " + angDesiredDeg);

    var diff = angDesiredRad - currAngle;
//    console.log(VEL*diff);
//    this.worldJointObject.enableAngularMotor(true, VEL*diff, FORCE);
    this.worldJointObject.enableAngularMotor(true, diff*VEL, FORCE);
};


Joint.prototype.isEnabled = function() {
    return this.enabled;
};



/************************************************************
Node
************************************************************/

/*
 constructor
*/
function Node(id, radius, mass, gridPosition, center) {
    this.id = id;
    this.radius = radius;
    this.gridPosition = gridPosition;
    this.mass = mass;
    this.joints = [];
    this.center = center;
};

/*
 getters
*/

Node.prototype.getRadius = function() {
    return this.radius;
};


Node.prototype.getGridPos = function() {
    return this.gridPosition;
};


Node.prototype.getMass = function() {
    return this.mass;
};


Node.prototype.getRigidBody = function() {
    return this.worldObject;
};


/*
 @deprecated
*/
Node.prototype.getPosition  = function() {
    return this.getCenter();
};


Node.prototype.getCenter = function() {
    return this.center;
};


Node.prototype.getId = function() {
    return this.id;
};


/*
 setters
*/

Node.prototype.setRigidBody = function(worldObj) {
    this.worldObject = worldObj;
};


Node.prototype.setMass = function(mass) {
    this.mass = mass;
};


/*
 @deprecated
 we'll define North as positive Z, which makes positive X East
*/
Node.prototype.getSnapPointN = function() {
    var C = this.getPosition();
    var pt = new Ammo.btVector3(C.x(), C.y(), C.z() + this.getRadius());
    return pt;
};


/*
 @deprecated
 we'll define North as positive Z, which makes positive X East
*/
Node.prototype.getSnapPointS = function() {
    var C = this.getPosition();
    var pt = new Ammo.btVector3(C.x(), C.y(), C.z() - this.getRadius());
    return pt;
};


/*
 @deprecated
 we'll define North as positive Z, which makes positive X East
*/
Node.prototype.getSnapPointE = function() {
    var C = this.getPosition();
    var pt = new Ammo.btVector3(C.x() + this.getRadius(), C.y(), C.z());
    return pt;
};


/*
 @deprecated
 we'll define North as positive Z, which makes positive X East
*/
Node.prototype.getSnapPointW = function() {
    var C = this.getPosition();
    var pt = new Ammo.btVector3(C.x() - this.getRadius(), C.y(), C.z());
    return pt;
};


/*
 @deprecated
 get closest "snap point" to this node (local coord):
 i.e. pick north, east, south or west point of node
 depending on given point
*/
Node.prototype.getClosestSnap = function(point) {
    var news = [];
    news.push(this.getSnapPointN());
    news.push(this.getSnapPointE());
    news.push(this.getSnapPointW());
    news.push(this.getSnapPointS());
    var closest;
    var minDist = 10000000000;
    for (var i=0; i<news.length; i++) {
	var currVec  = news[i];
	var currDist = ammodist(point, currVec);
	if (currDist < minDist) {
	    closest = currVec;
	    minDist = currDist;
	}
    }
    return closest;
};



/************************************************************
 Robot 
************************************************************/

/* TODO: change class to DotBot */

function Robot(adjacencyMatrix, gridN, gridM, cLength, phases, mutateProb) {
    this.cLength = cLength;
    
    // TODO: will want to scale these... make defn general
    this.NODE_RADIUS    = 0.1 * this.cLength;
    this.NODE_MASS      = 0.1 * this.cLength;
    this.SEGMENT_RADIUS = 0.1 * this.cLength; 
    this.SEGMENT_MASS   = 0.1 * this.cLength;
    this.SWEEP_ANGLE_DEG = 45;
    this.PHASE_CHOICES = [0, 3.1415];
    this.mutateProb = mutateProb;

    // segment has to fit between two nodes
    this.SEGMENT_LENGTH =  this.cLength - 2*this.NODE_RADIUS;
    this.ROBOT_HEIGHT = this.cLength;

    this.segments = [];
    this.nodes = [];
    this.joints = [];
    this.phases = phases;

    this.isActive = false;

    // the mapping between the node id in the adj mat 
    // and the array the nodes are stored in
    this.nodeIdMapping = new Object();

    this.robotFromAdjacencyMatrix(adjacencyMatrix, gridN, gridM, phases);
};


Robot.prototype.toggleNode = function(nodeId) {
    var n = this.getNodeById(nodeId);
    var mass = n.getMass();
    if (mass == 0) {
	n.setMass(this.NODE_MASS);
    } else {
	n.setMass(0.0);
    }
};


/* getters */

Robot.prototype.getPosition = function() {
    var xVals = [];
    var yVals = [];
    var zVals = [];
    for (var i=0; i<this.getNumSegments(); i++) {
	var rbv = this.getSegment(i).getRigidBody().getCenterOfMassPosition();
	xVals.push(rbv.x());
	yVals.push(rbv.y());
	zVals.push(rbv.z());
    }
    var meanX = meanVal(xVals);
    var meanY = meanVal(yVals);
    var meanZ = meanVal(zVals);
    return new Ammo.btVector3(meanX, meanY, meanZ);
};

Robot.prototype.getDistance = function(startingPoint) {
    var position = this.getPosition();
    var origin = startingPoint;
    return distanceVal(position, origin);
};


Robot.prototype.getPhases = function() {
    return this.phases;
};


Robot.prototype.getNumSegments = function() {
    return this.segments.length;
};


Robot.prototype.getNumNodes = function() { 
    return this.nodes.length;
};


Robot.prototype.getNumJoints = function() {
    return this.joints.length;
};


Robot.prototype.getSegment = function(i) {
    return this.segments[i];
};


Robot.prototype.getNode = function(i) {
    return this.nodes[i];
};


Robot.prototype.getNodeRadius = function() {
    return this.NODE_RADIUS;
};


Robot.prototype.getNodeById = function(id) {
    return this.getNode(this.nodeIdMapping[id]);
};


Robot.prototype.getJoint = function(i) {
    return this.joints[i];
};


Robot.prototype.getSegmentLength = function() {
    return this.SEGMENT_LENGTH;
};


Robot.prototype.getHeight = function() {
    return this.ROBOT_HEIGHT;
};


Robot.prototype.positionFromNodeIdx = function(nodeIdx, gridN, gridM) {
    var nodeRowCol = Grid.rowColFromElementIdx(nodeIdx, gridN, gridM);
    var rowNum = nodeRowCol[0];
    var colNum = nodeRowCol[1];
    return this.positionFromRowCol(rowNum, colNum);
};


Robot.prototype.gridPosFromNodeIdx = function(nodeIdx, gridN, gridM) {
    var rowcol = Grid.rowColFromElementIdx(nodeIdx, gridN, gridM);
    var row = rowcol[0];
    var col = rowcol[1];
    return new GridPos(row, col);
};


Robot.getCenterOfNodes = function(nodePos1, nodePos2) {
    var centerPos = new Ammo.btVector3(
	(nodePos1.x() + nodePos2.x())/2,
	nodePos1.y(),
	(nodePos1.z() + nodePos2.z())/2);
    return centerPos;
};

/*
 @deprecated
*/
Robot.prototype.setJointPhaseOffsets = function() {
    if (this.joints.length != this.phaseOffsets.length) {
	console.log("WARNING: number of joints doesn't equal number of phase offsets");
    }
    for (var i=0; i<this.joints.length; i++) {
	this.joints[i].setPhase(this.phaseOffsets[i]);
    }
};


/*
 get a position given the row number and col number of
 the grid that defines this robot
*/
Robot.prototype.positionFromRowCol = function(rowNum, colNum) {
    var x = -colNum*this.cLength;
    var y = this.ROBOT_HEIGHT;
    var z = -rowNum*this.cLength;
    var pos = new Ammo.btVector3(x, y, z);
    return pos;
};


/*
 create a robot given the adjacency matrix that defines it 
 and the numbers of rows and cols that make up its grid
*/
Robot.prototype.robotFromAdjacencyMatrix = function(adjacencyMatrix, gridRows, gridCols, phases) {
    var A = adjacencyMatrix;
    this.adjacencyMatrix = adjacencyMatrix;

    var nodeIds = Robot.getActiveNodeIds(A);

    this.createNodes(nodeIds, gridRows, gridCols);
    this.createSegments(A, gridRows, gridCols);
    this.initializeJoints(phases);
};

/*
 @deprecated
*/
Robot.prototype.cullInactivePhases = function(activeNodeIds) {
    var tmp = [];
    for (var i=0; i<activeNodeIds.length; i++) {
	tmp.push(this.phaseOffsets[activeNodeIds[i]]);
    }
    this.phaseOffsets = tmp;
};


Robot.getAxisOfRotation = function(nodeCenter, segmentCenter) {
    var v1 = ammosub(nodeCenter, segmentCenter);
    // just need a vector that is perpindicular to the vector that
    // defines the distance between node and segment
    var v2 = new Ammo.btVector3(
	v1.x(),
	v1.y()-1,
	v1.z());
    var cross = ammocross(v1, v2);
    return cross;
};


Robot.prototype.addHorizontalJoints = function(seg, bNode, tNode, enable, sweepAngleDeg) {
    // "bottom" 
    var segBotPosLocal     = new Ammo.btVector3(0,-seg.getLength()/2-bNode.getRadius(),0);
    var nodeBotPosLocal    = new Ammo.btVector3(0,0,0);
    var segBotRotVecLocal  = new Ammo.btVector3(0,0,-1);
    var nodeBotRotVecLocal = new Ammo.btVector3(0,0,-1);
    // "top" 
    var segTopPosLocal     = new Ammo.btVector3(0,seg.getLength()/2+tNode.getRadius(),0);
    var nodeTopPosLocal    = new Ammo.btVector3(0,0,0);
    var segTopRotVecLocal  = new Ammo.btVector3(0,0,1);
    var nodeTopRotVecLocal = new Ammo.btVector3(0,0,1);

    /* 
     define angle limits for horizontal segment 
     */

    var sweepAngleRad = sweepAngleDeg*Math.PI/180;

    /* 
     we use sweepAngleRad/4 because there are actually two hinges
     actuating at each joint and each one get sweep angles from
     positive angle/2 to negative angle/2
     */
    var angleOffsetTop = -Math.PI/2;
    var minAngleLimitTop = angleOffsetTop - sweepAngleRad/4;
    var maxAngleLimitTop = angleOffsetTop + sweepAngleRad/4;

    var angleOffsetBot = Math.PI/2;
    var minAngleLimitBot = angleOffsetBot - sweepAngleRad/4;
    var maxAngleLimitBot = angleOffsetBot + sweepAngleRad/4;


    var isEnabled = enable;

    var bJoint = new Joint(seg, bNode, 
			   segBotPosLocal,    nodeBotPosLocal,
			   segBotRotVecLocal, nodeBotRotVecLocal,
			   minAngleLimitBot, maxAngleLimitBot,
			   isEnabled, angleOffsetBot, true);
    var tJoint = new Joint(seg, tNode, 
			   segTopPosLocal,    nodeTopPosLocal,
			   segTopRotVecLocal, nodeTopRotVecLocal,
			   minAngleLimitTop, maxAngleLimitTop,
			   isEnabled, angleOffsetTop, false);

    this.joints.push(bJoint);
    this.joints.push(tJoint);
};


Robot.prototype.addVerticalJoints = function(seg, bNode, tNode, enable, sweepAngleDeg) {
    // "bottom" 
    var segBotPosLocal     = new Ammo.btVector3(0,-seg.getLength()/2-bNode.getRadius(),0);
    var nodeBotPosLocal    = new Ammo.btVector3(0,0,0);
    var segBotRotVecLocal  = new Ammo.btVector3(-1,0,0);
    var nodeBotRotVecLocal = new Ammo.btVector3(-1,0,0);
    // "top" 
    var segTopPosLocal     = new Ammo.btVector3(0,seg.getLength()/2+tNode.getRadius(),0);
    var nodeTopPosLocal    = new Ammo.btVector3(0,0,0);
    var segTopRotVecLocal  = new Ammo.btVector3(1,0,0);
    var nodeTopRotVecLocal = new Ammo.btVector3(1,0,0);

    /*
    define angle limits for horizontal segment
     */
    var sweepAngleRad = sweepAngleDeg*Math.PI/180;

    /* 
     we use sweepAngleRad/4 because there are actually two hinges
     actuating at each joint and each one get sweep angles from
     positive angle/2 to negative angle/2
     */
    var angleOffsetTop = Math.PI/2;
    var minAngleLimitTop = angleOffsetTop - sweepAngleRad/4;
    var maxAngleLimitTop = angleOffsetTop + sweepAngleRad/4;

    var angleOffsetBot = -Math.PI/2;
    var minAngleLimitBot = angleOffsetBot - sweepAngleRad/4;
    var maxAngleLimitBot = angleOffsetBot + sweepAngleRad/4;
    
    var isEnabled = enable;

    var bJoint = new Joint(seg, bNode, 
			   segBotPosLocal,    nodeBotPosLocal,
			   segBotRotVecLocal, nodeBotRotVecLocal,
			   minAngleLimitBot, maxAngleLimitBot,
			   isEnabled, angleOffsetBot, true);
    var tJoint = new Joint(seg, tNode, 
			   segTopPosLocal,    nodeTopPosLocal,
			   segTopRotVecLocal, nodeTopRotVecLocal,
			   minAngleLimitTop, maxAngleLimitTop,
			   isEnabled, angleOffsetTop, false);

    this.joints.push(bJoint);
    this.joints.push(tJoint);

};


Robot.prototype.getAdjacencyMatrix = function() {
    return this.adjacencyMatrix;
};


Robot.prototype.connectSegmentToNodes = function(seg) {

    var bNode = seg.getBNode();
    var tNode = seg.getTNode();

    var sweepAngleDeg = this.SWEEP_ANGLE_DEG;

    var enable = true;

    if (seg.isHorizontal()) {
	this.addHorizontalJoints(seg, bNode, tNode, enable, sweepAngleDeg);
    } else {
	this.addVerticalJoints(  seg, bNode, tNode, enable, sweepAngleDeg);
    }
};


Robot.prototype.generatePhases = function(howMany) {
    var ph = [];
    for (var i=0; i<howMany; i++) {
	ph.push(choose(this.PHASE_CHOICES));
    }
    return ph;
};


/*
 initialize robot joints.
 we are assuming that the number of phase values equals 
 the number of joints (they should). but should add in
 some defensive code to ensure this, or at least unit tests
*/
Robot.prototype.initializeJoints = function(phases) {
    for (var segidx=0; segidx<this.getNumSegments(); segidx++) {
	this.connectSegmentToNodes(this.getSegment(segidx));
    }
    if (phases == null) {
	this.phases = this.generatePhases(this.joints.length);
    } else {
	this.phases = this.mutatePhases(phases);
    }
    for (var i=0; i<this.joints.length; i++) {
	this.joints[i].setPhase(this.phases[i]);
    }
};


Robot.prototype.mutatePhases = function(phases) {
    for (var i=0; i<phases.length; i++) {
	if (Math.random() < this.mutateProb) {
	    if (phases[i] == 0) {
		phases[i] = 3.1415;
	    } else {
		phases[i] = 0.0;
	    }
	    //phases[i] = choose(this.PHASE_CHOICES);
	}
    }
    return phases;
};


Robot.prototype.createNodes = function(nodeIds, gridN, gridM) {
    for (var i=0; i<nodeIds.length; i++) {
	var nodeId = nodeIds[i];
	this.nodeIdMapping[nodeId] = i;
	var gridpos = this.gridPosFromNodeIdx(nodeId, gridN, gridM);
	var center = this.positionFromNodeIdx(nodeId, gridN, gridM);
	this.nodes.push(new Node(nodeId, this.NODE_RADIUS, this.NODE_MASS, gridpos, center));
    }
};


Robot.getActiveNodeIds = function(A) {
    var ids = [];
    for (var i=0; i<A.length; i++) {
	for (var j=0; j<A[i].length; j++) {
	    if (A[i][j] == 1) {
		ids.push(i);
		break;
	    }
	}
    }
    return ids;
};


/*
 based on "from" node id and "to" node id, determine whether 
 the segment is pointing in the pos/neg X or pos/neg Z direction
*/
Robot.prototype.getSegmentRotationKey = function(
    nodeIdFrom, nodeIdTo, adjacencyMatrix, gridN, gridM) {
    var fromRow = Grid.rowFromElementIdx(nodeIdFrom, gridN, gridM);
    var toRow   = Grid.rowFromElementIdx(nodeIdTo,   gridN, gridM);
    if (fromRow == toRow) {
	return "x";
    } 
    return "z";
};


Robot.prototype.addSegment = function(seg) {
    this.segments.push(seg);
};


// @deprecated
Robot.prototype.getEndPosition = function(centerPos, nodePos, segRotationKey) {

    var diffVec = ammosub(nodePos, centerPos);
    var diffVecLength = ammodist(centerPos, nodePos);
    var nodeRad = this.getNodeRadius();

    var scaleVal = (diffVecLength-nodeRad)/diffVecLength;
    diffVec = ammoscale(diffVec, scaleVal);

    var fromPosition = ammoadd(centerPos, diffVec);

    return fromPosition;
};


Robot.getTopPosition = function(node, isHorizontal) {
    var rtn = new Ammo.btVector3();
    var nodeCenter = node.getPosition();
    var nodeRadius = node.getRadius();
    // note that horizontal := neg x-oriented
    if (isHorizontal) {
	// x is node.radius to the right of tNode
	rtn.setX(nodeCenter.x() - nodeRadius);
	// y is the same
	rtn.setY(nodeCenter.y());
	// z is the same
	rtn.setZ(nodeCenter.z());
    } else {
	// x is the same
	rtn.setX(nodeCenter.x());
	// y is the same
	rtn.setY(nodeCenter.y());
	// z is node.radius down from tNode
	rtn.setZ(nodeCenter.z() - nodeRadius);
    }
    return rtn;
};


Robot.getBotPosition = function(bNode, isHorizontal) {
    var rtn = new Ammo.btVector3();
    var nodeCenter = bNode.getPosition();
    var nodeRadius = bNode.getRadius();
    if (isHorizontal) {
	// x is node.radius to the left of bNode
	rtn.setX(nodeCenter.x() + nodeRadius);
	// y is the same
	rtn.setY(nodeCenter.y());
	// z is the same
	rtn.setZ(nodeCenter.z());
    } else {
	// x is the same
	rtn.setX(nodeCenter.x());
	// y is the same
	rtn.setY(nodeCenter.y());
	// z is node.radius above bNode
	rtn.setZ(nodeCenter.z() + nodeRadius);
    }
    return rtn;
};


/*
 create this robot's segments
*/
Robot.prototype.createSegments = function(adjacencyMatrix, gridN, gridM) {
    var A = adjacencyMatrix;
    
    for (var row=0; row<A.length; row++) {
	// only consider lower triangular elements to avoid redundancy
	for (var col=0; col<row; col++) { 
	    if (A[row][col]==1) {

		var bNode = this.getNodeById(row); // "top" node
		var tNode = this.getNodeById(col); // "bottom" node
		
		var isHorizontal = Segment.isXOriented(bNode, tNode);
		var tPos = Robot.getTopPosition(tNode, isHorizontal); // segment "bottom" position
		var bPos = Robot.getBotPosition(bNode, isHorizontal); // segment "top" position
		
		var s = new Segment(this.SEGMENT_RADIUS,this.SEGMENT_MASS, bPos, tPos, bNode, tNode);

		this.addSegment(s);
	    }
	}
    }
};


Robot.prototype.getSegmentById = function(id) {
    for (var i=0; i<this.segments.length; i++) {
	if (this.segments[i].id==id) {
	    return this.segments[i];
	}
    }
    console("FATAL: Robot.fetchSegmentById()");
};


/*
  move the bot
*/
Robot.prototype.move = function(time) {
    for (var i=0; i<this.joints.length; i++) {
	if (this.joints[i].isEnabled()) {
	    this.joints[i].actuate(time);
	}
    }
};


/*
  remove bot from world
*/
Robot.prototype.removeFromWorld = function(world) {
    for (var i=0; i<this.getNumSegments(); i++) {
	var body = this.segments[i].getRigidBody();
	world.removeCollisionObject(body);
    }
    for (i=0; i<this.getNumNodes(); i++) {
	body = this.getNode(i).getRigidBody();
	world.removeCollisionObject(body);
    }
    for (i=0; i<this.joints.length; i++) {
	body = this.joints[i].getWorldObject();
	world.removeConstraint(body);
    }
    this.segments = [];
    this.nodes = [];
    this.joints = [];
    this.isActive = false;
};
