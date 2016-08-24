//TODO: 
//number of heat shields added isn't correct. Should add same number as boosters in previous stage, and same size. Instead it adds 1 medium one (probably because of the preceeding parachute stage.)
//

"use strict";
var VERSION = 10;

var flightInProgress = false;

function readableSpeed(m){
	if(m < 0) throw "Negative speeds not supported.";
	if(m < 0.001) return "0 m/s";
	else if(m < 0.1) return "" + Math.round(m * 1000) + " mm/s";
	else if(m < 10) return "" + (Math.round(m * 10) / 10) + " m/s";
	else if(m < 10000) return "" + Math.round(m) + " m/s";
	else return "" + (Math.round(m / 100) / 10) + " km/s";
}

function readableMass(m){
	if(m < 0) throw "Negative masses not supported. What's wrong with you?";
	if(m < 1000) return "" + Math.round(m) + " kg";
	else return "" + Math.round(m) / 1000 + " T";
}

function readableDistance(m){
	if(m < 0) throw "Negative distances not supported.";
	if(m < 1000) return "" + Math.round(m) + " m";
	if(m < 10000) return "" + Math.round(m / 10) / 100 + " km";
	if(m < 100000) return "" + Math.round(m / 100) / 10 + " km";
	//if(m < 1000000) return "" + Math.round(m / 1000) + " km";
	return "" + Math.round(m / 1000) + " km";
}

function readableTime(tt){
	if(m < 0) throw "Negative times not supported.";
	var ss = Math.round(tt);
	var s = ss % 60;
	var mm = ~~(ss / 60);
	if(mm < 60)
		return mm + ":" + (s < 10 ? "0" : "") + s;
	
	var m = mm % 60;
	var hh = ~~(mm / 60);
	return "" + hh + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}

$(function(){
	//Data required for calculations.
	var massSafetyFactor = 1.01; // 1% mass allowance for overhead.
	var dvByMassConstant = 2;
	
	var cookies = Cookies.getJSON("kspcalccookies");
	
	//User interface:
	DOT.do("#body")
		.div().id("formcontainer").class("container").do()
			.br().br().h("<a href=\"https://twitter.com/joshsideris\" class=\"twitter-follow-button\" data-show-count=\"false\">Follow @joshsideris</a>").br().br().b("Joshua Sideris'")
			.h1().do().h("Advanced Kerbal Space Program Mission Calculator").br().i("Rocket Designer <b>&bull;</b> Mission Planner <b>&bull;</b> Parachute / Heat Shield / Aerocapture Calculator <b>&bull;</b> Simulator").class("subtitle").end()
				.a("Version " + VERSION).href("./changes.html").target("_blank")
				.br()
				.h("Join the discussion on the ").a("KSP forum").href("http://forum.kerbalspaceprogram.com/index.php?/topic/146439-advanced-ksp-mission-tool/").target("_blank").h(".")
				/*
				.h2("Video Tutorial")
				.div().$css("width", "100%").$css("text-align", "center").do()
					.h('<iframe width="560" height="315" src="https://www.youtube.com/embed/OCpOVswGqbo" frameborder="0" allowfullscreen></iframe>')
				.end()
				.br()*/
				.div().$css("width", "100%").$css("text-align", "center").do()
					.h('<ins class="adsbygoogle" style="display:inline-block;width:728px;height:90px" data-ad-client="ca-pub-6712057098655965" data-ad-slot="2959555079"></ins>')
				.end()
				.h2("Note to Redditors")
					.h("After posting a link to this on ").a("Reddit").href("https://www.reddit.com/r/KerbalSpaceProgram/comments/4z9ul9/advanced_ksp_mission_calculator_just_try_it/").target("_blank").h(" I've received tons of great feedback and bug reports. Thanks to this feedback, here is what you can expect for version 11.")
					.br()
					.ul().do()
						.li("Powered landings on Duna instead of using 200 parachutes.")
						.li("Failed aerocaptures will instead go back and attempt a capture burn.")
						.li("A link to the rocket/mission plan for future reference (will probably make a new tool for this as well).")
						.li("Atmospheric launches will follow the prograde vector until reaching the mininmum apoapsis.")
						.li("Non-atmospheric launches will blast off at a 45 degree angle until reaching the minimum apoapsis.")
						.li("Various display errors will be fixed.")
					.end()
					.br()
					.h("I also recommend turning off ion engines unless you want to have to deal with extremely long and difficult burns (I'm trying to find a good way to deal with this problem automatically). I'm fairly busy with other work this week so maybe I'll push something out mid-to-late next week.")
				.h2("Calculator")	
					.h3("Enabled Mods")
					.input().id("includestagerecoverychutes").type("checkbox").if(cookies && cookies.enableStageRecovery, function(){DOT.checked("")})
						.label().for("includestagerecoverychutes").do()
							.h("Include stage recovery chutes for boosters jettisoned on Kerbin. Requires the ")
							.a("StageRecovery").href("http://kerbal.curseforge.com/projects/stagerecovery").target("_blank")
							.h(" mod.")
						.end().title("This will add one MK2-R chute to each booster when launching from Kerbin.")
					.br()
					.input().id("enableinterstellarfuelswitch").type("checkbox").if(cookies && cookies.enableFuelSwitching, function(){DOT.checked("")})
						.label().for("enableinterstellarfuelswitch").do()
							.h("Enable fuel switching. Requires the ")
							.a("Interstellar Fuel Switch").href("http://mods.curse.com/ksp-mods/kerbal/237233-interstellar-fuel-switch").target("_blank")
							.h(" mod.")
						.end().title("Allows fuel tanks to be filled all the way up with liquid fuel, for use with the stock Nerv engine.")
					.h3("Mission Planner")
						.label("Initial Payload Mass: ").title("The initial cargo mass that the spacecraft starts with, without accounting for any of the rockets or fuel required to get there. Include any payload-specific instruments, sensors, batteries, solar panels. Don't include parachutes or heat shields because the app adds them for you. Don't include the mass of passengers because they are not considered by the game's physics.").for("payloadamount")
						.input().id("payloadamount").class("form-control").type("number").min("0").required("required").value("1")
						.span().class("units").do().h(" T").end()
						.br()
						.label("Payload Profile: ").title("The size radius of the payload. This is important for approximating drag, as well as parachute / heat shield reqirements.").for("payloadprofile")
						.select().id("payloadprofile").class("form-control").do()
							.option("Tiny / 0.625 m").value("0.625")
							.option("Small / 1.25 m").value("1.25").selected("selected")
							.option("Large / 2.5 m").value("2.5")
							.option("Extra Large / 3.75 m").value("3.75")
							.option("Complex / 10 m").value("10")
						.end()
						.br()
						.table().class("table").do()
							.tbody().do()
								.tr().do()
									.td().class("col-md-6").do()
										.ol().id("missionplan").class("missionplanlist").do()
											//Iterate through flight plan here. Actually we don't start out with anything preset...
										.end()
									.end()
									.td().id("missionoptions").class("col-md-6").do()
										
									.end()
								.end()
							.end()
						.end()
					.h3("Available Engines")
						.div().do()
							.iterate(9, function(i){
								if(i == 0 || i == 8){
									//No engines on this tier
									return;
								}
								DOT.div().class("engineselectiontier").do()
									.div().class("engineselectionslide engineselectiontiernumb").do()
										.span("Tier " + (i + 1))
									.end()
									
									.div().id("t" + (i + 1) + "engines").class("engineselectionslide engineselectionlist").do()
										.iterate(rocketScience.length, function(j){
											if(rocketScience[j].tier == i + 1){
												DOT.div().class("sciencecontainer").do()
													.img().id(rocketScience[j].htmlIdName + "-button").src(rocketScience[j].icon).title(rocketScience[j].name).class("imgicon clickableimgicon enabledicon").$click(function(){
														var clicked = $("#" + rocketScience[j].htmlIdName + "-button");
														var engines = $("#" + rocketScience[j].htmlIdName + "-engines");
														if(clicked.hasClass("enabledicon")){
															clicked.removeClass("enabledicon");
															clicked.addClass("disabledicon");
															engines.hide(250);
														}
														else{
															clicked.removeClass("disabledicon");
															clicked.addClass("enabledicon");
															engines.show(250);
														}
														
													})
													.div().id(rocketScience[j].htmlIdName + "-engines").class("enginecontainer").do()
														.iterate(engines.length, function(k){
															if(engines[k].science == rocketScience[j].name){
																
																DOT.img().id(engines[k].htmlIdName + "-button").src(engines[k].icon).class("imgicon clickableimgicon " + (engines[k].name == "Dawn" ? "disabledicon" : "enabledicon")).title(engines[k].name + (engines[k].name == "Dawn" ? " - Warning, the dawn engine is challenging and annoying to use and the calculator has trouble placing it in conveient places. Try to hand-tune use of this engine." : ""))
																	.$click(function(){
																		var clicked = $("#" + engines[k].htmlIdName + "-button");
																		if(clicked.hasClass("enabledicon")){
																			clicked.removeClass("enabledicon");
																			clicked.addClass("disabledicon");
																		}
																		else{
																			clicked.removeClass("disabledicon");
																			clicked.addClass("enabledicon");
																		}
																	});
															}
														})
													.end()
												.end();
											}
										})
									.end()
								.end();
							})
							
							
						.end()
					.h3("Calculate Rocket")
						.button("Launch Mission").id("calcbtn").$click(function(){
							DOT.do("#flightresults").$empty()
								.div().class("panhandling").do()
									.h("This project has taken on a life of its own. It's now over 5000 lines of code. If you like this tool and you'd like to contribute or show gratitude, please consider supporting the tool's continued development. Your donations keep this project alive. ").a("Donate.").href("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=XFMC6SQEDWU9W").target("_blank")
								.end()
								.br()
								.div().id("launchcalculatinggif").$css("width", "100%").$css("text-align", "center").do()
									.div().id("loadingmessage")
									.br()
									.img().src("./images/gears.gif")
								.end()
								.script(function(){
									if(flightInProgress){
										return;
									}
									flightInProgress = true;
									var pr = realizeMission(Number($("#payloadamount").val()) * 1000, missionPlan)
									pr.then(function(data){
										console.log(data);
										flightInProgress = false;
										$("#launchcalculatinggif").hide(500);
										DOT.do("#flightresults")
										.h1("MISSION STATUS: SUCCESS").$css("color", "green")
										//.b(data.message)
										.if(data.rocket != null && data.rocket.segments.length > 0, function(){
											DOT.h2("Best Rocket Design")
												.table().class("table")
													.do()
														.tbody().do()
															.iterate(data.rocket.segments.length, function(j){
																var segment = data.rocket.segments[j];
																DOT.iterate(segment.stages.length, function(i){
																	var stage = segment.stages[i];
																	DOT.tr().do()
																		.if(i == 0, function(){
																			//Add the label.
																			DOT.td().rowspan("" + segment.stages.length).class("rocketsegmentlabel").do().div().do().span(segment.label).end().end()
																		})
																		.td(stage.type)
																		.if(stage.type == "Payload", function(){
																			DOT
																			.td().do()
																				.img().src("./images/commandpod.png").class("imgicon")
																			.end()
																			.td().do()
																				.h("Mass: ").b((Math.round(stage.getMass()) / 1000) + " T")
																			.end();
																		})
																		.else(function(){
																			DOT
																			.td().do()
																				.img().src(stage.icon)
																					.data("enginesrc", stage.icon)
																					.data("fuelsrc", (stage.engine == null ? stage.icon : stage.engine.fuelIcon))
																					.class("imgicon")
																					.$hover(function(){
																						$(this).attr("src", $(this).data("fuelsrc"))
																					}, function(){
																						$(this).attr("src", $(this).data("enginesrc"))
																					})
																			.end()
																			.td().do()
																				.if(stage.engine != null || stage.removedEngine != null, function(){
																					var ceng = stage.engine || stage.removedEngine;
																					DOT.h("Fuel: ").b(stage.initialFuel + " units").h(" of ").b(stage.fuelType.name)
																					.h(" (" + stage.numbTanksPerBooster + " central " 
																						+ (stage.numbRadialBoosterPairs  > 0
																							? "+ " + stage.numbTanksPerBooster + "&times;" 
																							+ (stage.numbRadialBoosterPairs * 2) + " radial " : "") 
																						+ "short " + ceng.radius + " m tanks or equivalent)")
																					.br()
																					.h("Detachable Boosters: ").b(stage.numbRadialBoosterPairs * 2)
																					.br()
																					.h("Engine: ").b(ceng.name 
																						+ (stage.engine ? " &times; " + ((stage.numbRadialBoosterPairs * 2 + 1) * stage.numbEnginesPerBooster) : " from previous stage"))
																					.br();
																				})
																				.if(stage.type == "Parachutes", function(){
																					DOT.h("MK2-R Chutes: <b>" + (~~stage.getMass() / 100) + "</b>")
																					.br();
																				})
																				.if(stage.type == "Heat Shield", function(){
																					DOT.h(stage.heatShield.name + " Heat Shield: <b>" + stage.numbHeatShields + "</b>")
																					.br();
																				})
																				
																				.h("Estimated mass of stage: ").b((Math.round(stage.getMass()) / 1000) + " T")
																			.end();
																		})
																	.end();
																});
															})
														.end()
													.end()
													.br()
													.b("Total Estimated Mass: ").h((Math.round(data.rocket.getMass()) / 1000) + " T")
													.br()
													.b("Total Estimated &Delta;V: ").h(readableSpeed(data.rocket.getDv()) + "")
													.br().br()
													.b().do()
														.i("*Calculations done on each stage have a built-in safety factor, assumeing 1% excess mass of their payloads. Use this to add decouplers, nose cones, fins, control surfaces, landing gear, etc.")
														.br()
														.i("*All takeoff calculations assume that each exposed part is covered by a nose cone to reduce drag.")
														.br()
														.i("*Use common sense. There might be some optimizations that the algorithm missed since this tool is still in development.")
														.br()
														.i().do().h("*Make sure any detachable boosters or fuel tanks chain fuel into more central tanks via fuel ducts in an ").a("\"asparagus\" format").href("http://wiki.kerbalspaceprogram.com/wiki/Asparagus_staging").target("_blank").h(".").end()
														.br()
														.i("*You can attach space fuel tanks radially and detach them upon depletion. Be sure to match the takeoff stage's ascent profile for maximal aerodynamics.")
														.br()
														.i("*For parachutes, be sure to replace a few of the MK2-Rs with drogue chutes on heavy crafts.")
														.br()
														.i("*Report bugs to josh.sideris@gmail.com.")
													.end()
											.script(function(){
												DOT.h2("Launch Simulation & Flight Plan")
												.table().class("table").do().tbody().do().iterate(data.mission.length, function(i){
													var missionSegment = data.mission[i];
													if(missionSegment.launchEvents){
														DOT.tr().class("tlmissionmessage").do().td().do()
															.h("Launch from " + missionSegment.launchPlanet.name + ".")
															.br()
															.button("View Flight").class("accordion").$click(function(){
																$(this).toggleClass("active");
																$(this).next().toggleClass("show");
															})
															.div().class("panel").do()
																.table().class("table").do().tbody().do().iterate(missionSegment.launchEvents.length, function(j){
																	var event = missionSegment.launchEvents[j];
																	DOT.tr().$css("background-color", event.color).do()
																		.td(readableTime(event.time)).class("col-md-1")
																		.td(readableDistance(event.altitude)).class("col-md-1")
																		.td(event.message)
																	.end();
																}).end().end()
															.end()
														.end().end();
													}
													
													DOT.iterate(missionSegment.messages.length, function(j){
														var message = missionSegment.messages[j];
														DOT.tr().class("tlmissionmessage").do()
															.td(message)
														.end();	
													});
													if(missionSegment.landingSequence.length > 0){
														DOT.tr().class("tlmissionmessage").do().td().do()
															.h("Land on " + missionSegment.landPlanet.name + ".")
															.br()
															.button("View Descent").class("accordion").$click(function(){
																$(this).toggleClass("active");
																$(this).next().toggleClass("show");
															})
															.div().class("panel").do()
																.table().class("table").do().tbody().do().iterate(missionSegment.landingSequence.length, function(j){
																	var event = missionSegment.landingSequence[j];
																	DOT.tr()/*.$css("background-color", event.color)*/.do()
																		.td(event)
																	.end();
																}).end().end()
															.end()
														.end().end();
													}
													
												}).end().end();
												
											});
										});
									}).catch(function(reason){
										flightInProgress = false;
										$("#launchcalculatinggif").hide(500);
										DOT.h1("MISSION STATUS: FAILURE").$css("color", "red")
										.b(reason);
									});
								});
						})
			.br()
			.br()
			.div().id("flightresults")
			.br().br().br().br().br().br().br().br().br().br().br().br().br().br().br().br().br().br()
		.end()
	;
	
	initializeMission();
	(adsbygoogle = window.adsbygoogle || []).push({}); //GOOGLE ADS.
});

/*function dragAreaSelector(id){
	DOT.select().id(id).class("form-control").onchange("").do()
		.option("0.3 m&sup2; - \"Tiny\" (0.625 m)").value("0.3068")
		.option("1.2 m&sup2; - \"Small\" (1.25 m)").value("1.2272")
		.option("5 m&sup2; - \"Large\" (2.5 m)").value("4.9087")
		.option("11 m&sup2; - \"Extra Large\" (3.75 m)").value("11.0447")
		.option("Custom").value("0")
	.end()
	.br()
	.input()
}
*/








