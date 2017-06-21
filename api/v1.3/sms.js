var config=require('../../config/config');
var request = require('request');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var Utilsms = require('../../utils/sms');
 var https   = require('https') ;
 var express = require('express');
 var router = express.Router();
 var models  = require('../../models');
 var co = require('co');
//https://app.cloopen.com:8883/2013-12-26/Accounts/{accountSid}/IM/PushMsg?sig={SigParameter}
//https://app.cloopen.com:8883/2013-12-26/Accounts/{accountSid}/SMS/TemplateSMS?sig={SigParameter}
//上传xml内容
var Sms={
  get_smscode:function(req,res){
    var phoneno =req.body.phoneno;
    if (!phoneno) {
      return response.ApiError(res,{message:"userid or content empty"});
    }
    //生成6位随机数
    var smscode=""; 
    for(var i=0;i<6;i++) 
    { 
      smscode += Math.floor(Math.random()*10); 
    } 
    var data={
      "to":phoneno,
      "appId":config.rlsms.appId,
      "templateId":config.rlsms.templateId,
      "datas":[smscode,config.rlsms.lostdata]         
    };

    data = JSON.stringify(data);
    var gettime = moment(new Date()).format('YYYYMMDDhhmmss');

    var Authorization = new Buffer(config.rlsms.accountSid+":"+gettime).toString("base64");  
    var SigParameter = str.md5(config.rlsms.accountSid +config.rlsms.authtoken + gettime).toUpperCase();
    //var ryurl='https://app.cloopen.com:8883'+'/2013-12-26/Accounts/'+config.rlsms.accountSid+'/SMS/TemplateSMS?sig='+SigParameter;
  

    var opt = {  
        method: "POST",  
        host: config.rlsms.host,  
        port: config.rlsms.port,  
        path: '/2013-12-26/Accounts/'+config.rlsms.accountSid+'/SMS/TemplateSMS?sig='+SigParameter,   
        headers: {  
           "Accept": 'application/json',  
           "Content-Type": 'application/json;charset=utf-8',   
           "Content-Length": data.length,
           "Authorization":Authorization
        }  
    };  
   var req = https.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode ==200) {  
            var body = "";  
            serverFeedback.on('data', function (data) { body += data; })  
                          .on('end', function () { 
                              models.Smscode.create({
                                phoneno:phoneno,
                                smscode:smscode
                              }).then(function(){
                                //res.send(200, body); 
                                return response.onDataSuccess(res,{data:''})
                              }, function(err){
                                return response.ApiError(res,{message:"add smscode error"});
                              })
                          });  
        }  
        else {  
            res.send(500, "error");  
        }  
    });  
    req.write(data + "\n");  
    req.end();  
  },send_smsbytemplate:function(req,res){
      var option = {};
      option.mpnos = req.body.mpnos;
      option.templateId = req.body.templateId;
      option.parameters = req.body.parameters;
      Utilsms.send_smsbytemplate(option,function (err, data) {
        if (err) {
            return response.ApiError(res,{message:'发送失败'})
        }
        if (!data) {
            return response.ApiSuccess(res,{});
        }
        data = JSON.parse(data);
        return response.ApiSuccess(res,{data:data});
    });
  }
}
module.exports=Sms;