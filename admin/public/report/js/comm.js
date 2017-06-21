var ToolUtils = {
	addHandler: function(element, type, handler) {
		if (element.addEventListener) {
			element.addEventListener(type, handler, false);
		} else if (element.attachEvent) {
			element.attachEvent("on" + type, handler);
		} else {
			element["on" + type] = handler;
		}
	},
	utc2String: function(utc, formatStr) {
		if (Boolean(utc) && typeof(utc) == 'number' && utc != 0) {
			var date = new Date(utc);
			return date.format(formatStr);
		}
		return '';
	},
	getURLParam: function(paramName) {
		var paramStr = window.location.search.substring(1);
		if (Boolean(paramStr)) {
			var paramArray = decodeURI(paramStr).split('&');
			for (var i = 0; i < paramArray.length; i++) {
				if (paramArray[i].split('=')[0] == paramName) {
					return paramArray[i].split('=')[1];
				}
			};
		}
		return null;
	},
	getCookie: function(c_name) {
		if (document.cookie.length > 0) {
			c_start = document.cookie.indexOf(c_name + "=");
			if (c_start != -1) {
				c_start = c_start + c_name.length + 1;
				//当indexOf()带2个参数时，第二个代表其实位置，参数是数字，这个数字可以加引号也可以不加（最好还是别加吧）
				c_end = document.cookie.indexOf(";", c_start);
				if (c_end == -1) c_end = document.cookie.length;
				return unescape(document.cookie.substring(c_start, c_end));
			}
		}
		return "";
	},
	subString: function(str, len, hasDot) {
		var newLength = 0;
		var newStr = "";
		var chineseRegex = /[^\x00-\xff]/g;
		var singleChar = "";
		var strLength = str.replace(chineseRegex, "**").length;
		for (var i = 0; i < strLength; i++) {
			singleChar = str.charAt(i).toString();
			if (singleChar.match(chineseRegex) != null) {
				newLength += 2;
			} else {
				newLength++;
			}
			if (newLength > len) {
				break;
			}
			newStr += singleChar;
		}

		if (hasDot && strLength > len) {
			newStr += "...";
		}
		return newStr;
	},
	saveLocalStoreItem: function(key, value) {
		localStorage.setItem(key, value);
	},
	getLocalStoreItem: function(key) {
		return localStorage.getItem(key);
	}
};
var NEW_URL = {
    ver: '/api-v1.4/',
    cms: "http://api.geju.com",

};

/**
 * 对Date的扩展，将 Date 转化为指定格式的String 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 例子： (new
 * Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 (new
 * Date()).Format("yyyy-M-d h:m:s.S") ==> 2006-7-2 8:9:4.18
 */
Date.prototype.format = function(fmt) {
	var o = {
		"M+": this.getMonth() + 1, // 月份
		"d+": this.getDate(), // 日
		"h+": this.getHours(), // 小时
		"m+": this.getMinutes(), // 分
		"s+": this.getSeconds(), // 秒
		"q+": Math.floor((this.getMonth() + 3) / 3), // 季度
		S: this.getMilliseconds()
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return fmt;
};

var Map = function() {
	this._entrys = new Array();

	this.put = function(key, value) {
		if (key == null || key == undefined) {
			return;
		}
		var index = this._getIndex(key);
		if (index == -1) {
			var entry = new Object();
			entry.key = key;
			entry.value = value;
			this._entrys[this._entrys.length] = entry;
		} else {
			this._entrys[index].value = value;
		}
	};
	this.get = function(key) {
		var index = this._getIndex(key);
		return (index != -1) ? this._entrys[index].value : null;
	};
	this.remove = function(key) {
		var index = this._getIndex(key);
		if (index != -1) {
			this._entrys.splice(index, 1);
		}
	};
	this.clear = function() {
		this._entrys.length = 0;
	};
	this.contains = function(key) {
		var index = this._getIndex(key);
		return (index != -1) ? true : false;
	};
	this.getCount = function() {
		return this._entrys.length;
	};
	this.getEntrys = function() {
		return this._entrys;
	};
	this._getIndex = function(key) {
		if (key == null || key == undefined) {
			return -1;
		}
		var _length = this._entrys.length;
		for (var i = 0; i < _length; i++) {
			var entry = this._entrys[i];
			if (entry == null || entry == undefined) {
				continue;
			}
			if (entry.key === key) { //equal  
				return i;
			}
		}
		return -1;
	};
}