
function MyDemoApplication(options) {
    this.isPaused = false;
    this.oneStep = false;
    this.floorY = -1;
    this.time = 0.0;
    this.rigidBodyOpts = new Object();
    // the definition of friction doesn't appear to do anything
    this.rigidBodyOpts.friction = 0.1;
    this.runTime = 10;
    this.writeOnce = false;
    this.configSendURL = "";
    this.appVersion = null;
    this.uuid = generateUid();
    this.historyPanel = null;
    this.floor = null;
    this.GROUND_THICKNESS = 0.1;
    // the following calls initPhysics
    DemoApplication.apply(this, arguments);
}

$.extend(MyDemoApplication.prototype,
	 DemoApplication.prototype);


MyDemoApplication.prototype.setConfig = function(config) {
    this.config = config;
};


MyDemoApplication.prototype.setDistanceDisplayDOMElement = function(domEl) {
    this.displayDOMElement = domEl;
};


MyDemoApplication.prototype.setTimeDisplayDOMElement = function(domEl) {
    this.timeDOMElement = domEl;
};


MyDemoApplication.prototype.setDistanceIndicatorDOMElement = function(domEl) {
    this.distanceIndicatorDOMElement = domEl;
};


/*
 add a cylinder to the world
*/
MyDemoApplication.prototype.addCylinder = function(position, radius, length, mass, isHorizontal) {
/*    var cylShape = new Ammo.btCylinderShape(
	new Ammo.btVector3(radius, length/2, 0));
*/
    var cylShape = new Ammo.btBoxShape(this.tVec(radius/2,length/2-.1,radius/2));
    var cylTrans = new Ammo.btTransform();
    cylTrans.setIdentity();
    cylTrans.setOrigin(position);
    var cylRot = new Ammo.btQuaternion();
    if (isHorizontal) {
	cylRot.setEulerZYX(-Math.PI/2,0,0);
    } else {
	cylRot.setEulerZYX(0,0,Math.PI/2);
    }
    cylTrans.setRotation(cylRot);

    var cyl = this.localCreateRigidBody(mass, cylTrans, cylShape, this.rigidBodyOpts);
    return cyl;
};


MyDemoApplication.prototype.setRunTime = function(rt) {
    this.runTime = rt;
};


MyDemoApplication.prototype.setAppVersion = function(ver) {
    this.appVersion = ver;
};

/*
 add a sphere to the world
*/
MyDemoApplication.prototype.addSphere = function(radius, mass, position) {
//    var sphereShape = new Ammo.btSphereShape(radius);
    var sphereShape = new Ammo.btBoxShape(this.tVec(radius-.01, radius-.01, radius-.01));
    var sphereTrans = new Ammo.btTransform();
    sphereTrans.setIdentity();
    var x = position.x();
    var y = position.y();
    var z = position.z();
    sphereTrans.setOrigin(this.tVec(x,y,z));
    var sphere = this.localCreateRigidBody(mass, sphereTrans, sphereShape, this.rigidBodyOpts);
    return sphere;
};


/*
 add a node to the world
*/
MyDemoApplication.prototype.addNodeToWorld = function(nodeObject) {
    var body = this.addSphere(
	nodeObject.getRadius(), 
	nodeObject.getMass(),
	nodeObject.getPosition());
    nodeObject.setRigidBody(body);
};


MyDemoApplication.prototype.setHistoryPanel = function(hp) {
    this.historyPanel = hp;
};


MyDemoApplication.prototype.addSegmentToWorld = function(segmentObject) {
    var body = this.addCylinder(
	segmentObject.getCenter(),
	segmentObject.getRadius(),
	segmentObject.getLength(),
	segmentObject.getMass(),
	segmentObject.isHorizontal());
    segmentObject.setRigidBody(body);
};


MyDemoApplication.prototype.addJointToWorld = function(jointObject) {

    var seg = jointObject.getSegment();
    var node = jointObject.getNode();

    var segBody = seg.getRigidBody();
    var nodeBody = node.getRigidBody();
    var segPos = jointObject.getSegmentPosition();
    var nodePos = jointObject.getNodePosition();
    var segOr = jointObject.getSegmentOrientation();
    var nodeOr = jointObject.getNodeOrientation();
    var limits = jointObject.getLimits();

    var worldJoint = new Ammo.btHingeConstraint(
	segBody, nodeBody, segPos, nodePos, segOr, nodeOr);
//    worldJoint.setLimit(limits[0], limits[1]);
    jointObject.setWorldObjectPointer(worldJoint);
    this.m_dynamicsWorld.addConstraint(worldJoint, true);    
};


MyDemoApplication.prototype.setConfigSendLocation = function(url) {
    this.configSendURL = url;
};


/*
 add the robot to the dynamics world
*/
MyDemoApplication.prototype.addRobotToWorld = function() {
    var p_robot = this.robot;

    var i=0;

    // nodes
    for (i=0; i<p_robot.getNumNodes(); i++) {
	var currNode = p_robot.getNode(i);
	this.addNodeToWorld(currNode);
    }

    // segments
    for (i=0; i<p_robot.getNumSegments(); i++) {
	var currSeg = p_robot.getSegment(i);
	this.addSegmentToWorld(currSeg);
    }

    // joints
    for (i=0; i<p_robot.getNumJoints(); i++) {
	var currJoint = p_robot.getJoint(i);
	this.addJointToWorld(currJoint);
    }

    p_robot.isActive = true;
    this.time = 0;
    this.writeOnce = true;
    this.startingPoint = this.robot.getPosition();
    this.m_shapeDrawer.refreshStartPoint(
	this.startingPoint.x(),
	this.floorY,
	this.startingPoint.z());
};


MyDemoApplication.prototype.initRobot = function(adjacencyMatrix, gridN, gridM, phases) {
    // define the robot
    this.robot = new Robot(adjacencyMatrix, gridN, gridM, 1, phases, this.config.mutation_prob);
};

/*
 @deprecated
instead use
1. this.initRobot()
2. this.addRobotToWorld
*/
MyDemoApplication.prototype.spawnRobot = function(adjacencyMatrix, gridN, gridM) {

    this.initRobot(adjacencyMatrix, gridN, gridM);

    // add it to the physics world
    this.addRobotToWorld();
};


MyDemoApplication.prototype.deleteRobot = function() {
    if (this.robot != null) {
	this.robot.removeFromWorld(this.m_dynamicsWorld);
	this.robot = null;
    }
};


MyDemoApplication.prototype.spawnGround = function() {

    var groundShape = new Ammo.btBoxShape(this.tVec(2000, this.GROUND_THICKNESS, 2000));
    var groundTrans = new Ammo.btTransform();
    groundTrans.setIdentity();
    groundTrans.setOrigin(this.tVec(0, this.floorY, 0));
    var opts = {};
    opts.rgb = {r: 0, g: 1, b: 0};
    this.floor = this.localCreateRigidBody(0, groundTrans, groundShape, opts);

    /*
       sceneJS doesn't have a plane primitive by default and since the version of 
       sceneJS that is used with the ammo.js DemoApplication is old, I can't get it 
       to work with the plugins that are now available (which include a plane).
       so we'll just use a big box for now.
    */
/*
    // Create infinite ground plane. yes there are two grounds. shouldn't need them.
    var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), -1);
    var aabbTransform = new Ammo.btTransform();
    aabbTransform.setIdentity();
    this.localCreateRigidBody(0, aabbTransform, aabbShape, this.rigidBodyOpts);
*/
};


MyDemoApplication.prototype.setKeyboardActions = function() {
    var th = this;
    this.keyboardCallback({
	e:function(e,da){
	    console.log("Pressed e");
	}
    });
    this.keyboardCallback({
	p:function(e,da){
	    console.log("Paused...");
	    th.isPaused = !th.isPaused;
	}
    });
    this.keyboardCallback({
	o:function(e,da){
	    console.log("step");
	    th.oneStep = true;
	}
    });

};


MyDemoApplication.prototype.setGravity = function(g) {
    this.m_dynamicsWorld.setGravity(this.tVec(0, g, 0));
};


MyDemoApplication.prototype.initPhysics = function(){
    // Bullet-interfacing code
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();
    this.m_dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(
	dispatcher, overlappingPairCache, solver, collisionConfiguration);

    this.setGravity(-5);

    // create objects
    this.spawnGround();

    // set up keyboard stuff
    this.setKeyboardActions();

    // Reset scene
    this.clientResetScene();
    this.setCameraDistance(20);
};


MyDemoApplication.prototype.isRunning = function() {
    return this.time < this.runTime;
};


MyDemoApplication.prototype.getCurrentDistance = function() {
    var dist = this.robot.getDistance(this.startingPoint);
    return dist;
};


MyDemoApplication.prototype.updateDistanceDisplay = function() {
    if (this.isRunning && this.robot != null) {
	$(this.displayDOMElement).html('current distance from red ball: <span id="distNum">' + 
				       Math.round(this.getCurrentDistance()*100)/100) + '</span>';
    }
};


MyDemoApplication.prototype.updateTimeDisplay = function() {
    if (this.isRunning && this.robot != null) {
	$(this.timeDOMElement).text("time left: " + 
				    Math.round(this.getTimeLeft()*100)/100);
    }
};


MyDemoApplication.prototype.updateDistanceIndicator = function() {
    var th = this;
    if (this.isRunning && this.robot != null) {
	$(this.distanceIndicatorDOMElement)
	    .filter(
		function() { 
		    return parseFloat($(this).attr("data-distance")) < th.getCurrentDistance();
		})
	    .css("background", "pink");

	$(this.distanceIndicatorDOMElement)
	    .filter(
		function() { 
		    return parseFloat($(this).attr("data-distance")) > th.getCurrentDistance();
		})
	    .css("background", "white");

    }
};


MyDemoApplication.prototype.getTimeLeft = function() {
    return this.runTime - this.time;
};


MyDemoApplication.prototype.clientMoveAndDisplay = function(){

    if (this.isRunning()) {
	if(this.m_dynamicsWorld && 
	   (!this.isPaused || (this.isPaused && this.oneStep))) {
	    this.oneStep = false;
	    // Simple dynamics world doesn't handle fixed-time-stepping
	    var ms = this.getDeltaTimeMicroseconds();
	    var minFPS = 1000000.0/60.0;
	    if(ms > minFPS) {
		ms = minFPS;
	    }

	    this.time += 0.01;
	    
	    if (this.robot != null && this.robot.isActive) {
		this.robot.move(this.time);
/*
		console.log("time: " + Math.round(100*this.time)/100 + 
			", distance: " + 
			Math.round(100*this.getCurrentDistance())/100 + 
			   ", position: " + pp(this.robot.getPosition));
*/
	    }

//	    this.m_dynamicsWorld.stepSimulation(ms / 1000000.0);
	    this.m_dynamicsWorld.stepSimulation(this.time);

	    //this.m_dynamicsWorld.stepSimulation(minFPS / 1000000.0);
	    this.updateDistanceDisplay();
	    this.updateTimeDisplay();
	    this.updateDistanceIndicator();
	}
    } else {
	// only allow a single write to server
	if (this.writeOnce == true) {
	    var dist = this.robot.getDistance(this.startingPoint);
	    this.sendResults(dist, this.robot.getAdjacencyMatrix());
	    this.writeOnce = false;
	    // also refresh history panel
	    //this.historyPanel.redraw();
	}
    }
};


MyDemoApplication.prototype.sendResults = function(dist, adj) {

    var dataJSON = {
	"distance": dist,
	"N": this.config.N,
	"M": this.config.M,
	"adjacency_matrix": adjMatToDBString(adj),
	"session": this.uuid,
	"version": this.appVersion,
	"phases": arrayToDBString(this.robot.getPhases())
    };

    $.ajax({
	type: "POST",
	url: this.configSendURL,
	data: dataJSON,
	success: null,
	dataType: null
    });
};


MyDemoApplication.prototype.resetWorld = function() {
//    this.initPhysics();
    this.deleteRobot();
//    this.m_bodies = [];
//    this.m_dynamicsWorld.removeCollisionObject(this.floor);

//    this.m_shapeDrawer.removeAllShapes();

    for (var i=0; i<this.m_shapeDrawer.drawbody.length; i++) {
	this.m_shapeDrawer.drawbody[i] = false;
    }

    for (i=0; i<this.m_shapeDrawer.bodies.length; i++) {
	var tn = this.m_shapeDrawer.scene.findNode("trans" + i);
	if (tn != null) {
	    tn.destroy();
	}

	var sn = this.m_shapeDrawer.scene.findNode("shape" + i);
	if (sn != null) {
	    sn.destroy();
	}

	var rn = this.m_shapeDrawer.scene.findNode("rot" + i);
	if (rn != null) {
	    rn.destroy();
	}
    }

    this.m_shapeDrawer.bodies = [];
    this.m_shapeDrawer.shapes = [];
    this.m_shapeDrawer.drawbody = [];
    for (var i=0; i<this.m_bodies.length; i++) {
	this.m_dynamicsWorld.removeCollisionObject(this.m_bodies[i]);
    }
    this.m_bodies = [];


//    var shapesNode = this.m_shapeDrawer.scene.findNode("shapes");
    /*
    there is a bug with eachNode that causes destroy not to work in it
     (specifically, it uses the length of the children of the node as the
     array index into children to destroy, but as we are destroying children
     the array is shrinking.
     */
/*
    var len = 0;
    if (shapesNode.children != null) {
	len = shapesNode.children.length;
    }
    var selector;
    while (len > 0) {
	selector = SceneJS._selectNode(node.children[len-1]);
	selector.destroy();
	len = shapesNode.children.length;
    }
*/
/*
    var foo = this.m_shapeDrawer.scene.findNode("shapes").eachNode(
	function() {
	    if (this != null) {
		this.destroy();
	    }
    });
    while(foo != null) {
	foo = this.m_shapeDrawer.scene.findNode("shapes").eachNode(
	    function() {
		if (this != null) {
		    this.destroy();
		}
	    });
	console.log("removing");
    }
*/	
    this.clientResetScene();
    this.spawnGround();
};


