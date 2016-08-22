"use strict";

function Booster(engine, numbEngines, numbTanks, dumpIntoBooster, dumpMultiplier){
	this.engine = engine;
	this.numbTanks = numbTanks;
	this.numbEngines = numbEngines;
	this.initialFuelAmount = numbTanks * this.engine.minFuelTank + this.engine.builtinFuel * numbEngines;
	this.fuelAmount = this.initialFuelAmount;
	this.dumpingInto = dumpIntoBooster;
	this.dumpMultiplier = dumpMultiplier; // can be 0.5, for instance, if 2 engines are dumping into the same central tank.
	//this.dryMass = this.engine.mass * numbEngines + engine.fuelType.density * (engine.fuelType.containerMassRatio + 1) * (fuelAmount - this.engine.builtinFuel);
	this.initialMass = this.getMass();
	this.isJettisoned = false;
}

Booster.prototype.getMass = function(){
	if(this.isJettisoned){
		return 0;
	}
	return this.engine.mass * this.numbEngines //Engine mass
		+ this.engine.fuelType.density * this.engine.fuelType.containerMassRatio * (this.initialFuelAmount - this.engine.builtinFuel) //Containers
		+ this.engine.fuelType.density * this.fuelAmount; //Fuel
}

//time is in seconds.
//thrustAmount is a number between 0 and 1.
//Returns change in momentum.
Booster.prototype.burn = function(time, thrustAmount, outsidePressure){
	if(this.isJettisoned){
		return 0;
	}
	if(thrustAmount > 1 || thrustAmount < 0){
		throw "Error: Invalid thrustAmount."
	}
	var maxBurnable = time * this.engine.fuelConsumption * this.numbEngines; //The theoretical fuel consumption of this booster for this dT.
	var fuelBurnt = Math.min(maxBurnable * thrustAmount, this.fuelAmount);
	var fuelFactor = fuelBurnt / (maxBurnable); //Basically, amount burnt divided by maximum amount burnable.
	if(fuelFactor > 1 || fuelFactor < 0){
		throw "Error: Invalid fuelFactor - too much or too little fuel burnt."
	}
	var thrust = fuelFactor * this.getThrust(outsidePressure);
	
	this.fuelAmount -= fuelBurnt;
	var changeInMomentum = thrust * time;
	return changeInMomentum;
}

Booster.prototype.dump = function(){
	if(this.isJettisoned){
		return 0;
	}
	var amount = this.fuelAmount; //Can't put this after because it could lead to scenarios where the stage gets ejected early.
	if(this.dumpingInto != null){
		if(this.dumpingInto.isJettisoned == false){
			var pullAmount = (this.dumpingInto.initialFuelAmount - this.dumpingInto.fuelAmount) * this.dumpMultiplier;
			var amountToTransfer = Math.max(0, Math.min(pullAmount, this.fuelAmount));
			this.fuelAmount -= amountToTransfer;
			this.dumpingInto.fuelAmount += amountToTransfer;
		}
		else{
			this.dumpingInto = null;
		}
	}
	return amount;
}

Booster.prototype.getFuelBurnRate = function(){
	return this.engine.fuelConsumption * this.numbEngines;
}

Booster.prototype.getThrust = function(outsidePressure){
	return this.numbEngines * (this.engine.aslThrust * (Math.min(outsidePressure, 101.325) / 101.325) 
		+ this.engine.vacThrust * (Math.max(101.325 - outsidePressure, 0) / 101.325));
}

Booster.prototype.getTwr = function(planet){
	return this.getThrust(planet.pressure) / (planet.g * this.getMass());
}

Booster.prototype.addFuelTanks = function(n){
	this.numbTanks += n;
	this.initialFuelAmount += n * this.engine.minFuelTank;
	this.fuelAmount += n * this.engine.minFuelTank;
	var x = this.fuelAmount; //I know this will never happen, but if we add a tank to a booster that already used up some fuel, we should preserve that emptiness.
	this.fuelAmount = this.initialFuelAmount;
	this.initialMass = this.getMass();
	this.fuelAmount = x;
}