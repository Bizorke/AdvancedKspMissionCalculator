"use strict";
//Simulator

/*
There are a few challenges to address here.
The actions are: 
launch
DV / orbit / exit / fly by
land
areocapture
cargo

Strategy:
Starting from mission end to beginning, whenever there is a stage that requires space DV, add the required change in momentum to a buffer.
Then upon a launch, build the rocket that can launch plus handle the buffer.
When the payload changes in the middle of a delta v, there'll be a stack of DVs required for each mass section.
Aerocapture, and sometimes launches, will also require a little bit of DV to stablize the orbit.
*/

/*
TODO: 
-Show proper descents (not just 100m/s)
-During descent preparations, tell user how to angle craft to avoid falling below low stable orbit.
-Multiple aerocaptures.
-Landing gear stage.
-On aerocapture, make sure you add more DV to the inner stage for corrective burns.
-On escape planet from moon, get into elliptical orbit of the planet first.
-If the previous stage used the same engine (even if it's not the same number of engine stacks), steal the engine and add fuel + more stacks.
*/

var MASS_SAFETY_FACTOR = 1.01;

function printLoadingMessage(message){
	$("#loadingmessage").html(message);
}

function MissionSegment(payloadMass){
	this.messages = [];
	this.launchPlanet = null;
	this.landPlanet = null;
		this.landingSequence = [];
	//Aerocapture
		this.aerocapturePlanet = null;
		this.aerocaptureApoapsis = 500000;
	//this.startWithHeatShields = false;
	this.resultOrbit = null;
	this.dVPayloadChart = [];
	
	this.launchEvents = null;
	this.changePayloadMass(payloadMass);
	//this.aerocaptureMessage = "";
}

MissionSegment.prototype.addDv = function(dv){
	if(isNaN(dv)){
		throw "dv cannot be null."
	}
	this.dVPayloadChart[this.dVPayloadChart.length - 1].dv += dv;
}

MissionSegment.prototype.changePayloadMass = function(m){
	this.dVPayloadChart.push({mass: m, dv: 0, refuel: false});
}

MissionSegment.prototype.refuelVessel = function(){
	currentChartItem = this.dVPayloadChart[this.dVPayloadChart.length - 1];
	this.dVPayloadChart.push({mass: currentChartItem.mass, dv: 0, refuel: true});
}

MissionSegment.prototype.addMessage = function(message){
	this.messages.push(message);
}

function RocketBuilderResult(status, message, rocket, flightRecorder){
	this.status = status;
	this.message = message;
	this.rocket = rocket;
	this.flight = flightRecorder;
}

/*function getDvForOrbitChange(planet, oldPeriapsis, oldApoapsis, newPeriapsis, newApoapsis){
	var oldSmia = Math.sqrt();
	var oldSmaa = (planet.radius * 2 + oldPeriapsis + oldApoapsis) * 0.5;
	var newSmaa = (planet.radius * 2 + newPeriapsis + newApoapsis) * 0.5;
	
	
}*/

var addingStageRecoveryChutes = false;
function setUpMods(){
	addingStageRecoveryChutes = document.getElementById("includestagerecoverychutes").checked;
	
	if(document.getElementById("enableinterstellarfuelswitch").checked){
		enginesByName["Nerv"].minFuelTank = 100;
		fuels["liquidfuel"].containerMassRatio = (1 / 8);
	}
	else{
		enginesByName["Nerv"].minFuelTank = 45;
		fuels["liquidfuel"].containerMassRatio = (100 / 45) * (1 / 8);
	}
}

function saveSettings(){
	document.cookie = JSON.stringify({ 
			enableStageRecovery: document.getElementById("includestagerecoverychutes").checked,
			enableFuelSwitching: document.getElementById("enableinterstellarfuelswitch").checked
		});
}

function realizeMission(payload, objectives){
	
	setUpMods();
	saveSettings()
	
	printLoadingMessage("Planning Mission.");
	
	var payloadAmount = Number($("#payloadamount").val()) * 1000;
	//$("#force-ssto").is(':checked') && $("#force-ss").is(':checked')
	var forceSsto = $("#force-ssto").is(':checked');
	var forceSs = forceSsto && $("#force-ss").is(':checked');
	
	var missionStatus = checkMission(objectives, payloadAmount);
	if(!missionStatus.rocketOk){
		var ret = new Promise(function(resolve, reject){
			reject(missionStatus.message);
		});
		return ret;
	}

	var currentDvBuffer = 0;
	var currentPayloadMass = payload;
	//var landPlanet = null;
	//var launchPlanet = null;
	//var currentPeri = null;
	//var currentApo = null;
	//var currentPinpoint = null;
	var currentPlanet = null;
	var missionSegments = [];
	var currentOrbit;
	var orbitStack = new OrbitStack();
	//var dVPayloadChart = [];
	//Set the payload mass:
	for(var i = 0; i < objectives.length; i++){
		var obj = objectives[i];
		var currentMissionSegment = missionSegments.length > 0 ? missionSegments[missionSegments.length - 1] : null;
		var dvThisObj = 0;
		var afixParentOrbit = false;
		
		switch(obj.action){
			case "start":
				currentPlanet = obj.planet;
				currentMissionSegment = new MissionSegment(currentPayloadMass);
				missionSegments.push(currentMissionSegment);
				
				var p = currentPlanet;
				while(p.primary != null){
					var o = new Orbit(p.primary);
					o.setPeriapsis(p.periapsis);
					o.setApoapsis(p.apoapsis);
					orbitStack.stack.unshift(o);
					p = p.primary;
				}
				
					currentOrbit = new Orbit(currentPlanet);
				if(obj.status == "orbit"){
					currentOrbit.setPeriapsis(obj.periapsis);
					currentOrbit.setApoapsis(obj.apoapsis);
				}
				else{
					//landed. Still add this planet to the orbit.
					currentOrbit.setPeriapsis(0);
					currentOrbit.setApoapsis(0);
				}
				orbitStack.stack.push(currentOrbit);
				break;
			case "launch":
				//Denotes the start of a new mission segment.
				if(i == 1){
					currentMissionSegment.launchPlanet = obj.planet;
				}
				else{
					
					currentMissionSegment.resultOrbit = currentOrbit.clone();
					currentMissionSegment = new MissionSegment(currentPayloadMass);
					currentMissionSegment.launchPlanet = obj.planet;
					missionSegments.push(currentMissionSegment);
				}
				
				//currentMissionSegment.addMessage("Launch ");
				//currentApo = obj.planet.lowStableOrbit;
				//currentPeri = obj.planet.lowStableOrbit;
				//currentPinpoint = currentPeri;
				currentOrbit.setPeriapsis(obj.planet.lowStableOrbit);
				currentOrbit.setApoapsis(obj.planet.lowStableOrbit);
				break;
			case "cargo":
				if(obj.cargo > 0){
					currentMissionSegment.addMessage("Add " + readableMass(obj.cargo) + " of cargo.");
				}
				else{
					currentMissionSegment.addMessage("Remove " + readableMass(-obj.cargo) + " of cargo.");
				}
				currentPayloadMass += obj.cargo;
				currentMissionSegment.changePayloadMass(currentPayloadMass);
				break;
			case "refuel":
				if(forceSs){
					currentMissionSegment.addMessage("Refuel the vessel.");
					currentMissionSegment.refuelVessel();
				}
				else{
					currentMissionSegment.addMessage("Refuels are not permitted for non-single-stage vessels. Objective ignored.");
				}
			case "work":
				if(obj.type == "dv"){
					dvThisObj += obj.dv;
					currentMissionSegment.addMessage("Do " + readableSpeed(dvThisObj) + " worth of work.");
				}
				else{//orbit
					var apoBurn = 0;
					var periBurn = 0;
					var periDirection = "prograde";
					var apoDirection = "prograde";
					if(currentOrbit.periapsis == null && currentOrbit.apoapsis == null){
						//That means we're flying by. Elliptical orbit. Set the periapsis then burn to achieve apoapsis.
						currentOrbit.setPeriapsis(obj.periapsis);
						periBurn += currentOrbit.setApoapsisViaPeriapsis(obj.apoapsis);
						periDirection = "retrograde";
					}
					else if(currentOrbit.apoapsis == null){
						periDirection = "retrograde";
						if(obj.periapsis < currentOrbit.periapsis){
							apoDirection = "retrograde";
						}
						periBurn += currentOrbit.setApoapsisViaPeriapsis(obj.apoapsis);
						apoBurn += currentOrbit.setPeriapsisViaApoapsis(obj.periapsis);
					}
					else if(currentOrbit.periapsis == null){
						//Sub-orbital flight.
						throw "DV during sub-orbital flight not supported. This is a bug.";
					}
					else{
						//Just adjust both. I don't think order matters right? (I presume this because of conservation in momentum).
						if(obj.apoapsis < currentOrbit.apoapsis){
							periDirection = "retrograde";
						}						
						if(obj.periapsis < currentOrbit.periapsis){
							apoDirection = "retrograde";
						}
						
						periBurn += currentOrbit.setApoapsisViaPeriapsis(obj.apoapsis);
						apoBurn += currentOrbit.setPeriapsisViaApoapsis(obj.periapsis);
												
					}
					
					if(periBurn > 0){
						currentMissionSegment.addMessage("Burn " + readableSpeed(periBurn) + " " + periDirection + " at the periapsis to adjust the apoapsis to " + readableDistance(obj.apoapsis) + ".");
					}
					if(apoBurn > 0){
						currentMissionSegment.addMessage("Burn " + readableSpeed(apoBurn) + " " + apoDirection + " at the apoapsis to adjust the periapsis to " + readableDistance(obj.periapsis) + ".");
					}
					dvThisObj += periBurn + apoBurn;
					
					//Now if the currently orbited body has a primary, we need to fix that primary's orbit.
					afixParentOrbit = true;
				}
				
				
				break;
			case "escape":
				//Look ahead to figure out what direction we want to escape to.
				var imenantFlybyPlanet = null;
				var upcomingEscape = false;
				var newApo = null;
				var newPeri = null;
				for(var j = i + 1; j < objectives.length; j++){
					if(objectives[j].action == "escape"){
						upcomingEscape = true;
						//Make sure that another escape isn't comming up.
						/*for(var k = j + 1; k < objectives.length; k++){
							if(objectives[k].action == "escape" || objectives[k].action == "land" || objectives[k].action == "flyby" || (objectives[k].action == "work" || objectives[k].type == "orbit")){
								//If we're escaping a planet from a moon, it might be better to make the escape burn from the planet.
								upcomingEscape = false;
								newApo = currentPlanet.aveapsis;
								newPeri = currentPlanet.primary.lowStableOrbit;
								break;
							}
						}*/
						break;
					}
					else if (objectives[j].action == "work" && objectives[j].type == "orbit"){
						newApo = objectives[j].apoapsis;
						newPeri = objectives[j].periapsis;
						break;
					}
					else if(objectives[j].action == "land" || objectives[j].action == "flyby" /*|| objectives[j].action == "aerocapture"*/){//The aerocapture thing can't happen here.
						//The new apoapsis nad periapsis wil depend on the planet.
						imenantFlybyPlanet = objectives[j].planet;
						break;
					}
				}
				
				
				var oldOrbit = currentOrbit;
				var escapeBurn = oldOrbit.escape();
				dvThisObj += escapeBurn;
				orbitStack.stack.pop();
				if(orbitStack.stack.length > 0)
					currentOrbit = orbitStack.stack[orbitStack.stack.length - 1];
				else
					currentOrbit = null;
				
				var escapeMessage = "";
				if(escapeBurn == 0){
					//ALREADY ON ESCAPE PATH
					//It would be nice if we could burn anyway, since hyperbolic orbits actually allow you to amplify V-infinity.
					//Try the following:
					//1. capture in a super-elliptical orbit.
					//2. burn at periapsis when the time is right to escape and get LOTS of extra DVs!
					escapeMessage = "Allow the spacecraft to drift out of " + currentPlanet.name + "'s orbit."; //Already escaping?
					//currentMissionSegment.addMessage("Burn retrograde at the " + currentPlanet.name + " periapsis just enough to achieve an elliptical orbit, then wait for a good window to leave by burning prograde at the periapsis.");
				}
				
				else if(newApo != null && newPeri != null){
					//SET A NEW ORBIT AROUND PRIMARY
					var dApo = newApo - currentPlanet.aveapsis;
					var dPeri = newPeri - currentPlanet.aveapsis;
					var goForApo = false;
					var burnPrograde = true;
					var additionalBurnAmount = 0;
					if(Math.abs(dApo) > Math.abs(dPeri)){ //If the burn to adjust the apo is larger than the burn to get peri, go for that, because it will be cheaper now.
						goForApo = true;
						//Both of these conditions are redundant. Really? Why?
						if(dApo > 0){
							burnPrograde = true;
							additionalBurnAmount = oldOrbit.effectParentDv(currentOrbit.setApoapsisViaPeriapsis(newApo));
						}
						else{
							burnPrograde = false;
							additionalBurnAmount = oldOrbit.effectParentDv(currentOrbit.setPeriapsisViaApoapsis(newPeri));
						}
					}
					else{
						//Peri burn would have been greater.
						if(dPeri > 0){
							burnPrograde = true;
							additionalBurnAmount = oldOrbit.effectParentDv(currentOrbit.setApoapsisViaPeriapsis(newApo));
						}
						else{
							burnPrograde = false;
							additionalBurnAmount = oldOrbit.effectParentDv(currentOrbit.setPeriapsisViaApoapsis(newPeri));
						}
					}
					
					
					dvThisObj += additionalBurnAmount;
					escapeMessage = "Burn " + readableSpeed(escapeBurn) + " prograde at the periapsis to achieve an escape trajectory in the " + (burnPrograde ? "prograde" : "retrograde") + " direction of " + currentPlanet.name + "'s orbit. Keep burning an additional " + readableSpeed(additionalBurnAmount) + " until reaching a " + currentPlanet.primary.name + " " + (goForApo ? "apoapsis of " + readableDistance(newApo) : "periapsis of " + readableDistance(newPeri)) + ".";
				}
				else if(upcomingEscape && currentPlanet != planetData.kerbol){//I'm not sure if the second condition does anything anymore, or if it's even correct. But it passes tests.
					//ESCAPE PRIMARY PLANET, STARTING FROM MOON.
					var burnAmountForParentEscape = oldOrbit.effectParentDv(currentOrbit.escape());
					
					escapeMessage = "Burn " + readableSpeed(escapeBurn) + " prograde at the periapsis to achieve an escape trajectory in the prograde direction of " + currentPlanet.name + "'s orbit. Keep burning an additional " + readableSpeed(burnAmountForParentEscape) + " until reaching an escape trajectory from " + currentPlanet.primary.name + ".";
					
					dvThisObj += burnAmountForParentEscape;
				}
				else if(imenantFlybyPlanet && imenantFlybyPlanet == currentPlanet.primary){
					//LANDING ON PRIMARY.
					newPeri = currentPlanet.primary.atmosphericHeight > 10000 ? currentPlanet.primary.atmosphericHeight / 4 : currentPlanet.lowStableOrbit;
					
					if(currentOrbit.apoapsis == null){
						throw "Apoapsis of satellite cannot be null. Error.";
					}
					//console.log("Effecting land trajectory on primary.");
					var burnForLand = oldOrbit.effectParentDv(currentOrbit.setPeriapsisViaApoapsis(newPeri));
					
					escapeMessage = "Burn " + readableSpeed(escapeBurn) + " prograde at the periapsis to achieve an escape trajectory in the retrograde direction of " + currentPlanet.name + "'s orbit. Keep burning an additional " + readableSpeed(burnForLand) + " until reaching a " + currentPlanet.primary.name + " periapsis of " + readableDistance(newPeri) + ".";
					
					dvThisObj += burnForLand;
				}
				else if(imenantFlybyPlanet){
					//FLYBY NEIGHBOURING BODY
					
					var burnForFlyby = 0;
					if(currentOrbit){
						if(currentPlanet.aveapsis > imenantFlybyPlanet.aveapsis){
							burnForFlyby += oldOrbit.effectParentDv(currentOrbit.setPeriapsisViaApoapsis(imenantFlybyPlanet.aveapsis));
						}
						else{
							burnForFlyby += oldOrbit.effectParentDv(currentOrbit.setApoapsisViaPeriapsis(imenantFlybyPlanet.aveapsis));
						}
					}
					else{
						burnForFlyby += 100;
					}
					
					dvThisObj += burnForFlyby;
					
					escapeMessage = "Wait for a transfer window, then burn " + readableSpeed(escapeBurn) + " prograde at the periapsis to achieve an escape trajectory in the " + (currentPlanet.aveapsis > imenantFlybyPlanet.aveapsis ? "retrograde" : "prograde") + " direction of " + currentPlanet.name + "'s orbit. Continue burning an additional " + readableSpeed(burnForFlyby) + " until the spacecraft is on an intercept course for " + imenantFlybyPlanet.name + ".";
				}
				else{
					//UNKNOWN
					escapeMessage = "Burn " + readableSpeed(escapeBurn) + " prograde at the periapsis to achieve an escape trajectory.";
				}
				
				currentMissionSegment.addMessage(escapeMessage);
				if(currentPlanet.primary == null){
					currentMissionSegment.addMessage("Escape " + currentPlanet.name + ".");
				}
				else{
					currentMissionSegment.addMessage("Escape to " + currentPlanet.primary.name + ".");
				}
				
				currentPlanet = currentPlanet.primary;
				break;
			case "flyby":
				//First, determine whether the apoapsis or the periapsis of the current orbit needs to be adjusted.
				currentPlanet = obj.planet;
				if(currentOrbit){
					var dApo = Math.abs(currentOrbit.apoapsis - currentPlanet.aveapsis);
					var dPeri = Math.abs(currentOrbit.periapsis - currentPlanet.aveapsis);
					
					if(dApo == 0 || dPeri == 0){
						//Special logic in the escape code, etc actually sets the apoapsis or periapsis for us.
						//When that happens the apoapsis is null but the periapsis is 0.
						//We don't want to have to burn at the periapsis and waste a TON of fuel for nothing.
					}
					else{
						if(currentOrbit.apoapsis == null || (dApo) < (dPeri) || currentPlanet.aveapsis > currentOrbit.apoapsis){
							var burn = currentOrbit.setApoapsisViaPeriapsis(currentPlanet.aveapsis);
							dvThisObj += burn;
							currentMissionSegment.addMessage("Adjust the spacecraft's periapsis speed by about " + readableSpeed(burn) + " as needed to achieve an encounter with " + currentPlanet.name + ".");
						}
						else if((dApo) > (dPeri) || currentPlanet.aveapsis < currentOrbit.periapsis){
							var burn = currentOrbit.setPeriapsisViaApoapsis(currentPlanet.aveapsis);
							dvThisObj += burn;
							currentMissionSegment.addMessage("Adjust the spacecraft's apoapsis speed by about " + readableSpeed(burn) + " as needed to achieve an encounter with " + currentPlanet.name + ".");
						}
					}
				}
				
				
				
				currentOrbit = new Orbit(currentPlanet);
				//currentOrbit.periapsis = ???;
				orbitStack.addOrbit(currentOrbit);
				
				var newPeri = null;
				for(var j = i + 1; j < objectives.length; j++){
					if(objectives[j].action == "escape"){
						break;
					}
					else if (objectives[j].action == "work" && objectives[j].type == "orbit"){
						newPeri = objectives[j].periapsis;
						currentMissionSegment.addMessage("Fine-tune the periapsis of the upcoming " + obj.planet.name + " encounter to " + readableDistance(newPeri) + ".");
						dvThisObj += 10;
						break;
					}
					else if(objectives[j].action == "flyby"){
						newPeri = objectives[j].planet.aveapsis;
						currentMissionSegment.addMessage("Fine-tune the trajectory of the upcoming " + obj.planet.name + " encounter to achieve a flyby with " + objectives[j].planet.name + ".");
						dvThisObj += 10;
						break;
					}
					else if(objectives[j].action == "land"){
						if(obj.planet.atmosphericHeight > 0){
							newPeri = obj.planet.atmosphericHeight / 4;
							currentMissionSegment.addMessage("Fine-tune the periapsis of the upcoming " + obj.planet.name + " encounter to about " + readableDistance(newPeri) + ".");
						}
						else{
							newPeri = obj.planet.lowStableOrbit;
							currentMissionSegment.addMessage("Fine-tune the periapsis of the upcoming " + obj.planet.name + " encounter to about " + readableDistance(newPeri) + ".");
						}
						dvThisObj += 10;
						break;
					}
					else if(objectives[j].action == "aerocapture"){
						newPeri = obj.planet.atmosphericHeight / 2;
						//The new apoapsis nad periapsis wil depend on the planet.
						currentMissionSegment.addMessage("Fine-tune the periapsis of the upcoming " + obj.planet.name + " encounter to bring the spacecraft slightly into the atmosphere (below " + readableDistance(obj.planet.atmosphericHeight) + ").");
						dvThisObj += 10;
						break;
					}
				}
				
				if(newPeri != null){
					currentOrbit.setPeriapsis(newPeri);
				}
				else{
					currentOrbit.setPeriapsis(currentPlanet.lowStableOrbit);
				}
				
				//Finally...
				currentMissionSegment.addMessage("Encounter " + currentPlanet.name + ".");
				
				break;
			case "aerocapture":
				//This might also add some delta v for stabilization.
				//But we won't know how much until we simulate it because we don't know what angle we should be hitting the plaent at.
				currentOrbit.periapsis = currentPlanet.atmosphericHeight / 2;
				
				//An aerocapture is only going to happen during a flyby to an atmospheric planet.
				//There will never be an apoapsis to the orbit.
				//The periapsis will be set long before atmospheric entry.
				currentMissionSegment.aerocaptureApoapsis = obj.apoapsis;
				//currentMissionSegment.addMessage("Adjust periapsis and prepare for an aerocapture."); //Instead, add this later with specifics.
				currentMissionSegment.aerocapturePlanet = currentPlanet;
				currentMissionSegment.resultOrbit = orbitStack.clone();
				
				//New mission segment.
				currentMissionSegment = new MissionSegment(currentPayloadMass);
				missionSegments.push(currentMissionSegment);
				
				//Now the actual aerocapture is done...
				currentOrbit.setApoapsis(obj.apoapsis);
				//Now burn to fix periapsis.
				currentMissionSegment.addDv(currentOrbit.setPeriapsisViaApoapsis(currentPlanet.lowStableOrbit / 2)); //Let's at least set it here, then the fine-tuner can adjust it.
				
				//Again, this can be added lated with specifics.
				//currentMissionSegment.addMessage("After the aerocapture, burn prograde at the apoapsis to achieve a periapsis of " + readableDistance(currentPlanet.lowStableOrbit) + ".");
				//currentMissionSegment.startWithHeatShields = true;
				
				
				
				afixParentOrbit = true;
				break;
			case "land":
				if(currentPlanet.atmosphericHeight > 0){
					//Just burn into the atmosphere.
					if(currentOrbit.periapsis > currentPlanet.atmosphericHeight / 4){
						if(currentOrbit.apoapsis != null){
							var entryBurn = currentOrbit.setPeriapsisViaApoapsis(currentPlanet.atmosphericHeight / 4);
							dvThisObj += entryBurn;
							currentMissionSegment.addMessage("Burn " + readableSpeed(entryBurn) + " retrograde at the apoapsis until the periapsis is below " + readableDistance(currentPlanet.lowStableOrbit / 4) + " for atmospheric entry.");
						}
						else{
							throw "Approaching planet for landing with wrong periapsis.";
						}
					}
					currentMissionSegment.addMessage("Before entering " + currentPlanet.name + "'s atmosphere, use any remaining fuel on the current stage to burn retrograde in order to reduce the spacecraft's orbital velocity as much as possible.");
				}
				else{
					//Stop all orbital momentum.
					var entryBurn = currentOrbit.getSpeedAtDistance(currentOrbit.periapsis);
					dvThisObj += entryBurn;
					currentMissionSegment.addMessage("Burn " + readableSpeed(entryBurn) + " towards the horizon in the retrograde direction until the orbital velocity is 0 and the spacecraft is falling straight down towards " + currentPlanet.name + ".");
				}
				
				currentMissionSegment.landPlanet = obj.planet;
				currentMissionSegment.addDv(dvThisObj);
				dvThisObj = 0;
				
				
				currentMissionSegment.resultOrbit = orbitStack.clone();
				currentMissionSegment = new MissionSegment(currentPayloadMass);
				missionSegments.push(currentMissionSegment); // Have to add this here in case there's a payload change on the surface that shouldn't be a part of this mission segment.
				/*if(currentPlanet.atmosphericHeight > 0){
					currentMissionSegment.startWithHeatShields = true; //It also adds heatshields :).
				}*/
				
				afixParentOrbit = true;
				break;
		}
		
		if(afixParentOrbit){
			if(currentPlanet.primary != null){
				orbitStack.stack[orbitStack.stack.length - 2].setPeriapsis(currentPlanet.periapsis);
				orbitStack.stack[orbitStack.stack.length - 2].setApoapsis(currentPlanet.apoapsis);
			}
		}
		
		currentMissionSegment.addDv(dvThisObj);
		//currentMissionSegment.dVPayloadChart.dv += dvThisObj;
	}
	
	//console.log(missionSegments);
	
	//loop backwards through the mission objectives + build rocket.
	/*for(var i = missionSegments.length - 1; i >= 0; i--){
		var segment = missionSegments[i];
		
	}*/
	
	if(forceSs){
		return calculateSsRocket(missionSegments, payload);
	}
	else{
		return calculateRocket(missionSegments, payload, forceSsto);
	}
}

function checkMission(mission, payload){
	var currentPayload = payload;
	for(var i = 0; i < mission.length; i++){
		var mi = mission[i];
		switch(mi.action){
			case "cargo":
				currentPayload += mi.cargo;
				break;
			case "aerocapture":
				if(mi.planet.atmosphericHeight > mi.apoapsis){
					return {rocketOk: false, message: "Apoapsis of an aerocapture cannot be below atmospheric height."}
				}
				break;
		}
		
		if(currentPayload < 0){
			return {rocketOk: false, message: "Payload cargo cannot fall below 0 T."}
		}
	}
	return {rocketOk: true, message: ""}
}

function generateHeatShieldStage(rocket){
	var heatshieldStage = new Stage("Heat Shield", null, 0, 0, 0, 0, false);
	var prevStage = null;
	if(rocket.getCurrentSegment().stages.length == 0){
		//Means we're adding heatshields on the previous segment?
		if(rocket.segments.length == 1){
			//Wierd. Basically we're areocapturing then ending the mission. Something probably went wrong. But we'll just assume we shouldn't add any heat shields.
		}
		else{
			
			for(var psi = rocket.segments.length - 2; psi >= 0 && prevStage == null; psi--){
				var psSegment = rocket.segments[psi];
				if(psSegment.stages.length > 0) prevStage = psSegment.stages[psSegment.stages.length - 1];
			}
			
		}
	}
	else{
		prevStage = rocket.getCurrentSegment().stages[rocket.getCurrentSegment().stages.length - 2];
	}
	if(prevStage){
		//TODO: in the future, we can add some better algorithms for adding heat shieds. Like only add the 10m ones if they're available.
		if(prevStage.type == "Payload"){
			heatshieldStage.setHeatShields(new HeatShield(prevStage.cargoRadius), 1);
		}
		else{
			heatshieldStage.setHeatShields(new HeatShield(prevStage.engine.radius), 1 + prevStage.detachableBoosters.length);
		}
	}
	else{
		//No payload.
		heatshieldStage.setHeatShields(new HeatShield(1.25), 1);
	}
	return heatshieldStage;
}

function getLabel(blastoffPlanet, aerocapturePlanet, landPlanet, workRequired){
	var segmentLabel = "";
	if(blastoffPlanet){
		segmentLabel += (blastoffPlanet.name + " LAUNCH").toUpperCase().replace("&UUML;", "&Uuml;");
		if(landPlanet || aerocapturePlanet){
			segmentLabel += " - ";
		}
	}
	if(landPlanet){
		segmentLabel += (landPlanet.name + " LANDING").toUpperCase().replace("&UUML;", "&Uuml;");
	}
	if(aerocapturePlanet){
		segmentLabel += (aerocapturePlanet.name + " AEROCAPTURE").toUpperCase();
	}
	if(!(blastoffPlanet || landPlanet || aerocapturePlanet)){
		if(workRequired) segmentLabel = "WORK";
		else segmentLabel = "";
	}
	
	return segmentLabel;
}

function calculateRocket(missionSegments, initialPayload, forceSsto){
//Payloads and landings are optional.
	//POPULATE AVAILABLE ENGINES.
	var payloadProfileRadius = Number($("#payloadprofile").val());
	var availableEngines = [];
	var availableEnginesWithBottomNodes = [];
	/*var forceSsto = $("#force-ssto").is(':checked'); //Pass in.
	var forceSs = forceSsto && $("#force-ss").is(':checked');*/
	
	//Sort: get a list of engines with bottom nodes.
	for(var i = 0; i < engines.length; i++){
		var htmlIdName = engines[i].htmlIdName;
		var scienceHtmlIdName = engines[i].science.toLowerCase().replaceAll(" ", "");
		if($("#" + htmlIdName + "-button").hasClass("enabledicon")
			&& $("#" + scienceHtmlIdName + "-button").hasClass("enabledicon")){
			
			availableEngines.push(engines[i]);
			if(engines[i].hasBottomNode){
				availableEnginesWithBottomNodes.push(engines[i]);
			}
		}
	}
	
	var fullRocketStack = new Rocket();
	
	return Sequencr.promiseFor(0, missionSegments.length, function(resolve, reject, i, value){
		var missionSegment = missionSegments[(missionSegments.length - 1) - i]; //Start from the end and go backwards.
		var dVPayloadChart = missionSegment.dVPayloadChart;
		var blastoffPlanet = missionSegment.launchPlanet;
		var landPlanet = missionSegment.landPlanet;
		var aerocapturePlanet = missionSegment.aerocapturePlanet;
		var blastoffRequired = blastoffPlanet != null;
		var landingRequired = landPlanet != null;
		var aerocaptureRequired = aerocapturePlanet != null;
		
		availableEngines.sort(function(a, b){
			return (a.mass * (a.radialSize == "Radial Mounted" ? 2 : 1) + a.minFuelTank * a.fuelType.density - b.mass * (b.radialSize == "Radial Mounted" ? 2 : 1) - b.minFuelTank * b.fuelType.density);
		});
		availableEnginesWithBottomNodes.sort(function(a, b){
			return (a.mass * (a.radialSize == "Radial Mounted" ? 2 : 1) + a.minFuelTank * a.fuelType.density - b.mass * (b.radialSize == "Radial Mounted" ? 2 : 1) - b.minFuelTank * b.fuelType.density);
		});
		
		var currentFlight = null;
		
		var workRequired = false;
		//var totalDvRequiredThisSegment = 0;

		for (var j = 0; j < dVPayloadChart.length; j++){
			if(dVPayloadChart[j].dv > 0){
				workRequired = true;
				break;
			}
		}
		
		var segmentLabel = getLabel(blastoffPlanet, aerocapturePlanet, landPlanet, workRequired);
		var currentSegment = new RocketSegment(segmentLabel);
		fullRocketStack.addSegment(currentSegment);
		
		if(i == 0 && initialPayload > 0){
			//First iteration - add the payload stage.
			var payloadStage = new Stage("Payload", null, 0, 0, 0, initialPayload, false);
			payloadStage.cargoRadius = payloadProfileRadius;
			currentSegment.addStage(payloadStage);
		}
		
		Sequencr.promiseChain([function(resolve, reject){
			//REACTION WHEEL ATTACHMENTS
			printLoadingMessage("Adjusting vehicular torque.");
			setTimeout(function(){ //Just for visual effect. Doesn't slow down the calculation by much.
				if(fullRocketStack.getTorque() / fullRocketStack.getMass() < (15 / 25000)){ //NOTE: 15/25T is experimental and arbitrary.
					var torqueStage = new Stage("Torque", null, 0, 0, 0, 0, false);
					fullRocketStack.addStage(torqueStage);
					var tAttachment = new StageAttachment("Advanced Inline Stabilizer", 100, 1, "./images/inlinestabilizer.png");
					tAttachment.torque = 15;
					torqueStage.attachments.push(tAttachment);
					while(fullRocketStack.getTorque() / fullRocketStack.getMass() < (15 / 25000)){
						tAttachment.count++;
						tAttachment.torque += 15;
					}
				}
				resolve();
			}, 200);
		}, function(resolve, reject){
			//LANDING/AEROCAPTURE STAGE
			
			//LANDING GEAR
			if(landPlanet){
				//Spread the legs out using M-beams if the rocket is too tall. Maybe one for every 25m?
				var numbStruts = 4;
				if(fullRocketStack.getMass() > 50000) numbStruts = 6;
				if(fullRocketStack.getMass() > 100000) numbStruts = 8;
				
				var landingGear = null;
				if(fullRocketStack.getMass() < 20000) landingGear = LandingStruts.small;
				else if(fullRocketStack.getMass() < 50000) landingGear = LandingStruts.medium;
				else landingGear = LandingStruts.large;
				
				var landingStage = new Stage("Landing Gear", null, 0, 0, 0, 0, false);
				landingStage.attachments.push(landingGear.getStageAttachment(numbStruts)); //gear
				//landingStage.attachments.push(new StageAttachment); //extensions - need height of rocket.
				fullRocketStack.addStage(landingStage);
			}
			
			var aerobreakRocketStack = fullRocketStack.clone(); //For aerocaptures or parachute landings.
			var poweredLandingRocketStack = fullRocketStack.clone(); //For powered landings.
			
			//HEATSHIELD STUFF.
			//Generic heat shield on previous stages (add before parachutes to prevent crazy logic).
			//But this stage might not get added, for instance, for atmospheric powered ladnings we'll have to regenerate the heat shield stage to encompass 
			var heatshieldStage = null;
			if((landPlanet && landPlanet.atmosphericHeight > 0) || (aerocapturePlanet && aerocapturePlanet.atmosphericHeight > 0)){
				heatshieldStage = generateHeatShieldStage(fullRocketStack); 
			}
			
			//PARACHUTE STUFF (This gets added before heatshields. See below.)
			//Add parachutes and heatshields if required.
			if(landPlanet && landPlanet.atmosphericHeight > 0){
				var parachuteResult = calculateParachutes(fullRocketStack.getMass(), landPlanet);
				if(parachuteResult.status == "success"){
					var parachuteStage = new Stage("Parachutes", null, 0, 0, 0, parachuteResult.numbChutes * 100, false);
					//currentSegment.addStage(parachuteStage); //TODO: test parachutes now.
					aerobreakRocketStack.addStage(parachuteStage);
				}
				else{
					aerobreakRocketStack = null; //This will force the upcomming landing logic to use a powered landing.
				}
			}
			if(heatshieldStage){
				if(!heatshieldStage.heatShield){
					throw "Heatshield stage must have a heat shield.";
				}
				if(aerobreakRocketStack) aerobreakRocketStack.addStage(heatshieldStage);
				//if(poweredLandingRocketStack) poweredLandingRocketStack.addStage(parachuteStage); //Still need heat shields for a powered landing if there's an atmosphere.
			}
			
			if(landPlanet){
				
				printLoadingMessage("Optimizing landing on " + landPlanet.name  + ".");
				setTimeout(function(){ //Just for visual effect. Doesn't slow down the calculation by much.
							
					if(landPlanet.atmosphericHeight > 0){ //TODO: only do this if the space craft has heat shields and parachutes.
						missionSegment.landingSequence.push("Jettison the current vacuum engine.");
						missionSegment.landingSequence.push("Enter " + landPlanet.name + "'s atmosphere with heat shields forward.");
					}
					
					if(landPlanet.atmosphericHeight == 0){
						//Powered landing.
						missionSegment.landingSequence.push("Reduce the spacecraft's velocity (keeping it below 100 m/s).");
						missionSegment.landingSequence.push("As the spacecraft gets closer to the ground, throttle thrusters to reduce speed to 5 m/s.");
						missionSegment.landingSequence.push("Deploy landing gear.");
						missionSegment.landingSequence.push("Land.");
						
						fullRocketStack = poweredLandingRocketStack;
						calculateLanding(resolve, reject, 
							i == missionSegments.length - 1 && !blastoffRequired && !workRequired ? availableEngines : availableEnginesWithBottomNodes, 
							fullRocketStack, 
							landPlanet, 
							missionSegment.resultOrbit.currentOrbit().periapsis);
							
					}
					else{
						//Aerobreak/shoots. But let's see if a powered landing might be better.
						new Promise(function(resolve, reject){
							calculateLanding(resolve, reject, 
								i == missionSegments.length - 1 && !blastoffRequired && !workRequired == 0 ? availableEngines : availableEnginesWithBottomNodes, 
								poweredLandingRocketStack, 
								landPlanet, 
								missionSegment.resultOrbit.currentOrbit().periapsis);
						}).then(function(data){
							poweredLandingRocketStack.addStage(generateHeatShieldStage(poweredLandingRocketStack)); //Add heat shields to the new rocket.
							if(aerobreakRocketStack == null || poweredLandingRocketStack.getMass() < aerobreakRocketStack.getMass()){ 
								fullRocketStack = poweredLandingRocketStack;
								missionSegment.landingSequence.push("Jettison heat shields and activate landing engines upon slowing to a safe speed.");
								missionSegment.landingSequence.push("Reduce the spacecraft's velocity (keeping it below 100 m/s).");
								missionSegment.landingSequence.push("As the spacecraft gets closer to the ground, throttle thrusters to reduce speed to 5 m/s.");
							}
							else {
								missionSegment.landingSequence.push("Deploy drogue chutes when possible, then when safe, other parachutes.");
								missionSegment.landingSequence.push("Optionally jettison heat shields during descent to reduce weight.");
								fullRocketStack = aerobreakRocketStack;
							}
							
							missionSegment.landingSequence.push("Deploy landing gear.");
							missionSegment.landingSequence.push("Land.");
							resolve();
						}).catch(function(reason){
							if(aerobreakRocketStack) fullRocketStack = aerobreakRocketStack;
							else reject("Could not calculate landing on " + landPlanet.name + ". Aerobreaking was not possible and neither was a powered landing.");
							resolve();
						});
					}
				}, 200);
			}
			else if(aerocaptureRequired){
				
				printLoadingMessage("Optimizing aerocapture on " + aerocapturePlanet.name + ".");
				setTimeout(function(){ //Just for visual effect. Doesn't slow down the calculation by much.
					calculateAerocapture(aerobreakRocketStack, missionSegment.aerocaptureApoapsis, aerocapturePlanet, missionSegment.resultOrbit)
					.then(function(data){
						if(data.status == "success" /*&& Math.abs(data.apoapsis - missionSegment.aerocaptureApoapsis) / missionSegment.aerocaptureApoapsis < 0.125*/){//12.5% deviation, we should have a precision of 6.25%
							fullRocketStack = aerobreakRocketStack;
							var correctiveBurn1 = missionSegment.resultOrbit.currentOrbit().setPeriapsisViaApoapsis(aerocapturePlanet.lowStableOrbit);
							var correctiveBurn2 = missionSegment.resultOrbit.currentOrbit().setApoapsisViaPeriapsis(missionSegment.aerocaptureApoapsis);
							
							missionSegment.addMessage("Aim for a periapsis of " + readableDistance(data.periapsis) + " and aerocapture with heatshields forward, to achieve an apoapsis of " + readableDistance(data.apoapsis) + ".");
							missionSegment.addMessage("At the apoapsis, burn " + readableSpeed(correctiveBurn1) + " prograde, bringing the periapsis up to " + readableDistance(aerocapturePlanet.lowStableOrbit) + ".");
							missionSegment.addMessage("At the next periapsis, burn " + readableSpeed(correctiveBurn2) + " to correct the apoapsis to " + readableDistance(missionSegment.aerocaptureApoapsis) + ".");
							
							resolve();
						}
						else{
							var message = data.message;
							if(data.status == "success") message = "Aerocapture on " + aerocapturePlanet.name + " could not achieve desired apoapsis within a reasonable degree of error. Closest attempt: " + readableDistance(data.apoapsis) + ".";
							//reject(message); //TODO: try an aerocapture.
							//Instead of rejecting at this point, let's try an aeroburn.
							//To do an aeroburn, we need to undo the current segment.
							missionSegment.resultOrbit.currentOrbit().setPeriapsis(aerocapturePlanet.lowStableOrbit);
							var captureBurn = missionSegment.resultOrbit.currentOrbit().setApoapsisViaPeriapsis(missionSegment.aerocaptureApoapsis);
							dVPayloadChart[0].dv += captureBurn;
							missionSegment.addMessage("An aerocapture isn't possible. Instead, aim for a periapsis of " + readableDistance(aerocapturePlanet.lowStableOrbit) + " and proceed to burn " + readableSpeed(captureBurn) + " retrograde until the apoapsis is " + readableDistance(missionSegment.aerocaptureApoapsis) + ".");
							missionSegment.aerocapturePlanet = null;
							
							aerocapturePlanet = null;
							workRequired = true;
							currentSegment.label = getLabel(blastoffPlanet, aerocapturePlanet, landPlanet, workRequired);
							
							resolve();
						}
					});
				}, 200);
			}
			else{
				resolve();
			}
		}, function(resolve, reject, data){
			//SPACE STAGE
			
			
			if(dVPayloadChart != null && dVPayloadChart.length > 0){
				printLoadingMessage("Optimizing space &Delta;V stage.");
				setTimeout(function(){ //Just for visual effect. Doesn't slow down the calculation by much.
					calculateSpaceStage(resolve, reject, fullRocketStack, i == missionSegments.length - 1 && !blastoffRequired ? availableEngines : availableEnginesWithBottomNodes, dVPayloadChart);
				}, 200);
			}
			else{
				resolve();
			}
		}, function(resolve, reject, data){
			//LAUNCH STAGE
			
			//Now (if we were able to successfully build the space stage) we need to try to build the launch.
			if(blastoffRequired){
				printLoadingMessage("Optimizing launch on " + blastoffPlanet.name + ".");
				
				calculateLaunchStage(resolve, reject, i == missionSegments.length - 1 ? availableEngines : availableEnginesWithBottomNodes, fullRocketStack, blastoffPlanet, missionSegment, forceSsto);
			}
			else{
				resolve();
			}
		}]).then(function(){resolve({mission: missionSegments, rocket: fullRocketStack})})
		.catch(function(reason){reject(reason)});
	});
	
}

function calculateSpaceStage(resolve, reject, rocket, availableEngines, dVPayloadChart){
	/* DV Fuel Calculation (comments)
	CALCULATION
	a = F/M, v = t * a -> v = t * F/(M + 0.5*mf), but t = fuel / fuelrate
	
	v = (fuel / fuelrate)*F/(M + 0.5*mf)
	v * fuelrate * (M + 0.5*mf) = F * fuel
	mf = fuel * D,					//Mass of fuel
	mt = (mf - eFuel * D) * R		//Mass of fuel tanks assuming 'R' ratio (usually 1/8), eFuel is the fuel capacity of the engine.
	M = mp + me + mt				//me is the mass of the engine
	M = mp + me + max(0, fuel - eFuel) D * R
	//Where M is total dry mass, mp is basically payload mass, mf is mass of fuel, me is the mass of engine, and mt is the mass of empty tanks.
	
	thus,
	v * fuelrate * (mp + me + fuel * D * R + 0.5 * fuel * D) = fuel * F
	v * fuelrate * (mp + me) + v * fuelrate * fuel * D (R + 0.5) = fuel * F
	v * fuelrate * (mp + me) = fuel * F - v * fuelrate * fuel * D (R + 0.5)
	v * fuelrate * (mp + me) = fuel * (F - v * fuelrate * D (R + 0.5))
	v * fuelrate * (mp + me) / (F - v * fuelrate * D (R + 0.5)) = fuel
	(mp + me) / (F / (v * fuelrate) - D (R + 0.5)) = fuel
	*/
	
	//First make sure that dv is required for this mission.
	var totalDvRequiredThisSegment = 0;
	for(var i = 0; i < dVPayloadChart.length; i++){
		totalDvRequiredThisSegment += dVPayloadChart[i].dv;
	}
	
	if(totalDvRequiredThisSegment == 0){
		resolve();
		return;
	}
	
	//Pick a good engine and enough fuel to achieve the detla vs required.
	
	var bestSpaceStage = null;
	var bestRocketDesign = null;
	var removePrevEngineOnBestFlight = false;
	
	//Loop through each engine and test it against the requirements.
	for(var i = 0; i < availableEngines.length; i++){
		var tempRocket = rocket.clone();
		var ceng = availableEngines[i];
		var fuel = ceng.fuelType;
		var numbEngines = ceng.radialSize == "Radial Mounted" ? 2 : 1;
		
		var removePrevEngine = false;
		var lastStage = tempRocket.getCurrentStage();
		if(lastStage != null && lastStage.numbRadialBoosterPairs == 0 && lastStage.numbEnginesPerBooster == numbEngines && lastStage.engine == ceng){
			//Just add fuel onto the same engine.
			removePrevEngine = true;
			lastStage.replaceEngine();
		}
		
		//Try different radially-mounted engine configs:
		//var exactFuelAmount = (Math.pow(Math.e, dV / ceng.vacIsp) - 1) * 
		
		var exactFuelRequired = 0;
		for(var j = 0; j < dVPayloadChart.length; j++){
			
			var fuelRequiredThisStep = (tempRocket.getMass() + dVPayloadChart[j].mass + ceng.mass * numbEngines - ceng.builtinFuel * (fuel.density * fuel.containerMassRatio) ) * MASS_SAFETY_FACTOR			
				/ (ceng.vacThrust / (dVPayloadChart[j].dv * ceng.fuelConsumption) - fuel.density * (0.5 * fuel.containerMassRatio));
			
			//Doubles the fuel for every 10 minutes of burn. Adds a penalty for small/slow engines and fixes problems with maneuvers
			//The above-described technique is super-buggy with dawn engines. So let's add an upper limit to how much this thing can double-up. How about 3x?
			//TODO: this is still pretty buggy (but better). Problem is that I don't want to make assumptions about how long the user is willing to burn or what safety-factor they need.
			var burnTimeFactor = Math.min(Math.max(1, (fuelRequiredThisStep / ceng.fuelConsumption) / (60*5)), 3);
			exactFuelRequired += fuelRequiredThisStep * burnTimeFactor;
		}
		
		var roundedFuelRequired = Math.ceil(exactFuelRequired / ceng.minFuelTank) * ceng.minFuelTank;
		var numbTanksRequired = Math.round(roundedFuelRequired / ceng.minFuelTank);
		
		if(!validFuelAmount(roundedFuelRequired, ceng)){
			continue;
		}
		
		var testStage = new Stage("Vacuum", ceng, numbEngines, numbTanksRequired, 0, 0, false);
		tempRocket.addStage(testStage);
		//TODO: set a maximum burn time.
		if(/*roundedFuelRequired / ceng.fuelConsumption <= 60 * 15*/
			(bestRocketDesign == null || bestRocketDesign.getMass() > tempRocket.getMass()))
		{
			bestSpaceStage = testStage;
			bestRocketDesign = tempRocket;
			removePrevEngineOnBestFlight = removePrevEngine;
		}
	}
	
	if(bestSpaceStage){
		if(removePrevEngineOnBestFlight){
			rocket.getCurrentStage().replaceEngine();
		}
		rocket.addStage(bestSpaceStage);
		resolve();
		return;
	}
	else{
		reject("Unable to build a space stage that could deliver a payload to the required " + readableSpeed(totalDvRequiredThisSegment) + " of &Delta;V.");
	}
}

function calculateLanding(resolve, reject, availableEngines, rocket, planet, fallFromAltitude){
	//Right now, the only way
	
	var bestStage = null;
	var bestRocketTemplate = null;
	var stageReplacementRequired = false;
	
	Sequencr.promiseFor(0, availableEngines.length,function(resolve, reject, i){
		var ceng = availableEngines[i];
		for (var numbBoosters = 1; numbBoosters < 10; numbBoosters += 2){
			for(var fuelCans = 1; true; fuelCans++){
				var tempRocket = rocket.clone();
				var numbEnginesPerBooster = ceng.radialSize == "Radial Mounted" ? 2 : 1;
				
				var lastStage = tempRocket.getCurrentStage();
				if(lastStage != null && lastStage.numbRadialBoosterPairs == (numbBoosters - 1) / 2 && lastStage.numbEnginesPerBooster == numbEnginesPerBooster && lastStage.engine == ceng){
					//Just add fuel onto the same engine.
					lastStage.replaceEngine();
				}
				
				var stage = new Stage("Land", ceng, numbEnginesPerBooster, fuelCans, (numbBoosters - 1) / 2, 0, (planet == planetData.kerbin) && addingStageRecoveryChutes);
				
				tempRocket.addStage(stage);
				
				if(bestStage && bestStage.getMass() < stage.getMass()) break;
				
				if(tempRocket.getTwr(planet) < 1) break;
				
				
				var m = tempRocket.getMass();
				//var fG = planet.g * m;
				var fT = tempRocket.getThrust(planet.pressure);
				//var fNet = fT - fG;
				var aT = fT / m;
				
				var impactSpeed = Math.sqrt(2 * planet.g * fallFromAltitude);
				//dv = a*dt
				var minBurnTime = impactSpeed / aT;
				var fallTime = impactSpeed / planet.g;
				
				var fuelBurnRate = stage.getFuelBurnRate();
				var maxFuelBurnTime = fuelCans * numbBoosters * ceng.minFuelTank / fuelBurnRate;
				
				//Several conditions must be met at this point.
				//1. landing burn cannot take more than descent burn.
				//2. rocket needs to have enough fuel to land.
				if(minBurnTime < fallTime && minBurnTime < maxFuelBurnTime){
					if(bestStage == null || tempRocket.getMass() < bestRocketTemplate.getMass()){
						bestStage = stage;
						bestRocketTemplate = tempRocket;
						stageReplacementRequired = (lastStage != null && lastStage.removedEngine != null);
					}
				}
				
			}
			
			if(ceng.radialSize == "Radial Mounted") break;
		}
		
		resolve();
	}).then(function(){
		if(bestStage == null){
			reject("Unable to select a landing stage.");
		}
		else{
			if(stageReplacementRequired){
				rocket.getCurrentStage().replaceEngine();
			}
			rocket.addStage(bestStage);
			resolve();
		}
		
	});
	
}

function calculateAerocapture(rocket, desiredApoapsis, planet, orbitStack){

	//OTHER AEROCAPTURE STUFF
	
	//Binary search to achieve the desired apoapsis.
	var targetPeriapsis = planet.atmosphericHeight / 2;
	var binaryJump = targetPeriapsis / 2;
	
	
	if(orbitStack.stack[orbitStack.stack.length - 1].planet != planet) throw "Where are we?";
	
	
	return Sequencr.promiseFor(0, 32, function(resolve, reject, i, bestMission){
		var currentBestMission = bestMission || null;
		
		//Get rid of the top of the stack for now because we're gonna optimize it.
		orbitStack.stack.pop();
		
		var orbit = new Orbit(planet);
		orbit.setPeriapsis(targetPeriapsis);
		orbitStack.addOrbit(orbit);
		
		var entryVector = orbit.getRadialSpeedVectorAtAltitude(planet.atmosphericHeight);
		
		var result = runSimulation(rocket.clone(), planet, "aerocapture", planet.atmosphericHeight, Math.abs(entryVector[0]), -Math.abs(entryVector[1]));
		orbit.setApoapsisFromSpeed(result.absSpeed, planet.atmosphericHeight);
		result.periapsis = targetPeriapsis;
		result.apoapsis = orbit.apoapsis;
		currentBestMission = compareAerocaptureMissions(result, currentBestMission, desiredApoapsis);
		
		if(result.apoapsis < 0){
			//This happens when the mission fails.
			//throw "Aerocapture apoapsis negative? Something went wrong.";
		}
		
		if(result.status == "success" && (result.apoapsis == null || (desiredApoapsis != null && result.apoapsis > desiredApoapsis))){
			targetPeriapsis -= binaryJump;
		}
		else{
			targetPeriapsis += binaryJump;
		}
		
		binaryJump *= 0.5;
		
		
		resolve(currentBestMission);
	});
}

function calculateLaunchStage(resolve, reject, availableEngines, fullRocket, blastoffPlanet, missionSegment, forceSsto){
	//Just in case:
	var launchToEscape = false; //Not fully supported.
	
	var bestFlight = null;
	var bestLaunchStage = null;
	var bestOrbitStage = null;
	var bestFlightReplaceFinalEngine = false;
	var lightestSuccessfulRocket = null;
	//debug("Setting up launch tests.");
	
	
	var maxRadialEngines = 8;
	var maxBoosterPairs = forceSsto ? 0 : 8;
	var cengi = 0;
	var ceng = availableEngines[cengi];
	var fuel = ceng.fuelType;
	
	//Launch booster fuel.
	//var numbTanksPerStack = 1; //(numbDetachableBoosters == 1 || radialMountedEng ? 0 : 1); //Need at least one small tank.
	var numbS0TanksPerStack = 1;
	var numbEnginesPerBooster = ceng.radialSize == "Radial Mounted" ? 2 : 1;
	var numbDetachableBoosterPairs = 0;
	var numbTanksAddedSinceAdjustingUpperStages = 0;
	
	//Extra space engine fuel;
	
	var extraS2Tanks = 0;
	var numbTanksAddedSinceAvoidingOrbitalStage = 0;
	var hasS2 = forceSsto ? false : fullRocket.getCurrentSegment().hasVacuumStage; //We don't want to touch the upper stages if we're doing an SSTO.
	
	//Requires an orbital stage?
	var hasS1 = false;
	var s1Tanks = 1; //Only takes effect once the stage is enabled.
	var s1EngineIndex = 0;
	var s1Engine = null; //availableEngines[orbitalStageEngineIndex];
	
	var simulationDoneCallback = function(){
		
		if(bestFlight == null){
			reject("Could not get payload off the ground on " + blastoffPlanet.name + ".");
		}
		else if (bestFlight.missionStatus != "Success"){
			//NOTE: you do have the best flight that you could potentially pass back...
			reject("Could not get payload into stable orbit.");
		}
		/*else if(bestFlight.extraLaunchDv < dV){
			reject({status: "failure", message: "Successfully simulated " + (launchToEscape ? "escape launch" : "launch into orbit") + ", however, there was not enough fuel remaining to complete the next part of the mission. Short by " + readableSpeed(dV - bestFlight.extraLaunchDv) + " of the following objective's &Delta;V.", rocket: bestFlight.rocket, flight: bestFlight});
		}*/
		else{
			//resolve({status: "success", message: "Successfully simulated " + (launchToEscape ? "escape launch" : "launch into orbit") + " and desired &Delta;V.", rocket: bestFlight.rocket, flight: bestFlight});
			if(bestFlightReplaceFinalEngine){
				fullRocket.getCurrentStage().replaceEngine();
			}
			if(bestOrbitStage) fullRocket.addStage(bestOrbitStage);
			if(bestLaunchStage) fullRocket.addStage(bestLaunchStage);
			
			missionSegment.launchEvents = bestFlight.events;
			
			resolve();
		}
	};
	
	Sequencr.do(function(){
		//RESET DESIGN TWEAKS
		var cycleS0 = false;
		var cycleS1 = false;
		var addBoosters = false;
		var addLaunchFuel = false;
		var addOrbitalFuel = false;
		var addMissionFuel = false;
		
		//BUILD THE ROCKET.
		var rocket = fullRocket.clone();
		
		
		if(hasS2){
			rocket.addStage(bestSpaceStage.clone()); // Just assume this for now, but later maybe we can try without it.
			if(extraS2Tanks > 0){
				rocket.stages[rocket.stages.length - 1].addFuelTanks(extraS2Tanks);
			}
		}
		
		var currentOrbitalStage = null;
		var currentOrbitalStageReplacesEngine = false;
		if(hasS1){
			var lastStage = rocket.getCurrentStage();
			if(lastStage != null && lastStage.numbRadialBoosterPairs == 0 && lastStage.numbEnginesPerBooster == (s1Engine.radialSize == "Radial Mounted" ? 2 : 1) && lastStage.engine == s1Engine){
				//Just add fuel onto the same engine.
				lastStage.replaceEngine();
				currentOrbitalStageReplacesEngine = true;
			}
			currentOrbitalStage = new Stage("Orbital", 	s1Engine, s1Engine.radialSize == "Radial Mounted" ? 2 : 1, s1Tanks, 0, 0, (blastoffPlanet == planetData.kerbin) && addingStageRecoveryChutes);
			rocket.addStage(currentOrbitalStage);
		}
			
		//Stage(					stageType, 	engine, numbEnginesPerBooster, numbTanksPerBooster, numbRadialBoosterPairs, 	cargoMass)
		//if(numbLaunchEngines > 0){
			//I guess I'm alwayl going to be adding a takeoff stage...
		var currentTakeoffStage = new Stage("Takeoff", 	ceng, 	numbEnginesPerBooster, numbS0TanksPerStack, numbDetachableBoosterPairs, 0, (blastoffPlanet == planetData.kerbin) && addingStageRecoveryChutes)
		rocket.addStage(currentTakeoffStage);
		//}
		
		//TEST THE ROCKET.
		
		var problems = inspectNextRocket(rocket, lightestSuccessfulRocket, blastoffPlanet, launchToEscape);
		
		if(!problems.hasProblem()){
			var testflight = runSimulation(rocket.clone(), blastoffPlanet, "launch", 0, blastoffPlanet.siderialRotationalVelocity, 0);
			problems = testflight.problems;
			testflight.rocket = rocket; //Because the rocket this test flight refers to is used up.
			
			/*if(testflight.extraLaunchDv < dV){
				problems.insufficientMissionDv = true;
			}*/
			//debug("\t\tLaunch complete. Flight recorder: ");
			//debug(testflight);
				
			//This is just for the lightest rocket. All we care about is 1. success, 2. meets dV requirements, 3. mass is less than existing lightest.
			if(testflight.missionStatus == "Success" /*&& testflight.extraLaunchDv >= dV*/){
				if(lightestSuccessfulRocket == null || lightestSuccessfulRocket.getMass() > rocket.getMass()){ 
					lightestSuccessfulRocket = rocket;
				}
			}
			
			if(flightABetterThanFlightB(testflight, bestFlight, lightestSuccessfulRocket)){
				bestFlight = testflight;
				bestFlightReplaceFinalEngine = currentOrbitalStageReplacesEngine;
				bestOrbitStage = currentOrbitalStage;
				bestLaunchStage = currentTakeoffStage;
			}
		}
		
		//DEBUG PROBLEMS
		
		//Design problems
		if(problems.tooMassive){
			if(!forceSsto && hasS1){
				cycleS1 = true; //Why not? We're filtering out all the super-massive designs anyway so this shouldn't be too expensive.
			}
			else{
				cycleS0 = true;
			}
		}
		else if(problems.noBottomNodeForIntermediateStage){
			cycleS1 = true;
		}
		else if(problems.stageTwrTooLow){
			cycleS0 = true;
		}
		else if(problems.twrTooLow){
			if(forceSsto) cycleS0 = true;
			else addBoosters = true; //TODO: maybe, add non-detachable boosters.
		}
		//Flight problems
		else if(problems.didntGetOffTheGround){
			if(forceSsto) cycleS0 = true;
			else addBoosters = true; //TODO: maybe, add non-detachable boosters.
		}
		else if(problems.boosterFuelDepletedDuringAscent){
			addLaunchFuel = true;
		}
		else if(problems.fuelDepletedInSubOrbit){
			addOrbitalFuel = true;
		}
		else if(problems.earlyReentry){
			if(forceSsto) cycleS0 = true;
			else cycleS1 = true;
		}
		else if(problems.insufficientMissionDv){
			addMissionFuel = true;
		}else{
			//Everything is ok. Try cycling S1 anyway.
			if(forceSsto) cycleS0 = true;
			else cycleS1 = true;
		}
		
		//TWEAKS
		
		if(addMissionFuel){
			if(hasS2){
				extraS2Tanks++;
			}
			else{
				addOrbitalFuel = true;
			}
		}
		
		if(addOrbitalFuel){
			if(hasS1){
				s1Tanks++;
			}
			else if(hasS2 && s1EngineIndex < availableEngines.length){
				//The reason for the illongated condition is because if we've already cycled through all s1 engines, it means the ship is probably re-entering the atmosphere and crashing.
				//So, S2 isn't cutting it.
				extraS2Tanks++;
			}
			else{
				if(forceSsto) addLaunchFuel = true;
				//Don't want to add fuel to S0 just yet becaues this is a space problem.
				//However, if the S1 cycle is exhausted, this will result in adding fuel to S0.
				else cycleS1 = true;
			}
		}
		
		if(cycleS1){
			if(hasS1){
				extraS2Tanks = 0;
				s1Tanks = 1;
				numbS0TanksPerStack -= numbTanksAddedSinceAdjustingUpperStages;
				numbTanksAddedSinceAdjustingUpperStages = 0;
				
				s1EngineIndex++;
				if(s1EngineIndex < availableEngines.length){
					s1Engine = availableEngines[s1EngineIndex];
				}
				else{
					hasS1 = false;
					numbS0TanksPerStack++;
				}
			}
			else{
				if(s1EngineIndex < availableEngines.length){
					//Add S1
					extraS2Tanks = 0;
					s1Tanks = 1;
					numbS0TanksPerStack -= numbTanksAddedSinceAdjustingUpperStages;
					numbTanksAddedSinceAdjustingUpperStages = 0;
					hasS1 = true;
					s1Engine = availableEngines[s1EngineIndex];
				}
				else{
					//Already cycled through S1...
					numbS0TanksPerStack++;
				}
			}
		}
		
		if(addLaunchFuel = true){
			numbS0TanksPerStack++;
			if(hasS1 || extraS2Tanks > 0){//TODO: check if this is the right condition.
				numbTanksAddedSinceAdjustingUpperStages++;
			}
		}
		
		if(addBoosters){
			if(ceng.radialSize == "Radial Mounted"){
				numbEnginesPerBooster += 2;
				if(numbEnginesPerBooster > maxRadialEngines){
					cycleS0 = true;
				}
			}
			else{
				numbDetachableBoosterPairs++;
				hasS1 = false;
				numbS0TanksPerStack = 1;
				numbTanksAddedSinceAdjustingUpperStages = 0;
				if(numbDetachableBoosterPairs > maxBoosterPairs){
					cycleS0 = true;
				}
			}
		}
		
		if(cycleS0){
			numbS0TanksPerStack = 1;
			numbDetachableBoosterPairs = 0;
			numbTanksAddedSinceAdjustingUpperStages = 0;
			
			//Extra space engine fuel;
			
			extraS2Tanks = 0;
			
			//Requires an orbital stage?
			hasS1 = false;
			s1Tanks = 1; //Only takes effect once the stage is enabled.
			s1EngineIndex = 0;
			s1Engine = null; //availableEngines[orbitalStageEngineIndex];
			
			
			cengi++;
			if(cengi >= availableEngines.length){
				simulationDoneCallback();
				return false; //DONE.
			}
			else{
				ceng = availableEngines[cengi];
				fuel = ceng.fuelType;
				numbEnginesPerBooster = ceng.radialSize == "Radial Mounted" ? 2 : 1;
			}
		}
		
	}, 1);
}

function validFuelAmount(fuelAmount, engine){
	if(fuelAmount != Infinity && fuelAmount != -Infinity && !isNaN(fuelAmount) && fuelAmount >= engine.builtinFuel)
		return true;
	else
		return false;
}

function inspectNextRocket(rocket, lightestFlight, planet, launchToEscape){
	
	var problems = new FlightProblems();
	//First make sure this rocket is not too heavy.
	if(lightestFlight != null && rocket.getMass() > lightestFlight.getMass() * 1.25){
		problems.tooMassive = true;
		return problems;
	}
	
	//Make sure that intermediate stages have bottom nodes.
	for(var i = 0; i < rocket.segments.length - 1; i++){
		var segment = rocket.segments[i];
		for(var j = 0; j < segment.stages.length; j++){
			var stage = segment.stages[j];
			if(stage.engine != null && !stage.engine.hasBottomNode){
				problems.noBottomNodeForIntermediateStage = true;
				return problems;
			}
		}
	}
	
	//Check
	
	//Test to ensure this rocket can get into orbit.
	//Gives us a very basic understanding.
	if(planet != null){
		//Make sure the twr is ok.
		if(rocket.getCurrentStage().getTwr(planet) <= 1){
			problems.stageTwrTooLow = true;
			return problems;
		}
		
		var twr = rocket.getTwr(planet);
		if(twr <= 1){
			problems.twrTooLow = true;
			return problems;
		}
		
		var thrustAcceleration = planet.g * twr;
		var twrAcceleration = thrustAcceleration - planet.g;
		var burnTime = 0;
		
		if(launchToEscape){
			//Not exactly; the escape velocity depends on altitude.
			burnTime = planet.escapeVelocity / twrAcceleration;
		}
		else{
			var burnDistance = planet.g * planet.lowStableOrbit / twrAcceleration;
			burnTime = Math.sqrt(2 * burnDistance / twrAcceleration);
		}
		
		var launchDv = thrustAcceleration * burnTime; //This is going to be the amount of dV required by the engine.
		var orbitalDv = planet.minOrbitalVelocity;
		
		var rocketDv = rocket.getDv();
		
		if(rocketDv - launchDv < 0){ //Note that this is a complete depletion of fuel. Not just the boosters.
			problems.fuelDepetedDuringAscent = true;
			return problems;
		}
		
		/*if(rocketDv - launchDv - orbitalDv < 0){
			//CAN'T TEST THIS BECAUSE WE CANNOT ASSUME THE SOLUTION IS TO ADD MORE FUEL ONTO THE ORBITAL STAGE
			problems.fuelDepetedDuringORBIT OR WHATEVER = true;
			return problems;
		}*/
		
		//if(!launchToEscape){
			//TODO: this doesn't assume any tilting, meaning it's not considering the most efficient path.
			//however the simulation also doesn't consider the most efficient path so this isn't a huge concern at this point.
			//launchDv += planet.minOrbitalVelocity; 
		//}
	}
	
	return problems;
}

function flightABetterThanFlightB(flightA, flightB, flightL/*, missionDv */){
	var DV_PENALIZATION = 20; //Penalization factor for each m/s taken away from the mission.

	//TEST FOR NULLS.
	if(flightA != null && flightB == null) return true;
	if(flightA == null && flightB != null) return false;
	if(flightA == null && flightB == null) return null; //Also, I hate you.
	
	//TEST FOR SUCCESS
	if(flightA.missionStatus == "Success" && flightB.missionStatus != "Success") return true;
	if(flightA.missionStatus != "Success" && flightB.missionStatus == "Success") return false;
	
	//At this point we know that the successes are the same.
	
	//TEST FOR Dv DEBT
	
	//if(flightA.inDvDebt && !flightB.inDvDebt) return false;
	//if(!flightA.inDvDebt && flightB.inDvDebt) return true;
	
	//Finally, we need to decide whether we're pushing for better results, or pushing to complete the mission (i.e. mass doesn't matter when comparing failed missions).
	
	if(flightA.missionStatus == "Success"){
		//Push for the best results.
		
		//TEST V/M^2 RATIO
		var fAMass = flightA.rocket.getMass();
		var fBMass = flightB.rocket.getMass();
		var fLMass = flightL == null ? Infinity : flightL.getMass();
		
		//Absolute rating (prevents snowballing masses).
		if(fAMass <= (fLMass * 1.25) && fBMass > (fLMass * 1.25)) return true;
		if(fBMass <= (fLMass * 1.25) && fAMass > (fLMass * 1.25)) return false;
		
		//return fAMass < fBMass;
		//var fAdV = flightA.extraLaunchDv - missionDv;
		//var fBdV = flightB.extraLaunchDv - missionDv;
		
		
		//Make sure the dVs are ok.
		if(flightA.extraLaunchDv >= 0 && flightB.extraLaunchDv < 0) return true;
		if(flightA.extraLaunchDv < 0 && flightB.extraLaunchDv >= 0) return false;
		
		//Peralize heavily if extra dV is less than 0. But not too heavily or we'll get extremely heavy rockets.
		//var penalizationA = Math.sign(fAdV) == 1 ? 1 : DV_PENALIZATION;
		//var penalizationB = Math.sign(fBdV) == 1 ? 1 : DV_PENALIZATION;
		
		//Basically, 100m/s allows for a 1% increase in the ship's mass.
		//var fARating = (fAdV / 100) * (fAMass * 0.01) * penalizationA - fAMass;
		//var fBRating = (fBdV / 100) * (fBMass * 0.01) * penalizationB - fBMass;
		
		//return fARating >= fBRating;
		return flightA.extraLaunchDv >= flightB.extraLaunchDv;
		
		//return (flightA.extraLaunchDv - missionDv) / (fAMass * fAMass) > (flightB.extraLaunchDv - missionDv) / (fBMass * fBMass);
		//return fAMass < fBMass;
			//return flightA.extraLaunchDv / (fAMass) > flightB.extraLaunchDv / (smallmass);
			/*return (flightA.extraLaunchDv / (fAMass * fAMass * fAMass) > flightB.extraLaunchDv / (fBMass * fBMass)
				&& flightA.extraLaunchDv / (fAMass * fAMass * fAMass) > flightL.extraLaunchDv / (fLMass * fLMass));*/
			//return false;
	}
	else{
		//Push to complete the mission.
		
		//TEST ORBITAL VELOCITY
		if(flightA.bestOrbitalVelocity < flightB.bestOrbitalVelocity) return false;
		if(flightA.bestOrbitalVelocity > flightB.bestOrbitalVelocity) return true;
		
		//TEST ALTITUDE
		if(flightA.bestAltitude < flightB.bestAltitude) return false;
		if(flightA.bestAltitude > flightB.bestAltitude) return true;
		
	}

	return false; //Probably a higher tier rocket, therefore more expensive. But basically it doesn't matter.
}

function compareAerocaptureMissions(missionA, missionB, desiredApoapsis){
	if(missionA && !missionB) return missionA;
	if(!missionA && missionB) return missionB;
	//They shouldn't both be null ever (gigo)
	
	if(missionA.status == "success" && missionB.status != "success") return missionA;
	if(missionA.status != "success" && missionB.status == "success") return missionB;
	
	if(missionA.apoapsis == null && missionB.apoapsis != null) return missionB;
	if(missionA.apoapsis != null && missionB.apoapsis == null) return missionA;
		
	if(desiredApoapsis != null){
		//Compare apoapses
			
		var aD = Math.abs(missionA.apoapsis - desiredApoapsis);
		var bD = Math.abs(missionB.apoapsis - desiredApoapsis);
		
		if(aD > bD) return missionB;
		else return missionA;
	}
	else{
		//Aerobreaking. We want the highest possible apoapsis.
		if(missionA.apoapsis > missionB.apoapsis) return missionA;
		else return missionA;
	}
}

function runSimulation(rocket, planet, mission, startAltitude, startHSpeed, startVSpeed){
	
	if(isNaN(startAltitude + startHSpeed + startVSpeed) || !mission || !rocket || !planet){
		throw "No.";
	}
	
	var launchToEscape = false; //Not supported.
	
	var ai = new ControlAi(rocket, planet, mission, 1);
	
	//var orbitalV = 0;
	var t = 0;
	
	var altitude = startAltitude;
	var vSpeed = startVSpeed;
	var hSpeed = startHSpeed;
	
	var oldVSpeed = startVSpeed;
	var oldHSpeed = startHSpeed;
	
	if(mission == "launch"){
		rocket.flightRecorder.log("Launch" + (launchToEscape ? " at satellites's pariapsis, if possible" : "") + ".", "#ccffcc");
		if(planet.atmosphericHeight > 0){
			rocket.flightRecorder.log("Keep the spacecraft aimed in the direction of the prograde marker until reaching an apoapsis at low stable orbit.", "#e6f7ff");
		}
		else{
			rocket.flightRecorder.log("Aim to keep the prograde marker at a 45&deg; angle until reaching an apoapsis at low stable orbit.", "#e6f7ff");
		}
	}
	
	if(mission == "aerocapture"){
		rocket.flightRecorder.log("Enter " + planet.name + "'s atmosphere.", "#ccffcc");
		var stage = rocket.getCurrentStage();
		if(stage.type != "Heat Shield"){
			throw "Aerocapture without heat shields? Don't think so."
		}
		if(stage.heatShield.deployedRadius != stage.heatShield.radius){
			stage.heatShield.deploy();
			rocket.flightRecorder.log("Deploy heat shields.", "#ccffcc");
		}
	}
	
	do{
		ai.checkForProblems(mission, altitude); //This also changes dt.
		
		var dt = ai.dT;
		
		//CALCULATE PRESSURE + DENSITY
		var atmosphericPressure = 0;
		var atmosphericDensity = 0;
		
		if(planet.pressure <= 0 || altitude > planet.atmosphericHeight){
			atmosphericPressure = 0;
		}
		else{
			atmosphericPressure = planet.pressure * Math.pow(Math.E, -altitude / planet.scaleHeight);
			if(planet.temperature > 0){
				atmosphericDensity = atmosphericPressure / (287.053 * planet.temperature);
			}
		}
		
		//CALCULATE DISTANCE
		var distanceFromPlanetCenter = planet.radius + altitude;
		
		//CALCULATE AERODYNAMICS
		var terminalVelocity = Infinity;
		var vVDrag = 0;
		var hVDrag = 0;
		var absSpeed = Math.sqrt(vSpeed * vSpeed + hSpeed * hSpeed);
			
		if(atmosphericDensity > 0){
			//CALCULATE TERMINAL VELOCITY
			var rocketMass = rocket.getMass(); //Only call this once becaues it's relatively expensive and already needs to be called many times.
			var FG = rocketMass * (G * planet.mass) / (distanceFromPlanetCenter * distanceFromPlanetCenter); 
			var dragArea = rocket.getDragArea();
			terminalVelocity = Math.sqrt(2 * FG / (atmosphericDensity * 0.2 * dragArea));
			
			//CALCULATE DRAG
			//Fd = 0.5*p*v*v*d*A -> p = air density, v = velocity, d = drag coefficient, A = area cross section
			var absFDrag = 0.5 * atmosphericDensity * absSpeed * absSpeed * 0.1 * dragArea;
			var absADrag = absFDrag / rocketMass;
			var absVDrag = absADrag * dt;
			vVDrag = absVDrag * -Math.sign(vSpeed) * (absSpeed > 0 ? vSpeed / (absSpeed) : 1);
			hVDrag = absVDrag * -Math.sign(hSpeed) * (absSpeed > 0 ? hSpeed / (absSpeed): 1);
		}
		
		//CALCULATE VERTICAL DV CAUSED BY GRAVITY
		var vG = -dt * (G * planet.mass) / (distanceFromPlanetCenter * distanceFromPlanetCenter); 
		
		//AI STUFF
		var burnVector = ai.process(vSpeed, hSpeed, absSpeed, hVDrag, vVDrag, vG, altitude, atmosphericPressure, atmosphericDensity, terminalVelocity);
		var absBurn = burnVector[0];
		var burnAngle = burnVector[1];
		var vBurn = absBurn * Math.sin(burnAngle);
		var hBurn = absBurn * Math.cos(burnAngle);
		
		
		//CHANGE SPACECRAFT SPEED
		
		//Dynamics:
		
		hSpeed += hBurn;
		hSpeed += hVDrag
		
		var avgHSpeed = (oldHSpeed + hSpeed) * 0.5;
		
		//Centripital "force"
		//vCy is parabolic wrt Vh (and wrt t for constant acceleration). I suppose Vavg isn't a bad approximation for now?
		//var aC = avgHSpeed * avgHSpeed / distanceFromPlanetCenter; 
		//var vCy = aC * dt;
		
		var dVv = 0;
		dVv += vBurn;
		dVv += vG + /*vCy + */vVDrag; // I think we add vC here right? Otherwise vG will concatenate even when we're in orbit. //Tested, seems to work.
		
		
		vSpeed += dVv;
		
		var avgVSpeed = (oldVSpeed + vSpeed) * 0.5;
		
		var d_v = avgVSpeed * dt;
		var d_h = avgHSpeed * dt;
		var theta = Math.atan2(d_h, d_v + altitude + planet.radius);
		
		//Because of the orbit, the new altitude will be a little different than altitude + d_v.
		
		altitude = Math.sqrt((altitude + planet.radius + d_v) * (altitude + planet.radius + d_v) + d_h * d_h) - planet.radius;
		
		//rotate the vSpeed and hSpeed vectors by theta.
		var tempVectorX = hSpeed;
		var tempVectorY = vSpeed;
		hSpeed = tempVectorX * Math.cos(theta) - tempVectorY * Math.sin(theta);
		vSpeed = tempVectorY * Math.cos(theta) + tempVectorX * Math.sin(theta);
		
		//Corrections to hSpeed (yes this introduces some feedback error.)
		var absSpeed = Math.sqrt(vSpeed * vSpeed + hSpeed * hSpeed);
		
		oldVSpeed = vSpeed;
		oldHSpeed = hSpeed;
		
		//END CONDITIONS
		var postProcessRet = ai.postProcess(mission, altitude, hSpeed, vSpeed, absSpeed, terminalVelocity, dt, t);
		if(postProcessRet){
			//Happens when the simulation is done.
			return postProcessRet;
		}
		
		t += dt;
		
		//Check to make sure there are no processing errors (debugging)
		if(isNaN(altitude + hSpeed + vSpeed + vBurn + absSpeed)){
			throw "An error occurred.";
			
		}
	}
	while(true);
}

//This guy is gonna be responsible for making decisions.
function ControlAi(rocket, planet, mission, dT){
	this.rocket = rocket;
	this.planet = planet;
	this.mission = mission;
	
	this.sideways = false;
	this.waiting = false;
	this.exitAtmMsg = (planet.pressure == 0);
	this.dead = false;
	
	this.dT = dT;
}

ControlAi.prototype.checkForProblems = function(mission, altitude){
	var currentSegment = this.rocket.getCurrentSegment();
	if(mission == "launch"){
		if(this.planet.pressure <= 0 || altitude > this.planet.atmosphericHeight){
			//dT = 10; //warp :P. //Don't warp - serious problems on gilly.
			if(!this.exitAtmMsg){
				this.exitAtmMsg = true;
				this.rocket.flightRecorder.log("Exit " + this.planet.name + "'s atmosphere.", "#ccffcc");
			}
		}
		else{
			if(this.exitAtmMsg){ //or, if the planet has no atmosphere.
				//dT = 1; //Basically, if we're re-entering the atmosphere, it's probably a failed mission.
				this.exitAtmMsg = false;
				this.rocket.flightRecorder.log("Re-enter " + this.planet.name + "'s atmosphere.", "#ffe6e6");
				if(!this.dead){ //If we ran out of fuel before the re-entry, the re-ently is not the real problem. Otherwise (this case) it is.
					
					if(currentSegment.hasOrbitalStage){
						if(currentSegment.stages[currentSegment.stages.length - 1].type == "Orbital"){
							this.rocket.flightRecorder.problems.earlyReentry = true;
						}
						else{
							this.rocket.flightRecorder.problems.fuelDepletedInSubOrbit = true;
						}
					}
					else{
						this.rocket.flightRecorder.problems.earlyReentry = true;
					}
				}
			}
		}
		var cS = currentSegment.getCurrentStage();
		if(!this.dead && (cS == null || cS.mainBooster == null || cS.mainBooster.fuelAmount == 0 || cS.type == "Land" || cS.type == "Vacuum")){
			//this.dT = 30;
			this.dead = true;
			if(altitude >= this.planet.atmosphericHeight){
				//Causes the orbital stage to be added/upgraded.
				this.rocket.flightRecorder.problems.fuelDepletedInSubOrbit = true;
			}
		}
	}
}

ControlAi.prototype.process = function(vSpeed, hSpeed, absSpeed, hVDrag, vVDrag, vG, altitude, atmosphericPressure, atmosphericDensity, terminalVelocity){
	var ret = new Array(2);
	
	switch(this.mission){
		case "aerocapture":
			//Just don't do anything.
			return [0, 0];
			break;
		case "aerobrake":
			return;
			break;
		//case "land": //I think this can be pulled off without a simulation.
			//On gas planets, use heat shields.
			//break;
		case "launch":
			var maxVerticalDv = Math.max(0, (terminalVelocity - (this.sideways ? hSpeed + hVDrag : vSpeed + vG + vVDrag)) );
			var maxHorizontalDv = 0;
			if(this.sideways){
				maxHorizontalDv = Math.max(0, this.planet.minOrbitalVelocity - hSpeed);
			}
			
			//This applies to an object in freefall (no pariapsis).
			var apoapsis = this.getApoapsis(altitude, vSpeed);
			
			if(!this.sideways && altitude >= this.planet.atmosphericHeight && apoapsis > this.planet.lowStableOrbit){
				this.sideways = true;
				this.rocket.flightRecorder.log("Tilt towards the horizon and burn, keeping the apoapsis roughly " + readableDistance(this.planet.lowStableOrbit) + " until reaching a stable orbit.", "#ccffcc");
			}
			
			
			//Weird orbital equations from school and wikipedia.
			//var mu = G * planet.mass;
			//var semimajorAxis = apoapsis + planet.radius;
			// vCalculated = Math.sqrt(mu * ((2 / distanceFromPlanetCenter) - (1 / semimajorAxis)));
			
			var burnAmount = this.rocket.burn(this.dT, atmosphericPressure, (this.sideways ? maxHorizontalDv : this.getMaxVerticalDv(terminalVelocity, hSpeed, vSpeed, hVDrag, vVDrag, vG, altitude)), absSpeed);
			if(isNaN(burnAmount)){
				throw "Oh no.";
			}
			
			ret[0] = burnAmount;
			
			//Before we do anything, we need to check whether the takeoff stage had an early jettison.
			if(atmosphericDensity > 0 && this.rocket.flightRecorder.stage0Jettisoned && !this.dead && apoapsis < this.planet.atmosphericHeight){
				this.rocket.flightRecorder.problems.boosterFuelDepletedDuringAscent = true;
			}
			var angle = pi / 2;
			if(this.sideways){
				angle = 0;
				//Now you can actually burn at a slight angle inward or outward to do corrective steering. The angle depends on vSpeed.
				var correctiveAngle = Math.max(-pi/2, Math.min(pi/2, -vSpeed * pi / (vSpeed > 0 ? 3600 : 900))); // the 3600 is experimental. Hopefully it works.
				angle += correctiveAngle;
			}
			else{
				if(altitude > this.planet.atmosphericHeight / 2){
					//Adjust the angle after reading a suitable altitude, or in the case of rocky planets, right after launch.
					angle = Math.atan(hSpeed / vSpeed); //Keep direction aligned with prograde marker (for atmospheric planets).
					if(this.planet.atmosphericHeight == 0){
						//Correct prograde marker aligned with 45 degrees.
						var correctiveAngle = Math.max(-pi/2, Math.min(pi/2, 0.1 * (hSpeed - vSpeed) / absSpeed)); 
						angle += correctiveAngle;
					}
				}
			}
			ret[1] = angle;
			break;
		default:
			throw "Mission type not implemented.";
			break;
	}
	return ret;
}

ControlAi.prototype.postProcess = function(mission, altitude, hSpeed, vSpeed, absSpeed, terminalVelocity, dt, t){
	this.rocket.flightRecorder.logTerminalV(Math.min(terminalVelocity, this.getTrajectorySpeedLimit(altitude, vSpeed)), absSpeed); // This line is a bit awkward but I guess it doesn't matter where it goes.
	this.rocket.update(dt, altitude, hSpeed);
	
	switch(mission){
		case "launch":
			var apoapsis = this.getApoapsis(altitude, vSpeed);
		
			if(altitude < 0){
				if(t <= 1){
					this.rocket.flightRecorder.log("Can't get off the ground.", "#ffcccc");
					this.rocket.flightRecorder.problems.didntGetOffTheGround = true;
				}
				else{
					this.rocket.flightRecorder.log("Crash into the ground.", "#ffcccc");
					if(!this.dead && !this.rocket.flightRecorder.problems.earlyReentry && !this.rocket.flightRecorder.problems.fuelDepletedInSubOrbit){
						//If it crashed and still had fuel, probably means the main stage jettisoned too soon.
						//For instance, it jettisoned on a rockey planet and the small space engine (like an ant) couldn't get us into orbit.
						//Don't need to care about cases on atmospheric planets because:
						//	- We have flags set upon early jettison in atmosphere.
						//	- We have flags set upon early re-entry.
						this.rocket.flightRecorder.problems.boosterFuelDepletedDuringAscent = true;
					}
				}
				this.rocket.flightRecorder.missionStatus = "Failed";
				return this.rocket.flightRecorder;
			}
			
			if(hSpeed >= this.planet.minOrbitalVelocity){
				var remainingDv = this.rocket.getDv();
				this.rocket.flightRecorder.log("Reach stable orbit speed (raise periapsis via a short apoapsis burn if needed).", "#99ff99");// with &Delta;V = " + readableSpeed(remainingDv) + " remaining on the spacecraft.", "#99ff99");
				
				this.rocket.flightRecorder.missionStatus = "Success"
				this.rocket.flightRecorder.extraLaunchDv = remainingDv;
				return this.rocket.flightRecorder;
			}
			
			
			
			//WHERE DO THESE EQUAL?
			//Trying to solve for "escape distance"
			//pD = planet.primary.radius + planet.periapsis;
			//- m*2*pd*D + m*D^2 - M*2*r*D - M*D^2 = M*r^2 - m*pd^2
			//D^2(m - M) - 2*D(m*pd + M*r) = M*r^2 - m*pd^2
			
			//Check if we've escaped.
			var aGAtApoapsis = (G * this.planet.mass) / ((this.planet.radius + apoapsis) * (this.planet.radius + apoapsis));
			var aGOfPrimaryAtApoapsis = (G * this.planet.primary.mass) / ((this.planet.primary.radius + this.planet.periapsis - apoapsis) * (this.planet.primary.radius + this.planet.periapsis - apoapsis));
			if(aGOfPrimaryAtApoapsis > aGAtApoapsis){ //This is a bug caused by quantization erorr. It has happened on gilly.
				/*if(launchToEscape){
					var remainingDv = this.rocket.getDv();
					this.rocket.flightRecorder.log("Reach an escape path from " + this.planet.name + " with &Delta;V = " + readableSpeed(remainingDv) + " remaining on the spacecraft.", "#99ff99");
					this.rocket.flightRecorder.missionStatus = "Success"
					this.rocket.flightRecorder.extraLaunchDv = remainingDv;
					return this.rocket.flightRecorder;
				}*/
				//else{
					//This could theoretically happen if we thrust too early after leaving the atmosphere.
					//But the problem is that it always happens on gilly.
					/*rocket.flightRecorder.log("An unexpected error occurred during simulation. Please report to Joshua Sideris.", "#ffcccc");
					rocket.flightRecorder.missionStatus = "Failed";
					return rocket.flightRecorder;*/
					var remainingDv = this.rocket.getDv();
					this.rocket.flightRecorder.log("Reach stable orbit speed (raise periapsis via a short apoapsis burn if needed).", "#99ff99");// with &Delta;V = " + readableSpeed(remainingDv) + " remaining on the spacecraft.", "#99ff99");
					this.rocket.flightRecorder.missionStatus = "Success"
					this.rocket.flightRecorder.extraLaunchDv = remainingDv;
					return this.rocket.flightRecorder;
				//}
			}
			
			if(vSpeed > 0 && !this.sideways && !this.waiting){
				if(apoapsis >= this.planet.lowStableOrbit){
					if(altitude > this.planet.atmosphericHeight){
						this.rocket.flightRecorder.log("Start to tilt towards the horizon as the apoapsis approaches " + readableDistance(this.planet.lowStableOrbit) + ". Thrust horizontally until reaching a stable orbit.", "#ccffcc");
						this.sideways = true;
					}
					else{
						this.rocket.flightRecorder.log("Throttle thrusters, keeping the apoapsis at " + readableDistance(this.planet.lowStableOrbit) + ". Wait for spacecraft to exit the atmosphere.", "#ccffcc");
						this.waiting = true;
					}
				}
			}
			
			if(this.dead){
				return this.rocket.flightRecorder;
			}
			break;
		case "aerocapture":
			if(altitude < 0 || hSpeed < this.planet.minOrbitalVelocity){
				return {status: "failed", message: "Apoapsis of " + this.planet.name + " too low. Crashed into ground.", absSpeed: 0}
			}
			if(altitude > this.planet.atmosphericHeight && vSpeed > 0){
				//Done.
				return {status: "success", message: "", absSpeed: absSpeed}
			}
			break;
		case "aerobrake":
			//This needs some additional checks.
			if(altitude < 0 || hSpeed < this.planet.minOrbitalVelocity){
				return {status: "success", message: "Aerocbreak."}
			}
			if(altitude > this.planet.atmosphericHeight && vSpeed > 0){
				//Done.
				return {status: "failure", message: "Aerobrake on " + this.planet.name + " failed to stop spacecraft."}
			}
			break;
			
		default:
			throw "Mission type not implemented.";
			break;
	}
}

ControlAi.prototype.getApoapsis = function(altitude, vSpeed){
	return altitude + vSpeed * vSpeed / (2 * this.planet.g);
}

ControlAi.prototype.getTrajectorySpeedLimit = function(altitude, vSpeed){
	var trajectorySpeedLimit = Infinity;
	//This applies to an object in freefall (no pariapsis).
	var apoapsis = this.getApoapsis(altitude, vSpeed);

	if(this.waiting && !this.sideways){
		// Don't want to burn much because we should save it for the orbital part.
		if(apoapsis < this.planet.lowStableOrbit){
			trajectorySpeedLimit = Math.sqrt(this.planet.lowStableOrbit * (2 * this.planet.g) - altitude); // apparently this doesn't account for deminishing gravity at high altitudes. Seems to work well enough though.
		}
	}
	return trajectorySpeedLimit;
}

ControlAi.prototype.getMaxVerticalDv = function(terminalVelocity, hSpeed, vSpeed, hVDrag, vVDrag, vG, altitude){
	var maxVerticalDv = Math.max(0, (terminalVelocity - (this.sideways ? hSpeed + hVDrag : vSpeed + vG + vVDrag)) );
	if(this.waiting && !this.sideways){
		var apoapsis = this.getApoapsis(altitude, vSpeed);
		// Don't want to burn much because we should save it for the orbital part.
		if(apoapsis < this.planet.lowStableOrbit){
			var trajectorySpeedLimit = this.getTrajectorySpeedLimit(altitude, vSpeed);
			maxVerticalDv = Math.min(maxVerticalDv, trajectorySpeedLimit - (vSpeed + vG + vVDrag)); 
		}
		else{
			maxVerticalDv = 0;
		}
	}
	
	return maxVerticalDv;
}