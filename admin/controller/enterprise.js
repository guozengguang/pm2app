var models  = require('../../models');
var config=require('../../config/config');
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var StringBuilder = require('../../utils/StringBuilder');

var enterpriseList = (where,options) =>{
  "use strict";
  var item={rows:[],count:0};
  var sql=new StringBuilder();
  sql.AppendFormat("SELECT en.*,m.m_name,m.mid,m.m_type from gj_enterprise as en " +
      "INNER JOIN gj_enterprise_member as em ON em.enterprise=en.id " +
      "INNER JOIN gj_members as m ON m.mid=em.member WHERE 1=1 ")
  if(where.name){
    sql.AppendFormat("AND en.name LIKE '%{0}%' ",where.name)
  }
  sql.AppendFormat("LIMIT {0},{1}",options.offset,options.pagesize)
  var sqlCount=new StringBuilder();
  sqlCount.AppendFormat("SELECT count(*) as count from gj_enterprise as en " +
  "INNER JOIN gj_enterprise_member as em ON em.enterprise=en.id " +
  "INNER JOIN gj_members as m ON m.mid=em.member WHERE 1=1 ")
  if(where.name){
    sqlCount.AppendFormat("AND en.name LIKE '%{0}%' ",where.name)
  }
  return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
    item.rows=data
    return models.sequelize.query(sqlCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  }).then(function (count) {
    item.count=count[0].count
    return item
  }).catch(function (err) {
    console.log(err)
  })
}
exports.enterprise_render = function (req, res) {
  return res.render('enterprise/list', {
    title: '活动列表',
  });
};
exports.enterprise_list = function (req, res) {
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={}
  if(body.name){
    where.name=body.name
  }
  enterpriseList(where,options).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.index = options.offset + index + 1
        node.createdAt=Str.getUnixToTime(node.createdAt)
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
exports.enterprise_detail = function (req, res) {
  var body=req.query;
  models.Enterprise.findOne({
    where:{id:body.id},
    raw:true
  }).then(function (item) {
    item.pics=Str.AbsolutePath(item.pics)
    item.productPics=Str.AbsolutePath(item.productPics)
    return res.render('enterprise/detail', {
      title: '新建活动',
      item:item || {}
    });
  }).catch(function (err) {
    console.log(err)
  })
};
exports.enterprise_update = function (req,res) {
  var body=req.body
  models.Enterprise.update(body,{where:{id:body.id}}).then(function (item) {
    return response.onSuccess(res, {message:'ok'})
  }).catch(function (err) {
    console.log(err)
  })
}