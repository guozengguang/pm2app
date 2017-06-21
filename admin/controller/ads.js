var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var _ = require('lodash');
var Logs=require("../controller/logs");

exports.adsAll = function(req,res,next){
  co(function* () {
    var placesitemtype=yield models.PlacesItemType.findAll();
    req.placesitemtype=placesitemtype?placesitemtype:[];
    next()
  }).catch(function(e) {
    console.log(e);
  });
}
exports.ads_render = function (req, res) {
  return res.render('ads/ads', {
    title: '广告位管理',
  });
};
exports.ads_list = function (req, res) {
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={}
  if(body.p_id){
    where.p_id=body.p_id
  }
  if(body.pi_type){
    where.pi_type=body.pi_type
  }
  if(body.status){
    switch (body.status){
      case '1'://显示中
        _.merge(where,{
          '$and': [
            {'pi_stime': {"$lt":moment()}},
            {'pi_etime': {"$gt":moment()}},
            {'pi_status': 0}
          ]
        })
        break;
      case '2'://未开始
        where.pi_stime={"$gt":moment()}
        break;
      case '3'://已到期 @ 已下架
        _.merge(where,{
          '$or': [
            {'pi_etime': {"$lt":moment()}},
            {'pi_status': 1}
          ]
        })
        break;
    }
  }
  co(function* () {
    var placesitem=yield models.PlacesItem.findAll({
      where:where,
      order:[['pi_stime']],
      limit:options.pagesize,
      offset:options.offset
    });
    var count=yield models.PlacesItem.findAndCountAll({
      where:where
    });
    placesitem.forEach(function(node,index){
      var node=node.dataValues;
      var  s=1
      if(node.pi_stime>moment()){
        s=2
      }
      if(node.pi_etime<moment()){
        s=3
      }
      if(node.pi_status==1){
        s=3
      }
      node.s=s;
      node.pi_stime = moment(node.pi_stime).format('YYYY-MM-DD HH:mm:ss');
      node.pi_etime = moment(node.pi_etime).format('YYYY-MM-DD HH:mm:ss');
      //通过时间课状态判断当前广告状态
      node.index = options.offset + index + 1;
    })
    count=count.count;
    response.onSuccess(res, {
      list:placesitem,
      pagecount: Math.ceil(count / options.pagesize),
      req:req.cookies
    })
  }).catch(function(e) {
    console.log(e);
  });
};
exports.ads_add_render = function (req, res) {
  return res.render('ads/ads_add', {
    title: '添加广告位',
    placesitemtype:req.placesitemtype,
    aly:config.aly
  });
};
exports.ads_create = function (req, res) {
  var body=req.body;
  models.PlacesItem.create(body).then(function(item){
    Logs.logsSave({
      lg_content: "添加广告位【"+body.pi_name+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.ads_edit_render = function (req, res) {
  var pi_id=req.query.pi_id;
    models.PlacesItem.findOne({
      where:{pi_id:pi_id}
    }).then(function(item){
      if (item) {
        item.dataValues.pi_stime = moment(item.dataValues.pi_stime).format('YYYY-MM-DD HH:mm:ss');
        item.dataValues.pi_etime = moment(item.dataValues.pi_etime).format('YYYY-MM-DD HH:mm:ss');
        item.dataValues.pi_img = Str.AlyPath(item.dataValues.pi_img);
        return res.render('ads/ads_edit', {
          title: '编辑广告位',
          item:item,
          placesitemtype:req.placesitemtype,
          aly:config.aly
        });
      }
    },function(err){
      console.log(err);
      return res.render(err);
    })
};
exports.ads_update = function (req, res) {
  var body=req.body;
  var pi_id=body.pi_id;
  delete body.pi_id;
  models.PlacesItem.findOne({
    where:{pi_id:pi_id}
  }).then(function(items) {
    items.update(body).then(function(){
      Logs.logsSave({
        lg_content: "更新广告位【"+body.pi_name+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:"操作成功"});
    },function(err){
      console.log(err)
      return response.onError(res, {message:err.errors[0].message});
    });
  },function(err){
    console.log(err)
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.ads_autocomplete = function(req,res){
  var body=req.query
  co(function *(){
    try{
      var ads=yield models.PlacesItem.getComplete({vi_val:body.vi_val});
      response.onSuccess(res, {list:ads})
    }catch (err){
      console.log(err)
      return response.onError(res, {message:err.errors[0].message});
    }
  })
}