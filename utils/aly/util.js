var cryptoLib = require('crypto');
var Buffer = require('buffer').Buffer;
var ALY = {};
ALY.secretAccessKey="Q7KIWm7tBwNtIUD7I1pEFFWKChOjRE";
ALY.accessKeyId="DJMGU4mvJFo6mZdV";
ALY.url="http://mts.cn-beijing.aliyuncs.com";

ALY.util = {
  each:function (object, iterFunction) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        var ret = iterFunction.call(this, key, object[key]);
        if (ret === ALY.util.abort) break;
      }
    }
  },
  abort: {},
  arrayEach:function (array, iterFunction) {
    for (var idx in array) {
      if (array.hasOwnProperty(idx)) {
        var ret = iterFunction.call(this, array[idx], parseInt(idx, 10));
        if (ret === ALY.util.abort) break;
      }
    }
  },
  iso8601: function(date) {
      if (date === undefined) { date = ALY.util.date.getDate(); }
      return date.toISOString();
  },
  getDate: function () { return new Date(); },
  topEscape:function(clearString) {
    var output = '';
    var x = 0;
    clearString = clearString.toString();
    var regex = /(^[a-zA-Z0-9-_.~]*)/;
    while (x < clearString.length) {
      var match = regex.exec(clearString.substr(x));
      if (match != null && match.length > 1 && match[1] != '') {
        output += match[1];
        x += match[1].length;
      } else {
        if (clearString[x] == ' ')
          output += '%20';
        else {
          var charCode = clearString.charCodeAt(x);
          var hexVal = charCode.toString(16);
          output += '%' + ( hexVal.length < 2 ? '0' : '' ) + hexVal.toUpperCase();
        }
        x++;
      }
    }
    return output;
  },
  hmac:function (key, string, digest, fn) {
    if (!digest) digest = 'binary';
    if (digest === 'buffer') { digest = undefined; }
    if (!fn) fn = 'sha256';
    if (typeof string === 'string') string = new Buffer(string);
    return cryptoLib.createHmac(fn, key).update(string).digest(digest);
  },
  queryParamsToString:function (params) {
    var items = [];
    var escape = ALY.util.uriEscape;
    var sortedKeys = Object.keys(params).sort();
    ALY.util.arrayEach(sortedKeys, function(name) {
      var value = params[name];
      var ename = escape(name);
      var result = ename;
      if (Array.isArray(value)) {
        var vals = [];
        ALY.util.arrayEach(value, function(item) { vals.push(escape(item)); });
        result = ename + '=' + vals.sort().join('&' + ename + '=');
      } else if (value !== undefined && value !== null) {
        result = ename + '=' + escape(value);
      }
      items.push(result);
    });
    return items.join('&');
  },
  uriEscape: function (string) {
    /*jshint undef:false */
    var output = encodeURIComponent(string);
    output = output.replace(/[^A-Za-z0-9_.~\-%]+/g, escape);

    // percent-encodes some extra non-standard characters in a URI
    output = output.replace(/[*]/g, function(ch) {
      return '%' + ch.charCodeAt(0).toString(16).toUpperCase();
    });
    return output;
  },
};
ALY.mts={
  SubmitJobs:function(params){
    var paramdata={
      Format:"JSON",
      Version:"2014-06-18",
      SignatureMethod:"HMAC-SHA1",
      SignatureNonce:Math.round(Math.random() * 1000000),
      SignatureVersion:"1.0",
      AccessKeyId:ALY.accessKeyId,
      Timestamp:ALY.util.iso8601(ALY.util.getDate()),
      Action:"SubmitJobs",
      RegionId:"cn-beijing",
      PipelineId:"390beec969a44660a0098a87d59377bf",
      Input:JSON.stringify({
        Bucket:"gejumedia",
        Location:"oss-cn-beijing",
        Object:params.inputfile
      }),
      OutputBucket:"gejumedia",
      OutputLocation:"oss-cn-beijing",
      Outputs:JSON.stringify([{
        OutputObject:params.outfile,
        TemplateId:"S00000001-100020",
      }]),
    }
    var headers = [];
    ALY.util.each(paramdata,function(name){
      headers.push(name);
    });
    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });
    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, headers, function (name) {
      canonicalizedQueryString += "&" + name + "=" + ALY.util.topEscape(paramdata[name]);
    });
    var stringToSign = 'POST&%2F&' + ALY.util.topEscape(canonicalizedQueryString.substr(1));
    paramdata.Signature = ALY.util.hmac(ALY.secretAccessKey+'&', stringToSign, 'base64', 'sha1');
    return ALY.util.queryParamsToString(paramdata);
  },
  QueryJobList:function(params){
    var paramdata={
      Format:"JSON",
      Version:"2014-06-18",
      SignatureMethod:"HMAC-SHA1",
      SignatureNonce:Math.round(Math.random() * 1000000),
      SignatureVersion:"1.0",
      AccessKeyId:ALY.accessKeyId,//"WREHCJdzZat5VVh7",
      Timestamp:ALY.util.iso8601(ALY.util.getDate()),
      Action:"QueryJobList",
      JobIds:params.JobIds
    }
    var headers = [];
    ALY.util.each(paramdata,function(name){
      headers.push(name);
    })
    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });
    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, headers, function (name) {
      canonicalizedQueryString += "&" + name + "=" + ALY.util.topEscape(paramdata[name]);
    });
    var stringToSign = 'POST&%2F&' + ALY.util.topEscape(canonicalizedQueryString.substr(1));
    paramdata.Signature = ALY.util.hmac(ALY.secretAccessKey+'&', stringToSign, 'base64', 'sha1');
    return ALY.util.queryParamsToString(paramdata);
  },
  SubmitMediaInfoJob:function(params){
    var paramdata={
      Format:"JSON",
      Version:"2014-06-18",
      SignatureMethod:"HMAC-SHA1",
      SignatureNonce:Math.round(Math.random() * 1000000),
      SignatureVersion:"1.0",
      AccessKeyId:ALY.accessKeyId,//"WREHCJdzZat5VVh7",
      Timestamp:ALY.util.iso8601(ALY.util.getDate()),
      Action:"SubmitMediaInfoJob",
      Input:JSON.stringify({
        Bucket:"gejumedia",
        Location:"oss-cn-beijing",
        Object:encodeURIComponent(params.file)
      })
    }
    var headers = [];
    ALY.util.each(paramdata,function(name){
      headers.push(name);
    })
    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });
    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, headers, function (name) {
      canonicalizedQueryString += "&" + name + "=" + ALY.util.topEscape(paramdata[name]);
    });
    var stringToSign = 'POST&%2F&' + ALY.util.topEscape(canonicalizedQueryString.substr(1));
    paramdata.Signature = ALY.util.hmac(ALY.secretAccessKey+'&', stringToSign, 'base64', 'sha1');
    return ALY.util.queryParamsToString(paramdata);
  },
  QueryMediaInfoJobList:function(params){
    var paramdata={
      Format:"JSON",
      Version:"2014-06-18",
      SignatureMethod:"HMAC-SHA1",
      SignatureNonce:Math.round(Math.random() * 1000000),
      SignatureVersion:"1.0",
      AccessKeyId:ALY.accessKeyId,//"WREHCJdzZat5VVh7",
      Timestamp:ALY.util.iso8601(ALY.util.getDate()),
      Action:"QueryMediaInfoJobList",
      MediaInfoJobIds:params.MediaInfoJobIds
    }
    var headers = [];
    ALY.util.each(paramdata,function(name){
      headers.push(name);
    })
    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });
    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, headers, function (name) {
      canonicalizedQueryString += "&" + name + "=" + ALY.util.topEscape(paramdata[name]);
    });
    var stringToSign = 'POST&%2F&' + ALY.util.topEscape(canonicalizedQueryString.substr(1));
    paramdata.Signature = ALY.util.hmac(ALY.secretAccessKey+'&', stringToSign, 'base64', 'sha1');
    return ALY.util.queryParamsToString(paramdata);
  },
  SubmitSnapshotJob:function(params){
    var paramdata={
      Format:"JSON",
      Version:"2014-06-18",
      SignatureMethod:"HMAC-SHA1",
      SignatureNonce:Math.round(Math.random() * 1000000),
      SignatureVersion:"1.0",
      AccessKeyId:ALY.accessKeyId,//"WREHCJdzZat5VVh7",
      Timestamp:ALY.util.iso8601(ALY.util.getDate()),
      RegionId:"cn-beijing",
      Action:"SubmitSnapshotJob",
      Input:JSON.stringify({
        Bucket:"gejumedia",
        Location:"oss-cn-beijing",
        Object:params.inputfile
      }),SnapshotConfig:JSON.stringify({
        OutputFile: {
          Bucket: "gejumedia",
          Location: "oss-cn-beijing",
          Object: params.outfile,
        },
        Time: "5"
      })
    }
    var headers = [];
    ALY.util.each(paramdata,function(name){
      headers.push(name);
    })
    headers.sort(function (a, b) {
      return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
    });
    var canonicalizedQueryString = "";
    ALY.util.arrayEach.call(this, headers, function (name) {
      canonicalizedQueryString += "&" + name + "=" + ALY.util.topEscape(paramdata[name]);
    });
    var stringToSign = 'POST&%2F&' + ALY.util.topEscape(canonicalizedQueryString.substr(1));
    paramdata.Signature = ALY.util.hmac(ALY.secretAccessKey+'&', stringToSign, 'base64', 'sha1');
    return ALY.util.queryParamsToString(paramdata);
  }
}

module.exports = ALY;
