/*****************************************************************************************
// Starter Web Interface 8.0.2
// Copyright (c) 2024 Pharos Controls Ltd. All rights reserved.
// 
// This sample content is made freely available for illustrative purposes only.
// Pharos Controls Ltd grants a non-exclusive copyright license to use this sample 
// content from which you can generate content tailored to your own specific needs for use
// with products from Pharos Controls Ltd. This sample content has not been 
// thoroughly tested under all conditions and Pharos Controls Ltd
// cannot guarantee reliability or serviceability.
// 
// This sample content is provided "as is" without warranties of any kind.
// The implied warranties of non-infringement, merchantability and fitness for a particular
// purpose are expressly disclaimed. In no event shall Pharos Controls Ltd be liable
// to any party for direct, indirect, incidental or consequential damages arising from the use of
// this sample content.
// 
// For further information please contact support@pharoscontrols.com.
//*****************************************************************************************/

var myColor = 0;
var myKelvin = 0;
var myRGB = [];
var cph = 0;
var cpw = 0;
var colorPicker = 0;
var cpWidth = 0;
var kelvinPicker = 0;
var intPicker = 0;
var sldrSize = 32;

// Set Default group intensity of first press and intial slider position
var myInt = 128;
// Above enter 0 for 0%, 128 for 50% and 255 for 100% to set starting intensity
var slidrInt = "#000000";
// Above enter "#000000" for 0%, "#808080" for 50% and "#ffffff" for 100% slider position

function drawKP() {
	kelvinPicker = new iro.ColorPicker("#kelvinPicker", {
		width: cpWidth,
		color: "rgb(255, 255, 255)",
		borderWidth: 0,
		borderColor: "#fff",
		layoutDirection: 'vertical',
		layout: [{
			component: iro.ui.Slider,
			options: {
				id: 'kelvinslider',
				sliderType: 'kelvin',
				sliderSize: sldrSize,
			}
		}, ]
	});
	kelvinPicker.on('input:change', function(color) {
		myKelvin = color.kelvin;
		var thisKelvin = Math.floor(myKelvin);

		function scale(number, inMin, inMax, outMin, outMax) {
			return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
		}
		var dmxKelvin = Math.ceil(scale(thisKelvin, 2194, 10992, 0, 255));
		Query.set_group_override({
			"num": selectedGroup,
			"temperature": dmxKelvin
		});
	});
}

function drawIS() {
	intPicker = new iro.ColorPicker("#ISPicker", {
		width: cpWidth,
		color: slidrInt,
		borderWidth: 0,
		borderColor: "#fff",
		layoutDirection: 'vertical',
		layout: [{
			component: iro.ui.Slider,
			options: {
				id: 'intSlider',
				sliderType: 'value',
				sliderSize: sldrSize,
			}
		}, ]
	});
	intPicker.on('input:change', function(color) {
		myInt = parseInt(color.value, 10) * 2.55;
		Query.set_group_override({
			"num": selectedGroup,
			"intensity": myInt
		});
	});
}

function drawCP() {
	cpw = $(window).width();
	cph = $(window).scrollTop() + $(window).height();
	if ($(window).width() > $(window).height()) {
		if ($(window).width() > 844 && $(window).width() < 1181) {
			cpWidth = parseInt(cph, 10) * .5;
		} else if ($(window).width() > 1180) {
			cpWidth = 350;
		} else {
			cpWidth = parseInt(cph, 10) * .65;
		}
	} else {
		cpWidth = parseInt(cph, 10) * .3;
	}
	if (cpWidth > 350) {
		cpWidth = 350;
	}
	if (($(window).height() < 430 && $(window).width() > $(window).height()) || $(window).width() < 430 && $(window).height() > $(window).width()) {
		sldrSize = 25;
		colorPicker = new iro.ColorPicker("#demoWheel", {
			width: cpWidth,
			handleRadius: 8,
			handleUrl: null,
			handleOrigin: {
				y: 0,
				x: 0
			},
			color: "#f00",
			borderWidth: 0,
			padding: 8,
			wheelLightness: true,
			wheelAngle: 270,
			wheelDirection: 'anticlockwise',
			layoutDirection: 'vertical',
			layout: [{
				component: iro.ui.Wheel,
				options: {}
			}, ],
			css: {
				'cp-on': {
					'background-color': '$color'
				},
			}
		});
	} else {
		sldrSize = 32;
		colorPicker = new iro.ColorPicker("#demoWheel", {
			width: cpWidth,
			handleRadius: 8,
			handleUrl: null,
			handleOrigin: {
				y: 0,
				x: 0
			},
			color: "#f00",
			borderWidth: 0,
			padding: 8,
			wheelLightness: true,
			wheelAngle: 270,
			wheelDirection: 'anticlockwise',
			layoutDirection: 'vertical',
			layout: [{
				component: iro.ui.Wheel,
				options: {}
			}, {
				component: iro.ui.Slider,
				options: {
					id: 'satSlider',
					sliderType: 'saturation',
					sliderSize: sldrSize
				}
			}, ],
			css: {
				'cp-on': {
					'background-color': '$color'
				},
			}
		});
	}
	colorPicker.on('input:change', function(color) {
		myColor = color.rgbString;
		var thisColor = myColor.replace('rgb(', '').replace(')', '');
		thisColor = thisColor.replaceAll(' ', '');
		myRGB = thisColor.split(",");
		Query.set_group_override({
			"num": selectedGroup,
			"intensity": myInt,
			"colour" : {
				"red": parseInt(myRGB[0]),
				"green": parseInt(myRGB[1]),
				"blue": parseInt(myRGB[2])
			}
		});
	});
}
$(document).ready(function() {
	$(window).on("orientationchange, resize", function() {
		setTimeout(function() {
			$('.IroColorPicker').remove();
			drawCP();
			drawKP();
			drawIS();
		}, 100);
	});
	$(document).ready(function() {
		setTimeout(function() {
			$('.IroColorPicker').remove();
			drawCP();
			drawKP();
			drawIS();
		}, 100);
	})
});