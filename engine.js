"use strict";

function RocketScience(name, tier, icon){
	this.name = name;
	this.htmlIdName = name.toLowerCase().replaceAll(" ", ""); 
	this.tier = tier;
	this.icon = icon;
}

var rocketScience = [];
rocketScience.push( new RocketScience("Basic Rocketry", 2, "./images/Basic_rocketry.png"));
rocketScience.push( new RocketScience("General Rocketry", 3, "./images/General_rocketry.png"));
rocketScience.push( new RocketScience("Advanced Rocketry", 4, "./images/Advanced_rocketry.png"));
rocketScience.push( new RocketScience("Propulsion Systems", 5, "./images/Propulsion_systems.png"));
rocketScience.push( new RocketScience("Heavy Rocketry", 5, "./images/heavy_rocketry.png"));
rocketScience.push( new RocketScience("Precision Propulsion", 6, "./images/Precision_propulsion.png"));
rocketScience.push( new RocketScience("Heavier Rocketry", 6,  "./images/Heavier_rocketry.png"));
rocketScience.push( new RocketScience("Nuclear Propulsion", 7, "./images/nuclear_propulsion.png"));
rocketScience.push( new RocketScience("Very Heavy Rocketry", 8, "./images/very_heavy_rocketry.png"));
rocketScience.push( new RocketScience("Hypersonic Flight", 8, "./images/Hypersonic_flight.png"));
rocketScience.push( new RocketScience("Ion Propulsion", 8, "./images/Ion_propulsion.png"));

function Fuel(name, density, cost, containerMassRatio){
	this.name = name;
	this.density = density;
	this.cost = cost;
	this.containerMassRatio = containerMassRatio;
}
var fuels = {};
fuels["liox"] = new Fuel("Liquid Fuel + Oxidizer", 5, 0.8, 1 / 8);
fuels["liquidfuel"] = new Fuel("Liquid Fuel", 5, 0.8, (100 / 45) * (1 / 8));
fuels["xenon"] = new Fuel("Xenon", 0.1, 4, 0.77358490566); //For the PB-X750

function Engine(name, mass, aslThrust, vacThrust, fuelType, fuelConsumption, cost, science, icon, builtinFuel, radialSize, vacIsp, hasBottomNode){
	this.name = name; 
	this.htmlIdName = name.toLowerCase().replaceAll(" ", ""); 
	this.mass = mass * 1000; 
	this.aslThrust = aslThrust * 1000; 
	this.vacThrust = vacThrust * 1000; 
	this.fuelType = fuelType; 
	this.fuelConsumption = fuelConsumption; 
	this.cost = cost; 
	this.science = science; 
	this.icon = icon; 
	this.builtinFuel = builtinFuel;
	this.radialSize = radialSize;
	this.radius = 0;
	this.dragArea = 0;
	this.minFuelTank = 50;
	this.vacIsp = vacIsp;
	this.hasBottomNode = hasBottomNode;
	this.fuelIcon = "./images/fuelsmall.png";
	switch(radialSize){
		case "Radial Mounted": //Not really sure how big or small to make these.
			this.minFuelTank = 500 / fuelType.density; //100;
			this.dragArea = pi * 1.25 * 1.25;
			this.radius = 1.25;
			break;
		case "Tiny": 
			this.minFuelTank = 200 / fuelType.density; //40
			this.dragArea = pi * 0.625 * 0.625;
			this.radius = 0.625;
			this.fuelIcon = "./images/fueltiny.png";
			break;
		case "Small": 
			this.minFuelTank = 500 / fuelType.density; //100;
			this.dragArea = pi * 1.25 * 1.25;
			this.radius = 1.25;
			break;
		case "Large": 
			this.minFuelTank = 4000 / fuelType.density; //800;
			this.dragArea = pi * 2.5 * 2.5;
			this.radius = 2.5;
			this.fuelIcon = "./images/fuellarge.png";
			break;
		case "Extra Large": 
			this.minFuelTank = 18000 / fuelType.density; //3600;
			this.dragArea = pi * 3.75 * 3.75;
			this.radius = 3.75;
			this.fuelIcon = "./images/fuelextralarge.png";
			break;
	}
	if(this.fuelType == fuels["xenon"]){
		this.fuelIcon = "./images/fuelxenontiny.png"
	}
	
	enginesByName[this.name] = this;
}
var engines = [];
var enginesByName = {};

engines.push (new Engine("Ant", 	0.02, 	0.51, 2, fuels["liox"], 0.129, 110, "Propulsion Systems", "./images/ant.png", 0, "Tiny", 315, true));
engines.push (new Engine("Dart", 	1, 		153.53, 180, fuels["liox"], 10.529, 3850, "Hypersonic Flight", "./images/dart.png", 0, "Small", 340, true));
engines.push (new Engine("Dawn", 	0.25, 	0.05, 2, fuels["xenon"], 0.485, 8000, "Ion Propulsion", "./images/dawn.png", 0, "Tiny", 4200, true));
//engines.push new Engine("Puff", 	0.09, 	9.6, 20, "monopropellent", 2.039, 150, , "./images/puff.png", 0, "Radial Mounted", 250, false));
engines.push (new Engine("Mainsail",6, 		1379.03, 1500, fuels["liox"], 98.682, 13000, "Heavier Rocketry", "./images/mainsail.png", 0, "Large", 310, true));
engines.push (new Engine("Mammoth", 15, 	3746, 4000, fuels["liox"], 258.976, 39000, "Very Heavy Rocketry", "./images/mammoth.png", 0, "Extra Large", 315, false));
engines.push (new Engine("Nerv", 	3, 		13.88, 60, fuels["liquidfuel"], 1.53, 10000, "Nuclear Propulsion", "./images/nerv.png", 0, "Small", 800, true));
engines.push (new Engine("Poodle", 	1.75, 	64.286, 250, fuels["liox"], 14.567, 1300, "Heavy Rocketry", "./images/poodle.png", 0, "Large", 350, true));
engines.push (new Engine("Rhino", 	9, 		1500, 2000, fuels["liox"], 119.967, 25000, "Very Heavy Rocketry", "./images/rhino.png", 0, "Extra Large", 340, true));
engines.push (new Engine("Reliant", 1.25, 	200.667, 215, fuels["liox"], 14.616, 1100, "General Rocketry", "./images/reliant.png", 0, "Small", 300, true));
engines.push (new Engine("Skipper", 3, 		568.75, 650, fuels["liox"], 41.426, 5300, "Heavy Rocketry", "./images/skipper.png", 0, "Large", 320, true));
engines.push (new Engine("Spark", 	0.1, 	16.2, 18, fuels["liox"], 1.22, 200, "Propulsion Systems", "./images/spark.png", 0, "Tiny", 300, true));
engines.push (new Engine("Spider", 	0.02, 	1.79, 2, fuels["liox"], 0.14, 120, "Precision Propulsion", "./images/spider.png", 0, "Radial Mounted", 290, true));
engines.push (new Engine("Swivel", 	1.5, 	168.75, 200, fuels["liox"], 12.73, 1200, "Basic Rocketry", "./images/swivel.png", 0, "Small", 320, true));
engines.push (new Engine("Terrier", 0.5, 	14.78, 60, fuels["liox"], 3.547, 390, "Advanced Rocketry", "./images/terrier.png", 0, "Small", 345, true));
engines.push (new Engine("Thud", 	0.9, 	108.2, 120, fuels["liox"], 8.024, 820, "Advanced Rocketry", "./images/thud.png", 0, "Radial Mounted", 305, true));
engines.push (new Engine("Twin-Boar",10.5, 	1866.7, 2000, fuels["liox"], 135.962, 17000, "Heavier Rocketry", "./images/twin-boar.png", 6400, "Large", 300, false));
engines.push (new Engine("Twitch", 	0.09, 	13.793, 16, fuels["liox"], 1.125, 400, "Precision Propulsion", "./images/twitch.png", 0, "Radial Mounted", 290, true));
engines.push (new Engine("Vector", 	4, 		936.5, 1000, fuels["liox"], 64.660, 18000, "Very Heavy Rocketry", "./images/vector.png", 0, "Small", 315, true));

//var enginesByMass = engines.slice().sort(function(a, b){return a.mass - b.mass});