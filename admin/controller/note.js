"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');;
var Yunpian = require('../../utils/yunpian');;
var co = require('co');
var Logs=require("../controller/logs");
var StringBuilder = require('../../utils/StringBuilder');
var _=require('lodash')

exports.note_render = function (req, res) {
  co(function *() {
    try{
      var goods=yield models.Goods.findAll({
        where:{},
        raw:true,
        attributes:[['goodsid','id'],['goods_name','name']]
      })
      var room=yield models.Classroom.findAll({
        where:{classroom_status:0},
        raw:true,
        attributes:[['classroom','id'],['classroom_name','name']]
      })
      return res.render('note/list', {
        title: '短信通知',
        goods:goods,
        room:room
      });
    }catch (err){
      console.log(err)
    }
  })
};
exports.note_list = function (req, res) {
  co(function *() {
    try{
      var tpl=yield Yunpian.get_tpl({});
      var filter=yield models.Config.findOne({
        where:{key:'noteFilter'},
        raw:true,
        attributes:['val']
      })
      filter=filter?filter.val.split(','):[]
      return response.onSuccess(res,{list:_.filter(tpl, function(item){
        return filter.indexOf(item.tpl_id+'')==-1;
      })})
    }catch (err){
      console.log(err)
      return response.onError(res,{message:err.toString()})
    }
  })
};
exports.note_exchange = function (req, res) {
  var body=req.query
  if(body.goods==0 && body.room==0){
    return response.onError(res,{message:'选择一个课程或者分院'})
  }
  var sql=new StringBuilder();
  sql.AppendFormat("select u.uc_userphone as phone " +
      "from gj_userclass as u " +
      "where 1=1 ");
  if(body.goods!=0){
    sql.AppendFormat("AND uc_goodsid={0} ",body.goods);
  }
  if(body.room!=0){
    sql.AppendFormat("AND uc_calssroomid={0} ",body.room);
  }
  sql.AppendFormat("GROUP BY u.uc_userphone");
  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
    data.forEach(function (item,index) {
      data[index]=item.phone
    })
    return response.onSuccess(res,{detail:_.union(data).join(',')})
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{message:err.toString()})
  })
};
exports.note_add = function (req, res) {
  var body=req.body
  if(!body.content){
    return response.onError(res,{message:'参数缺失'})
  }
  Yunpian.add_tpl({content:body.content}).then(function (list) {
    Logs.logsSave({
      lg_content: "增加短信模板【"+body.content+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:'ok'})
  }).then(function (err) {
    console.log(err)
    return response.onError(res,{message:err})
  })
};
exports.note_del = function (req, res) {

};
exports.note_push = function (req, res) {
  var body=req.body;
  if(!/^(1\d{10})(,(1\d{10}))*$/.test(body.mobile)){
    return response.onError(res,{message:'手机号码格式错误'})
  }
  var mobile=body.mobile.split(',')
  co(function *() {
    try{
      //手机号码去重复
      mobile=_.union(mobile)
      //对于超过1000的分组发送
      if(mobile.length>1000){
        for(var i=0,len=mobile.length;i<len;i+=1000){
          yield Yunpian.batch_send({mobile:mobile.slice(i,i+1000),text:body.content})
        }
      }else {
        yield Yunpian.batch_send({mobile:mobile,text:body.content})
      }
      Logs.logsSave({
        lg_content: "发送短信【"+mobile.length+"】条",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:mobile.length})
    }catch(err) {
      console.log(err)
      return response.onError(res,{message:err})
    }
  })

};
