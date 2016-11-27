function LandingGear(name, mass, icon){
	this.name = name;
	this.mass = mass;
	this.icon = icon;
}

LandingGear.prototype.getStageAttachment = function(count){
	return new StageAttachment(this.name, this.mass, count, this.icon)
}

var LandingStruts = {
	small: new LandingGear("LT-05 Micro Landing Strut", 15, "./images/lt05.png"),
	medium: new LandingGear("LT-1 Landing Strut", 50, "./images/lt1.png"),
	large: new LandingGear("LT-2 Landing Strut", 100, "./images/lt2.png")
}

