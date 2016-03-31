/***** Begin ECMAScript 5 ISO Support - MIT License ***************************

Copyright (c) 2009 - Michael J. Ryan (http://tracker1.info)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

===============================================================================

This script implements the support for ISO-Style date parsing in a new Date() 
as well as support for Date.prototype.toISOString().

There is also an additional Date.fromISOString definition for use as needed.

******************************************************************************/
(function(){

	//create handle to the original date object class
	var OriginalDate = Date;
	
	//method to handle conversion from an ISO-8601 style string to a Date object
	function DateFromISOString(input) {
		var iso8601Format = /^(\d{4})-(\d{2})-(\d{2})((([T ](\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?)?)?)?(([-+])(\d{2}):(\d{2}))?(Z)?$/;
		
		//normalize input
		var input = input.toString().replace(/^\s+/,'').replace(/\s+$/,'');
		
		if (!iso8601Format.test(input))
			return null; //invalid format

		var d = input.match(iso8601Format);
		var offset = 0;
	    
		var date = new OriginalDate(Number(d[1]), 0, 1);
		date.setMonth(Number(d[2] - 1));
		date.setDate(Number(d[3]));
		if (d[7]) { date.setHours(Number(d[7])); }
		if (d[8]) { date.setMinutes(Number(d[8])); }
		if (d[10]) { date.setSeconds(Number(d[10])); }
		if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
		
		//specific offset from zulu - use it and account for local offset
		if (d[13]) {
			offset = (Number(d[15]) * 60) + Number(d[16]);
			offset *= ((d[14] == '-') ? 1 : -1);
			offset -= date.getTimezoneOffset();
		}
		//otherwise, if zulu, localize offset
		else if (d[17] == 'Z') { offset -= date.getTimezoneOffset(); }

		var time = date.getTime() + (offset * 60000);
		date.setTime(time);
		return date;
	}
	
	//parsing of ISO dates ex: new Date('1970-01-01T00:00:00.000Z');
	if (isNaN(new Date("1970-01-01T00:00:00.000Z"))) {
		//wrap the Date implementation around the original to support a new Date from an ISO-8601 style string
		Date = function() {
			switch(arguments.length) {
				case 0: return new OriginalDate();
				case 1: 
					//handle iso date input, or delegate to original
					return DateFromISOString(arguments[0]) || new OriginalDate(arguments[0]);
				case 2: return new OriginalDate(arguments[0], arguments[1]);
				case 3: return new OriginalDate(arguments[0], arguments[1], arguments[2]);
				case 4: return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3]);
				case 5: return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
				case 6: return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
				case 7: return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6]);
				case 8: return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7]);
				case 9: return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8]);
				default: //max of 10 arguments supported
					return new OriginalDate(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], arguments[5], arguments[6], arguments[7], arguments[8], arguments[9]);
			}
		}
		
		//Clone methods on OriginalDate
		for (var x in OriginalDate)
			if (typeof OriginalDate[x] == 'function' && typeof Date[x] == 'undefined')
				Date[x] = OriginalDate[x];
				
		//Mark prototype for inheritance
		OriginalDate.prototype.constructor = Date;
		Date.prototype = OriginalDate.prototype;
	}

	//Implement ECMAScript 5's Date.prototype.toISOString
	if (typeof Date.prototype.toISOString == 'undefined') {
		//Add a toISOString method.
		Date.prototype.toISOString = function() {
			//method to zero-pad a string
			var zpad = function(len, input) {
				var ret = String(input);
				while (ret.length < len)
					ret = '0' + ret;
				return ret;
			};

			var y = zpad(4, this.getUTCFullYear());
			var m = zpad(2, this.getUTCMonth() + 1);
			var d = zpad(2, this.getUTCDate());
			var h = zpad(2, this.getUTCHours());
			var n = zpad(2, this.getUTCMinutes());
			var s = zpad(2, this.getUTCSeconds());
			var ms = zpad(3, this.getUTCMilliseconds());
			return y + '-' + m + '-' + d + 'T' + h + ':' + n + ':' + s + '.' + ms + 'Z';
		}
	}
	
	if (typeof Date.fromISOString == 'undefined') {
		Date.fromISOString = DateFromISOString;
	}
	
	if (typeof Date.UTC == 'undefined') {
		Date.UTC = function(year, month, date, hours, minutes, seconds, ms) {
			//normalize input
			year = Number(year);
			month = Number(month);
			date = isNaN(date) ? 1 : Math.floor(Number(date));
			hours = Number(hours);
			minutes = Number(minutes);
			seconds = Number(seconds);
			ms = Number(ms);
			if (Math.round(year) >= 0 && Math.round(year) <= 99) year = 1900 + Math.round(year);
			
			//set the result/return object
			var ret = new Date();
			ret.setUTCFullYear(year, month, date);
			ret.setUTCHours(Number(hours), Number(minutes), Number(seconds), Number(ms));
			return ret.getTime(); //returns a number
		}
	}
	
	if (typeof Date.now == 'undefined') {
		Date.now = function() {
			return new Date().getTime();
		}
	}
	
})();
/***** End of ECMAScript v5 ISO support **************************************/



/***** Extensions to the Date object *****/

//Extend static values on the Date class
Date.constants = {
	clrMin:new Date(-62135571600000),
	clrMax:new Date(253402300799999),
	sqlMin:new Date("1900-01-01Z"),
	msAjaxFormatEarly:/\"\\\/Date\((\-?\d+)\)\\\/\"/g,
	msAjaxFormat:/^\/Date\((\-?\d+)\)\/$/,
	second: 1000,
	minute: 1000 * 60,
	hour: 1000 * 60 * 60,
	day: 1000 * 60 * 60 * 24
}


/*** Begin UTC/Local conversion support ***************************************
Methods for converting to/from UTC and identifying additional attributes 
for date/time logic.
******************************************************************************/
	Date.kind = { "unspecified":"Unspecified", "utc":"Utc", "local":"Local" }

	Date.specifyKind = function(date, kind) {
		//not a date, return the original value
		if (!(date && date instanceof Date)) return date;
		
		//update the date object to match the kind
		var k = kind.toString().toLowerCase().replace(/^\s+|\s+$/g,'');
		if (Date.kind[k] == Date.kind.utc) {
			date.kind = Date.kind.utc;
			return date.toUTC();
		}
		else if (Date.kind[k] == Date.kind.local) {
			date.kind = Date.kind.local;
			return date.toLocal();
		}
		else date.kind = Date.kind.unspecified;
		
		return date;
	}

	//convert from utc time to local time
	Date.prototype.toLocal = function() {
		//if the date is UTC adjust from the utc offset
		if (this.kind == Date.kind.utc) {
			var dv = this.getDate();
			var offset = new Date().getTimezoneOffset * 60 * 1000;
			this.setTime(dv - offset);
			this.kind = Date.kind.utc;
		}
		
		//override instance prototypes
		this.getDate = Date.prototype.getDate;
		this.getDay = Date.prototype.getDay;
		this.getFullYear = Date.prototype.getFullYear;
		this.getHours = Date.prototype.getHours;
		this.getMilliseconds = Date.prototype.getMilliseconds;
		this.getMinutes = Date.prototype.getMinutes;
		this.getMonth = Date.prototype.getMonth;
		this.getSeconds = Date.prototype.getSeconds;
		this.getTimezoneOffset = Date.prototype.getTimezoneOffset;
		this.getYear = Date.prototype.getYear;

		this.setDate = Date.prototype.setDate;
		this.setFullYear = Date.prototype.setFullYear;
		this.setHours = Date.prototype.setHours;
		this.setMilliseconds = Date.prototype.setMilliseconds;
		this.setMinutes = Date.prototype.setMinutes;
		this.setMonth = Date.prototype.setMonth;
		this.setSeconds = Date.prototype.setSeconds;
		this.setTimeout = Date.prototype.setTimeout;
		this.setYear = Date.prototype.setYear;

		this.toString = Date.prototype.toString;
		return this;
	}

	//convert a local time to utc
	Date.prototype.toUTC = function() {
		//if the date isn't already UTC adjust based on the offset
		if (this.kind != Date.kind.utc) {
			var dv = this.getTime();
			var offset = new Date().getTimezoneOffset * 60 * 1000;
			this.setTime(dv + offset);
			this.kind = Date.kind.utc;
		}
		
		//override instance prototypes
		this.getDate = Date.prototype.getUTCDate;
		this.getDay = Date.prototype.getUTCDay;
		this.getFullYear = Date.prototype.getUTCFullYear;
		this.getHours = Date.prototype.getUTCHours;
		this.getMilliseconds = Date.prototype.getUTCMilliseconds;
		this.getMinutes = Date.prototype.getUTCMinutes;
		this.getMonth = Date.prototype.getUTCMonth;
		this.getSeconds = Date.prototype.getUTCSeconds;
		this.getTimezoneOffset = function(){ return 0; }; //no offset
		this.getYear = function() { return Date.prototype.getUTCFullYear() - 1900; };

		this.setDate = Date.prototype.setUTCDate;
		this.setFullYear = Date.prototype.setUTCFullYear;
		this.setHours = Date.prototype.setUTCHours;
		this.setMilliseconds = Date.prototype.setUTCMilliseconds;
		this.setMinutes = Date.prototype.setUTCMinutes;
		this.setMonth = Date.prototype.setUTCMonth;
		this.setSeconds = Date.prototype.setUTCSeconds;
		this.setTimeout = Date.prototype.setUTCTimeout;
		this.setYear = function(year) { if (!isNaN(year)) this.setFullYear(year + 1900); }

		this.toString = Date.prototype.toUTCString;
		return this;
	}
/*** End UTC/Local conversion support ****************************************/


//Converts from ISO8601 or MS-Ajax encoded datetime
//	ex:	Date.fromJson("2009-07-03T16:09:45Z")
//			Fri Jul 03 2009 09:09:45 GMT-0700
//		Date.fromJson("\/Date(1246662585000)\/")
//			Fri Jul 03 2009 09:09:45 GMT-0700
Date.fromJson = function(jsonString) {
    var d = Date.fromMsAjax(jsonString) || new Date(jsonString); //new Date extended above with ISO support
		
	if (isNaN(d) || d.getYear() <= Date.constants.sqlMin.getYear())
    	return null; //null out MS-SQL Server's min value

    return d;
}

Date.fromMsAjax= function(jsonString) {
	if (jsonString instanceof Date) return jsonString; //already a date
	
	jsonString = jsonString.toString().replace(/^\s+/,'').replace(/\s+$/,'')
	if (!Date.constants.msAjaxFormat.test(jsonString.trim()))
		return null; //invalid format

	var dv = jsonString.toString().trim().replace(Date.constants.msAjaxFormat, '$1');
	dv = parseInt(dv);
	if (!isNaN(dv))
		return new Date(dv);
	
	return null; //invalid
}
        
//Extend the instance prototype for Date objects
Date.prototype.datePart= function() {
	var ret = new Date(this.valueOf());
	ret.setHours(0, 0, 0, 0);
	return ret;
}
