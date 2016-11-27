function calculateParachutes(rocketMass, planet){
	
	if(rocketMass == 0){
		return {status: "success", numbChutes: 1, message: ""};
	}
	
	var drag = 0.2;
	var elevation = 0;
	var landingSpeed = 5;
	var massInTons = rocketMass / 1000;
	var pressureKpa = planet.pressure / 1000;


	var chuteMassT = (0.0000484397 * drag * pressureKpa * Math.pow((elevation + planet.radius), 2) * massInTons * Math.pow(landingSpeed, 2) 
			- G * planet.mass * massInTons * Math.exp(elevation / planet.scaleHeight)) 
		/ (G * planet.mass * Math.exp(elevation / planet.scaleHeight) 
			- 0.0242198 * pressureKpa * Math.pow(elevation + planet.radius, 2) * Math.pow(landingSpeed, 2));
		
	//0.3 was experimentally found to be a working value for the radially attached chutes.
	//They weigh 0.1T each. 
	var numbChutes = Math.ceil(chuteMassT / 0.3);
	if (chuteMassT <= 0 && numbChutes > 0){
		return {status: "fail", message: "The spacecraft could not be landed with parachutes."};
	}
	else {
		
	    return {status: "success", numbChutes: numbChutes, message: ""};
	}
}

var parachuteIcon = "./images/mk2-r.png";