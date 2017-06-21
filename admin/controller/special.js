var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var _ = require('lodash');
var Logs=require("../controller/logs");

exports.special_render = function (req, res) {
  return res.render('special/list', {
    title: '专辑列表',
  });
};
exports.special_subset_render = function (req, res) {
  var body=req.query;
  models.Special.findOne({
    where:{special_id:body.id},raw:true
  }).then(function(item){
    if (item) {
      return res.render('special/subset/list', {
        title: '子专辑列表',
        item:item
      })
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })

};
exports.special_list = function (req, res) {
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={special_parent:0};
  var order=[['createdAt', 'DESC']]
  if(body.special_parent){
    where.special_parent=body.special_parent;
    order=[['createdAt']]
  }
  models.Special.findAndCountAll({
    where:where,
    order:order,
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.index = options.offset + index + 1
        node.dataValues.createdAt = Str.getUnixToTime(node.dataValues.createdAt)
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
};
exports.special_add_render = function (req, res) {
  return res.render('special/add', {
    title: '新建专辑',
  });
};
exports.special_subset_add_render = function (req, res) {
  var body=req.query
  return res.render('special/subset/add', {
    title: '新增子专辑',
    id:body.id
  });
};
exports.special_create = function (req, res) {
  var body=req.body;
  models.Special.create(body).then(function(item){
    if(body.attachid){
      var id=item.dataValues.special_id;
      var prd={
        prdid:id,
        attachid:body.attachid,
        prd_pics:body.special_img,
        prd_type:30
      }
      models.Prdattach.create(prd)
    }
    Logs.logsSave({
      lg_content: "新建专辑【"+body.special_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err);
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.special_edit_render = function (req, res) {
  var body=req.query;
  models.Special.findOne({
    where:{special_id:body.id}
  }).then(function(item){
    if (item) {
      return res.render('special/edit', {
        title: '专辑维护',
        item:item,
        aly:config.aly
      });
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })
};
exports.special_subset_edit_render = function (req, res) {
  var body=req.query;
  models.Special.findOne({
    where:{special_id:body.id},
    raw:true
  }).then(function(item){
    if (item) {
      models.Prdattach.getPrdidAndType({type:30,id:item.special_id}).then(function (data) {
        return res.render('special/subset/edit', {
          title: '子专辑维护',
          item:item,
          data:data.length>0?data[0]:{},
          aly:config.aly
        });
      })
    }
  },function(err){
    console.log(err);
    return res.render(err);
  })
};
exports.special_update = function (req, res) {
  var body=req.body;
  models.Special.update(body,{
    where:{special_id:body.special_id}
  }).then(function(items) {
    if(body.attachid && !body.prdattachid){//新增附件
      var prd={
        prdid:body.special_id,
        attachid:body.attachid,
        prd_pics:body.special_img,
        prd_type:30
      }
      models.Prdattach.create(prd)

    }else if(body.prdattachid){
      var prd={
        attachid:body.attachid,
        prd_pics:body.special_img
      }
      models.Prdattach.update(prd,{where:{prdattachid:body.prdattachid}})
    }
    Logs.logsSave({
      lg_content: "更改专辑【"+body.special_title+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
    return response.onError(res, {message:err.errors[0].message});
  })
};
exports.special_video_render = function (req,res){
  var body=req.query;
  return res.render('special/subset/video', {
    title: '关联视频',
    aly:config.aly
  });
};