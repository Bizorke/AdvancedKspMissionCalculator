"use strict";


function Rocket(){
	this.segments = [];
	this.flightRecorder = new FlightRecorder(this);
	this.fuelDepleted = false;
}

//Returns the delta v from the burn.
//Won't jettison segments.
//FIXME: TODO: make sure this doesn't waste landing fuel unless absolutely necessary.
Rocket.prototype.burn = function(time, outsidePressure, maxDesiredDv){
	if(this.fuelDepleted) return 0;
	
	var initialMass = this.getMass();
	
	var segment = this.getCurrentSegment();
	var totalDM = segment.burn(time, outsidePressure, initialMass, maxDesiredDv);
	
	var afterMass = this.getMass();
	
	var dumpResult = segment.dump(); //Note that dumping will affect the mass because this function also jettisons expended boosters.
	
	//Jettison stage.
	if(dumpResult == 0){
		var currentStage = segment.getCurrentStage();
		if(currentStage != null && currentStage.type != "Parachutes" && currentStage.type != "Heat Shield" && currentStage.type != "Payload" && currentStage.type != "Land"){
			this.flightRecorder.log("Jettison the central engine upon exhaustion.", "#ffffb3");
			segment.stages.pop();
			
			var newCurrentStage = this.getCurrentStage();
			
			if(newCurrentStage != null && newCurrentStage.engine != null && newCurrentStage.type != "Land"){
				this.flightRecorder.log("Activate next stage.", "#ccffcc");
				this.flightRecorder.stage0Jettisoned = true;
			}
			else{
				this.flightRecorder.log("Fuel depletion.", "#ffe6e6");
				this.fuelDepleted = true;
			}
		}
		
	}
	
	return totalDM / ((afterMass + initialMass) / 2);
}

Rocket.prototype.getMass = function(){
	var m = 0;
	for(var i = 0; i < this.segments.length; i++){
		m += this.segments[i].getMass();
	}
	return m;
}

Rocket.prototype.addSegment = function(segment){
	segment.rocket = this;
	this.segments.push(segment);
	return segment;
}

Rocket.prototype.getCurrentSegment = function(){
	if(this.segments != null && this.segments.length > 0){
		return this.segments[this.segments.length - 1];
	}
	else{
		return null;
	}
}

Rocket.prototype.getCurrentStage = function(){
	var stage = null;
	for(var i = this.segments.length - 1; stage == null && i >= 0; i--){
		var currentSegment = this.segments[i];
		if(currentSegment) stage = currentSegment.getCurrentStage();
	}
	return stage;
}

Rocket.prototype.addStage = function(stage){
	var currentSegment = this.getCurrentSegment();
	if(!currentSegment){
		throw "Add a rocket segment before adding a stage.";
		//currentSegment = this.addSegment(new RocketSegment());
	}
	
	currentSegment.addStage(stage);
}

Rocket.prototype.getFuelBurnRate = function(){
	var currentStage = this.getCurrentStage();
	if(currentStage){
		return currentStage.getFuelBurnRate();
	}
	else{
		return 0;
	}
}

Rocket.prototype.getThrust = function(outsidePressure){
	var currentStage = this.getCurrentStage();
	if(currentStage){
		return currentStage.getThrust(outsidePressure);
	}
	else{
		return 0;
	}
}

//Makes a copy of the current rocket and tries to get the dV.
Rocket.prototype.getDv = function(){
	var copyR = this.clone();
	var dv = 0;
	for(var seg = copyR.segments.length - 1; seg >= 0; seg--){
		var segment = copyR.segments[seg];
		for(var s = segment.stages.length - 1; s >= 0; s--){
			var stage = segment.stages[s];
			dv += copyR._getStageDv(stage);
			
			segment.stages.pop();
		}
	}
	
	return dv;
}

//Makes a copy of the current rocket and tries to get the dV.
Rocket.prototype.getSpaceDvOfCurrentStage = function(){
	var copyR = this.clone();
	var dv = 0;
	var segment = copyR.getCurrentSegment();
	for(var s = segment.stages.length - 1; s >= 0; s--){
		var stage = segment.stages[s];
		if(stage.type == "Launch"){
			break;
		}
		dv += _getStageDv(stage);
		
		copyR.stages.pop();
	}
	
	return dv;
}

Rocket.prototype._getStageDv = function(stage){
	var dv = 0;
	for(var p = stage.detachableBoosters.length - 2; p >= 0; p -= 2){
		//Expend a pair of detachable boosters.
		var b1 = stage.detachableBoosters[p];
		var b2 = stage.detachableBoosters[p + 1];
		var mBefore = this.getMass();
		var burnRate = this.getFuelBurnRate();
		var twoBoosterFuel = b1.fuelAmount + b2.fuelAmount;
		var dt = twoBoosterFuel / burnRate;
		b1.fuelAmount = 0;
		b2.fuelAmount = 0;
		var mAfter = this.getMass();
		var thrust = this.getThrust(0);
		
		dv += dt * thrust / ((mBefore + mAfter) / 2);
		
		stage.detachableBoosters.pop();
		stage.detachableBoosters.pop();
	}
	
	//Central booster.
	var b = stage.mainBooster;
	if(b != null){
		var mBefore = this.getMass();
		var burnRate = this.getFuelBurnRate();
		var boosterFuel = b.fuelAmount;
		var dt = boosterFuel / burnRate;
		b.fuelAmount = 0;
		var mAfter = this.getMass();
		var thrust = this.getThrust(0);
		
		dv += dt * thrust / ((mBefore + mAfter) / 2);
	}
	return dv;
}

Rocket.prototype.getTwr = function(planet){
	return this.getThrust(planet.pressure) / (planet.g * this.getMass());
}

Rocket.prototype.getDragArea = function(){
	var largestArea = 0.1;
	for(var j = 0; j < this.segments.length; j++){
		var segment = this.segments[j];
		for(var i = 0; i < segment.stages.length; i++){
			var stage = segment.stages[i];
			var a = 0;
			if(stage.engine != null){
				a += stage.engine.dragArea * (1 + segment.stages[i].detachableBoosters.length);
			}
			if(stage.heatShield != null){
				a += stage.heatShield.area * stage.numbHeatShields;
			}
			if(stage.type == "Payload"){
				a += pi * stage.cargoRadius * stage.cargoRadius;
			}
			if(a > largestArea){
				largestArea = a;
			}
		}
	}
	
	return largestArea;
}

Rocket.prototype.clone = function(){
	var newRocket = new Rocket();
	for(var i = 0; i < this.segments.length; i++){
		var segment = this.segments[i].clone();
		newRocket.addSegment(segment);
	}
	return newRocket;
}

Rocket.prototype.update = function(dTime, altitude, orbitalV){
	this.flightRecorder.update(dTime, altitude, orbitalV);
}

Rocket.prototype.getTorque = function(){
	var totalTorque = 0;
	for(var j = 0; j < this.segments.length; j++){
		var segment = this.segments[j];
		for(var i = 0; i < segment.stages.length; i++){
			var stage = segment.stages[i];
			totalTorque += stage.getTorque();
		}
	}
	return totalTorque;
}

function FlightRecorder(rocket){
	this.events = []; 
	this.flightTime = 0;
	this.rocket = rocket;
	this.rocketMass = rocket.getMass();
	//this.result = null;
	this.bestAltitude = 0;
	this.bestOrbitalVelocity = 0;
	this.missionStatus = "Pending";
	this.extraLaunchDv = 0;
	this.altitude = 0;
	this.stage0Jettisoned = false;
	
	//fates
	this.problems = new FlightProblems();
	
	this.terminalVWarningActive = false;
	this.lastTerminalVLogged = 0;
}

FlightRecorder.prototype.update = function(dTime, altitude, orbitalV){
	this.flightTime += dTime;
	this.altitude = altitude;
	this.bestOrbitalVelocity = 0;
	if(altitude > this.bestAltitude){
		this.bestAltitude = this.altitude;
	}
	if(orbitalV > this.bestOrbitalVelocity){
		this.bestOrbitalVelocity = orbitalV;
	}
}

FlightRecorder.prototype.log = function(message, color){
	this.events.push({time: this.flightTime, altitude: this.altitude, message: message, color: (color || "0xFFFFFF")});
}

FlightRecorder.prototype.logTerminalV = function(terminalV, speed){
	if(speed > 0 && speed > this.lastTerminalVLogged * 1.5 && (terminalV - speed) / speed < 0.1){
		if(this.terminalVWarningActive){
			this.log("Gradually adjust speed to " + (Math.round(terminalV / 10) * 10) + " m/s by " + readableDistance(Math.round(this.altitude / 100) * 100) + " altitude.", "#e6f7ff");
		}
		else{
			this.log("Keep speed below " + (Math.round(terminalV / 10) * 10) + " m/s by " + readableDistance(Math.round(this.altitude / 100) * 100) + " altitude.", "#e6f7ff");
			this.terminalVWarningActive = true;
		}
	}
	else{
		if(this.terminalVWarningActive){
			this.log("Speed up.", "#b3e6ff");
			this.terminalVWarningActive = false;
		}
	}
}

FlightRecorder.prototype.recordStats = function(alt, orbitalV){
	if(alt > this.bestAltitude){
		this.bestAltitude = alt;
	}
	if(orbitalV > this.bestOrbitalVelocity){
		this.bestOrbitalVelocity = orbitalV;
	}
}

function FlightProblems (){
	//Flight problems
	this.didntGetOffTheGround = false;
	this.boosterFuelDepletedDuringAscent = false;
	this.fuelDepletedInSubOrbit = false;
	this.earlyReentry = false;
	this.insufficientMissionDv = false;
	
	//Design problems
	this.tooMassive = false;
	this.stageTwrTooLow = false; //This is worse than twrTooLow because adding more boosters won't help.
	this.twrTooLow = false;
	this.noBottomNodeForIntermediateStage = false;
	//this.fuelDepleted = false; //catch all.
	//this.fuelDepetedDuringAscent = false;
}

FlightProblems.prototype.hasProblem = function(){
	return this.didntGetOffTheGround
		|| this.boosterFuelDepletedDuringAscent
		|| this.fuelDepletedInSubOrbit
		|| this.earlyReentry
		|| this.insufficientMissionDv
		
		|| this.tooMassive
		|| this.stageTwrTooLow
		|| this.twrTooLow
		|| this.noBottomNodeForIntermediateStage;
}