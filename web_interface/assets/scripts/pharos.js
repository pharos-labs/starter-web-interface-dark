/*****************************************************************************************
// Starter Web Interface 8.0.2.BETA.2
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

var y = 0;
var collapsed = true;
var iGroup = 0;
var uGroup = 0;
var accOpen = 0;
var sccOpen = 0;
var lastHash = 0;
var selectedGroup = "";
var controllerType = "";
var testConditions = false;
var intGroup = "";
var myFilter = [0, 0, 0, 0, 0, 0, 0, 0];
var tLimit = 5000;
var sLimit = 5000;
var gLimit = 340;
var intStart = "off"
var intBlock = false;
var intBlockTimerId = -1;
var auth = true;
var groupSort = "alpha"; // The sort order of the groups, can be num (sort by number), alpha (sort alphabetically), otherwise sort will be in creation order
var playbackGroupNames = []; // This is loaded with group names as they arrive

function pad(str, max) {
	str = str.toString();
	return str.length < max ? pad("0" + str, max) : str;
}

// Setup intBlock flag
// When set, slider updates are not sent back to the Controller
// This can be used to prevent feedback loops
function enableIntBlock()
{
	intBlock = true;
	clearTimeout(intBlockTimerId)
	intBlockTimerId = setTimeout(
		function()
		{
			intBlock = false;
			intBlockTimerId = -1
		}, 500);
}


// Function to update dashboard slider values
function updateDBSliders() {
	Query.get_group_info(function(t) {
		enableIntBlock();
		for (var i = 0; i < Object.keys(t.groups).length; i++) {
			if (t.groups[i].num >= gLimit) {} else {
				$('#slider' + t.groups[i].num).slider("option", "value", t.groups[i].level);
				$('#amount' + t.groups[i].num).val(t.groups[i].level);
				if (t.groups[i].level === 0) {
					$('#groupSwitch' + t.groups[i].num).prop("checked", false);
				} else {
					$('#groupSwitch' + t.groups[i].num).prop("checked", true);
				}
			}
		}
	});
}

function updateIntensitySliders() {
	Query.get_group_info(function(t) {
		enableIntBlock();
		for (var i = 0; i < Object.keys(t.groups).length; i++) {
			if (t.groups[i].num >= gLimit) {} else {
				$('#intensity' + t.groups[i].num).slider("option", "value", t.groups[i].level);
				$('#intensityAmount' + t.groups[i].num).val(t.groups[i].level);
				if (t.groups[i].level === 0) {
					$('#intensitySwitch' + t.groups[i].num).prop("checked", false);
				} else {
					$('#intensitySwitch' + t.groups[i].num).prop("checked", true);
				}
			}
		}
	});
}

function updateZoneLevel() {
	Query.get_group_info(function(t) {
		enableIntBlock();
		for (var i = 0; i < Object.keys(t.groups).length; i++) {
			if (t.groups[i].num >= gLimit) {} else {
				$('.zoneLevel' + t.groups[i].num).text(t.groups[i].level + "%");
				if (t.groups[i].level === 0) {
					$('#intSwitch' + t.groups[i].num).prop("checked", false);
				} else {
					$('#intSwitch' + t.groups[i].num).prop("checked", true);
				}
			}
		}
	});
}

function msToTime(duration) {
	var milliseconds = Math.floor((duration % 1000) / 100),
		seconds = Math.floor((duration / 1000) % 60),
		minutes = Math.floor((duration / (1000 * 60)) % 60),
		hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;
	return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}
// Function that builds the timeline groups and accordion
function timelines() {
	Query.get_timeline_info(function(t) {
		function predicatBy(prop) {
			return function(a, b) {
				if (a[prop] > b[prop]) {
					return 1;
				} else if (a[prop] < b[prop]) {
					return -1;
				}
				return 0;
			};
		}
		//Usage
		t.timelines.sort(predicatBy("num"));
		var tlNum = Object.keys(t.timelines).length;
		var accNum = Math.floor(parseInt(tlNum, 10) / parseInt(9, 10) + 1);
		var accSub = [];
		if (tlNum === 0) {
			$('.tlSwitch, .timelineContainer').remove();
		} else {
			$('.buttons').html("");
			for (var k = 0; k <= 8; k++) {
				$('.buttons').append('<div class="accTop accTop' + k + '"  onclick="header(' + k + ')">UNGROUPED</div><div class="clear accSub accSub' + k + '" ></div>');
			}
			for (var i = 0; i < tlNum; i++) {
				if (t.timelines[i].num >= tLimit) {} else {
					// Allow a total of 8 group name slots to be used, others go in the default section
					var playbackGroupName = t.timelines[i].group;
					var playbackGroupIndex = 0;

					if(playbackGroupName!="")
					{
						if(!playbackGroupNames.includes(playbackGroupName) && playbackGroupNames.length < 8) {
							playbackGroupNames.push(playbackGroupName);
						}
						playbackGroupIndex = playbackGroupNames.indexOf(playbackGroupName) + 1;

						if(playbackGroupIndex>0) {
							$(`.accTop${playbackGroupIndex}`).text(playbackGroupName);
						}

					}
					$(`.accSub${playbackGroupIndex}`).append('<div onclick="start_timeline(' + t.timelines[i].num + ')" class="btn2" id="timeline' + t.timelines[i].num + '">' + t.timelines[i].name + '</div>');
				}
			}
		}
		for (var h = 0; h < 9; h++) {
			if ($('.accTop' + h).next().children().length === 0) {
				$('.accTop' + h).remove();
			}
		}
		$('.systemStatusTimelines').html("");
		for (var p = 0; p < tlNum; p++) {
			if (t.timelines[p].num >= tLimit) {} else {
				var myLocation = t.timelines[p].custom_properties['Zone'];
				if (myLocation === "undefined") {
					var myLoc = ""
				} else {
					var myLoc = '<div class="groupLocation">' + t.timelines[p].custom_properties['Zone'] + '</div>';
				}
				var myLength = msToTime(t.timelines[p].length);
				var myTlState = t.timelines[p].state.replace(/\_/g, ' ');
				if (t.timelines[p].group == "") {
					if ((t.timelines[p].onstage == true && t.timelines[p].state == "running") || (t.timelines[p].onstage == true && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="showName">' + t.timelines[p].name + '</div>' + myLoc + '<div class="groupName">UNGROUPED</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					} else if ((t.timelines[p].onstage == false && t.timelines[p].state == "running") || (t.timelines[p].onstage == false && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.timelines[p].name + '</div>' + myLoc + '<div class="groupName">UNGROUPED</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					}
				} else {
					if ((t.timelines[p].onstage == true && t.timelines[p].state == "running") || (t.timelines[p].onstage == true && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="showName">' + t.timelines[p].name + '</div>' + myLoc + '<div class="groupName">Group ' + t.timelines[p].group + '</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					} else if ((t.timelines[p].onstage == false && t.timelines[p].state == "running") || (t.timelines[p].onstage == false && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.timelines[p].name + '</div>' + myLoc + '<div class="groupName">Group ' + t.timelines[p].group + '</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					}
				}
			}
		}
		$('.accSub').slideUp("fast");
		if ($('.accSub').children().hasClass('active')) {
			$('.active').parent().slideDown("fast").css('display', 'block');
		} else {
			$('.accSub').first().slideDown("fast").css('display', 'block');
			$('.tlRel .relSwitch').addClass("ui-state-disabled");
		}
	});
}
// Function that builds the scene page and accordion
function scenes() {
	Query.get_scene_info(function(t) {
		function predicatBy(prop) {
			return function(a, b) {
				if (a[prop] > b[prop]) {
					return 1;
				} else if (a[prop] < b[prop]) {
					return -1;
				}
				return 0;
			};
		}
		//Usage
		t.scenes.sort(predicatBy("num"));
		var scNum = Object.keys(t.scenes).length;
		var accNum = Math.floor(parseInt(scNum, 10) / parseInt(9, 10) + 1);
		if (scNum === 0) {
			$('.scSwitch, .scenesContainer').remove();
		} else {
			for (var p = 0; p < scNum; p++) {
				if (t.scenes[p].state === "started") {
					$('#scene' + t.scenes[p].num).addClass('active');
				} else {
					$('#scene' + t.scenes[p].num).removeClass('active');
				}
			}
			if (scNum === 0) {
				$('.tlSwitch, .scenesContainer').remove();
			} else {
				$('.scenes').html("");
				for (var k = 0; k <= 8; k++) {
					$('.scenes').append('<div class="accSCtop accSCtop' + k + '"  onclick="accSCsub(' + k + ')">UNGROUPED</div><div class="clear accSCsub accSCsub' + k + '" ></div>');
				}
				for (var i = 0; i < scNum; i++) {

					// Allow a total of 8 group name slots to be used, others go in the default section
					var playbackGroupName = t.scenes[i].group;
					var playbackGroupIndex = 0;

					if(playbackGroupName!="")
					{
						if(!playbackGroupNames.includes(playbackGroupName) && playbackGroupNames.length < 8) {
							playbackGroupNames.push(playbackGroupName);
						}
						playbackGroupIndex = playbackGroupNames.indexOf(playbackGroupName) + 1;

						if(playbackGroupIndex>0) {
							$(`.accSCtop${playbackGroupIndex}`).text(playbackGroupName);
						}
					}
					$(`.accSCsub${playbackGroupIndex}`).append('<div onclick="start_scene(' + t.scenes[i].num + ')" class="btn2" id="scene' + t.scenes[i].num + '">' + t.scenes[i].name + '</div>');

				}
			}
			for (var h = 0; h < 9; h++) {
				if ($('.accSCtop' + h).next().children().length === 0) {
					$('.accSCtop' + h).remove();
				}
			}
			$('.systemStatusScenes').html("");
			for (var p = 0; p < scNum; p++) {
				if (t.scenes[p].num >= sLimit) {} else {
					var myLocation = t.scenes[p].custom_properties['Zone'];
					if (myLocation === "undefined") {
						var myLoc = ""
					} else {
						var myLoc = '<div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div>';
					}
					var myLength = msToTime(t.scenes[p].length);
					var myScState = t.scenes[p].state.replace(/\_/g, ' ');

					if (t.scenes[p].group == "") {
						if ((t.scenes[p].onstage == true && t.scenes[p].state == "started")) {
							$('.systemStatusScenes').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.scenes[p].num + '</div><div class="label">SCENE</div></div></div><div class="showContainer"><div id="show' + t.scenes[p].num + '" class="showInfo"><div class="showStatus">' + myScState + '</div><div class="showName">' + t.scenes[p].name + '</div><div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div><div class="groupName">UNGROUPED</div></div></div>');
							$('#scene' + t.scenes[p].num).addClass('active');
						} else if ((t.scenes[p].onstage == false && t.scenes[p].state == "started")) {
							$('.systemStatusScenes').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.scenes[p].num + '</div><div class="label">SCENE</div></div></div><div class="showContainer"><div id="show' + t.scenes[p].num + '" class="showInfo"><div class="showStatus">' + myScState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.scenes[p].name + '</div><div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div><div class="groupName">UNGROUPED</div></div></div>');
							$('#scene' + t.scenes[p].num).addClass('active');
						}
					} else {
						if ((t.scenes[p].onstage == true && t.scenes[p].state == "started")) {
							$('.systemStatusScenes').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.scenes[p].num + '</div><div class="label">SCENE</div></div></div><div class="showContainer"><div id="show' + t.scenes[p].num + '" class="showInfo"><div class="showStatus">' + myScState + '</div><div class="showName">' + t.scenes[p].name + '</div><div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div><div class="groupName">Group ' + t.scenes[p].group + '</div></div></div>');
							$('#scene' + t.scenes[p].num).addClass('active');
						} else if ((t.scenes[p].onstage == false && t.scenes[p].state == "started")) {
							$('.systemStatusScenes').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.scenes[p].num + '</div><div class="label">SCENE</div></div></div><div class="showContainer"><div id="show' + t.scenes[p].num + '" class="showInfo"><div class="showStatus">' + myScState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.scenes[p].name + '</div><div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div><div class="groupName">Group ' + t.scenes[p].group + '</div></div></div>');
							$('#scene' + t.scenes[p].num).addClass('active');
						}
					}
				}
			}
			$('.accSCsub').slideUp("fast");
			if ($('.accSCsub').children().hasClass('active')) {
				$('.active').parent().slideDown("fast").css('display', 'block');
			} else {
				$('.accSCtop').first().slideDown("fast").css('display', 'block');
				$('.scRel .relSwitch').addClass("ui-state-disabled");
			}
		}
	});
}

function groups() {
	Query.get_group_info(function(t) {

		// Create a shallow copy of the group info for sorting
		var sortedGroups = [...t.groups];

		if(groupSort=="num") {
			sortedGroups.sort(function(a,b) {
				return a.num - b.num;
			});
		}

		if(groupSort=="alpha") {
			sortedGroups.sort(function(a,b) {
				if (a.name < b.name) {
				  return -1;
				}
				if (a.name > b.name) {
				  return 1;
				}
				return 0;
			});
		}

		var grNum = Object.keys(sortedGroups).length;
		$('.groupStatus').append('<div class="sliderContainer" id="sliderContainer0"><div class="slider_title">ALL</div><div class="sliderInput"><input class="amount" id="amount0" readonly type="text"></div><div class="groupSwitch"><input type="checkbox" id="groupSwitch0" name="toggle" onclick="groupBox(0)" checked="true"><label for="toggle"><i></i></label><span></span></div><div class="sliderbg" align="center"><div align="center" class="slider" id="slider0"></div></div></div>');
		$('body').append('<script>$(function() {$("#slider0").slider({orientation: "horizontal",range: "min", min: 0, max: 100, value: 100, step: 1, slide: function(change, ui){$("#amount0").val(ui.value);INTthrottled0(ui.value);},stop: function(change, ui) {$("#amount0").val(ui.value);INTthrottled0(ui.value);},change: function(change, ui) {$("#amount0").val(ui.value);INTthrottled0(ui.value);}});$("#amount0").val($("#slider0").slider("value"));});function sendINT0(int) {if (intBlock) {} else {var newInt = parseInt(int,10) /100;Query.master_intensity({"num":"0", "level": newInt});}}var INTthrottled0 = $.throttle(100, sendINT0); </script>');
		$('.masterIntensity').append('<div class="intensityContainer" id="intensityContainer0"><div class="slider_title">ALL</div><div class="sliderInput"><input class="amount" id="intensityAmount0" readonly type="text"></div><div class="groupSwitch"><input type="checkbox" id="intensitySwitch0" name="toggle" onclick="groupBox(0)" checked="true"><label for="toggle"><i></i></label><span></span></div><div class="sliderbg" align="center"><div align="center" class="slider" id="intensity0"></div></div></div>');
		$('body').append('<script>$(function() {$("#intensity0").slider({orientation: "horizontal",range: "min", min: 0, max: 100, value: 100,  step: 1,slide: function(change, ui){$("#intensityAmount0").val(ui.value);INTthrottled0(ui.value);},stop: function(change, ui) {$("#intensityAmount0").val(ui.value);INTthrottled0(ui.value);},change: function(change, ui) {$("#intensityAmount0").val(ui.value);INTthrottled0(ui.value);}});$("#intensityAmount0").val($("#intensity0").slider("value"));});function sendINT0(int) {if (intBlock) {} else {var newInt = parseInt(int,10) /100;Query.master_intensity({"num":"0", "level": newInt});}}var INTthrottled0 = $.throttle(100, sendINT0); </script>');

		var grCount = 0; // Track the number of groups added
		sortedGroups.forEach((group) => {
			if (group.num > 0 && group.num !== null && grCount < gLimit) {
				var myName = "'" + group.name + "'";
				$('.zoneContainer').append('<div class="zone"><div class="zoneGroup" id="zone' + grCount + '" onClick="setIntGroup(' + group.num + ',' + myName + ')"><div class="zoneTitle">' + group.name + '</div><div class="zoneLevel zoneLevel' + group.num + '">' + group.level + '%</div></div><div class="intSwitch"><input id="intSwitch' + group.num + '" type="checkbox" name="toggle" onClick="intBox(' + group.num + ')"  checked><label for="toggle"><i></i></label><span></span></div></div>');
				$('.groupBtns').append('<div id="group' + group.num + '" onClick="setGroup(' + group.num + ')" class="btn2 group">' + group.name + '</div>');
				$('.groupStatus').append('<div class="sliderContainer" id="sliderContainer' + grCount + '"><div class="slider_title">' + group["name"] + '</div><div class="sliderInput"><input class="amount" id="amount' + group.num + '" readonly type="text"></div><div class="groupSwitch"><input type="checkbox" id="groupSwitch' + group.num + '" name="toggle" onclick="groupBox(' + group.num + ')" checked="true"><label for="toggle"><i></i></label><span></span></div><div class="sliderbg" align="center"><div align="center" class="slider" id="slider' + group.num + '"></div></div></div>');
				$('body').append('<script>$(function() {$("#slider' + group.num + '").slider({orientation: "horizontal",range: "min", min: 0, max: 100, value: 100, step: 1,slide: function(change, ui) {$("#amount' + group.num + '").val(ui.value);INTthrottled' + group.num + '(ui.value);},stop: function(change, ui) {$("#amount' + group.num + '").val(ui.value);INTthrottled' + group.num + '(ui.value);},change: function(change, ui) {$("#amount' + group.num + '").val(ui.value);INTthrottled' + group.num + '(ui.value);}});$("#amount' + group.num + '").val($("#slider' + group.num + '").slider("value"));});function sendINT' + group.num + '(int) {if (intBlock) {} else {var newInt = parseInt(int,10) /100;Query.master_intensity({"num":' + group.num + ', "level": newInt });}}var INTthrottled' + group.num + ' = $.throttle(100, sendINT' + group.num + '); </script>');
				$('.masterIntensity').append('<div class="intensityContainer" id="intensityContainer' + grCount + '"><div class="slider_title">' + group["name"] + '</div><div class="sliderInput"><input class="amount" id="intensityAmount' + group.num + '" readonly type="text"></div><div class="groupSwitch"><input type="checkbox" id="intensitySwitch' + group.num + '" name="toggle" onclick="groupBox(' + group.num + ')" checked="true"><label for="toggle"><i></i></label><span></span></div><div class="sliderbg" align="center"><div align="center" class="slider" id="intensity' + group.num + '"></div></div></div>');
				$('body').append('<script>$(function() {$("#intensity' + group.num + '").slider({orientation: "horizontal",range: "min", min: 0, max: 100, value: 100,  step: 1,slide: function(change, ui) {$("#intensityAmount' + group.num + '").val(ui.value);INTthrottled' + group.num + '(ui.value);},stop: function(change, ui) {$("#intensityAmount' + group.num + '").val(ui.value);INTthrottled' + group.num + '(ui.value);},change: function(change, ui) {$("#intensityAmount' + group.num + '").val(ui.value);INTthrottled' + group.num + '(ui.value);}});$("#intensityAmount' + group.num + '").val($("#intensity' + group.num + '").slider("value"));});function sendINT' + group.num + '(int) {if (intBlock) {} else {var newInt = parseInt(int,10) /100;Query.master_intensity({"num":' + group.num + ', "level": newInt });}}var INTthrottled' + group.num + ' = $.throttle(100, sendINT' + group.num + '); </script>');
				grCount++;
			}
		});
	});
}

function updateTimelines(callback) {
	Query.get_timeline_info(function(t) {
		function predicatBy(prop) {
			return function(a, b) {
				if (a[prop] > b[prop]) {
					return 1;
				} else if (a[prop] < b[prop]) {
					return -1;
				}
				return 0;
			};
		}
		t.timelines.sort(predicatBy("num"));
		var tlNum = Object.keys(t.timelines).length;
		if (tlNum === 0) {
			setTimeout(function() {
				if ($('.systemStatusTimelines').html() === "") {
					$('.systemStatusTimelines').html('<div class="noStatus">There are no timelines available.</div>');
				}
			}, 200);
		} else {
			$('.systemStatusTimelines').html("");
			for (var p = 0; p < tlNum; p++) {
				var myLocation = t.timelines[p].custom_properties['Zone'];
				if (myLocation === "undefined" || typeof myLocation === "undefined") {
					var myLoc = ""
				} else {
					var myLoc = t.timelines[p].custom_properties['Zone'];
				}
				var myLength = msToTime(t.timelines[p].length);
				var myTlState = t.timelines[p].state.replace(/\_/g, ' ');
				if (t.timelines[p].group == "") {
					if ((t.timelines[p].onstage == true && t.timelines[p].state == "running") || (t.timelines[p].onstage == true && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="showName">' + t.timelines[p].name + '</div><div class="groupLocation">' + myLoc + '</div><div class="groupName">UNGROUPED</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					} else if ((t.timelines[p].onstage == false && t.timelines[p].state == "running") || (t.timelines[p].onstage == false && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.timelines[p].name + '</div><div class="groupLocation">' + myLoc + '</div><div class="groupName">UNGROUPED</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					}
				} else {
					if ((t.timelines[p].onstage == true && t.timelines[p].state == "running") || (t.timelines[p].onstage == true && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="showName">' + t.timelines[p].name + '</div><div class="groupLocation">' + myLoc + '</div><div class="groupName">Group ' + t.timelines[p].group + '</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					} else if ((t.timelines[p].onstage == false && t.timelines[p].state == "running") || (t.timelines[p].onstage == false && t.timelines[p].state == "holding_at_end")) {
						$('.systemStatusTimelines').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.timelines[p].num + '</div><div class="label">TIMELINE</div></div></div><div class="showContainer"><div id="show' + t.timelines[p].num + '" class="showInfo"><div class="showStatus">' + myTlState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.timelines[p].name + '</div><div class="groupLocation">' + myLoc + '</div><div class="groupName">Group ' + t.timelines[p].group + '</div></div></div>');
						$('#timeline' + t.timelines[p].num).addClass('active');
					}
				}
			}
		}
	});
	callback();
}

function updateScenes(callback) {
	Query.get_scene_info(function(t) {
		function predicatBy(prop) {
			return function(a, b) {
				if (a[prop] > b[prop]) {
					return 1;
				} else if (a[prop] < b[prop]) {
					return -1;
				}
				return 0;
			};
		}
		//Usage
		console.log(t);
		t.scenes.sort(predicatBy("num"));
		var scNum = Object.keys(t.scenes).length;
		if (scNum === 0) {
			setTimeout(function() {
				if ($('.systemStatusScenes').html() === "") {
					$('.systemStatusScenes').html('<div class="noStatus">There are no scenes available.</div>');
				}
			},200);
		} else {
			$('.systemStatusScenes').html("");
			for (var p = 0; p < scNum; p++) {
				if (t.scenes[p].num >= sLimit) {} else {
					var myLocation = t.scenes[p].custom_properties['Zone'];
					console.log(myLocation);
					if (myLocation === "undefined" || typeof myLocation === "undefined") {
						var myLoc = ""
					} else {
						var myLoc = t.scenes[p].custom_properties['Zone'];
					}
					var myLength = msToTime(t.scenes[p].length);
					var myScState = t.scenes[p].state.replace(/\_/g, ' ');
					var thisNum = t.scenes[p].num;
					var thisStr = thisNum.toString();
					var myNum = thisStr.padStart(4, '0');
	//				if (t.scenes[p].group == "") {
	//					//do nothing
	//				} else {
						if ((t.scenes[p].onstage == true && t.scenes[p].state == "started")) {
							$('.systemStatusScenes').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.scenes[p].num + '</div><div class="scLabel">SCENE</div></div></div><div class="showContainer"><div id="show' + t.scenes[p].num + '" class="showInfo"><div class="showStatus">' + myScState + '</div><div class="showName">' + t.scenes[p].name + '</div><div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div><div class="groupName">Group ' + t.scenes[p].group + '</div></div></div>');
						} else if ((t.scenes[p].onstage == false && t.scenes[p].state == "started")) {
							$('.systemStatusScenes').append('<div class="statusContainer"><div class="timelineNumContainer"><div class="groupInfo"><div class="timelineNum">' + t.scenes[p].num + '</div><div class="scLabel">SCENE</div></div></div><div class="showContainer"><div id="show' + t.scenes[p].num + '" class="showInfo"><div class="showStatus">' + myScState + '</div><div class="inactive">INACTIVE</div><div class="showName">' + t.scenes[p].name + '</div><div class="groupLocation">' + t.scenes[p].custom_properties['Zone'] + '</div><div class="groupName">Group ' + t.scenes[p].group + '</div></div></div>');
						//}
					}
				}
			}

		}
	});
	callback();
}

function updateScroll() {
	console.log("update Scroll");
	var myScrollHeight = $(".systemStatus").prop('scrollHeight');
	var newScrollHeight = parseInt(myScrollHeight, 10) - 20;
		var myHeight = $(".systemStatus").height();
		console.log("scroll = " + myScrollHeight + " height = " + myHeight);
	if (newScrollHeight > myHeight) {
		$('.systemStatusContainer .subLabel').html("(Scroll)");

	} else {
		$('.systemStatusContainer .subLabel').html("");
	}
	if ($("#page3 .selectGroups").prop('scrollHeight') > $("#page3 .selectGroups").height()) {
		$('#page3 .subLabel').html("(Scroll)");
	} else {
		$('#page3 .subLabel').html("");
	}
	if ($(".groupStatus").prop('scrollHeight') > $(".groupStatus").height()) {
		$('.groupStatusContainer .subLabel').html("(Scroll)");
	} else {
		$('.groupStatusContainer .subLabel').html("");
	}
	setTimeout(function() {
		if ($('.systemStatusTimelines').html() === "" && $('.systemStatusScenes').html() === "") {
			$('.systemStatus').html('<div class="noStatus">There are no currently active timelines or scenes.</div><div class="systemStatusTimelines"></div><div class="systemStatusScenes"></div>');
			$('.systemStatusContainer .subLabel').html("");
		} else {
			$('.noStatus').remove();

		}
	}, 200);
}

function loop(obj, ul) {
	$.each(obj, function(key, val) {
		if (val && typeof val === "object") { // object, call recursively
			var ul2 = $("<h2>").appendTo($("<div>").appendTo(ul));
			loop(val, ul2);
		} else {
			$("<h1>", {}).text(key).appendTo(ul);
			$("<div>", {
				id: key
			}).text(val).appendTo(ul);
		}
	});
}

function triggers() {
	Query.get_trigger_info(function(t) {
		var trNum = Object.keys(t.triggers).length;
		if (trNum === 0) {
			$('#mainTriggers,  #page2, #triggers').remove();
		} else {
			$('aside').html("");
			for (var k = 0; k < trNum; k++) {
				if (t.triggers[k].name === "") {
					var myTriggerName = "Trigger " + t.triggers[k].num;
				} else {
					var myTriggerName = t.triggers[k].name;
				}
				if ($(window).width() < 391) {
					var myTitle = myTriggerName;
					var truncated = myTitle.substr(0, 15);
					//Updating with ellipsis if the string was truncated
					var shortText = truncated + (truncated.length < 15 ? '' : '...');
				} else {

				var trWidth = parseInt($('.accordion').width(),0) - 80;
					var charLength = Math.ceil(parseInt(trWidth, 0) * .07);
			console.log("charlength = " + charLength);
					var myTitle = myTriggerName;
					var truncated = myTitle.substr(0, charLength);
					//Updating with ellipsis if the string was truncated
					var shortText = truncated + (truncated.length < charLength ? '' : '...');
				}

				$('aside').append('<h1 id="trTitle' + k + '" class="trTitle" onClick="triangle(' + t.triggers[k].num + ')" style="background-color:' + t.triggers[k].group + ';"><span class="tri' + t.triggers[k].num + ' triangle"></span>&nbsp;' + shortText + '<span id="trigger' + t.triggers[k].num + '" class="tBtn" onClick="fireTrigger(' + t.triggers[k].num + ')">RUN</span></h1><div id="triggerCon' + t.triggers[k].num + '" class="triggerCon"><h2 id="conTitle' + t.triggers[k].num + '" class="conTitle">CONDITIONS</h2><div id="tCon' + t.triggers[k].num + '" class="conCon"></div><h2 id="actTitle' + t.triggers[k].num + '" class="actTitle">ACTIONS</h2><div id="tAct' + t.triggers[k].num + '" class="actCon"></div>');
				var trCon = Object.keys(t.triggers[k].conditions).length;
				if (trCon > 0) {
					for (var l = 0; l < trCon; l++) {
						if (t.triggers[k].conditions[l].text !== null) {
							$('#tCon' + t.triggers[k].num).append('<h3 class="conditions">' + t.triggers[k].conditions[l].text + '</h3>');
						}
					}
				} else {
					$('#conTitle' + t.triggers[k].num).remove();
					$('#tCon' + t.triggers[k].num).remove();
				}
				var trAct = Object.keys(t.triggers[k].actions).length;
				if (trAct > 0) {
					for (var m = 0; m < trAct; m++) {
						if (t.triggers[k].actions[m].text !== null) {
							$('#tAct' + t.triggers[k].num).append('<h3 class="actions">' + t.triggers[k].actions[m].text + '</h3>');
						}
					}
				} else {
					$('#trigger' + t.triggers[k].num).parent().remove();
				}
				var grpColor = t.triggers[k].group;
				if (grpColor === "") {
					$('#trTitle' + k).addClass("ungrouped");
				} else if (grpColor === "#e18383") {
					$('#trTitle' + k).addClass("a");
				} else if (grpColor === "#edb283") {
					$('#trTitle' + k).addClass("b");
				} else if (grpColor === "#f3dd75") {
					$('#trTitle' + k).addClass("c");
				} else if (grpColor === "#80ca80") {
					$('#trTitle' + k).addClass("d");
				} else if (grpColor === "#83c2c3") {
					$('#trTitle' + k).addClass("e");
				} else if (grpColor === "#b47cb4") {
					$('#trTitle' + k).addClass("f");
				}
			}
		}
	});
}

function systemInfo() {
	Query.get_system_info(function(system) {
		var capacity = system.channel_capacity;
		var hardwareType = system.hardware_type;
		var serialNum = system.serial_number;
		var firmware = system.firmware_version;
		var resetReason = system.reset_reason;
		$(".systemInfo").append("<div class='data row'>Hardware Type:</div> <div class='data row'>" + hardwareType + "</div><div  class='data row'>Capacity:</div><div class='data row'> " + capacity + "</div><div class='data row'>Serial Number:</div><div class='data row'> " + serialNum + "</div><div class='data row'>Firmware: </div><div class='data row'>" + firmware + "</div><div class='data row'>Reset Reason:</div><div class='data row'> " + resetReason + "</div>");
		controllerType = system.hardware_type;
	});
}

function projectInfo(callback) {
	Query.get_project_info(function(project) {
		var name = project.name;
		if (name === "") {
			name = "--";
		}
		var author = project.author;
		if (author === "") {
			author = "--";
		}
		var fileName = project.filename;
		if (fileName === "") {
			fileName = "--";
		}
		var uploadDate = project.upload_date.split("T");
		$(".projectInfo").append("<div class='projectInfoContent'><div class='row'>Project Name:</div><div class='row'>" + name + "</div><div class='row'>Author: </div><div class='row'>" + author + "</div><div class='row'>Filename:</div><div class='row'>" + fileName + "</div><div class='row'>Upload Date: </div><div class='row'>" + uploadDate[0] + " " + uploadDate[1] + "</div></div>");
	});
	callback();
}

function controllerInfo() {
	Query.get_controller_info(function(controller) {
		var controllerName = controller.controllers[0].name;
		$(".projectInfoContent").append("<div class='row'>Controller Name: </div><div class='row'>" + controllerName + "</div>");
	});
}
//  Calling functions to build pages
timelines();
scenes();
groups();
triggers();
systemInfo();
updateScroll();
projectInfo(function() {
	controllerInfo();
});
// Subscription to update scene buttons
Query.subscribe_scene_status(function(r) {
	var myState = r.state.replace(/\_/g, ' ');
	if (r.state === "started") {
		$('#scene' + r.num).addClass('active');
		$('#scShow' + r.num + ' .showStatus').html(myState);
	} else {
		$('#scene' + r.num).removeClass('active');
	}
	updateScenes(function() {
		updateScroll();
	});
});
Query.subscribe_timeline_status(function(q) {
	var myState = q.state.replace(/\_/g, ' ');
	if (q.state === "holding_at_end" || q.state === "running") {
		$('#timeline' + q.num).addClass('active');
		$('#tlShow' + q.num + ' .showStatus').html(myState);
	} else {
		$('#timeline' + q.num).removeClass('active');
	}
	updateTimelines(function() {
		updateScroll();
	});
});
Query.subscribe_group_status(function(g) {
	var myHash = location.hash;
	enableIntBlock();
	if (g.num >= gLimit) {} else {
		if (myHash === "#info") {
			var myVal = $('#slider' + g.num).slider("option", "value");
			if (myVal === g.level) {
				//do nothing
			} else {
				$('#slider' + g.num).slider("option", "value", g.level).slider("option", "animate", false);
				$('#amount' + g.num + ', #intensityAmount' + g.num).val(g.level);
			}
			if (g.level == 0) {$('#groupSwitch' + g.num).prop('checked', false);}else{$('#groupSwitch' + g.num).prop('checked', true);}
		} else if (myHash === "#page6") {
			var myVal2 = $('#intensity' + g.num).slider("option", "value");
			if (myVal2 === g.level) {
				//do nothing
			} else {
				$('#intensity' + g.num).slider("option", "value", g.level).slider("option", "animate", false);
				$('#intensityAmount' + g.num).val(g.level);
			}
			if (g.level == 0) {$('#intensitySwitch' + g.num).prop('checked', false);}else{$('#intensitySwitch' + g.num).prop('checked', true);}
		} else if (myHash === "#page4") {
			//		if($('.zoneLevel').val() === g.levels) {
			//
			//			//do nothing
			//		} else {
			$('.zoneLevel' + g.num).text(g.level + "%");
			if (g.level == 0) {$('#intSwitch' + g.num).prop('checked', false);}else{$('#intSwitch' + g.num).prop('checked', true);}
			//}
		} else if (myHash === "#dimmer") {
			$('#dimmer .dial').val(g.level + "%").trigger("change")
		}
	}
});
// Function that starts timelines
function start_timeline(num) {
	if ($('#timeline' + num).hasClass("active")) {
		Query.release_timeline({
			"num": num
		});
	} else {
			if ($('#tlRelSwitch').is(":checked") && ($('#timeline' + num).parent().prev().text() != "Ungrouped")) {
				var thisGroup = $('#timeline' + num).parent().prev().text();
				Query.release_all_timelines({
					"fade": 2,
					"group": thisGroup
				});
				setTimeout(function() {
					Query.start_timeline({
						"num": num
					});
				}, 100);
				//}
			} else {
				Query.start_timeline({
					"num": num
				});
			}
	}
}
// Function that starts scenes
function start_scene(num) {
	if ($('#scene' + num).hasClass("active")) {
		Query.release_scene({
			"num": num
		});
	} else {
		if ($('#scRelSwitch').is(":checked") && ($('#scene' + num).parent().prev().text() != "Ungrouped")) {
			var thisGroup = $('#scene' + num).parent().prev().text();
			Query.release_all_scenes({
				"fade": 2,
				"group": thisGroup
			});
			Query.start_scene({
				"num": num
			});
		} else {
			Query.start_scene({
				"num": num
			});
		}
	}
}

function setGroup(num) {
	if (num === 0) {
		if ($('.allBtn').hasClass('active')) {
			$('.allBtn').removeClass('active');
			selectedGroup = "";
		} else {
			$('.group').removeClass('active');
			$('.allBtn').addClass('active');
			selectedGroup = 0;
		}
	} else {
		if ($('#group' + num).hasClass('active')) {
			$('#group' + num).removeClass('active');
			selectedGroup = "";
		} else {
			$('.group').removeClass('active');
			$('#group' + num).addClass("active");
			selectedGroup = num;
		}
	}
	console.log('selected group' + selectedGroup);
}

function fireTrigger(num) {
	if (testConditions) {
		Query.fire_trigger({
			"num": num,
			"conditions": true
		});
		alert("Trigger Number " + num + " was run with conditions tested.");
		//		myFadeOut('.triggerAlert', function() {
		//
		//				myFadeIn('.triggerAlert',num);
		//
		//
		//		});
	} else {
		Query.fire_trigger({
			"num": num,
			"conditions": false
		});
		alert("Trigger Number " + num + " was run without conditions tested.");
	}
}
// Function for the off button
function off() {
	lastHash = location.hash;
	document.location = "index.html#allOffPage";
	$('.footer').hide();
}
//accordion functions
function header(num) {
	//$('.accSub'+ num).slideUp("fast");
	if (num === 0) {
		$('.tlRel .relSwitch').addClass("ui-state-disabled");
	} else {
		$('.tlRel .relSwitch').removeClass("ui-state-disabled");
	}
	if ($(".accTop" + num).next().is(":visible")) {
		$(".accTop" + num).next().slideUp("fast");
	} else {
		$(".accTop" + num).next().slideDown("fast").css('display', 'block');
	}
}

function accSCsub(num) {
	//$('.accSCsub').slideUp("fast");
	if (num === 0) {
		$('.scRel .relSwitch').addClass("ui-state-disabled");
	} else {
		$('.scRel .relSwitch').removeClass("ui-state-disabled");
	}
	if ($(".accSCtop" + num).next().is(":visible")) {
		$(".accSCtop" + num).next().slideUp("fast");
	} else {
		$(".accSCtop" + num).next().slideDown("fast").css('display', 'block');
	}
}

function intBox(num) {
	if (!$('#intSwitch' + num).is(':checked')) {
		$('#slider' + num).slider("option", "value", 0);
		$('.zoneLevel' + num).html("0%");
		Query.master_intensity({
			"num": num,
			"level": 0
		});
		//$('#zone' + num + " .status").html("OVERRIDDEN").addClass("overridden");
	} else {
		$('#slider' + num).slider("option", "value", 100);
		Query.master_intensity({
			"num": num,
			"level": 1
		});
		//$('#zone' + num + " .status").html("OVERRIDDEN").addClass("overridden");
		$('.zoneLevel' + num).html("100%");
	}
}

function groupBox(num) {
	if (location.hash === "#page6") {
		if (!$('#intensitySwitch' + num).is(':checked')) {
			$('#intensity' + num).slider("option", "value", 0);
			$('.zoneLevel' + num).html("0%");
			$('#groupSwitch' + num).prop("checked", false);
			Query.master_intensity({
				"num": num,
				"level": 0
			});
			//$('#zone' + num + " .status").html("OVERRIDDEN");
		} else {
			$('#groupSwitch' + num).prop("checked", true);
			$('#intensity' + num).slider("option", "value", 100);
			Query.master_intensity({
				"num": num,
				"level": 1
			});
			$('.zoneLevel' + num).html("100%");
			//$('#zone' + num + " .status").html("OVERRIDDEN");
		}
	} else {
		if (!$('#groupSwitch' + num).is(':checked')) {
			$('#slider' + num).slider("option", "value", 0);
			$('.zoneLevel' + num).html("0%");
			$('#intensitySwitch' + num).prop("checked", false);
			Query.master_intensity({
				"num": num,
				"level": 0
			});
			//$('#zone' + num + " .status").html("OVERRIDDEN");
		} else {
			$('#intensitySwitch' + num).prop("checked", true);
			$('#slider' + num).slider("option", "value", 100);
			Query.master_intensity({
				"num": num,
				"level": 1
			});
			$('.zoneLevel' + num).html("100%");
			$('.zoneLevel' + num).html("100%");
			//$('#zone' + num + " .status").html("OVERRIDDEN");
		}
	}
}

function trFilter(group, num) {
	var myGroup = ["ungrouped", "a", "b", "c", "d", "e", "f", "g"];
	var myChildren = $('.' + myFilter).next();
	if (group === 'g') {
		$('.trTitle').fadeIn(450);
		$('.filterBtn').removeClass("filterBtnActive");
		for (var f = 0; f <= 6; f++) {
			myFilter[f] = 0;
		}
	} else {
		if (!$('#' + group).hasClass("filterBtnActive")) {
			myFilter[num] = 1;
			$('#' + group).addClass("filterBtnActive");
		} else {
			myFilter[num] = 0;
			$('#' + group).removeClass("filterBtnActive");
		}
		$('.triggerCon').hide();
		for (var a = 0; a < 7; a++) {
			if (myFilter[a] === 0) {
				$('.' + myGroup[a]).hide();
			} else {
				$('.' + myGroup[a]).fadeIn(450);
			}
		}
		if (!$('#ungrouped').hasClass("filterBtnActive") && !$('#a').hasClass("filterBtnActive") && !$('#b').hasClass("filterBtnActive") && !$('#c').hasClass("filterBtnActive") && !$('#d').hasClass("filterBtnActive") && !$('#e').hasClass("filterBtnActive") && !$('#f').hasClass("filterBtnActive")) {
			$('#g').trigger("click");
		}
	}
};

function setIntGroup(num, name) {
	lastHash = location.hash;
	intGroup = num;
	document.location = "index.html#dimmer";
	$('#dimmer .intGroupName').html(name);
	var curLevel = $('.zoneLevel' + num).text().split("%");
	$('#dimmer .dial').val(curLevel[0] + "%").trigger("change");
}
$(document).ready(function() {

	$('.help').click(function() {
		lastHash = location.hash;
		document.location = "index.html#page5";
	});
	var myHash = location.hash;
	if (myHash === "#page0") {
		$('.footer').hide();
	} else {
		$('.footer').show();
	}
	$('.scenesContainer, .wpContainer').hide();
	// Help button functions
	$('.help').click(function() {
		$('.footerBtn').removeClass('footerBtn_active');
		$('.icon').removeClass('icon_active');
	});
	// Footer button function
	$('.footerBtn').click(function() {
		$(this).addClass('footerBtn_active');
		$(this).children('.icon').addClass('icon_active');
		$('.footerBtn').not(this).children('.icon').removeClass('icon_active');
		$('.footerBtn').not(this).removeClass('footerBtn_active');
	});
	$('.icon').click(function() {
		$(this).addClass('icon_active');
		$(this).parents('footerBtn').addClass('footerBtn_active');
		$('.icon').parents('footerBtn').not(this).removeClass('footerBtn_active');
		$('.icon').not(this).removeClass('icon_active');
	});
	$('.footerBtn').click(function() {
		$(this).addClass('footerBtn_active');
		$(this).children('icon').addClass('icon_active');
		$('.footerBtn').children('icon').not(this).removeClass('icon_active');
		$('.footerBtn').not(this).removeClass('footerBtn_active');
	});
	$('#home').click(function() {
		if ($(window).width() > 744 && $(window).height() > $(window).width()) {
			document.location = "index.html#info";
		} else if ($(window).width() > 1133) {
			document.location = "index.html#info";
		} else {
			document.location = "index.html#page0";
		}
	});
	$('#dimmers').click(function() {
		if ($(window).width() > 743 && $(window).height() > $(window).width()) {
			document.location = "index.html#page6";
		} else if ($(window).width() > 1132) {
			document.location = "index.html#page6";
		} else {
			document.location = "index.html#page4";
		}
	});
	$('.back').click(function() {
		document.location = "index.html" + lastHash;
	})
	$(window).on("orientationchange", function() {
		if (location.hash === "#info") {
			if ($(window).width() > 744 && $(window).height() > $(window).width()) {
				document.location = "index.html#info";
			} else if ($(window).width() > 1133) {
				document.location = "index.html#info";
			} else {
				document.location = "index.html#page0";
			}
		} else if (location.hash === "#page0") {
			if ($(window).width() > 744 && $(window).height() > $(window).width()) {
				document.location = "index.html#info";
			} else if ($(window).width() > 1133) {
				document.location = "index.html#info";
			} else {
				document.location = "index.html#page0";
			}
		}
		if (location.hash === "#page4") {
			if ($(window).width() > 743 && $(window).height() > $(window).width()) {
				document.location = "index.html#page6";
			} else if ($(window).width() > 1132) {
				document.location = "index.html#page6";
			} else {
				document.location = "index.html#page4";
			}
		} else if (location.hash === "#page6") {
			if ($(window).width() > 743 && $(window).height() > $(window).width()) {
				document.location = "index.html#page6";
			} else if ($(window).width() > 1132) {
				document.location = "index.html#page6";
			} else {
				document.location = "index.html#page4";
			}
		}
		setTimeout(function() {
			updateScroll();
		}, 200);
	});
	$(window).resize(function() {
		triggers();
		if (location.hash === "#info") {
			if ($(window).height() > 744 && $(window).height() > $(window).width()) {
				document.location = "index.html#info";
			} else if ($(window).width() > 1133) {
				document.location = "index.html#info";
			} else {
				document.location = "index.html#page0";
			}
		} else if (location.hash === "#page0") {
			if ($(window).width() > 744 && $(window).height() > $(window).width()) {
				document.location = "index.html#info";
			} else if ($(window).width() > 1133) {
				document.location = "index.html#info";
			} else {
				document.location = "index.html#page0";
			}
		}
		if (location.hash === "#page4") {
			if ($(window).width() > 743 && $(window).height() > $(window).width()) {
				document.location = "index.html#page6";
			} else if ($(window).width() > 1132) {
				document.location = "index.html#page6";
			} else {
				document.location = "index.html#page4";
			}
		} else if (location.hash === "#page6") {
			if ($(window).width() > 743 && $(window).height() > $(window).width()) {
				document.location = "index.html#page6";
			} else if ($(window).width() > 1132) {
				document.location = "index.html#page6";
			} else {
				document.location = "index.html#page4";
			}
		}
		setTimeout(function() {
			updateScroll();
		}, 200);
	});
	$(window).bind('hashchange', function() {
		if ($("#page3 .selectGroups").prop('scrollHeight') > $("#page3 .selectGroups").height()) {
			$('#page3 .subLabel').html("(Scroll)");
		} else {
			$('#page3 .subLabel').html("");
		}
		if ($(".systemStatus").prop('scrollHeight') > $(".systemStatus").height()) {
			$('.systemsStatusContainer .subLabel').html("(Scroll)");
		} else {
			$('.systemStatusContainer .subLabel').html("");
		}
		if ($(".groupStatus").prop('scrollHeight') > $(".groupStatus").height()) {
			$('.groupStatusContainer .subLabel').html("(Scroll)");
		} else {
			$('.groupStatusContainer .subLabel').html("");
		}
		var myHash = location.hash;
		if (myHash === "#login") {
			$('.footer').hide();
		}
		if (myHash === "#page0") {
			$('.footer').hide();
			if ($(window).width() > 744 && $(window).height() > $(window).width()) {
				document.location = "index.html#info";
			} else if ($(window).width() > 1133) {
				document.location = "index.html#info";
			} else {
				document.location = "index.html#page0";
			}
		}
		if (myHash === "#info") {
			$('.footer').css("opacity", 1).show();
			$('#home > div').addClass('footerBtn_active');
			$('#home > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#home > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#home > div').removeClass('footerBtn_active');
			if ($(window).width() > 744 && $(window).height() > $(window).width()) {
				document.location = "index.html#info";
			} else if ($(window).width() > 1133) {
				document.location = "index.html#info";
			} else {
				document.location = "index.html#page0";
			}
			updateDBSliders();
		} else if (myHash === "#page1") {
			$('.footer').css("opacity", 1).show();
			$('#playback > div').addClass('footerBtn_active');
			$('#playback > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#playback > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#playback > div').removeClass('footerBtn_active');
		} else if (myHash === "#page2") {
			$('.footer').css("opacity", 1).show();
			$('#triggers > div').addClass('footerBtn_active');
			$('#triggers > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#triggers > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#triggers > div').removeClass('footerBtn_active');
		} else if (myHash === "#page3") {
			$('.footer').css("opacity", 1).show();
			$('#pickers > div').addClass('footerBtn_active');
			$('#pickers > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#pickers > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#pickers > div').removeClass('footerBtn_active');
		} else if (myHash === "#page4") {
			$('.footer').css("opacity", 1).show();
			$('#dimmers > div').addClass('footerBtn_active');
			$('#dimmers > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#dimmers > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#dimmers > div').removeClass('footerBtn_active');
			if ($(window).width() > 743 && $(window).height() > $(window).width()) {
				document.location = "index.html#page6";
			} else if ($(window).width() > 1132) {
				document.location = "index.html#page6";
			} else {
				document.location = "index.html#page4";
			}
			updateZoneLevel();
		} else if (myHash === "#page5") {
			$('.footer').css("opacity", 1).show();
			$('.footerBtn').removeClass('footerBtn_active');
		} else if (myHash === "#page6") {
			$('.footer').css("opacity", 1).show();
			$('#dimmers > div').addClass('footerBtn_active');
			$('#dimmers > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#dimmers > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#dimmers > div').removeClass('footerBtn_active');
			if ($(window).width() > 743 && $(window).height() > $(window).width()) {
				document.location = "index.html#page6";
			} else if ($(window).width() > 1132) {
				document.location = "index.html#page6";
			} else {
				document.location = "index.html#page4";
			}
			updateIntensitySliders();
		} else if (myHash === "#allOffPage") {
			$('.footer').css("opacity", 1).show();
			$('.footer').addClass('ui-state-disabled');
			$('#allOff > div').children('.icon').addClass('icon_active');
			$('.footerBtn').not('#allOff > div').children('.icon').removeClass('icon_active');
			$('.footerBtn').not('#allOff > div').removeClass('footerBtn_active');
		}
	});
	$('#tlSwitch').on('click', function() {
		if ($(this).is(":checked")) {
			$('.tlSwitch .leftLabel').addClass('unchecked');
			$('.tlSwitch .rightLabel').removeClass('unchecked');
			$('.scenesContainer').show();
			$('.tlRel').hide();
			$('.scRel').show();
			$('.timelineContainer').hide();
			if ($('.accSCsub0').is(":visible")) {
				$('.relSwitch').addClass("ui-state-disabled");
			} else {
				$('.relSwitch').removeClass("ui-state-disabled");
			}
		} else {
			$('.tlSwitch .leftLabel').removeClass('unchecked');
			$('.tlSwitch .rightLabel').addClass('unchecked');
			$('.scenesContainer').hide();
			$('.timelineContainer').show();
			$('.tlRel').show();
			$('.scRel').hide();
			if ($('.accSub0').is(":visible")) {
				$('.relSwitch').addClass("ui-state-disabled");
			} else {
				$('.relSwitch').removeClass("ui-state-disabled");
			}
		}
	});
	$('#relSwitch').on('click', function() {
		if ($(this).is(":checked")) {
			$('.relSwitch .leftLabel').addClass('unchecked');
			$('.relSwitch .rightLabel').removeClass('unchecked');
		} else {
			$('.relSwitch .leftLabel').removeClass('unchecked');
			$('.relSwitch .rightLabel').addClass('unchecked');
		}
	});
	$('#cpSwitch').on('click', function() {
		if ($(this).is(":checked")) {
			$('.cpSwitch .leftLabel').addClass('unchecked');
			$('.cpSwitch .rightLabel').removeClass('unchecked');
			$('.wpContainer').show();
			$('.cpContainer').hide();
		} else {
			$('.cpSwitch .leftLabel').removeClass('unchecked');
			$('.cpSwitch .rightLabel').addClass('unchecked');
			$('.wpContainer').hide();
			$('.cpContainer').show();
		}
	});
	$('.cancel').click(function() {
		document.location = "index.html" + lastHash;
		$('.footer').removeClass("ui-state-disabled");
	});
	$('.release').click(function() {
		if ($('#allTlSwitch').is(":checked")) {
			var allTl = 1;
			Query.release_all_timelines({
				"fade": 2
			});
		}
		if ($('#allScSwitch').is(":checked")) {
			var allSc = 1;
			setTimeout(function() {
				Query.release_all_scenes({
					"fade": 2
				});
			}, 100);
		}
		if ($('#clearSwitch').is(":checked")) {
			var allClear = 1;
			setTimeout(function() {
				Query.clear_all_overrides({
					"fade": 2
				});
			}, 150);
		}
		document.location = "index.html" + lastHash;
		$('.footer').removeClass("ui-state-disabled");
		$('#clearSwitch, #allScSwitch, #allTlSwitch').prop('checked', false);
	});
	$('.clearBtn').click(function() {
		if (selectedGroup === ""){
		}else{
			Query.clear_group_overrides({
				"num": selectedGroup,
				"fade": 2
			});
			$('.clearBtn').addClass('active');
			setTimeout(function() {
				$('.clearBtn').removeClass('active');
			}, 350);
			$('#group' + selectedGroup).removeClass('active');
			selectedGroup = "";
		}
	});
	$('#conSwitch').change(function() {
		if ($('#conSwitch').is(":checked")) {
			testConditions = true;
		} else {
			testConditions = false;
		}
	})
});
