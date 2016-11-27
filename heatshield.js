

function HeatShield(radius){
	this.initRadius = radius; //For cloning.
	this.radius = radius;
	this.area = pi * this.radius * this.radius;
	this.mass = 0;
	this.deployedRadius = radius;
	this.name = "Generic"
	this.icon = heatshieldIcon;
	
	switch(radius){
		case 0.625:
			this.radius = 0.125;
			this.area = pi * this.radius * this.radius;
			this.mass = 300;
			this.name = "Small"
			break;
		case 1.25:
			this.mass = 300;
			this.name = "Small"
			break;
		case 2.5:
			this.mass = 1300;
			this.name = "Large"
			break;
		case 3.75:
			this.mass = 2800;
			this.name = "Extra Large"
			break;
		case 10:
			this.mass = 1500;
			this.radius = 2.5;
			this.name = "Inflating"
			this.icon = "./images/inflatingheatshield.png"
			break;
		default: 
			throw "Invalid heatshield radius.";
			break;
	}	
}

//TODO: don't forget to deploy this in the code.
HeatShield.prototype.deploy = function(){
	this.radius = this.deployedRadius;
	this.area = pi * this.radius * this.radius;
}

HeatShield.prototype.clone = function(){
	var ret = new HeatShield(this.initRadius);
	ret.radius = this.radius;
	ret.area = this.area;
	return ret;
}

var heatshieldIcon = "./images/heatshield.png";