"use strict";

function Orbit(planet){
	this.planet = planet;
	this.mu = G * this.planet.mass;
	this.periapsis = null;
	this.apoapsis = null;
	this.primary = null;
}

Orbit.prototype.clone = function(){
	var ret = new Orbit(this.planet);
	ret.periapsis = this.periapsis;
	ret.apoapsis = this.apoapsis;
	return ret;
}

/*Orbit.prototype.recalculateDependantVariables = function(){
	var focus = this.periapsis + this.planet.radius;
	if(this.apoapsis != null && this.periapsis != null){
		//Elliptical/circular orbit.
		this.majorAxis = this.focus + (this.apoapsis + this.planet.radius);
	}
	else if(this.apoapsis != null){
		//Sub-orbit. Don't think it will happen.
		throw "Can't calculate major axis during sub-orbital flight. Not implemented.";
	}
	else if(this.periapsis != null){
		//Hyperbolic orbit.
		//var eccentricity = ???;
		//var semiLatusRectum = ???;
		//this.majorAxis = 2 * semiLatusRectum / (1 - eccentricity ^ 2); //Don't do that.
		//this.majorAxis = -2 * this.periapsis; //x^2/a^2 + y^2/b^2 = 1 for y = 0 yields x = a, right? It's also negative.
		//I give up on this. Hyperbolic trajectories are too much work for this silly app. I'll assume, instead, that we always have parabolic trajectories.
		//That means majorAxis doesn't matter.
		this.majorAxis = null;
	}
	
	//this.fociDistance = this.majorAxis - this.focus * 2;
	//this.minorAxis = Math.sqrt(this.majorAxis * this.majorAxis - this.fociDistance * this.fociDistance);
}*/

/*Orbit.prototype.setSpeed = function(speed, angleFromPeriapsis){
	
}*/

/*Orbit.prototype.getSpeed = function(angleFromPeriapsis){
	
}*/

/*
EG:
(6.674e-11 * 5.2915793E22 * ((2 / (75768 + 600000)) - (2 / (70916 + 600000 + (75912 + 600000)))))^0.5


*/

Orbit.prototype.setApoapsisFromSpeed = function(s, d){
	if(s > this.getEscapeVelocityAtDistance(d)){
		this.apoapsis = null;
	}
	else{
		var focus = this.periapsis + this.planet.radius;
		this.apoapsis = - focus - this.planet.radius - 2 / ((s * s / (G * this.planet.mass)) - (2 / (d + this.planet.radius)));
	}
}

Orbit.prototype.getRadialSpeedVectorAtAltitude = function(altitude){
	if(this.apoapsis != null && altitude >= this.apoapsis) throw "Altitude for this calculation cannot be higher than apoapsis.";
	var dR = altitude + this.planet.radius;
	var cR = this.periapsis + this.planet.radius;
	var hSpeed = this.getSpeedAtDistance(this.periapsis);
	var vSpeed = 0;
	var oldHSpeed = hSpeed;
	var oldVSpeed = vSpeed;
	var dt = 1;//precision.
	while(cR < dR){ //I know there's a way to solve this using calculus, but the project is already past its deadline.
		
	
		var vG = -(dt * (G * this.planet.mass) / (cR * cR)); 
		//var aC = avgHSpeed * avgHSpeed / distanceFromPlanetCenter; 
		//var vC = aC * dt;
		vSpeed += vG;
		var avgHSpeed = (hSpeed + oldHSpeed) * 0.5;
		var avgVSpeed = (vSpeed + oldVSpeed) * 0.5;
		var d_v = avgVSpeed * dt;
		var d_h = avgHSpeed * dt;
		var theta = Math.atan2(d_h, d_v + cR);
		
		cR = Math.sqrt((cR + d_v) * (cR + d_v) + d_h * d_h)
		
		//Rotate velocity vector.
		var tempVectorX = hSpeed;
		var tempVectorY = vSpeed;
		hSpeed = tempVectorX * Math.cos(theta) - tempVectorY * Math.sin(theta);
		vSpeed = tempVectorY * Math.cos(theta) + tempVectorX * Math.sin(theta);
		
		oldHSpeed = hSpeed;
		oldVSpeed = vSpeed;
	}
	return [hSpeed, vSpeed];
}

Orbit.prototype.getSpeedAtDistance = function(r){
	if(this.apoapsis != null && this.periapsis != null){
		//Elliptical/circular orbit.
		var focus = this.periapsis + this.planet.radius;
		var majorAxis = focus + (this.apoapsis + this.planet.radius);
		return Math.sqrt(G * this.planet.mass * ((2 / (r + this.planet.radius)) - (2 / (majorAxis))));
	}
	else if(this.periapsis != null){
		//Parabolic/hyperbolic flight.
		return Math.sqrt(2 * G * this.planet.mass / (r + this.planet.radius)) + this.getHyperbolicExcessVelocity();
	}
	else if(this.apoapsis != null){
		//Sub-orbit. Don't think it will happen.
		throw "Can't calculate speed during sub-orbital flight. Not implemented.";
	}
}

Orbit.prototype.getEscapeVelocityAtDistance = function(d){
	if(this.periapsis == null)
		throw "Cannot calculate escape velocity when periapsis is not defined.";
	
	//return Math.sqrt(2 * this.planet.g * (this.planet.radius + d)); //This doesn't work because g changes based on r. Use the following equation instead...
	return Math.sqrt(2 * G * this.planet.mass / (this.planet.radius + d));
}

Orbit.prototype.getHyperbolicExcessVelocity = function(){
	if(this.primary == null){
		//Orbiting or exiting the sun. Either way, this calculator doesn't consider hyperbolic solar orbits.
		return 0;
	}
	else{
		if(this.apoapsis != null){
			//In stable orbit.
			return 0;
		}
		else{
			//In hyperbolic orbit. Get speed at primary.
			var speedWrtPrimary = this.primary.getSpeedAtDistance(this.planet.aveapsis);
			var speedOfPrimary = this.planet.orbit.getSpeedAtDistance(this.planet.aveapsis);
			var excess = Math.abs(speedWrtPrimary - speedOfPrimary);
			var localDv = this.translateParentDvToLocalDv(excess);
			return localDv;
		}
	}
}

Orbit.prototype.translateParentDvToLocalDv = function(vi){
	//Quadratir equation (don't ask).
	if(this.periapsis == null)
		throw "Cannot effect a parent dv during sub-orbital flights.";
	var ve = this.getEscapeVelocityAtDistance(this.periapsis);
	return Math.sqrt(ve * ve + vi * vi) - ve;
}
	
Orbit.prototype.effectParentDv = function(vi){
	var dv = this.translateParentDvToLocalDv(vi);
	//TODO: get rid of the return, and instead make the necessary changes up the orbit stack.
	//TODO: then find out where this code is used, and make sure they don't muck around with the stack.
	return dv;
}

Orbit.prototype.escape = function(){
	if(this.apoapsis == null){
		return 0;
	}
	else if(this.periapsis != null){
		var ve = this.getEscapeVelocityAtDistance(this.periapsis);
		var vp = this.getSpeedAtDistance(this.periapsis);
		var dv = ve - vp;
		this.setApoapsis(null);
		return dv;
	}
	else{
		throw "Can't escape if periapsis is not defined. Correct orbit first.";
	}
}

Orbit.prototype.setPeriapsis = function(value){
	this.periapsis = value;
	//this.recalculateDependantVariables();
	this.fixApses();
}

Orbit.prototype.setApoapsis = function(value){
	this.apoapsis = value;
	//this.recalculateDependantVariables();
	this.fixApses();
}

//Requires that there is an apoapsis.
Orbit.prototype.setPeriapsisViaApoapsis = function(value){
	if(this.apoapsis == null){
		throw "Cannot set periapsis via apoapsis for hyperbolic flights. Just set it directly.";
	}
	var apoV = this.getSpeedAtDistance(this.apoapsis);
	this.periapsis = value;
	//this.recalculateDependantVariables();
	var newApoV = this.getSpeedAtDistance(this.apoapsis);
	
	return Math.abs(newApoV - apoV);
	this.fixApses();
}

Orbit.prototype.setApoapsisViaPeriapsis = function(value){
	if(this.periapsis == null){
		throw "Cannot set apoapsis via periapsis for sub-orbital flights.";
	}
	var periV = this.getSpeedAtDistance(this.periapsis);
	this.apoapsis = value;
	//this.recalculateDependantVariables();
	var newPeriV = this.getSpeedAtDistance(this.periapsis);
	
	return Math.abs(newPeriV - periV);
	this.fixApses();
}

Orbit.prototype.fixApses = function(){
	if(this.apoapsis != null && this.periapsis != null){
		if(this.apoapsis < this.periapsis){
			var x = this.periapsis;
			this.periapsis = this.apoapsis;
			this.apoapsis = x;
		}
	}
	this.fixParentOrbits();
}

//If the current orbit has a set apoapsis, set the orbit of partents.
Orbit.prototype.fixParentOrbits = function(){
	if(this.primary){
		if(this.apoapsis != null){
			this.primary.apoapsis = this.planet.apoapsis;
			this.primary.periapsis = this.planet.periapsis;
		}
		this.primary.fixParentOrbits();
	}
	
}

//ORBIT STACKS.

function OrbitStack(){
	this.stack = [];
}

OrbitStack.prototype.addOrbit = function(orbit){
	if(this.stack.length == 0){
		if(orbit.planet != planetData.kerbol) throw "The top planet in the orbit stack must be Kerbol.";
	}
	else{
		if(this.stack[this.stack.length - 1].planet != orbit.planet.primary) throw "" + orbit.planet.name + " does not orbit " + this.stack[this.stack.length - 1].planet.name + "."
	}
	
	if(this.stack.length > 0){
		orbit.primary = this.stack[this.stack.length - 1];
	}
	this.stack.push(orbit);
}

OrbitStack.prototype.clone = function(){
	var ret = new OrbitStack();
	for(var i = 0; i < this.stack.length; i++){
		ret.addOrbit(this.stack[i].clone());
	}
	return ret;
}

OrbitStack.prototype.currentOrbit = function(){
	if(this.stack.length > 0){
		return this.stack[this.stack.length - 1];
	}
	else{
		return null;
	}
}

//PLANET Orbits

for(var i = 0; i < planetData.list.length; i++){
	var planet = planetData.list[i];
	if(planet.primary != null){
		planet.orbit = new Orbit(planet.primary);
		planet.orbit.setPeriapsis(planet.periapsis);
		planet.orbit.setApoapsis(planet.apoapsis);
	}
	else{
		planet.orbit = null;
	}
}









