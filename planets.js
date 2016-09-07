"use strict";

var planetData = {list: []};
function Planet(name, g, pressure, scaleHeight, atmosphericHeight, temperature, radius, mass, hasSurface, primary, periapsis, apoapsis, inclination, siderialRotationalVelocity){
	this.siderialRotationalVelocity = siderialRotationalVelocity;
	this.name = name;
	this.lowStableOrbit = atmosphericHeight + 10000;
	this.minOrbitalVelocity = Math.sqrt(G * mass / (this.lowStableOrbit + radius));
	this.escapeVelocity = Math.sqrt(2 * G * mass / radius);
	this.g = g;
	this.pressure = pressure * 1000;
	this.scaleHeight = scaleHeight;
	this.atmosphericHeight = atmosphericHeight
	this.temperature = temperature;
	this.radius = radius;
	this.mass = mass;
	this.hasSurface = hasSurface;
	this.primary = primary;
	this.satellites = [];
	this.periapsis = periapsis;
	this.apoapsis = apoapsis;
	this.aveapsis = (this.apoapsis + this.periapsis) * 0.5
	this.inclination = inclination;
	this.index = planetData.list.length;
	planetData.list.push(this);
	
	if(primary != null){
		primary.satellites.push(this);
	}
}

//					  			 name	g		pressure	scale.H	atm.H	T°		rad		mass			surface orbits
planetData.kerbol = new Planet(	"Kerbol",17.1, 	16, 		43429,	600000,	9726.85,261600000,1.756567e28, 	false,	null,				0,	0,	0, 3804.8);

planetData.moho = new Planet(	"Moho", 2.7, 	0, 			1, 		0, 		0, 		250000,	2.5263617e21, 	true,	planetData.kerbol,	4210510628,		6315765980,		7,		1.2982);
planetData.eve = new Planet(	"Eve", 	16.7, 	506.625,	7200, 	90000,	408.15,	700000,	1.2244127e23, 	true,	planetData.kerbol,	9734357701,		9931011387, 	2.1,	54.636);
planetData.kerbin = new Planet(	"Kerbin",9.81, 	101.325, 	5600, 	70000,	309.15,	600000,	5.2915793e22, 	true,	planetData.kerbol,	13599840256,	13599840256,	0,		174.94);
planetData.duna = new Planet(	"Duna", 2.94, 	6.755, 		5700, 	50000,	250.15,	320000,	4.5154812e21, 	true,	planetData.kerbol,	19669121365,	21783189163, 	0.06,	30.688);
planetData.dres = new Planet(	"Dres", 1.13, 	0, 			1, 		0, 		0,		138000,	3.2191322e20, 	true,	planetData.kerbol,	34917642714,	46761053692,	5,		24.916);
planetData.jool = new Planet(	"Jool", 7.85, 	1519.88, 	30000, 	200000,	200.15,	6000000,4.2332635e24, 	false,	planetData.kerbol,	65334882253,	72212238387,	1.304,	1047.2);
planetData.eeloo = new Planet(	"Eeloo",1.69, 	0, 			1, 		0, 		0, 		210000,	1.1149358e21, 	true,	planetData.kerbol,	66687926800,	113549713200,	6.15,	67.804);

planetData.gilly = new Planet(	"Gilly",0.049, 	0, 			1, 		0, 		0,		13000,	1.2421e17, 	true,	planetData.eve,		14175000,	48825000, 	12,		2.8909);
planetData.mun = new Planet(	"M&uuml;n", 1.63,0,			1, 		0, 		0, 		200000,	9.7600e20,	true,	planetData.kerbin,	12000000,	12000000, 	0,		9.0416);
planetData.minmus = new Planet(	"Minmus",0.491, 0, 			1, 		0, 		0,		60000,	2.6458e19, 	true,	planetData.kerbin,	47000000,	47000000,	6,		9.3315);
planetData.ike = new Planet(	"Ike", 	1.1, 	0, 			1, 		0, 		0,		130000,	2.7822e20, 	true,	planetData.duna,	3104000,	3296000,	0.2,	12.467);
planetData.laythe = new Planet(	"Laythe",7.85, 	60.795, 	8000, 	50000,	285.65,	500000,	2.9398e22, 	true,	planetData.jool,	7184000,	27184000,	0,		59.297);
planetData.vall = new Planet(	"Vall", 2.31, 	0, 			1, 		0, 		0, 		300000,	3.1088e21, 	true,	planetData.jool,	43152000,	43152000,	0,		17.789);
planetData.tylo = new Planet(	"Tylo", 7.85, 	0, 			1, 		0, 		0, 		600000,	4.2333e22, 	true,	planetData.jool,	68500000,	68500000,	0.025,	17.789);
planetData.bop = new Planet(	"Bop", 	0.589, 	0, 			1, 		0, 		0, 		65000,	3.7262e19, 	true,	planetData.jool,	98302500,	158697500,	15,		0.75005);
planetData.pol = new Planet(	"Pol", 	0.373,	0, 			1, 		0, 		0, 		44000,	1.0814e19, 	true,	planetData.jool,	149155794,	210624207,	4.25,	0.30653);