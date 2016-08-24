"use strict";
//Mission Planner

//#missionplan
//#missionoptions
var missionPlan = [];

var currentMissionApoapsis = 0;
var currentMissionPeriapsis = 0;
var currentMissionInclinationError = 0; //This happens as a result of launches and landings.

var isLanded = false;
var inOrbit = false;
var hyperbolicOrbit = false;
var inInterstellarSpace = false;
var currentMissionPlanet = null;

function updateMissionPlannerView(){
	//$("#missionplan").html("");
	//currentMissionPlanet = null;
	
	//if(missionPlan.length > 0){
	//for(var i = 0; i < missionPlan.length; i++){
		/*DOT.do("#missionplan")
		.li().class(missionPlan[i].action + "objective").do()
			.h(missionPlan[i].message)
		.end()*/
		//This mission planner code was set in a different function.
		
		//Update stats
		/*switch(missionPlan[i].action){
			case "start":
				currentMissionPlanet = missionPlan[i].planet;
				break;
			case "escape":
				currentMissionPlanet = currentMissionPlanet.primary;
				break;
			case "land":
				
		}*/
	//}
	/*}else{
		DOT.do("#missionplan").i("No mission objectives.")
	}*/
	
	$("#missionoptions").fadeOut(100, function(){
		$(this).html("");
		if(missionPlan.length == 0){
			//Allow player to choose a start planet.
			DOT.do("#missionoptions")
				.div().class("missionoption startobjective").do()
					.h4("Start")
					.label("Start at: ").for("startplanet")
					.select().id("startplanet").class("form-control")
					.onchange("if(planetData.list[$('#startplanet').val()].hasSurface){$('#startlandedbox').show();}else{$('#startlandedbox').hide();if($('#startlanded').is(':checked')){$('#startinorbit').prop('checked', true);}};")
					.do()
						//.option("N/A")
						DOT.option(planetData.kerbol.name).value(planetData.kerbol.index)
						.each(planetData.kerbol.satellites, function(pl){
							DOT.option("&nbsp;&nbsp;&nbsp;&nbsp;" 
								+ pl.name).value(pl.index).if(pl.name == "Kerbin", function(){DOT.selected("true")});
							if(pl.satellites.length > 0){
								DOT.each(pl.satellites, function(mn){
									DOT.option("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + mn.name).value(mn.index);
								});
							}
							
						})
					.end()
					.br()
					.label("Status: ")
					.br()
					.div().$css("margin-left", "20px").do()
						.div().id("startlandedbox").do()
							.input().id("startlanded").type("radio").name("startposition").checked("checked").onchange("$('#startincustomorbitparams').hide();")
							.label(" Landed").for("startlanded")
							.br()
						.end()
						.input().id("startinorbit").type("radio").name("startposition").onchange("$('#startincustomorbitparams').hide();")
						.label(" In Low Orbit").for("startinorbit")
						.br()
						.input().id("startincustomorbit").type("radio").name("startposition").onchange("$('#startincustomorbitparams').show();")
						.label(" In Custom Orbit").for("startincustomorbit").title("Warning: the app will assume that this is a valid orbit.")
						.div().id("startincustomorbitparams").$css("display", "none").do()
							.br()
							.label().do().h("Periapsis: ").end().for("startperiapsis")
							.input().id("startperiapsis").class("form-control").type("number").step("10").value(500).span().class("units").do().h(" km").end()
							.br()
							.label().do().h("Apoapsis: ").end().for("startapoapsis")
							.input().id("startapoapsis").class("form-control").type("number").step("10").value(500).span().class("units").do().h(" km").end()
						.end()
					.end()
					.br()
					.input().class("btn-default").type("button").value("Set Starting Point").onclick("addStartObjective();")
				.end();
			
		}
		else{
			var lastMissionObjective = missionPlan[missionPlan.length - 1];
			switch(lastMissionObjective.action){
				case "start":
					switch(lastMissionObjective.status){
						case "landed":
							isLanded = true;
							inOrbit = false;
							hyperbolicOrbit = false;
							inInterstellarSpace = false;
							break;
						case "orbit":
							isLanded = false;
							inOrbit = true;
							hyperbolicOrbit = false;
							inInterstellarSpace = false;
							break;
						/*case "high orbit":
							isLanded = false;
							inOrbit = true;
							hyperbolicOrbit = true;
							inInterstellarSpace = false;
							break;*/
					}
					break;
				case "launch":
					isLanded = false;
					inOrbit = true;
					hyperbolicOrbit = false;
					inInterstellarSpace = false;
					break;
				case "flyby":
					isLanded = false;
					inOrbit = true;
					hyperbolicOrbit = true;
					inInterstellarSpace = false;
					break;
				case "land":
					isLanded = true;
					inOrbit = false;
					hyperbolicOrbit = false;
					inInterstellarSpace = false;
					break;
				case "aerocapture":
					isLanded = false;
					inOrbit = true;
					hyperbolicOrbit = false;
					inInterstellarSpace = false;
					break;
				case "escape":
					if(currentMissionPlanet != null){
						isLanded = false;
						inOrbit = true;
						hyperbolicOrbit = false;
						inInterstellarSpace = false;
					}
					else{
						isLanded = false;
						inOrbit = false;
						hyperbolicOrbit = false;
						inInterstellarSpace = true;
					}
					break;
				case "work":
					break;
				case "cargo":
					break;
			}
			
			DOT.do("#missionoptions")
			.div().class("missionoption removelastobjective").do()
				.h4("Remove Last Objective or Reset")
				.if(missionPlan.length > 0, function(){DOT.input().class("btn-default").type("button").value("Remove Last Objective").onclick("removeLastObjective();")})
				.input().class("btn-default").type("button").value("Reset Mission").onclick("resetMission();")
			.end();
			
			if(isLanded){
				DOT.do("#missionoptions")
				.div().class("missionoption launchobjective").do()
					.h4("Takeoff").title("The escape burn will try to aim the spacecraft towards the next objective since any excess Delta V from an escape amplifies at the primary orbit due to hyperbolic orbital properties. Always launch into a low stable orbit. Vertical escapes are almost always less efficient.")
					.input().class("btn-default").type("button").value("Add Objective").onclick("addTakeoffObjective();")
				.end();
			}
			
			if(inOrbit && currentMissionPlanet.hasSurface){
				DOT.do("#missionoptions")
				.div().class("missionoption landobjective").do()
					.h4("Land on " + currentMissionPlanet.name).title("Landing will always make use of aerobraking when possible because heat shields and parachutes are typically less massive than extra fuel.")
					.input().class("btn-default").type("button").value("Add Objective").onclick("addLandObjective();")
				.end()
			}
			
			if(inOrbit && hyperbolicOrbit && currentMissionPlanet.atmosphericHeight > 0){
				//TODO: add this later.
				DOT.do("#missionoptions")
				.div().class("missionoption aerocaptureobjective").do()
					.h4("Aerocapture via " + currentMissionPlanet.name).title("This maneuver will jettison the current engine and use heat shields to get the spacecraft captured into an unstable orbit, then it will jetisson the heatshield and burn prograde at the new apoapsis to stabilize the orbit. Don't set the new apoapsis too low or high, because simulating an aerocapture will always add a little bit of error. This is a very risky maneuver, with some advantages. Be careful in order to avoid overheating of spacecraft parts. If you don't want to take the risk, use the \"Do Work\" objective to achieve stable orbit.")
					.if(currentMissionPlanet == planetData.jool, function(){
						DOT.p("Warning: Jool aerocaptures are extremely volatile and not recommended.").$css("color", "red")
						.br()
					})
					.label().do().h("New Apoapsis: ").end()
					.for("aerocaptureapoapsis").input().id("aerocaptureapoapsis").class("form-control").type("number").min("0").step("10").value(Math.round((currentMissionPlanet.radius * 5) / 1000)).span().class("units").do().h(" km").end()
					.br()
					.input().class("btn-default").type("button").value("Add Objective").onclick("addAerocaptureObjective();")
				.end()
			}
			
			if(inOrbit || inInterstellarSpace){
				//Planning a flyby.
				var mySatellites = currentMissionPlanet != null ? currentMissionPlanet.satellites : [planetData.kerbol];
				var objectType = (currentMissionPlanet != null ? (currentMissionPlanet.primary == null ? "Planet" : "Moon") : "System");
				if(mySatellites.length > 0){
					DOT.do("#missionoptions")
					.div().class("missionoption flybyobjective").do()
					.h4("Fly to " + objectType).title("Note that you can have any periapsis you want when you arrange a flyby, so this objective makes no assumptions about that until the next objective is added.")
					.label(objectType + ": ").for("flytoplanet")
					.select().id("flytoplanet").class("form-control").onchange("")
					.do()
						//.option("N/A")
						.each(mySatellites, function(p){
							DOT.option(p.name).value(p.index).if(p.name == "Kerbin" || p.name == "M&uuml;n", function(){DOT.selected("true")});
						})
					.end()
					.br()
					.input().id("flybyfixinclination").type("checkbox").checked("checked").label(" Fix Inclination").for("flybyfixinclination").title("It is theoretically possible to intercept any satellite, regardless of inclination, given enough time. However you should try to align inclinations to make life easier. The simulator also assumes that spacecraft will accumulate a small amount of inclination error during blastoff, but not during flyby missions since there should be ample time to fix your inclination cheaply before you reach the target.")
					.br()
					.input().class("btn-default").type("button").value("Add Objective").onclick("addFlyByObjective();")
					.end();
				}
			}

			if(inOrbit){
				DOT.do("#missionoptions").div().class("missionoption escapeobjective").do()
					.h4("Escape " + currentMissionPlanet.name).title("Gravity-assisted escapes will be supported in a future version, however the escape will be done such that it minimizes the Delta V required for proceeding objectives.")
					.input().class("btn-default").type("button").value("Add Objective").onclick("addEscapeObjective();")
				.end();
			}
			
			DOT.br();
			
			if(inOrbit){
				DOT.do("#missionoptions").do("#missionoptions").div().class("missionoption workobjective").do()
					.h4("Do Work").title("Burn engines to effect a Delta V, or a change in the spacecraft's orbit.")
					.label("Type: ").for("missionworktypeselect")
					.select().id("missionworktypeselect").class("form-control").do()
						.option("Change Orbit").value("1")
						.option("&Delta;V").value("2")
					.end().onchange("if($('#missionworktypeselect').val()=='1'){$('#missionworkchangeorbit').show();$('#missionworkburddv').hide();}else{$('#missionworkchangeorbit').hide();$('#missionworkburddv').show();}")
					.div().id("missionworkchangeorbit").do()
						.br()
						.label().do().h("New " + currentMissionPlanet.name + " periapsis: ").end().for("missionworknewperiapsis")
						.input().id("missionworknewperiapsis").class("form-control").type("number").step("10").value(currentMissionPlanet.lowStableOrbit / 1000).span().class("units").do().h(" km").end()
						.br()
						.label().do().h("New " + currentMissionPlanet.name + " apoapsis: ").end().for("missionworknewapoapsis")
						.input().id("missionworknewapoapsis").class("form-control").type("number").step("10").value(currentMissionPlanet.lowStableOrbit / 1000).span().class("units").do().h(" km").end()
					.end()
					.div().id("missionworkburddv").$css("display", "none").do()
						.br()
						.label().title("Adding a Delta V like this will not alter the orbit. Use it if you want some extra Delta V for an intercept mission, or if you think you might need some extra fuel. Note that the app already gives you a decent safety margin.").do().h("Burn &Delta;V: ").end().for("dvobjective")
						.input().id("dvobjective").class("form-control").type("number").step("100").value(0).span().class("units").do().h(" m/s").end()
					.end()
					.br()
					.input().class("btn-default").type("button").value("Add Objective").onclick("addWorkObjective();")
				.end();
			}
			
			DOT.do("#missionoptions").div().class("missionoption cargoobjective").do()
				.h4("Add/Remove Cargo").title("Add or remove payload mass. Use this to make calculations regarding towing asteroids, or accounting for mass changes due to deployed rovers, etc. Positive means you're adding mass, negative means you're subtracting mass.")
				.label("Mass: ").for("cargochangemass").input().id("cargochangemass").class("form-control").type("number").step("0.1").value(0).span().class("units").do().h(" T").end()
				.br()
				.input().class("btn-default").type("button").value("Add Objective").onclick("addCargoObjective();")
			.end();
			

			
		}
		
		
		missionPlannerLock = false;
		$(this).fadeIn(100);
	});
}

var missionPlannerLock = false;

function addStartObjective(){
	var planetId = $("#startplanet").val();
	var planet = planetData.list[planetId];
	var status = "";
	var verb = "";
	var periapsis = null;
	var apoapsis = null;
	if($("#startlanded").is(":checked") && planet.hasSurface){
		status = "landed";
		verb = "landed on";
	}
	else if ($("#startincustomorbit").is(":checked")){
		status = "orbit";
		periapsis = $("#startperiapsis").val() * 1000;
		apoapsis = $("#startapoapsis").val() * 1000;
		if(periapsis > apoapsis){
			var x = periapsis;
			periapsis = apoapsis;
			apoapsis = x;
		}
		verb = "in orbit (periapsis = " + readableDistance(periapsis) + ", apoapsis = " + readableDistance(apoapsis) + ") of";
	}
	else{
		status = "orbit";
		verb = "in low orbit of";
		periapsis = planet.lowStableOrbit;
		apoapsis = planet.lowStableOrbit;
	}
	currentMissionPlanet = planet;
	addMissionObjectiveNode({action: "start", planet: planet, status: status, message: "Start " + verb + " " + planet.name + ".", periapsis: periapsis, apoapsis: apoapsis});
}

function addTakeoffObjective(){
	addMissionObjectiveNode({action: "launch", planet: currentMissionPlanet, message: "Launch from " + currentMissionPlanet.name + "."});
}

function addLandObjective(){
	addMissionObjectiveNode({action: "land", planet: currentMissionPlanet, message: "Land on " + currentMissionPlanet.name + "."});
}

function addAerocaptureObjective(){
	var apoapsis = $("#aerocaptureapoapsis").val() * 1000;
	addMissionObjectiveNode({action: "aerocapture", planet: currentMissionPlanet, apoapsis: apoapsis, message: "Aerocapture via " + currentMissionPlanet.name + ", apoapsis => " + readableDistance(apoapsis) + "."});
}

function addEscapeObjective(){
	addMissionObjectiveNode({action: "escape", message: "Escape " + currentMissionPlanet.name + ".", from: currentMissionPlanet});
	currentMissionPlanet = currentMissionPlanet.primary;
}

function addFlyByObjective(planetIndex){
	var planetId = $("#flytoplanet").val();
	var planet = planetData.list[planetId];
	var fixInclination = $("#flybyfixinclination").prop("checked");
	
	currentMissionPlanet = planet;
	addMissionObjectiveNode({action: "flyby", planet: currentMissionPlanet, message: (fixInclination ? "Adjust inclination and fly" : "Fly") + " by " + planet.name + ".", fixInclination: fixInclination});
}


function addWorkObjective(){
	var workType = $("#missionworktypeselect").val();
	if(workType == "1"){//Change orbit.
		var apoapsis = $("#missionworknewapoapsis").val();
		var periapsis = $("#missionworknewperiapsis").val();
		if(!isNaN(apoapsis) && !isNaN(periapsis) && apoapsis > 0 && periapsis > 0){
			var apon = (apoapsis - 0) * 1000;
			var perin = (periapsis - 0) * 1000;
			if(apon < perin){//swap
				var x = apon;
				apon = perin;
				perin = x;
			}
			addMissionObjectiveNode({action: "work", message: "Adjust orbit: periapsis = " + readableDistance(perin) + ", apoapsis = " + readableDistance(apon) + "." , type: "orbit", periapsis: perin, apoapsis: apon});
		}
	}
	else{//DV
		var dv = $("#dvobjective").val();
		if(!isNaN(dv) && dv > 0){
			var dvn = dv - 0;
			addMissionObjectiveNode({action: "work", message: "Burn " + readableSpeed(dvn) + ".", type: "dv", dv: dvn});
		}
	}
}

function addCargoObjective(){
	var cargo = $("#cargochangemass").val();
	if(!isNaN(cargo)){
		var cargon = (cargo - 0) * 1000;
		addMissionObjectiveNode({action: "cargo", message: (cargon >= 0 ? "Add" : "Remove") + " " + readableMass(Math.abs(cargon)) + " of cargo.", cargo: cargon});
	}
}

function removeLastObjective(){
	if(!missionPlannerLock){
		missionPlannerLock = true;
		$("#missionplan>li").last().fadeOut(100, function(){$(this).remove();/*missionPlannerLock = false;*/});
		
		var poppedMission = missionPlan.pop();
		if(missionPlan.length > 0){
			if(poppedMission.action == "escape"){
				currentMissionPlanet = poppedMission.from;
			}
			else if(poppedMission.action == "flyby"){
				currentMissionPlanet = currentMissionPlanet.primary;
			}
		}
		else{
			currentMissionPlanet = null;
		}
		updateMissionPlannerView();
	}
}

function resetMission(){
	if(!missionPlannerLock){
		missionPlannerLock = true;
		$("#missionplan").fadeOut(100, function(){
			$(this).html("");
			$(this).show();
			missionPlan = [];
			currentMissionPlanet = null;
			updateMissionPlannerView();
		});
	}
}

function initializeMission(){
	missionPlannerLock = true;
	$("#missionplan").fadeOut(100, function(){
		$(this).html("");
		$(this).show();
		missionPlan = [];
		currentMissionPlanet = planetData.kerbin;
		missionPlannerLock = false; //Override the lock.
		addMissionObjectiveNode({action: "start", planet: planetData.kerbin, status: "landed", message: "Start landed on Kerbin."});
		missionPlannerLock = false; //Override the lock.
		addMissionObjectiveNode({action: "launch", message: "Launch from " + currentMissionPlanet.name + ".", planet: currentMissionPlanet});
		missionPlannerLock = true; //Override the lock.
		updateMissionPlannerView();
	});
}

function addMissionObjectiveNode(objective){
	if(!missionPlannerLock){
		missionPlannerLock = true;
		missionPlan.push(objective);
		
		DOT.do("#missionplan")
		.li().class(objective.action + "objective").do()
			.h(objective.message)
		.end().$css("display", "none").$fadeIn(100, function(){/*missionPlannerLock = false;*/});
		
		updateMissionPlannerView();
	}
}