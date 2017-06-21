"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');;
var co = require('co');
var Logs=require("../controller/logs");
var StringBuilder = require('../../utils/StringBuilder');
var hx = require('../../utils/hxchat');

/**
 * 状态对应表
 * @param {number} status - 状态
 * @returns {string}
 */
function setStatus(status) {
  var statusDesc=''
  switch (status){
    case 0:
      statusDesc='未审核'
      break;
    case 1:
      statusDesc='审核失败'
      break;
    case 2:
      statusDesc='审核成功'
      break;
    case 3:
      statusDesc='重新提交'
      break;
    case -1:
      statusDesc='已删除'
      break;
  }
  return statusDesc
}
/**
 * 财务审核订单变化
 * @param {object} body - 更新的内容
 * @param {number} id - 更新的id
 * @returns {*}
 */
function examineUpdate(body,id) {
  return models.paymentOrder.update(body,{where:{id:id}})
}
/**
 * 通过订单id里面学员的课程信息
 * @param {number} id - 订单的id
 * @returns {*}
 */
function orderMemberDetail(id) {
  var sql=new StringBuilder();
/*  sql.AppendFormat("select classroom.classroom_area_city as area_name,classroom.classroom_name,classroom.classroom_areaid as areaid,classroom.classroom,classroom.classroom_name," +
      " uc.en_uid," +
      " goods.goodsid,goods.goods_name," +
      " member.mid,member.m_pics,member.m_name,member.m_phone,member.m_card," +
      " clerk.m_name as clerk " +
      "from gj_order_relevance_user as o " +
      "INNER JOIN gj_enroll_user_class as uc ON uc.en_uid=o.uid " +
      "INNER JOIN gj_enroll_lesson as en ON en.lesson_id=uc.en_key_name " +
      "INNER JOIN gj_goods as goods ON goods.goodsid=en.lesson_name " +
      "INNER JOIN gj_members as member ON member.mid=uc.en_mid " +
      "INNER JOIN gj_classroom as classroom ON classroom.classroom=uc.en_classroomid " +
      "INNER JOIN gj_members as clerk ON clerk.mid=uc.en_clerkid " +
      "INNER JOIN gj_sales as sales ON sales.sales_members=uc.en_clerkid " +
      "WHERE o.oid={0}",id)*/

  var info="classroom.classroom_area_city as area_name,classroom.classroom_areaid as areaid,classroom.classroom,classroom.classroom_name," +
      "uc.en_uid,uc.en_fee," +
      "goods.goodsid,goods.goods_name," +
      "member.mid,member.m_pics,member.m_name,member.m_phone,member.m_card," +
      "clerk.m_name as clerk ";
  var union="(select  " + info +
      "from gj_enroll_user_class as uc " +
      "INNER JOIN gj_enroll_lesson as en ON en.lesson_id=uc.en_key_name AND en.type=0 " +
      "INNER JOIN gj_goods as goods ON goods.goodsid=en.lesson_name " +
      "LEFT JOIN gj_classroom as classroom ON classroom.classroom=uc.en_classroomid " +
      "INNER JOIN gj_members as member ON member.mid=uc.en_mid " +
      "LEFT JOIN gj_members as clerk ON clerk.mid=uc.en_clerkid where en_form=1 " +
      "UNION ALL " +
      "select  "+ info +
      "from gj_enroll_user_class as uc " +
      "INNER JOIN gj_goods as goods ON goods.goodsid=uc.en_goodsid " +
      "LEFT JOIN gj_classroom as classroom ON classroom.classroom=uc.en_classroomid " +
      "INNER JOIN gj_members as member ON member.mid=uc.en_mid " +
      "LEFT JOIN gj_members as clerk ON clerk.mid=uc.en_clerkid where en_form=0) as client ";


  sql.AppendFormat("select client.* from "+ union)
  sql.AppendFormat("INNER JOIN gj_order_relevance_user as o ON o.uid=client.en_uid " +
      "where o.oid={0}",id)

  return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
/**
 * 通过信息确认学员是否存在
 * @param {object} where - 查询条件
 * @returns {*}
 */
function memberInfoTrue(where) {
  console.log(where)
  var sql=new StringBuilder();
  sql.Append("SELECT ucid FROM gj_userclass WHERE");
  where.forEach(function (node) {
    sql.AppendFormat(" uc_goodsid={0} AND uc_userid={1} OR",node.goodsid,node.mid)
  })
  var sqlString=sql.ToString()
  return models.sequelize.query(sqlString.substring(0,sqlString.length-3),{ type: models.sequelize.QueryTypes.SELECT });
}
/**
 * 订单列表
 * @param {object} where - 查询条件
 * @param {object} options - 分页信息
 * @param {number} options.limit
 * @param {number} options.offset
 * @returns {*}
 */
function orderList(where,options) {
 return models.paymentOrder.findAndCountAll({
   where:where,
   order:[['createdAt', 'DESC']],
   limit:options.pagesize,
   offset:options.offset,
   raw:true
 })
}
exports.list_render = function (req, res) {
    var branch = req.Branch
    var sql = new StringBuilder();
    co(function *() {
        try {
            sql.Append("select classroom.classroom classroomid,classroom.classroom_report_time,classroom.classroom_name from gj_classroom as classroom WHERE 1=1");
            if (branch) {
                sql.AppendFormat(" AND classroom.classroom={0}", branch);
            }
            var goodsList = yield models.Goods.findAll({attributes: ['goodsid', 'goods_name'], raw: true});
            models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (list) {
                return res.render('caiwu/list', {
                    title: '审核列表',
                    roomList: JSON.stringify(list),
                    goodsList: JSON.stringify(goodsList)
                });
            }).catch(function (err) {
                console.log(err)
            })
        } catch (err) {
            console.log(err);
        }
    })
};
exports.list_ajax = function (req, res) {
    var branch = req.Branch
    if (branch) {
        return res.send('没权限')
    }
    var options = utils.cms_get_page_options(req);
    var body = req.query;
    var where = [];
    var end_time;
    co(function *() {
        try {
            var select = new StringBuilder();
            var selectCount = new StringBuilder();
            var selectExport = new StringBuilder();
            //列表
            select.AppendFormat("SELECT * FROM (SELECT o.oid, client.* FROM (SELECT classroom.classroom_area_city AS area_name,");
            select.AppendFormat("classroom.classroom_areaid AS areaid,classroom.classroom,classroom.classroom_name,uc.en_uid,uc.en_fee,");
            select.AppendFormat("goods.goodsid,goods.goods_name,member.mid,member.m_pics,member.m_name,member.m_phone,member.m_card,");
            select.AppendFormat("clerk.m_name AS clerk FROM gj_enroll_user_class AS uc INNER JOIN gj_enroll_lesson AS en ON en.lesson_id = uc.en_key_name");
            select.AppendFormat(" AND en.type = 0 INNER JOIN gj_goods AS goods ON goods.goodsid = en.lesson_name LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            select.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            select.AppendFormat(" WHERE en_form = 1 UNION ALL SELECT classroom.classroom_area_city AS area_name,classroom.classroom_areaid AS areaid,");
            select.AppendFormat("classroom.classroom,classroom.classroom_name,uc.en_uid,uc.en_fee,goods.goodsid,goods.goods_name,member.mid,member.m_pics,");
            select.AppendFormat("member.m_name,member.m_phone,member.m_card,clerk.m_name AS clerk FROM gj_enroll_user_class AS uc");
            select.AppendFormat(" INNER JOIN gj_goods AS goods ON goods.goodsid = uc.en_goodsid LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            select.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            select.AppendFormat(" WHERE en_form = 0 ) AS client INNER JOIN gj_order_relevance_user AS o ON o.uid = client.en_uid) member");
            select.AppendFormat(" INNER JOIN (SELECT * FROM gj_payment_order) orders");
            select.AppendFormat(" ON member.oid=orders.id WHERE 1=1 ");
            //总行数
            selectCount.AppendFormat("SELECT COUNT(*) AS count FROM (SELECT o.oid, client.* FROM (SELECT classroom.classroom_area_city AS area_name,");
            selectCount.AppendFormat("classroom.classroom_areaid AS areaid,classroom.classroom,classroom.classroom_name,uc.en_uid,");
            selectCount.AppendFormat("goods.goodsid,goods.goods_name,member.mid,member.m_pics,member.m_name,member.m_phone,member.m_card,");
            selectCount.AppendFormat("clerk.m_name AS clerk FROM gj_enroll_user_class AS uc INNER JOIN gj_enroll_lesson AS en ON en.lesson_id = uc.en_key_name");
            selectCount.AppendFormat(" AND en.type = 0 INNER JOIN gj_goods AS goods ON goods.goodsid = en.lesson_name LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            selectCount.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            selectCount.AppendFormat(" WHERE en_form = 1 UNION ALL SELECT classroom.classroom_area_city AS area_name,classroom.classroom_areaid AS areaid,");
            selectCount.AppendFormat("classroom.classroom,classroom.classroom_name,uc.en_uid,goods.goodsid,goods.goods_name,member.mid,member.m_pics,");
            selectCount.AppendFormat("member.m_name,member.m_phone,member.m_card,clerk.m_name AS clerk FROM gj_enroll_user_class AS uc");
            selectCount.AppendFormat(" INNER JOIN gj_goods AS goods ON goods.goodsid = uc.en_goodsid LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            selectCount.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            selectCount.AppendFormat(" WHERE en_form = 0 ) AS client INNER JOIN gj_order_relevance_user AS o ON o.uid = client.en_uid) member");
            selectCount.AppendFormat(" INNER JOIN (SELECT * FROM gj_payment_order) orders");
            selectCount.AppendFormat(" ON member.oid=orders.id WHERE 1=1 ");
            if (body.start_time) {
                select.AppendFormat("AND orders.etime >= '{0}' ", body.start_time);
                selectCount.AppendFormat("AND orders.etime >= '{0}' ", body.start_time);
            }
            if (body.end_time) {
                end_time = body.end_time;
            } else {
                end_time = moment().format('YYYY-MM-DD HH:mm:ss');
            }
            select.AppendFormat(" AND orders.etime <= '{0}'", end_time);
            selectCount.AppendFormat(" AND orders.etime <= '{0}'", end_time);
            if (body.classroom && body.classroom != '0') {
                select.AppendFormat(" AND member.classroom = {0}", body.classroom);
                selectCount.AppendFormat(" AND member.classroom = {0}", body.classroom);
            }
            if (body.goodsid && body.goodsid != '0') {
                select.AppendFormat(" AND member.goodsid = {0}", body.goodsid);
                selectCount.AppendFormat(" AND member.goodsid = {0}", body.goodsid);
            }
            if(body.status && body.status != 'all'){
                select.AppendFormat(" AND orders.status = {0}", body.status);
                selectCount.AppendFormat(" AND orders.status = {0}", body.status);
            }
            // select.AppendFormat(" ORDER BY orders.status,orders.etime desc  ");
            select.AppendFormat("  order by find_in_set(orders.status,'0,3,2,1,-1'),orders.createdat desc  ");
            selectExport = select;
            var count = yield models.sequelize.query(selectCount.ToString(), {type: models.sequelize.QueryTypes.SELECT});//yield表示同步执行
            var exportDataList = yield models.sequelize.query(selectExport.ToString(), {type: models.sequelize.QueryTypes.SELECT});//yield表示同步执行
            select.AppendFormat(" LIMIT {0},{1}", options.offset, options.pagesize);
            models.sequelize.query(select.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (item) {
                item.forEach( function(node, index) {
                    node.etime = str.getUnixToTime(node.etime);
                    node.index = options.offset + index + 1;
                    node.statusDesc=setStatus(node.status);
                    if(node.etime == "Invalid date"){
                        node.etime = '';
                    }
                });
                exportDataList.forEach(function (node,index) {
                    node.etime = str.getUnixToTime(node.etime);
                    node.index = options.offset + index + 1;
                    node.statusDesc=setStatus(node.status);
                    if(node.etime == "Invalid date"){
                        node.etime = '';
                    }
                });
                return response.onSuccess(res, {list: item,exportDataList:exportDataList, pagecount: Math.ceil(count[0].count / options.pagesize)});
            });
        } catch (err) {
            console.log(err);
        }
    })
};
exports.detail = function (req, res) {
  var branch=req.Branch
  if(branch){
    return res.send('没权限')
  }
  var id=req.params.id;
  co(function *() {
    try{
      var detail=yield models.paymentOrder.findOne({where:{id:id},raw:true})
      if(!detail){
        return res.send('异常操作')
      }
      var list=yield orderMemberDetail(detail.id);
      var remakeList=yield Logs.remarkList(1,id)
      detail.pics=detail.pics.split(',');
      detail.aly=config.aly;
      detail.stime=str.getUnixToTime(detail.stime);
      detail.etime=(detail.etime).toString()=='Invalid Date'?'':str.getUnixToTime(detail.etime);
      detail.statusDesc=setStatus(detail.status)
      detail.list=list;

      detail.remakeList=remakeList;
      return response.onSuccess(res, {detail:detail})
    }catch (err){
      console.log(err)
    }
  })
};
exports.examine = function (req, res) {
  var body=req.body
  var branch=req.Branch
  if(branch){
    return res.send('没权限')
  }
  co(function *() {
    try{
      var status=body.status;
      if(status==1){
        //导入前的信息准备
        var memberDetail= yield orderMemberDetail(body.id);
/*        { areaid: 1,
            classroom: 1,
            classroom_name: '北京总院',
            en_uid: 537,
            goodsid: 1,
            goods_name: '思想的格局一期',
            mid: 3945,
            m_pics: '',
            m_name: '呵呵',
            m_phone: '17701089934',
            m_card: '',
            clerk: '郭北京2' }*/
        if(memberDetail.length==0){
          return response.onError(res,{message:'不存在学员'})
        }
        //信息验证 确认不是重复报名的学员
        var memberInfo= yield memberInfoTrue(memberDetail);
        if(memberInfo.length>0){
          return response.onError(res,{message:'存在重复报名'})
        }
        //客户报名，变为正式会员 TODO
        for(let i=0,len=memberDetail.length;i<len;i++){
          let info=memberDetail[i]//单条数据  进行报名
          var goods=yield models.Goods.findOne({where:{goodsid:info.goodsid}});
          var goodsgroup=yield models.Group.findOne({where:{group_goodid:info.goodsid,group_areaid:0,group_classroomid:0,group_type:1}});
          var classroomgroup=yield models.Group.findOne({where:{group_goodid:info.goodsid,group_areaid:info.areaid,group_classroomid:info.classroom}});
          if (!goodsgroup){//不存在全国通讯录
            goodsgroup=yield models.Group.create({
              groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
              group_owner:config.hx_admin,//群主
              group_name:goods.dataValues.goods_subtitle+'同学录',//群名称
              group_imgurl:config.hx_group_img,//群图片
              group_maxnums:2000,//群最大成员
              group_desc:goods.dataValues.goods_subtitle,//群描述
              group_goodid:info.goodsid,//产品id
              group_areaid:'0',//地区id
              group_classroomid:'0',//学区id
              group_type:1//全国通讯录
            })
          }
          if (!classroomgroup){//不存在全国通讯录
            yield new Promise(function(resolve,reject){
              hx.createhxgroup({groupname:info.classroom_name,desc:goods.dataValues.goods_subtitle,maxusers:2000,owner:config.hx_admin},function(err,result){
                if(!err){
                  resolve(result)
                }else {
                  reject(err)
                }
              })
            }).then(function(data){
              var result=(typeof data)=="string"?JSON.parse(data):data;
              var groupid=result.data.groupid;
              return models.Group.create({
                groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
                group_owner:config.hx_admin,//群主
                group_name:info.classroom_name,//群名称
                group_imgurl:config.hx_group_img,//群图片
                group_maxnums:2000,//群最大成员
                group_desc:goods.dataValues.goods_subtitle,//群描述
                group_goodid:info.goodsid,//产品id
                group_areaid:info.areaid,//地区id
                group_classroomid:info.classroom,//学区id
                group_type:3,//聊天室
                group_hxid:groupid
              })
            }).then(function(data){

              classroomgroup=data
            }).catch(function(err){
              console.log(err)
            })
          }
          //确保了全国群组和地区群组都存在 写事物
          yield new Promise(function (resolve,reject) {
            hx.reghxuser({username:info.mid},function(err,result){
              resolve(result)
            })
          }).then(function(data){
            console.log(classroomgroup)
            return new Promise(function(resolve,reject){
              hx.addhxgroupuser({username:info.mid,groupid:classroomgroup.dataValues.group_hxid+''},function(err,result){
                if(!err){
                  resolve(result)
                }else {
                  reject(err)
                }
              })
            })
          }).then(function(data){
            if(data){
              models.Groupuser.create({
                groupuser_user:info.mid,
                groupuser_group:goodsgroup.dataValues.groupid
              });
              models.Groupuser.create({
                groupuser_user:info.mid,
                groupuser_group:classroomgroup.dataValues.groupid
              })
              models.Userclass.create({
                uc_userphone:info.m_phone,
                uc_calssroomid:info.classroom,
                uc_areaid:info.areaid,
                uc_status:1,
                uc_calssroomname:info.classroom_name,
                uc_areaname:info.area_name,
                uc_goodsid:info.goodsid,
                uc_userid:info.mid
              })
              models.Members.update({m_status:1},{where:{mid:info.mid}})
            }
          }).then(function () {
            models.EnrollUserClass.update({en_status:1},{where:{en_mid:info.mid}})
            models.EnrollUserClass.update({en_pay_status:1},{where:{en_uid:info.en_uid}})
          }).catch(function(err){
            console.log(err)
          })
        }
        //状态变更 订单完结
        yield examineUpdate({status:2,etime:body.etime},body.id)
      }else {
        //未通过直接驳回
        yield examineUpdate({status:1},body.id)
      }
      //操作备注
      Logs.remarkSave(req,{
        key:body.id,
        type:1,
        content:body.desc
      })
      return response.onSuccess(res,{message:'ok'})
    }catch (err){
      console.log(err)
    }
  })
};

