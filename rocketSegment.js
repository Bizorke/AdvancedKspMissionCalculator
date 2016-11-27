
"use strict";

function RocketSegment(label){
	this.stages = [];
	this.rocket = null;
	this.label = label
	
	//Flags
	this.hasPayloadStage = false;
	this.hasVacuumStage = false;
	this.hasOrbitalStage = false;
	this.hasLaunchStage = false;
	this.hasLandStage = false;
	this.hasAerocaptureStage = false;
	this.hasHeatshieldStage = false;
	this.hasParachuteStage = false;
}

RocketSegment.prototype.addStage = function(stage){
	
	switch(stage.type){
		case "Payload":
			if(this.stages.length > 0) throw "Payload must be the first stage."; 
			this.hasPayloadStage = true;
			break;
		case "Parachutes":
			if(this.hasHeatshieldStage || this.hasParachuteStage || this.hasLandStage || this.hasAerocaptureStage || this.hasVacuumStage || this.hasOrbitalStage || this.hasLaunchStage) throw "Invalid placement of parachute stage."; 
			this.hasParachuteStage = true;
			break;
		case "Heat Shield":
			if(this.hasHeatshieldStage || this.hasLandStage || this.hasAerocaptureStage || this.hasVacuumStage || this.hasOrbitalStage || this.hasLaunchStage) throw "Invalid placement of heat shield stage."; 
			this.hasHeatshieldStage = true;
			break;
		case "Land":
			if(this.hasLandStage || this.hasAerocaptureStage || this.hasVacuumStage || this.hasOrbitalStage || this.hasLaunchStage || this.hasHeatshieldStage || this.hasParachuteStage) throw "Invalid placement of land stage."; 
			this.hasLandStage = true;
			break;
		case "Aerocapture":
			if(this.hasLandStage || this.hasAerocaptureStage || this.hasVacuumStage || this.hasOrbitalStage || this.hasLaunchStage || this.hasHeatshieldStage || this.hasParachuteStage) throw "Invalid placement of aerocapture stage."; 
			this.hasAerocaptureStage = true;
			//Don't forget to add heat shields too (separately).
			break;
		case "Vacuum":
			if(this.hasVacuumStage || this.hasOrbitalStage || this.hasLaunchStage || this.hasHeatshieldStage || this.hasParachuteStage) throw "Invalid placement of vacuum stage."; 
			this.hasVacuumStage = true;
			break;
		case "Orbital":
			if(this.hasOrbitalStage || this.hasLaunchStage || this.hasHeatshieldStage || this.hasParachuteStage) throw "Invalid placement of orbital stage."; 
			this.hasOrbitalStage = true;
			break;
		case "Takeoff":
			if(this.hasLaunchStage || this.hasHeatshieldStage || this.hasParachuteStage) throw "Invalid placement of launch stage."; 
			this.hasLaunchStage = true;
			break;
		default:
			throw "Stage type not supported.";
			break;
	}
	
	stage.rocketSegment = this;
	this.stages.push(stage);
}

RocketSegment.prototype.getCurrentStage = function(){
	if(this.stages != null && this.stages.length > 0){
		return this.stages[this.stages.length - 1];
	}
	else{
		return null;
	}
}

RocketSegment.prototype.getMass = function(){
	var m = 0;
	for(var i = 0; i < this.stages.length; i++){
		m += this.stages[i].getMass();
	}
	return m;
}

RocketSegment.prototype.addStage = function(stage){
	stage.rocketSegment = this;
	this.stages.push(stage);
	return stage;
}

RocketSegment.prototype.clone = function(){
	var newSegment = new RocketSegment(this.label);
	for(var i = 0; i < this.stages.length; i++){
		var cStage = this.stages[i].clone();
		newSegment.addStage(cStage);
	}
	return newSegment;
}

RocketSegment.prototype.getThrust = function(outsidePressure){
	var currentStage = this.getCurrentStage();
	if(currentStage){
		return currentStage.getThrust(outsidePressure);
	}
	else{
		return 0;
	}
}

RocketSegment.prototype.burn = function(time, outsidePressure, initialRocketMass, maxDesiredDv){
	var totalDM = 0;
	var stage = this.getCurrentStage();
	if(stage.type == "Land" || stage.type == "Vacuum"){
		return 0; //Don't want to burn this in the launch simulation. 
	}
	var maxThrust = this.getThrust(outsidePressure);
	var maxDv = stage.engine != null ? 
		time * maxThrust / (initialRocketMass - (stage.engine.fuelConsumption * (1 + stage.detachableBoosters.length) * stage.numbEnginesPerBooster * stage.fuelType.density) / 2) 
		: 0;

	var thrustAmount = Math.min(maxDv, maxDesiredDv) / maxDv; // based on terminal velocity.
	totalDM += stage.burn(time, thrustAmount, outsidePressure);
	
	return totalDM;
}

RocketSegment.prototype.dump = function(){
	var stage = this.getCurrentStage();
	if(stage) return stage.dump();
	else return 0;
}