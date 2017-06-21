"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var response = require('../../utils/response');
var moment = require('moment');
var utils = require('../../utils/page');
var co = require('co');

exports.logs_render = function (req, res) {
  res.render('operatorlogs/logs', {
    title: '操作日志'
  });
};
exports.logs_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var user_login=req.query.user_login;
  var where={}
  co(function* () {
    if(user_login){  
      var user=yield models.User.findOne({
        where:{user_login:user_login}
      }).then(function(items){
        where.uid=items.dataValues.uid
      },function(err){
        console.log(err);
      })
    }
    var logs=yield models.Log.findAll({
      where:where,
      include:[{
        attributes:['user_login'],
        model:models.User,
        as:'ul'
      }],
      order:[['createdAt','DESC']],
      limit:options.pagesize,
      offset:options.offset
    });
    var count=yield models.Log.findAndCountAll({
      where:where,
      include:[{
        attributes:['user_login'],
        model:models.User,
        as:'ul'
      }]
    });
    logs.forEach(function(node,index){
      node.dataValues.createdAt = moment(node.dataValues.createdAt).format('YYYY-MM-DD HH:mm:ss');
      node.dataValues.index = options.offset + index + 1
    })
    count=count.count;   
    return response.onSuccess(res, {
      list:logs,
      pagecount: Math.ceil(count / options.pagesize)
    })
  }).catch(function(e) {
    console.log(e);
  });
};
exports.logsSave = function (body) {
  models.Log.create(body).then(function() {
    return "ok";
  })
};
exports.logs_del=function(req,res){
  var id=req.query.id
  models.Log.destroy({
    where:{lg_id: id}
  }).then(function(){
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
    return response.onError(res,{message:"失败"});
  })
};
/**
 * 添加备注
 * @param {object} req
 * @param {object} body
 * @param {number} body.key - 外键
 * @param {number} body.type - 类型
 * @param {number} body.content - 内容
 * @returns {body}
 */
exports.remarkSave = function (req,body) {
  body.ip=req.ip
  body.create=req.session.user.user_login
  return models.Remark.create(body)
};
/**
 * 备注列表
 * @param {number} type - 类型
 * @param {number} key - 外键
 * @returns {body}
 */
exports.remarkList = function (type,key) {
  return models.Remark.findAll({
    where:{key:key,type:type},
    raw:true,
    attributes:['content','create','createdAt']
  })
};