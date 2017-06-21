var PUBLIC = {//公用方法
    getSearch : function(){//获取search中带有的所有信息
        var str = location.search.slice(1);
        var arr = str.split('&');
        var obj = {};
        for(var i = 0,len=arr.length;i<len;i++){
            var arr2 = arr[i].split('=');
            obj[arr2[0]] = arr2[1];
        }
        return obj;
    },
    getCookie : function(){//获取cookie中带有的所有信息
        cookie = document.cookie;
        if(cookie.length>5){
            cookie = cookie.slice(5);
            var arr = cookie.split('&');
            var obj = {};
            for(var i= 0,len=arr.length;i<len;i++){
                var arr2 = arr[i].split('=');
                obj[arr2[0]] = arr2[1];
            }
        }
        return obj;
    }
};
var NEW_URL = {
    ver: '/api-v1.2/',
    cms: "http://api.gejubusiness.com",
};

/**
 * http请求封装类
 * @param {Object} options
 */
var HTTP_REQUEST = function(options){
	this.init(options);
}

HTTP_REQUEST.prototype = {
	options:{
		url:"",
		cookie:{},
		type:"GET",
		dataType:"json",
		data:{},
		timeout:5000,
		callback:function(){}
	},
	init:function(options){
		this.setOptions(options);
	},
	setOptions:function(options){
		this.options = $.extend({},this.options, options);
		this.execute();
	},
	execute:function(){
		var cookie = document.cookie;
		if(cookie != null && cookie.length>5) {
			this.options.cookie = {"cookie":cookie.slice(5).replace(/&/img,';')};
		}
		var self = this;
		$.ajax({
		  type: self.options.type,
		  url: NEW_URL.cms+NEW_URL.ver+self.options.url,
		  headers:self.options.cookie,
		  data: self.options.data,
		  dataType: self.options.dataType,
		  timeout: self.options.timeout || 5000,
		  context: $('body'),
		  success: function(data){
		    self.options.callback("success",data);
		  },
		  error: function(xhr, errorMessage, errorObject){
		    self.options.callback("error",errorMessage);
		  }
		});
	}
}

var NEW_AJAX = function (o){
    var cookie = document.cookie;
    if(cookie.length>5){
        cookie = cookie.slice(5);
        cookie = cookie.replace(/&/img,';');
        o.cookie = {"cookie":cookie};
    }
    //TODO
    /*else{//没有娶到cookie
        location.href = 'loginActivity.html';
        return;
    }*/
    $.ajax({
        url:NEW_URL.cms+NEW_URL.ver+ o.url,
        type: o.type||'post',
        headers: o.cookie,
        datatype: o.dataType || 'json',
        data: o.data,
        success: function (json) {
            o.success&& o.success(json);
        },
        error: function (request, errorMessage, errorObject) {
            console.log('错误信息' + request + ";" + errorMessage + ";" + errorObject);
            o.error&& o.error();
        }
    })
};
/* 当前格式参数
 o = {
 url:'',//接口不含api
 type:'get',//不填默认post
 dataType:'json',//默认JSON
 data:data,//数据
 success:success,//成功回调
 error:error//失败回调
 };
 */
//时间格式转换
Date.prototype.format =function(format){
    var o = {
        "M+" : this.getMonth()+1, //month
        "d+" : this.getDate(), //day
        "h+" : this.getHours(), //hour
        "m+" : this.getMinutes(), //minute
        "s+" : this.getSeconds(), //second
    }
    if(/(y+)/.test(format)) {
        format=format.replace(RegExp.$1,(this.getFullYear()+"").substr(4- RegExp.$1.length))
    }
    for(var k in o){
        if(new RegExp("("+ k +")").test(format)){
            format = format.replace(RegExp.$1,RegExp.$1.length==1? o[k] :("00"+ o[k]).substr((""+ o[k]).length))
        }
    }
    return format;
}
function setTime(createtime){
    if (Boolean(createtime) && typeof(createtime) == 'number' && createtime != 0) {
        var date = new Date(createtime*1000);
        return date.format("yyyy.MM.dd hh:mm");
    }
}
//获取mid
function getMid(mid) {
    var paramStr = window.location.search.substring(1);
    if (Boolean(paramStr)) {
        var paramArray = decodeURI(paramStr).split('&');
        for (var i = 0; i < paramArray.length; i++) {
            if (paramArray[i].split('=')[0] == mid) {
                return paramArray[i].split('=')[1];
            }
        }
    }
    return null;
}