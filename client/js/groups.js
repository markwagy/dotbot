/* groups.js: classes related to keeping track of groups */
/* c. mark wagy 2014 */

/* 
   dependencies:
   - jQuery
   - D3
*/


/* 
   constructor. 
   requires group id (can call getNewId() for this)
   we will assume that the order in which elements are added makes a "path":
   that is, a directed line made up of segments from one element to the next.
*/
function Group(groupId) {
    this.groupId = groupId;
    this.elements = [];
};


Group.prototype.getId = function() {
    return this.groupId;
};


Group.prototype.setColor = function(color) {
    this.color = color;
}


Group.prototype.getColor = function() {
    return this.color;
}


/*
  add an element to be grouped
*/
Group.prototype.addElement = function(el) {
    this.elements.push(el);
};


Group.prototype.addElements = function(els) {
    for (var i=0; i<els.length; i++) {
	this.addElement(els[i]);
    }
};


Group.prototype.removeElement = function(el) {
    var index = this.elements.indexOf(el);
    this.elements.splice(index, 1);
};


Group.prototype.getElements = function() {
    return this.elements;
};


Group.prototype.contains = function(element) {
    return this.elements.indexOf(element)!=-1;
};


Group.prototype.numElements = function() {
    return this.elements.length;
};


/*
  get a new "static" group id
*/
Group.getNewId = function() {
    if (typeof Group.idNum == 'undefined') {
	Group.idNum = 0;
    }
    Group.idNum++;
    return "group" + Group.idNum;
};


/* migrate given element from groupFrom to current group */
Group.prototype.migrateElementFrom = function(element, groupFrom) {
    groupFrom.removeElement(element);
    // ensure that we don't already have this element
    if (!this.contains(element)) {
	this.elements.push(element);
    }
};


/*
  given a list of objects with fields "x" and "y",
  return the "path command language" representation to be
  used in the SVG path definition.
*/
Group.svgPathListFromXY = function(xyList) {
    var str = "M" + xyList[0].x + " " + xyList[0].y;
    for (var i=1; i<xyList.length; i++) {
	str += "L" + xyList[i].x + " " + xyList[i].y;
    }
    return str;
};


/*
  get a path definition from the D3 SVG object
  for this Group's elements.
*/
Group.prototype.pathFromElements = function(d3_svg_obj) {
    var pathEls = [];
    for (var i=0; i<this.elements.length; i++) {
	var currEl = this.elements[i];
	var cx = d3_svg_obj.select("circle#" + currEl).attr("cx");
	var cy = d3_svg_obj.select("circle#" + currEl).attr("cy");
	pathEls.push({"x":cx, "y":cy});
    }
    var pathStr = "";
    if (pathEls.length>0) {
	pathStr = Group.svgPathListFromXY(pathEls);
    }
    return pathStr;
};


Group.prototype.pathPoints = function(svg) {
    var pts = [];
    for (var i in this.elements) {
	pts.push(
	    {
		"x": $("circle#" + this.elements[i]).attr("cx"), 
		"y": $("circle#" + this.elements[i]).attr("cy")
	    });
    }
    return pts;
}


/****************************************

Configuration

A Configuration is a partition of groups.
It also contains the (visual) paths used to obtain those groups.

****************************************/

// TODO: this should have an argument of either the SVG that
// could be used to define the configuration or the list of
// group partitions that define the configuration
function Configuration(opts) {
    this.groups = [];
    if (opts['svg']) {
	var svg = opts.svg;
	// use SVG object to define groups for this configuration
	var groupList = [];
	// extract group ids and joint ids from svg circles
	//var circles1 = $("circle");
	$.each($("circle"), function(index, value) {
	    // can't just embed custom attrs apparently, so have to embed group in innerHTML
	    var groupId = value.innerHTML;
	    var jointId = value.id;
	    if (!groupList[groupId]) {
		groupList[groupId] = [];
	    }
	    groupList[groupId].push(jointId);
	});

	// build groups in this config from svg-based lists
	for (var index in groupList) {
	    var g = new Group(index);
	    g.addElements(groupList[index]);
	    this.groups.push(g);
	}
    }
}


Configuration.prototype.fromJSON = function(json) {
    for (var grpIdx=0; grpIdx<json.groups.length; grpIdx++) {
	var currGroup = json.groups[grpIdx];
	var group = new Group(currGroup.id);
	group.setColor(currGroup.color);
	for (var elIdx=0; elIdx<currGroup.elements.length; elIdx++) {
	    var currEl = currGroup.elements[elIdx];
	    group.addElement(currEl);
	}
	this.addGroup(group);
    }
}


Configuration.prototype.fromSVG = function(domSVGSelect) {
    // use SVG object to define groups for this configuration
    var groupList = [];
    // extract group ids and joint ids from svg circles
    //var circles1 = $("circle");
    $.each($(domSVGSelect + " circle"), function(index, value) {
	var groupId = $(this).attr("data-group");
	var jointId = value.id;
	if (!groupList[groupId]) {
	    groupList[groupId] = [];
	}
	groupList[groupId].push(jointId);
    });

    // build groups in this config from svg-based lists
    for (var index in groupList) {
	var g = new Group(index);
	g.addElements(groupList[index]);
	this.groups.push(g);
    }
}


Configuration.prototype.addGroup = function(grp) {
    this.groups.push(grp);
};


Configuration.prototype.addGroups = function(grps) {
    for (var i=0; i<grps.length; i++) {
	this.addGroup(grps[i]);
    }
};


Configuration.prototype.getGroupByGroupId = function(groupId){
    for (var i=0; i<this.groups.length; i++) {
	if (this.groups[i].groupId == groupId) {
	    return this.groups[i];
	}
    }
};


Configuration.prototype.getGroups = function() {
    return this.groups;
};


Configuration.prototype.removeEmptyGroups = function() {
    var tmpGroups = [];
    var curGroups = this.groups;
    for (var i=0; i<curGroups.length; i++) {
	if (curGroups[i].numElements()>0) {
	    tmpGroups.push(curGroups[i]);
	}
    }
    this.groups = tmpGroups;
};


// reconfigure to accommodate the given new group 
// (by dropping elements from old group configurations in favor of new group)
Configuration.prototype.reconfigureGroups = function(updateGroup) {
    // for each element in update group, migrate that element from its existing group to the new group
    // TODO: improve efficiency
    var updateEls = updateGroup.getElements();
    for (var i=0; i<updateEls.length; i++) {
	var currEl = updateEls[i];
	for (var j=0; j<this.groups.length; j++) {
	    var currGroup = this.groups[j];
	    if (currGroup.contains(currEl)) {
		updateGroup.migrateElementFrom(currEl, currGroup);
	    }
	}
    }
    // add new group to config
    this.groups.push(updateGroup);
    // remove any empty groups that result
    this.removeEmptyGroups();
};


// get a deep copy of current configuration
Configuration.prototype.deepCopy = function() {
    var newObject = jQuery.extend(true, {}, this);
    return newObject;
};


Configuration.prototype.getElementGroup = function(element) {
    for (var i in this.groups) {
	if (this.groups[i].contains(element)) {
	    return this.groups[i];
	}
    }
}
