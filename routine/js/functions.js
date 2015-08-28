(function(){
init= function(){
	
    if(!window.localStorage){
        alertMsg('App is incompatible with your device', '');
    } else if(window.localStorage && window.localStorage.getItem('config') === null){
		$('img#configuration').addClass('active');
		$('#routine').hide();
		$('#about').hide();
		//Display config only
		
        alertMsg("Please configure your class", '');
        // promt to configure class
        // if yes store routine in localstorage
        // init routine
		
        loadConfig();
		
    } else {
		$('img#routine-schedule').addClass('active');
		$('form#config').hide();
		$('#about').hide();
        // init routine
        initRoutine();
	
		//Add menus and fix height for touch scroll
		addNavMenu();
        // check for routine update
        checkUpdate();
		
		//Display routine directly
    }
}

function alertMsg(msg, fn){
    alert(msg);
}

function loadConfig(){
    spin();
    var url = prepareURL('config', '{}', '', '{"_id":0}');
    $.ajax({
        url: url,
        type: "GET",
        data: "json"
    })
    .done(function(data){
        hideSpin();
        var college = '';
        var major = '';
        var year = '';
        var section = '';
        if(window.localStorage && window.localStorage.getItem('config') !== null){
            var config = JSON.parse(window.localStorage.config);
            college = config.collegeCode;
            major = config.majorCode;
            year = config.yearCode;
            section = config.sectionCode;
        }else{
            college = 'KEC';
            major = 'BCT';
            year = 'IV';
            section = 'A';            
        }
        data = data[0];
        addOptions('college', college, data.collegeCode);
        addOptions('major', major, data.majorCode);
        addOptions('year', year, data.yearCode);
        addOptions('section', section, data.sectionCode);
    })
    .fail(function(jqXHR, textStatus){
    	hideSpin();
        alertMsg("Could not compelete your request :( " + textStatus, '')
    });
}

function addOptions(id, select, options){
	$('#'+id).find('option').remove();
    $('#'+id).append('<option>Select</option>'); 
    $.each(options, function(index, value){
        var str;
        if(select == value){
            str = '<option selected></option>';
        }else{
            str = '<option></option>';
        }
        $('#'+id).append(
            $(str).val(value).html(value)
        ); 
    });
}

function hideSpin(){
	$('#container').hide();
	$('#config input[type="button"]').prop('disabled', false);
}

function spin(){
	$('#container').show();
	//$('#container').html( '<div id="loader"></div>' );
	$('#config input[type="button"]').prop('disabled', true);
	var opts = {
		lines: 9, // The number of lines to draw
		length: 0, // The length of each line
		width: 16, // The line thickness
		radius: 31, // The radius of the inner circle
		corners: 1, // Corner roundness (0..1)
		rotate: 11, // The rotation offset
		direction: 1, // 1: clockwise, -1: counterclockwise
		color: '#3498DB', // #rgb or #rrggbb
		speed: 1, // Rounds per second
		trail: 61, // Afterglow percentage
		shadow: false, // Whether to render a shadow
		hwaccel: false, // Whether to use hardware acceleration
		className: 'spinner', // The CSS class to assign to the spinner
		//zIndex: 2e9, // The z-index (defaults to 2000000000)
		top: 'auto', // Top position relative to parent in px
		left: 'auto' // Left position relative to parent in px
	};
	var target = document.getElementById('container');
	var spinner = new Spinner(opts).spin(target);
}

function prepareURL(collection, q, c, f){
    f = (f.length == 0) ? '{"day":1,"subject":1,"teacherCode":1,"room":1,"startTime":1,"endTime":1}' : f;
    collection = (collection.length == 0) ? 'routine' : collection;
    c = (c.length == 0) ? 'false' : c;
 
    var url;
    url  = 'http://getroutine.appspot.com/?';
    url += 'collection='+collection+'&';
    url += 'f='+f+'&';
    url += 'q='+q+'&';
    url += 'c='+c+'&';
    return url;
}

checkRoutine = function(){
// check routine 
	spin();
    var q  = '{';
        q += '"collegeCode":"'+$("#college").val()+'",';
        q += '"sectionCode":"'+$("#section").val()+'",';
        q += '"majorCode":"'  +$("#major").val()+'",';
        q += '"yearCode":"'   +$("#year").val()+'"';
        q += '}';
    var url = prepareURL('', q, 'true', '');

    $.ajax({
        url: url,
        type: "GET",
        data: "json"
    })
    .done(function(data){
        if(data <= 0){
        	hideSpin();
            alertMsg("Sorry! routine not available for your class :(",'');
        }else{
            var configuration = {
                "collegeCode" : $("#college").val(), 
                "majorCode"   : $("#major").val(),
                "yearCode"    : $("#year").val(),
                "sectionCode" : $("#section").val()
            }
            window.localStorage.config = JSON.stringify(configuration);

            cacheRoutine();
        }
    })
    .fail(function(jqXHR, textStatus){
    	hideSpin();
        alertMsg("Could not connect: " + textStatus, '')
    });
}

function cacheRoutine(){
// cache routine
    var q = window.localStorage.config;

    var url = prepareURL('', q, '', '');
    $.ajax({
        url: url,
        type: "GET",
        data: "json"
    })
    .done(function(data){
        // sort routine
        data.sort(function(a, b) { 
            return a._id - b._id;
        }); 

        window.localStorage.routine = JSON.stringify(data);
        changeLastUpdate();
    })
    .fail(function(jqXHR, textStatus){
    	hideSpin();
        alertMsg("Could not save your routine :( " + textStatus, '')
    });
}

function changeLastUpdate(){
// change last update
    var q = window.localStorage.config;

    var url = prepareURL('updates', q, '', '{"_id":0,"lastUpdate":1}');
    $.ajax({
        url: url,
        type: "GET",
        data: "json"
    })
    .done(function(data){
        window.localStorage.lastUpdate = JSON.stringify(data);
        hideSpin();
		alertMsg("Routine updated :)", '');      
		//initRoutine();
		location.reload();
    })
    .fail(function(jqXHR, textStatus){
        //alertMsg("Request failed: " + textStatus, '')
    });

}

function checkUpdate(){
    var q = window.localStorage.config;

    var url = prepareURL('updates', q, '', '{"_id":0,"lastUpdate":1}');
    $.ajax({
        url: url,
        type: "GET",
        data: "json"
    })
    .done(function(dbLastUpdate){
        var localLastUpdate = JSON.parse(window.localStorage.lastUpdate);
        localLastUpdate = localLastUpdate[0].lastUpdate; 

        //dbLastUpdate = JSON.parse(dbLastUpdate);
        dbLastUpdate = dbLastUpdate[0].lastUpdate; 

        if(localLastUpdate != dbLastUpdate){
        	spin();
        	cacheRoutine();
        }
    })
    .fail(function(jqXHR, textStatus){
    		hideSpin();
//        alertMsg("Could not update Routine: " + textStatus, '')
    });
}

function getSystemDay(){
    var systemDate = new Date();
    var systemDay = systemDate.getDay();
    //systemDay = 2;
    return systemDay;
}

function getSystemTimeInSec(){
    var systemDate = new Date();
    var systemTimeInSec = systemDate.getHours()*3600 + systemDate.getMinutes()*60 + systemDate.getSeconds();
    //systemTimeInSec = 13*3600+12*60+12;
    return systemTimeInSec;
}


function initRoutine(){
    // bring routine
    var routine = JSON.parse(window.localStorage.routine);
    
    // prep routine
    var days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    var systemDay = getSystemDay();
    var systemTimeInSec = getSystemTimeInSec();

    var row = 0;
	
    for(periods in routine){
        var period = routine[periods];
        var periodDay = parseInt(period.day); 
        var periodDivId = days[periodDay];
        var dispStr =	'<div class="period">'+
                        '<div class="duration">' + (time(period.startTime)+'-'+time(period.endTime))+'</div>'+
						'<div class="subject"> ' + period.subject+ '<span class="teacher">  ' + ((period.teacherCode.length !=0) ? ('('+period.teacherCode+')') : '') +' </span></div>'+
                        //'<div class="teacher">' + ((period.teacherCode.length !=0) ? ('('+period.teacherCode+')') : '') + '</div>'+
                       '<div class="teacher"><span class="no">' + ((period.room.length !=0) ? ('[ '+period.room+' ]') : '')+'</span></div>'+
						'</div>';
        $("#"+periodDivId +" .routine-body").append("<div id=\"row"+row+"\" class=\"routine-item\">"+dispStr+"</div>");
        row++;
    }
	
	$.each(days, function(i){
		if($('#'+days[i] +' .routine-body').html() ===''){
			$('#'+days[i] +' .routine-body').html(
				'<div class="no-class">No Classes!!!</div>'
			)
		};
	});
    // jump to day routine

	
    // write desc
    // write last update
    var lastUpdate = JSON.parse(window.localStorage.lastUpdate);
    lastUpdate = lastUpdate[0].lastUpdate; 
    var d = new Date(lastUpdate);
    $("#lastupdate").html('Last Update:' +d.toLocaleString());

    // write class desc
    var config = JSON.parse(window.localStorage.config);
    $("#class").html(config.collegeCode + ' / ' + config.majorCode + ' ' + config.sectionCode + ' / ' + config.yearCode);



    // start timer 
    var clock=setInterval(
        function(){
            timer();
        },1000);

}

function timer(){
    // bring routine
    var routine = JSON.parse(window.localStorage.routine);

    var systemDay = getSystemDay();
    var systemTimeInSec = getSystemTimeInSec();
	var days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    var row = 0;
	$('#remaining-time').html('');
    for(periods in routine){
        var period = routine[periods];
        var periodDay = parseInt(period.day);

       if(periodDay == systemDay){
            if(systemTimeInSec>timeInSec(period.startTime) && systemTimeInSec<=timeInSec(period.endTime)){
                var remainingTime = (period.endTime.hh*3600 + period.endTime.mm*60) - systemTimeInSec;
                $("#remaining-time").html('<div class="remaining-time-body">' +'<div id="subject">' + period.subject + " </div> " + formattedTime(remainingTime) + '</div>');
                $("#row"+row).addClass("routine-item active");
            }else if(systemTimeInSec>=timeInSec(period.startTime) && systemTimeInSec>=timeInSec(period.endTime)){
                $("#row"+row).addClass("routine-item over");
            }
       }
       row++;
    }
	var dayRoutine = $("#"+days[systemDay] + " .routine-body");
	if(dayRoutine.children('.over').length === dayRoutine.children().length){
		$('#landing-page-wrapper').remove();
	}
}

function formattedTime(secs){
    hrs = parseInt(secs / 3600);
    secs = secs - hrs*3600;
    mins = parseInt(secs / 60);
    secs = secs % 60;
    
    hrs = hrs > 12 ? hrs-12 : hrs;
    hrs = ''+hrs;
    mins = ''+mins;
    secs = ''+secs;
    
    hrs = hrs.length==1 ? '0'+hrs : hrs;
    mins = mins.length==1 ? '0'+mins : mins;
    secs = secs.length==1 ? '0'+secs : secs;

    return '<div id="time"><span id="hours">'+hrs + '</span>' + ' : ' + '<span id="minutes">' + mins + '</span>' + ' : ' + '<span id="seconds">' + secs + '</span></div>';
}

function timeInSec(tt){
    return tt.hh*60*60 + tt.mm*60;
} 

function time(tt){
    var ampm;
    var hh = ''+((tt.hh<=12) ? tt.hh : tt.hh-12);
    hh = (hh.length==1) ? '0'+hh : hh;
    var mm = ''+tt.mm;
    mm = (mm.length==1) ? '0'+mm : mm;
    ampm = (tt.hh < 12) ? 'AM' : 'PM';
    return hh + ':' + mm + ' ' + ampm;
}




function addNavMenu(){
	var $routine = $('#routine'),
		$config = $('form#config'),
		$about = $('#about'),
		$configuration = $('img#configuration'),
		$information = $('img#information'),
		$routineSchedule = $('img#routine-schedule');
	
	var arr = [$configuration, $information, $routineSchedule],
		containers = [$config, $about, $routine];
		
	/*var routineHeight = $routine.height(),
		topRoutineOffset = $routine.offset().top,
		viewHeight = $(window).height(),
		viewHeightRoutine = topRoutineOffset - viewHeight;
	*/
	var routineHeight = $routine.height();
	var days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
	
	var array = new Array();
	var  allRoutine = $('.main-routine');
	
	$.each(allRoutine, function(){array.push($(this).height() + 50);});
	
	$('#slide-wrapper').height(Math.max.apply(this, array));
	
	$.each(arr, function(i){
		arr[i].click(function(){
			if(!arr[i].hasClass('active')){
				$.each(arr, function(j){
					if(i != j){
						if(arr[j].hasClass('active')){
							arr[j].removeClass('active');
							containers[j].hide();
						}
					}
				});
				containers[i].show();
				arr[i].addClass('active');
                if(i == 0){
                    loadConfig();
                }
			}
		});
	});
	
}

})();
