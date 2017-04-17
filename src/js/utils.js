var audio_cash = new Audio('audio/cash.mp3');
var audio_down = new Audio('audio/down.mp3');

function round(value, num){
	var factor = Math.pow(10, num);
	value = Number(value);
	return Number(parseFloat(Math.trunc(value*factor)/factor).toFixed(num));
}

function formatSeconds(value) {
    var sec_num = parseInt(value, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function timenow(){
    var now= new Date(), 
    h= now.getHours(), 
    m= now.getMinutes(), 
    s= now.getSeconds();
    if(h>= 12)
        if(h>12) h -= 12;

    if(m<10) m= '0'+m;
    if(s<10) s= '0'+s;
    return h + ':' + m + ':' + s;
}

function log(msg){
	console.log(timenow()+' - '+msg);
}

function copyObject(obj, newObj){
	for (var prop in obj) {
		if (obj.hasOwnProperty(prop))
			if (typeof obj[prop] === 'object')
			{
				if (newObj[prop] == undefined) newObj[prop] = {};
				newObj[prop] = copyObject(obj[prop], newObj[prop]);
			}
			else
				newObj[prop] = obj[prop];
	}	
	return newObj;
}

function print(id, data, sp_class){
	sp_class = sp_class || '';
	var el = document.getElementById(id).getElementsByTagName('TBODY')[0];
	
	if (data==undefined || data==null || data.length==0){ 
		el.innerHTML = '';
		return false;
	}	
	
	for (var i=0; i<data.length; i++){		
		var id  = data[i].id;
		var row = document.getElementById(id);
		
		if (!row){
			row = document.createElement('TR');
			row.id = id;
			el.appendChild(row);	
		}
		
		row.className = '';
		
		var obj = data[i];
		for (var prop in obj)
			if (prop != 'id' && prop!=sp_class){
				var value = obj[prop];
				
				var col = row.getElementsByClassName(prop)[0];
				
				if (!col){
					col = document.createElement('TD');
					col.className = prop;
					row.appendChild(col);
				}
					
				if (col.innerHTML != value)
					col.innerHTML = value;
			}
			
		if (sp_class!='') row.className = obj[sp_class];
		if (i%2==0) row.className += ' odd';
	}
	
	var els = el.getElementsByTagName('TR');
	for (var i=0; i<els.length; i++){
		var rec = data.find(a => a.id==els[i].id);
		if (!rec)
			els[i].remove();
	}
}