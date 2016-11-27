"use strict";

function StageAttachment(type, mass, count, icon){
	this.mass = mass;
	this.type = type;
	this.count = count;
	this.icon = icon;
	this.torque = 0;
}

function Stage(stageType, engine, numbEnginesPerBooster, numbTanksPerBooster, numbRadialBoosterPairs, cargoMass, addStageRecoveryChutes){
	this.numbRadialBoosterPairs = numbRadialBoosterPairs;
	//rocket segment
	this.rocketSegment = null; 
	this.cargoMass = cargoMass;
	this.cargoRadius = 0;
	this.type = stageType;
	//this.dryMass = (numbRadialBoosters + 1) * (engine.mass + ); //Redundant (possibly not used?)
	this.fuelType = engine != null ? engine.fuelType : null; //Redundant
	this.engine = engine; 
	this.removedEngine = null; //Used when the engine is moded to an earlier stage.
	this.numbEnginesPerBooster = numbEnginesPerBooster;
	this.numbTanksPerBooster = numbTanksPerBooster;
	this.mainBooster = null;
	this.detachableBoosters = [];
	this.heatShield = null;
	this.numbHeatShields = 0;
	this.dumpEnabled = stageType == "Land" ? false : true;
	this.icon = "";
	this.overhead = 0; //Decouplers.
	this.addStageRecoveryChutes = addStageRecoveryChutes;
	
	this.attachments = [];
	
	if(engine != null){
		this.icon = engine.icon;
		this.mainBooster = new Booster(engine, numbEnginesPerBooster, numbTanksPerBooster, null, 0, addStageRecoveryChutes);
		for(var i = 0; i < numbRadialBoosterPairs; i++){
			this.detachableBoosters.push(new Booster(engine, numbEnginesPerBooster, numbTanksPerBooster, (this.detachableBoosters.length < 2 ? this.mainBooster : this.detachableBoosters[this.detachableBoosters.length - 2]), (i == 0 ? 0.5 : 1), addStageRecoveryChutes));
			this.detachableBoosters.push(new Booster(engine, numbEnginesPerBooster, numbTanksPerBooster, (this.detachableBoosters.length < 2 ? this.mainBooster : this.detachableBoosters[this.detachableBoosters.length - 2]), 1, addStageRecoveryChutes));
		}
	}
	else{
		if(this.type == "Parachutes"){
			this.icon = parachuteIcon;
		}
		else if(this.type == "Heat Shield"){
			this.icon = heatshieldIcon;
		}
	}
	
	//this.initialMass = this.getMass();
	this.initialFuel = engine != null ? numbTanksPerBooster * (numbRadialBoosterPairs * 2 + 1) * engine.minFuelTank : 0;
}

Stage.prototype.getTorque = function(){
	var totalTorque = 0;
	for(var i = 0; i < this.attachments.length; i++){
		totalTorque += this.attachments[i].torque;
	}
	return totalTorque;
}

Stage.prototype.replaceEngine = function(){
	this.removedEngine = this.engine;
	this.engine = null;
	this.icon = this.removedEngine.fuelIcon;
}

Stage.prototype.setHeatShields = function(heatShield, number){
	this.heatShield = heatShield;
	this.numbHeatShields = number;
	this.icon = heatShield.icon;
}

//This is used after the rocket is already built to add more fuel tanks (tweaking the design)
Stage.prototype.addFuelTanks = function(n){
	this.numbTanksPerBooster += n;
	if(this.mainBooster) this.mainBooster.addFuelTanks(n);
	for(var i = 0; i < this.detachableBoosters.length; i++){
		this.detachableBoosters[i].addFuelTanks(n);
	}
	
}

Stage.prototype.getMass = function(){
	var mass = 0;
	mass += this.cargoMass;
	if(this.mainBooster)
		mass += this.mainBooster.getMass();
		if(this.removedEngine){
			mass -= this.removedEngine.mass * this.numbEnginesPerBooster;
		}
	for(var i = 0; i < this.detachableBoosters.length; i++){
		mass += this.detachableBoosters[i].getMass();
	}
	if(this.heatShield){
		mass += this.heatShield.mass * this.numbHeatShields;
	}
	for(var i = 0; i < this.attachments.length; i++){
		mass += this.attachments[i].mass * this.attachments[i].count;
	}
	
	return mass;
}

//Returns the change in momentum from the burn.
Stage.prototype.burn = function(time, thrustAmount, outsidePressure){
	
	var totalDM = 0;
	//var startMass = this.getMass();
	if(this.mainBooster)
		totalDM += this.mainBooster.burn(time, thrustAmount, outsidePressure);
	
	for(var i = 0; i < this.detachableBoosters.length; i++){
		totalDM += this.detachableBoosters[i].burn(time, thrustAmount, outsidePressure);
	}
	
	//var afterMass = this.getMass();
	
	return totalDM;// / ((afterMass + startMass) / 2);
}

//Returns amount of remaining fuel. Good for knowing if the entire stage is ready to be jettisoned.
Stage.prototype.dump = function(){
	if(!this.dumpEnabled) return 0;
	var totalFuelAmount = 0;
	if(this.mainBooster)
		totalFuelAmount += this.mainBooster.dump(); // Need to do this because the dump function also tallies how much fuel we have left. Otherwise we end up dumping the main engine early.
	
	for(var i = 0; i < this.detachableBoosters.length; i++){
		totalFuelAmount += this.detachableBoosters[i].dump();
	}
	
	for(var i = this.detachableBoosters.length - 2; i >= 0; i -= 2){
		if(this.detachableBoosters[i].fuelAmount <= 0){
			if(this.detachableBoosters[i].fuelAmount != this.detachableBoosters[i + 1].fuelAmount){
				//console.warn("Error: Fuel amounts in opposite boosters was not equal.");
				throw "Error: Fuel amounts in opposite boosters was not equal."
			}
			this.detachableBoosters[i].isJettisoned = true;
			this.detachableBoosters[i + 1].isJettisoned = true;
			this.detachableBoosters.splice(i, 2);
			this.rocketSegment.rocket.flightRecorder.log("Detach pair of expended boosters.", "#ffffcc");
		}
	}
	
	return totalFuelAmount;
}

Stage.prototype.getFuelBurnRate = function(){
	var r = 0;
	if(this.mainBooster != null){
		r += this.mainBooster.getFuelBurnRate();
	}
	for(var i = 0; i < this.detachableBoosters.length; i++){
		r += this.detachableBoosters[i].getFuelBurnRate();
	}
	
	return r;
}

Stage.prototype.getThrust = function(outsidePressure){
	var f = 0;
	if(this.mainBooster != null){
		f += this.mainBooster.getThrust(outsidePressure);
	}
	for(var i = 0; i < this.detachableBoosters.length; i++){
		f += this.detachableBoosters[i].getThrust(outsidePressure);
	}
	
	return f;
}

Stage.prototype.getTwr = function(planet){
	return this.getThrust(planet.pressure) / (planet.g * this.getMass());
}

Stage.prototype.clone = function(){
	var numbBoosterPairs = this.detachableBoosters.length / 2;
	var stage = new Stage(this.type, this.engine || this.removedEngine, this.numbEnginesPerBooster, this.numbTanksPerBooster, numbBoosterPairs, this.cargoMass, this.addStageRecoveryChutes);
	if(numbBoosterPairs > 0){
		var lastBooster = this.detachableBoosters[numbBoosterPairs - 1];
		stage.detachableBoosters[numbBoosterPairs * 2 - 2].fuelAmount = lastBooster.fuelAmount;
		stage.detachableBoosters[numbBoosterPairs * 2 - 1].fuelAmount = lastBooster.fuelAmount;
	}
	else if(stage.mainBooster != null){
		stage.mainBooster.fuelAmount = this.mainBooster.fuelAmount;
	}
	if(this.heatShield){
		stage.setHeatShields(this.heatShield.clone(), this.numbHeatShields);
	}
	if(this.removedEngine){
		stage.replaceEngine();
	}
	//stage.overhead = this.overhead; //This is calculated when the stage is built.
	for(var i = 0; i < this.attachments.length; i++){
		stage.attachments.push(this.attachments[i]);
	}
	
	return stage;
}




