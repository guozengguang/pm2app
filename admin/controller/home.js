var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var _ = require('lodash');
var Logs=require("../controller/logs");
var Database=require("../../database");
//首页配置
exports.home_render = function (req, res) {
  return res.render('home/list', {
    title: '首页配置',
    item:Database.homeType
  });
};
exports.home_item = function (req, res) {
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={};
  var item={rows:[],count:0};
  var current=[];
  co(function *() {
    try{
      current=yield models.HomeItem.findAll({
        where:{subitem_home:body.id,subitem_status:1},
        attributes:[['subitem_key','id']],
        raw:true
      }).then(function (item) {
        arr=[];
        item.map(function (node) {
          arr.push(node.id)
        })
        return arr
      })
      console.log(current)
      switch (body.type){
        case '1':
          if(current.length>0){
            where.goodsid={"$notIn":current}
          }
          item=yield models.Goods.findAndCountAll({
            where:where,
            order:[['createdAt', 'DESC']],
            attributes:[['goods_name','name'],['goodsid','id']],
            limit:options.pagesize,
            offset:options.offset
          });
          break;
        case '2':
          if(current.length>0) {
            where.activity_id = {"$notIn": current}
          }
          item=yield models.Activity.findAndCountAll({
            where:where,
            order:[['createdAt', 'DESC']],
            attributes:[['activity_title','name'],['activity_id','id']],
            limit:options.pagesize,
            offset:options.offset
          });
          break;
        case '3':
        case '9':
          where.special_parent=0;
          if(current.length>0) {
            where.special_id = {"$notIn": current}
          }
          item=yield models.Special.findAndCountAll({
            where:where,
            order:[['createdAt', 'DESC']],
            attributes:[['special_title','name'],['special_id','id']],
            limit:options.pagesize,
            offset:options.offset
          });
          break;
        case '4':
          where.m_type=1
          if(current.length>0) {
            where.mid = {"$notIn": current}
          }
          item=yield models.Members.findAndCountAll({
            where:where,
            order:[['createdAt', 'DESC']],
            attributes:[['m_name','name'],['mid','id']],
            limit:options.pagesize,
            offset:options.offset
          });
          break;
        case '6':
          where.p_id=2
          if(current.length>0) {
            where.pi_id = {"$notIn": current}
          }
          item=yield models.PlacesItem.findAndCountAll({
            where:where,
            order:[['createdAt', 'DESC']],
            attributes:[['pi_name','name'],['pi_id','id']],
            limit:options.pagesize,
            offset:options.offset
          });
          break;
        case '8':
          where.international_parent=0;
          if(current.length>0) {
            where.international_id = {"$notIn": current}
          }
          item=yield models.International.findAndCountAll({
            where:where,
            order:[['createdAt', 'DESC']],
            attributes:[['international_title','name'],['international_id','id']],
            limit:options.pagesize,
            offset:options.offset
          });
          break;
      }
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.index = options.offset + index + 1,
        node.dataValues.type = body.type
      });
      return response.onSuccess(res, {
        list:list,
        pagecount: Math.ceil(item.count / options.pagesize)
      })
    }catch (err){
      console.log(err)
      return response.onError(res,{message:err.toString()})
    }
  })
};
exports.home_list = function (req, res) {
  var where={};
  models.Home.findAll({
    where:{home_status:1},
    include:[{
      model:models.HomeItem,
      as:'Item',
      where:{subitem_status:1},
      required: false,
    }],
    order:[
      ['home_sort','DESC'],
      [{ model: models.HomeItem, as: 'Item' },'subitem_sort','DESC']
    ]
  }).then(function(item){
    'use strict'
    if (item) {
      item.forEach( function(node, index) {
        var node=node.dataValues;
        node.index = index + 1
      });
      return response.onSuccess(res, {
        list:item,
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
  });
};
exports.home_create = function (req, res) {
  var body=req.body;
  for (var i=0,len=Database.homeType.length;i<len;i++){
    var type=Database.homeType[i]
    if(type.id==body.home_type){
      body.home_img=type.name;
      break;
    }
  }
  models.Home.create(body).then(function(item){
    Logs.logsSave({
      lg_content: "新增首页配置【"+body.home_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.home_item_create = function (req, res) {
  var body=req.body;
  models.HomeItem.create({
    subitem_title:body.title,
    subitem_home:body.home,
    subitem_key:body.id,
    subitem_sort:body.sort
  }).then(function(item){
    Logs.logsSave({
      lg_content: "首页配置新子项【"+body.title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.home_item_update = function (req, res) {
  var body=req.body;
  models.HomeItem.update(body,{where:{subitem_id:body.subitem_id}}).then(function(item){
    Logs.logsSave({
      lg_content: "更新首页子项目【"+body.subitem_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.home_update = function (req, res) {
  var body=req.body;
  console.log(body)
  models.HomeItem.findOne({
    where:{subitem_home:body.home_id,subitem_status:1},
    raw:true
  }).then(function (data) {
    if(data && body.home_status==0){
      return response.onError(res, {message:'存在子模块'});
    }else {
      //如果存在子模块是不能删除的
      models.Home.update(body,{where:{home_id:body.home_id}}).then(function(item){
        Logs.logsSave({
          lg_content: "更新首页模块【"+body.home_title+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
        return response.onSuccess(res, {message:'操作成功'});
      }, function(err){
        console.log(err);
        return response.onError(res, {message:err.errors[0].message});
      })
    }
  })
};

//app启动图部分
/**
 * 启动图列表
 * @param where
 * @param options
 */
function diagramList(where) {
  return models.Diagram.findAndCountAll({
    where:where,
    order:[['stime', 'DESC']],
    raw:true
  })
}
/**
 * 新建启动图
 * @param body
 */
function diagramCreate(body) {
  console.log(body)
  return models.Diagram.create(body)
}
/**
 * 更新启动图
 * @param where
 * @param body
 */
function diagramUpdate(where,body) {
  return models.Diagram.update(body,{where:where})
}
exports.diagram_render = function (req, res) {
  return res.render('home/diagram', {
    title: '首页配置'
  });
};
exports.diagram_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={status:1}
  diagramList(where,options).then(function (item) {
    var list=item.rows;
    list.forEach( function(node, index) {
      node.stime=Str.getUnix(node.stime)
      node.etime=Str.getUnix(node.etime)
      node.pics=Str.AbsolutePath(node.pics)
      node.index = options.offset + index + 1;
    });
    return response.onSuccess(res, {
      list:list,
      pagecount: Math.ceil(item.count / options.pagesize)
    })
  }).catch(function (err) {
    console.log(err)
  })
};
exports.diagram_create = function (req, res) {
  var body=req.body;
  body.stime=Str.getUnixToTime(body.stime)
  body.etime=Str.getUnixToTime(body.etime)
  diagramCreate(body).then(function () {
    return response.onSuccess(res,{message:'ok'})
  }).catch(function (err) {
    console.log(err)
  })
};
exports.diagram_update = function (req, res) {
  var body=req.body;
  diagramUpdate({id:body.id},{status:0}).then(function () {
    return response.onSuccess(res,{message:'ok'})
  }).catch(function (err) {
    console.log(err)
  })
};