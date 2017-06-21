var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var algorithm = require('ape-algorithm');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config = require('../../config/config');
var co = require('co');
var moment = require('moment');
var request = require('request');
var https   = require('https') ;

var  Pay={
  get_weixinpayurl:function(req,res){
    var product_id=req.query.productid;
     if(!product_id){
      return response.ApiError(res,{message:"productid empty"});
    }
    var nonce_str=""; 
    for(var i=0;i<32;i++) 
    { 
      nonce_str += Math.floor(Math.random()*10); 
    } 
    var time_stamp = parseInt(new Date().getTime()/1000);
    var stringA='appid='+config.weixin.appid+'&mch_id='+config.weixin.mch_id+'&nonce_str='+nonce_str+'&product_id='+product_id+'&time_stamp='+time_stamp;
    var stringSignTemp=stringA+"&key="+config.weixin.key ;
    var sign=str.md5(stringSignTemp).toUpperCase();
    var url = 'weixin://wxpay/bizpayurl?sign='+sign+'&appid='+config.weixin.appid+'&mch_id='+config.weixin.mch_id+'&nonce_str='+nonce_str+'&product_id='+product_id+'&time_stamp='+time_stamp;
    return response.onDataSuccess(res,{data:url})
  },
  get_weixingopenid:function(req,res){

    //var getopenidurl='https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx5a511f58fb7cb4db&secret=f98879dac4e2706523e4c9cda09c7e33&code='+req.query.code+'&grant_type=authorization_code';
    var openid = '';
    var path = '/sns/oauth2/access_token?appid=wx5a511f58fb7cb4db&secret=f98879dac4e2706523e4c9cda09c7e33&code='+req.query.code+'&grant_type=authorization_code';
    var opt = {  
        method: "GET",  
        host: 'api.weixin.qq.com', 
        path: path,   
        headers: {  
          "Content-Type": 'application/json'
        }  
    };  

   var req = https.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode ==200) {  
            var body = "";  
            serverFeedback.on('data', function (data) {
                body += data;
              })  
                          .on('end', function () {
                             var reu=JSON.parse(body);
                             openid = reu.openid;
                             access_token = reu.access_token;
                             return response.onDataSuccess(res,{data:reu});
                          });  
        }
        else {  
            return response.ApiError(res,{message:'获取失败'})
        }  
    });  
    req.end();  
  },
  get_weixinginfo:function(req,res){

    //var getopenidurl='https://api.weixin.qq.com/sns/oauth2/access_token?appid=wx5a511f58fb7cb4db&secret=f98879dac4e2706523e4c9cda09c7e33&code='+req.query.code+'&grant_type=authorization_code';
    var openid = '';
    var path = '/sns/oauth2/access_token?appid=wx5a511f58fb7cb4db&secret=f98879dac4e2706523e4c9cda09c7e33&code='+req.query.code+'&grant_type=authorization_code';
    var opt = {  
        method: "GET",  
        host: 'api.weixin.qq.com', 
        path: path,   
        headers: {  
          "Content-Type": 'application/json'
        }  
    };  

   var req = https.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode ==200) {  
            var body = "";  
            serverFeedback.on('data', function (data) {
                body += data;
              })  
                          .on('end', function () {
                             var reu=JSON.parse(body);
                             openid = reu.openid;
                             access_token = reu.access_token;
                             var bodyreu =Pay.getweixinuserinfo(access_token,openid,function (err, data) {
                                  if (err) {
                                      return response.ApiError(res,{message:'获取用户信息失败'})
                                  }
                                  if (!data) {
                                      return response.onDataSuccess(res,{});
                                  }
                                  //data = JSON.parse(data);
                                  return response.onDataSuccess(res,{data:data});
                             });

                          });  
        }
        else {  
            return response.ApiError(res,{message:'获取失败'})
        }  
    });  
    req.end();  
  },get_jsapiticket:function(req,res) {
    var path='/cgi-bin/token?grant_type=client_credential&appid=wx5a511f58fb7cb4db&secret=f98879dac4e2706523e4c9cda09c7e33';
    //var path = '/sns/oauth2/access_token?appid=wx5a511f58fb7cb4db&secret=f98879dac4e2706523e4c9cda09c7e33&code='+req.query.code+'&grant_type=authorization_code';
    var opt = {  
        method: "GET",  
        host: 'api.weixin.qq.com', 
        path: path,   
        headers: {  
          "Content-Type": 'application/json'
        }  
    };  
     var req = https.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode ==200) {  
            var body = "";  
            serverFeedback.on('data', function (data) {
                body += data;
              })  
                          .on('end', function () {
                             var reu=JSON.parse(body);
                             var access_token = reu.access_token;
                             var bodyreu =Pay.getticket(access_token,function (err, data) {
                                if (err) {
                                    return response.ApiError(res,{message:'获取票据失败'})
                                }
                                if (!data) {
                                    return response.onDataSuccess(res,{});
                                }
                                //data = JSON.parse(data);
                                return response.onDataSuccess(res,{data:data});
                            });
                          });  
        }
        else {  
            return response.ApiError(res,{message:'获取失败'})
        }  
    });  
    req.end(); 
   },paysign:function(appid,attach,body,mch_id,nonce_str,notify_url,openid,out_trade_no,spbill_create_ip,total_fee,trade_type) {
    var ret = {
        appid: appid,
        attach: attach,
        body: body,
        mch_id: mch_id,
        nonce_str: nonce_str,
        notify_url:notify_url,
        openid:openid,
        out_trade_no:out_trade_no,
        spbill_create_ip:spbill_create_ip,
        total_fee:total_fee,
        trade_type:trade_type
    };
    var string = Pay.raw(ret);
    var key = config.weixin.key;
    string = string + '&key='+key;  //key为在微信商户平台(pay.weixin.qq.com)-->账户设置-->API安全-->密钥设置
    var crypto = require('crypto');
    return crypto.createHash('md5').update(string,'utf8').digest('hex');
},raw:function(args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
},get_weixingpayid:function(req,res) {
    var title = req.query.title;
    var out_trade_no = req.query.out_trade_no;
    var total_fee = req.query.total_fee;
    var openid= req.query.openid;
    var appid=config.weixin.appid;
    var mch_id=config.weixin.mch_id;
    var nonce_str=""; 
    for(var i=0;i<32;i++) 
    { 
      nonce_str += Math.floor(Math.random()*10); 
    } 
    var url = "https://api.mch.weixin.qq.com/pay/unifiedorder";
    var notify_url = 'http://api.gejubusiness.com/api-v1.0/set-weixingpayorder';
    var attach = config.weixin.attach;
    var body = '格局商学-打赏';
    if(title) {body=title}; 

    var formData = "<xml>";
    formData += "<appid>"+appid+"</appid>"; //appid
    formData += "<attach>"+attach+"</attach>"; //附加数据
    formData += "<body>"+body+"</body>"; //商品或支付单简要描述
    formData += "<mch_id>"+mch_id+"</mch_id>"; //商户号
    formData += "<nonce_str>"+nonce_str+"</nonce_str>"; //随机字符串，不长于32位
    formData += "<notify_url>"+notify_url+"</notify_url>"; //支付成功后微信服务器通过POST请求通知这个地址
    formData += "<openid>"+openid+"</openid>"; //扫码支付这个参数不是必须的
    formData += "<out_trade_no>"+out_trade_no+"</out_trade_no>"; //订单号
    formData += "<spbill_create_ip>101.200.215.157</spbill_create_ip>"; //不是必须的
    formData += "<total_fee>"+total_fee+"</total_fee>"; //金额
    formData += "<trade_type>JSAPI</trade_type>"; //NATIVE会返回code_url ，JSAPI不会返回
    formData += "<sign>" + Pay.paysign(appid,attach,body,mch_id,nonce_str,notify_url, openid, out_trade_no,'101.200.215.157', total_fee, 'JSAPI') + "</sign>";
    formData += "</xml>";

    request(
    {
        url : url,
        method : 'POST',
        body : formData
    }, function (err, responses, body)
    {
        if (!err && responses.statusCode == 200)
        {
            console.log(body);
            var parseString = require('xml2js').parseString;
            var xml = body.toString("utf-8");
       
            parseString(xml, function (err, result) {
                if(result.xml.prepay_id)
                { 
                    var resu={
                      code: result.xml.return_code,
                      prepay_id : result.xml.prepay_id};
                      return response.onDataSuccess(res,{data:resu});
                }else{
                    return response.ApiError(res,{message:'获取预付订单失败'})
                  }
            });         
        }else{return response.ApiError(res,{message:'获取预付订单失败'})}

    });
  },set_weixingpayorder:function(req,res) {
     var parseString = require('xml2js').parseString;
            
            var xmlstring = req.body.toString("utf-8");
            console.log(xmlstring);
             parseString(xmlstring, function (err, result) {
          //    if(result.xml.return_code=='SUCCESS')
          //    { 
          //           var openid = result.xml.openid;
          //           var out_trade_no = result.xml.out_trade_no;
          //           var transaction_id   = result.xml.transaction_id;
          //           var total_fee = result.xml.total_fee;
          //           var time_end = result.xml.openid;
          //           var attach = result.xml.attach;
           
          //           models.Payorder.create({
          //             po_timeend:body.time_end,
          //             po_tradeno:body.out_trade_no,
          //             po_ordertype:0,
          //             po_openid:openid
          //       }).then(function(){
          //         var builder =  require('xml2js').Builder();  
          //               var resjson={
          //                 return_code:'SUCCESS',
          //                 return_msg:''
          //               };
          //               console.log();
          //               var buildxml = builder.buildObject(resjson);
          //               return res.send(buildxml);
          //       }, function(err){
          //           var resjson={
          //                 return_code:'FAIL',
          //                 return_msg:'支付过程出现问题'
          //               };
          //               var buildxml = builder.buildObject(resjson);
          //               return res.send(buildxml);
          //       })
          //  }else{
          //           var builder =  require('xml2js').Builder();  
          //           var resjson={
          //              return_code:'FAIL',
          //             return_msg:'支付过程出现问题'
          //           };
          //           var buildxml = builder.buildObject(resjson);
          //           return res.send(buildxml);
          //   }

             var builder =  require('xml2js').Builder();  
                        var resjson={
                          return_code:'SUCCESS',
                          return_msg:''
                        };
                        console.log();
                        var buildxml = builder.buildObject(resjson);
                        return res.send(buildxml);
    });
  },getticket:function(access_token,callback) {
   var path = '/cgi-bin/ticket/getticket?access_token='+access_token+'&type=jsapi';
   var opt = {  
        method: "GET",  
        host: 'api.weixin.qq.com', 
        path: path,   
        headers: {  
          "Content-Type": 'application/json'
        }  
    };  
    var req = https.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode ==200) {  
            var body = "";  
            serverFeedback.on('data', function (data) {
                body += data;
              })  
                          .on('end', function () {
                             var reu=JSON.parse(body);
                             var ticket = reu.ticket;
                             var resu={
                              code: serverFeedback.statusCode ,
                              ticket : ticket};
                             return callback(null,resu); 
                             
                          });  
        }
        else {  
           var resu={
                      code : erverFeedback.statusCode,//FAIL
                      message : "获取票据失败"
           }
           return callback(resu); 
        }  
      });  
      req.end(); 
  },getweixinuserinfo:function(access_token,openid,callback) {
   var path = '/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN';
   var opt = {  
        method: "GET",  
        host: 'api.weixin.qq.com', 
        path: path,   
        headers: {  
          "Content-Type": 'application/json'
        }  
    };  
    var req = https.request(opt, function (serverFeedback) {  
        if (serverFeedback.statusCode ==200) {  
            var body = "";  
            serverFeedback.on('data', function (data) {
                body += data;
              })  
                          .on('end', function () {
                             var reu=JSON.parse(body);
                             return callback(null,reu); 
                             
                          });  
        }
        else {  
           var resu={
                      code : erverFeedback.statusCode,//FAIL
                      message : "获取用户信息失败"
           }
           return callback(resu); 
        }  
      });  
      req.end(); 
  },set_payorder:function(req,res){
    var body=req.body;
  
    if(!body.mid){
      return response.ApiError(res,{message:"mid error"});
    }
    if(!body.prepayid){
      return response.ApiError(res,{message:"prepayid error"});
    }
   var content={};
        if (body.mid){
          content.po_tomid=body.mid;
        }
        if (body.name){
          content.po_toname=body.name;
        }
        if (body.prepayid){
          content.po_prepayid=body.prepayid;
        }
        if (body.money){
          content.po_money=body.money;
        }
        if (body.openid){
          content.po_openid=body.openid;
        }
        if (body.nickname){
          content.po_nickname=body.nickname;
        }
        if (body.sex){
          content.po_sex=body.sex;
        }
        if (body.city){
          content.po_city=body.city;
        }
        if (body.province){
          content.po_province=body.province;
        }
        if (body.headimgurl){
          content.po_headimgurl=body.headimgurl;
        }
        content.po_ordertype=1;
       models.Payorder.create(content).then(function(){
          return response.onDataSuccess(res,{data:{}});
      }, function(err){
        
        return response.ApiError(res,{message:" payorder error"});
      });
       
  },get_payorders:function(req,res){
    var body=req.query;
    console.log(body)
    if(!body.mid){
      return response.ApiError(res,{message:'mid empty'})
    }
    var totalmoney = 0;
    models.Payorder.findtotalmoney({
      where:{mid:body.mid},
      attributes:['totalmoney']
    }).then(function(item){
       if(item)
       {
         totalmoney = item[0].totalmoney;
       }
      
    })
    models.Payorder.findAll({
      where:{po_tomid:body.mid,po_ordertype:1},
      order: [['updatedAt', 'DESC']],
      limit:10,
      attributes:['po_money','po_openid','po_nickname','po_headimgurl','po_city']
    }).then(function(item){
        var data ={
          totalmoney:totalmoney,
          list:item
        }
        return response.onListSuccess(res,{data:data});
      
    },function(err){
      console.log(err);
       return response.ApiError(res,{message:'获取交易订单失败'})
    })
  },payorder_ajax : function (req, res) {
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    var where={}
    models.Payorder.findAndCountAll({
      where:where,
      order:[['createdAt', 'DESC']],
      limit:options.pagesize,
      offset:options.offset
    }).then(function(item){
      if (item) {
        var list=item.rows;
        list.forEach( function(node, index) {
          node.dataValues.createdAt = moment(node.dataValues.createdAt).format('YYYY-MM-DD HH:mm:ss');
          if(node.dataValues.po_sex=='1')
          {node.dataValues.po_sex='男';}
          else if(node.dataValues.po_sex=='2')
          {node.dataValues.po_sex='女';}
          else if(node.dataValues.po_sex=='0')
          {node.dataValues.po_sex='未设置';}
          node.dataValues.index = options.offset + index + 1
        });
        return response.onSuccess(res, {
          list:list,
          pagecount: Math.ceil(item.count / options.pagesize)
        })
      }else {
        return response.onError(res,'没有数据')
      }
    }, function(err){
      console.log(err)
    });
  }
}
module.exports=Pay;