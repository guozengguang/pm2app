"use strict";

var models  = require('../../models');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');;
var co = require('co');
var StringBuilder = require('../../utils/StringBuilder');
/**
 * 状态对应表
 * @param {number} status - 状态
 * @returns {string}
 */
function setStatus(status) {
  var statusDesc=''
  switch (status){
    case 0:
      statusDesc='未付款'
      break;
    case 1:
      statusDesc='付款完成'
      break;
  }
  return statusDesc
}
/**
 * 状态对应表
 * @param {number} status - 状态
 * @returns {string}
 */
function setType(type) {
    var typeDesc=''
    switch (type){
        case 1:
            typeDesc='微信'
            break;
        case 2:
            typeDesc='支付宝'
            break;
    }
    return typeDesc
}
exports.list_render = function (req, res) {
    return res.render('payment/list', {
        title: '付款码收款',
        goods:req.Goods,
        room:req.Classroom
    });
};
exports.list_ajax = function (req, res) {
    co(function *() {
        var body=req.query;
        var options=utils.cms_get_page_options(req);
        var where={};
        var sql=new StringBuilder();
        var sqlCount=new StringBuilder();
        sql.AppendFormat("select p.*,g.goods_name as goods,c.classroom_name as calssroom from gj_payment_code as p " +
            "inner join gj_goods as g on g.goodsid=p.goods " +
            "inner join gj_classroom as c on c.classroom=p.calssroom " +
            "where 1=1 ")
        //总条数查询
        sqlCount.AppendFormat("select count(*) as count from gj_payment_code as p " +
            "inner join gj_goods as g on g.goodsid=p.goods " +
            "inner join gj_classroom as c on c.classroom=p.calssroom " +
            "where 1=1 ")
        if(body.goods){
            sql.AppendFormat("and goods={0} ",body.goods)
            sqlCount.AppendFormat("and goods={0} ",body.goods)
        }
        if(body.calssroom){
            sql.AppendFormat("and calssroom={0} ",body.calssroom)
            sqlCount.AppendFormat("and calssroom={0} ",body.calssroom)
        }
        if(body.name){
            sql.AppendFormat("and name like '%{0}%' ",body.name)
            sqlCount.AppendFormat("and name like '%{0}%' ",body.name)
        }
        if(body.tel){
            sql.AppendFormat("and tel like '%{0}%' ",body.tel)
            sqlCount.AppendFormat("and tel like '%{0}%' ",body.tel)
        }
        if(body.stime){
            sql.AppendFormat("and p.createdat>'{0}' ",body.stime)
            sqlCount.AppendFormat("and p.createdat>'{0}' ",body.stime)
        }
        if(body.etime){
            sql.AppendFormat("and p.createdat < '{0}' ",body.etime)
            sqlCount.AppendFormat("and p.createdat < '{0}' ",body.etime)
        }
        sql.AppendFormat("ORDER BY p.createdat DESC LIMIT {0},{1}",options.offset,options.pagesize);
        try{
            var list = yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            var count = yield models.sequelize.query(sqlCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            list.forEach( function(node, index) {
                node.index = options.offset + index + 1
                node.createdat = str.getUnixToTime(node.createdat)
                node.typeDesc = setType(node.type)
                node.statusDesc = setStatus(node.status)
            });
            return response.onSuccess(res, {
                list:list,
                pagecount: Math.ceil(count[0].count / options.pagesize)
            })
        }catch (err){
            console.log(err)
            return response.onError(res,'没有数据')
        }
    })
};

