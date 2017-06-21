"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var sms = require('../../utils/sms');
var co = require('co');
var Logs=require("../controller/logs");
var StringBuilder = require('../../utils/StringBuilder');
var informConfig={//登陆短信配置
    appId: '8aaf07085a3c0ea1015a4ac65d4f0696',//应用id
    templateId: '155197',//短信模板id
    accountSid: '8a48b55153eae51101540dc38ef1365c',//主账户id
    authtoken: 'db6ea888164c485fb64fb6c0122a938d',//token
    lostdata: '30',//短信失效时间
    host: "app.cloopen.com",  //主域名
    port: 8883  //端口
}


/**
 * 状态应对表
 * @param {number} status - 状态
 * @returns {string}
 */
var setStatus = (status) =>  {
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
 * 获取客户列表
 * @param {object} where - 查询条件（筛选条件）
 * @param {object} options - 分页参数
 * @returns {Promise.<TResult>}
 */
var getList = (where,options) => {
    var item={raws:[],count:0};
    var sql=new StringBuilder();
    var statisticSql = "";
    var info="uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_channel,uc.en_uid,uc.en_classroomid,uc.en_clerkid,uc.en_desc,uc.en_mid,classroom.classroom_name,goods.goodsid,goods.goods_name,member.m_name,member.m_phone,member.m_card,member.m_company,member.m_position,clerk.m_name as clerk,clerk.m_phone as clerk_phone,uc.en_time as time ";
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

    sql.AppendFormat("select client.*,sales.sales_classroom,(CASE " +
        "WHEN client.en_status=1 THEN 1 " +
        "WHEN client.en_status=0 AND client.en_clerkid=0 OR (client.en_clerkid!=0 AND client.en_follow_status=0) THEN 2 " +
        "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 3 " +
        "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) AND client.time<= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 4 " +
        "ELSE 5 " +
        "END) as status" +
        " from "+ union)
    sql.AppendFormat("LEFT JOIN gj_sales as sales ON sales.sales_members=client.en_clerkid " +
        "LEFT JOIN gj_classroom as c ON sales.sales_classroom=c.classroom " +
        "where 1=1 ")
    //1 正式 2意向的 3正常的 4即将过期 5过期的
    if(where.status){
        sql.AppendFormat("AND (CASE " +
            "WHEN client.en_status=1 THEN 1 " +
            "WHEN client.en_status=0 AND client.en_clerkid=0 OR (client.en_clerkid!=0 AND client.en_follow_status=0) THEN 2 " +
            "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 3 " +
            "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) AND client.time<= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 4 " +
            "ELSE 5 " +
            "END) IN ({0}) ",where.status);
    }
    if(where.phone){
        sql.AppendFormat("AND (client.m_name LIKE '%{0}%' OR client.m_phone LIKE '%{0}%') ",where.phone);
    }
    if(where.all){
        sql.AppendFormat("AND client.en_classroomid={0} ",where.all);
    }
    if(where.myPayStatus){
        sql.AppendFormat("AND client.en_pay_status={0} ",where.myPayStatus);
    }
    if(where.payStatus){
        sql.AppendFormat("AND client.en_pay_status={0} ",where.payStatus);
        sql.AppendFormat("AND client.en_uid NOT IN (SELECT us.uid FROM gj_order_relevance_user as us " +
            "INNER JOIN gj_payment_order as p ON p.id=us.oid AND p.status in (0,2,3))");
    }
    if(where.branch){
        sql.AppendFormat("AND client.en_classroomid={0} AND sales.sales_classroom IS NOT NULL ",where.branch)
    }
    /*start*/
    statisticSql = sql.ToString();
    /*end*/
    sql.AppendFormat("order by client.time DESC LIMIT {0},{1}",options.offset,options.pagesize);

    var sqlCount=new StringBuilder();
    sqlCount.AppendFormat("select count(*) as count from "+ union)
    sqlCount.AppendFormat("LEFT JOIN gj_sales as sales ON sales.sales_members=client.en_clerkid " +
        "LEFT JOIN gj_classroom as c ON sales.sales_classroom=c.classroom " +
        "where 1=1 ")
    if(where.status){
        sqlCount.AppendFormat("AND (CASE " +
            "WHEN client.en_status=1 THEN 1 " +
            "WHEN client.en_status=0 AND client.en_clerkid=0 OR (client.en_clerkid!=0 AND client.en_follow_status=0) THEN 2 " +
            "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 3 " +
            "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) AND client.time<= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 4 " +
            "ELSE 5 " +
            "END) IN ({0}) ",where.status);
    }
    if(where.phone){
        sqlCount.AppendFormat("AND (client.m_name LIKE '%{0}%' OR client.m_phone LIKE '%{0}%') ",where.phone);
    }
    if(where.all){
        sqlCount.AppendFormat("AND client.en_classroomid={0} ",where.all);
    }
    if(where.myPayStatus){
        sqlCount.AppendFormat("AND client.en_pay_status={0} ",where.myPayStatus);
    }
    if(where.payStatus){
        sqlCount.AppendFormat("AND client.en_pay_status={0} ",where.payStatus);
        sqlCount.AppendFormat("AND client.en_uid NOT IN (SELECT us.uid FROM gj_order_relevance_user as us " +
            "INNER JOIN gj_payment_order as p ON p.id=us.oid AND p.status in (0,2,3))");
    }
    if(where.branch){
        sqlCount.AppendFormat("AND client.en_classroomid={0} AND sales.sales_classroom IS NOT NULL ",where.branch)
    }

    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
        data.forEach(function (node) {
            switch (node.status){
                case 1:
                    node.statusDesc='正式'
                    break;
                case 2:
                    node.statusDesc='意向'
                    break;
                case 3:
                    node.statusDesc='报备'
                    break;
                case 4:
                    node.statusDesc='即将过期'
                    break;
                case 5:
                    node.statusDesc='过期'
                    break;
            }
        })
        item.raws=data
        return models.sequelize.query(sqlCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
    }).then(function (count) {
        item.count=count[0].count;
        item.statisticSql=statisticSql;
        return item
    }).catch(function (err) {
        console.log(err)
    })
}
/**
 *  通过报备id获取报备人员姓名
 * @param id - 报备id
 * @returns {*}
 */
var getClerk = (id) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as name,m.m_phone,sales.sales_classroom as classroom from gj_enroll_user_class as uc " +
        "INNER JOIN gj_members as m ON m.mid=uc.en_clerkid  " +
        "INNER JOIN gj_sales as sales ON m.mid=sales.sales_members  " +
        "WHERE uc.en_uid={0}",id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
}
/**
 * 通过报备id 变更此人员下面所有招生老师
 * @param mid - 招生老师id
 * @param uid - 报备id
 * @returns {*}
 */
var updateClerk = (mid,uid) => {
    var sql=new StringBuilder();
    sql.AppendFormat("update gj_enroll_user_class SET gj_enroll_user_class.en_clerkid={0},gj_enroll_user_class.en_time=now() WHERE gj_enroll_user_class.en_mid IN " +
        "(select b.en_mid from (select gj_enroll_user_class.en_mid from gj_enroll_user_class WHERE gj_enroll_user_class.en_uid={1}) as b)",mid,uid);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE });
}
/**
 * 通过报备id 获取需要变更的记录条数id
 * @param uid - 报备id
 * @returns {*}
 */
var getUserClassList = (uid) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select gj_enroll_user_class.en_uid as uid,gj_enroll_user_class.en_mid as mid from gj_enroll_user_class WHERE gj_enroll_user_class.en_mid IN " +
        "(select b.en_mid from (select gj_enroll_user_class.en_mid from gj_enroll_user_class WHERE gj_enroll_user_class.en_uid={0}) as b)",uid);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
/**
 * 更新报备的信息
 * @param body - 修改的内容
 * @param where - 修改的条件
 * @returns {*}
 */
var updateClassRoom = (body,where) => {
    return models.EnrollUserClass.update(body,where)
}
/**
 * 获取报备的分院名称
 * @param uid - 报备id
 * @returns {*}
 */
var getUserClassRoomName = (uid) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select c.classroom_name as name,c.classroom as id from gj_enroll_user_class as uc " +
        "LEFT JOIN gj_classroom as c ON c.classroom=uc.en_classroomid where en_uid={0}",uid);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
/**
 * 新增申请审核
 * @param body - 需要记录的数据
 * @returns {Promise.<Array.<Instance>>}
 */
var setApply = (body) => {
    return models.Apply.create(body)
}
/**
 * 更新申请审核
 * @param body - 需要记录的数据
 * @returns {Promise.<Array.<Instance>>}
 */
var updateApply = (body,where) => {
    return models.Apply.update(body,where)
}
/**
 * 获取申请列表
 * @param where
 * @param options
 * @param proof 枚举项目
 * @returns {*}
 */
var getApplyList = (where,options,proof) => {
    console.log(where)
    var item={rows:[],count:0};
    var sql=new StringBuilder();
    var sqlCount=new StringBuilder();
    switch (where.type) {
        case 1:
            //记录查询
            sql.AppendFormat("select m.m_name,m.m_phone," +
                "clerk.m_name as clerk_name," +
                "CASE uc.en_form WHEN '1' THEN lesson.goods_name ELSE goods.goods_name END as gname," +
                "oldc.classroom_name as old_name," +
                "record.new_value as value," +
                "uc.en_uid," +
                "newc.classroom_name as new_name," +
                "apply.createdAt as time,apply.id,apply.status from gj_apply as apply " +
                "INNER JOIN gj_enroll_user_class as uc ON uc.en_uid=apply.foreign " +
                "INNER JOIN gj_apply_record as record ON record.key=apply.id " +
                "INNER JOIN gj_classroom as newc ON record.new_value=newc.classroom " +
                "INNER JOIN gj_members as clerk ON uc.en_clerkid=clerk.mid " +
                "INNER JOIN gj_members as m ON uc.en_mid=m.mid " +
                "INNER JOIN gj_classroom as oldc ON record.old_value=oldc.classroom " +
                "LEFT JOIN gj_goods as goods ON goods.goodsid=uc.en_goodsid " +
                "LEFT JOIN gj_enroll_lesson as en ON en.lesson_id=uc.en_key_name AND en.type=0 " +
                "LEFT JOIN gj_goods as lesson ON lesson.goodsid=en.lesson_name " +
                "WHERE apply.type=1 ")
            if(where.branch){
                sql.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            if(where.phone){
                sql.AppendFormat("AND (m.m_phone like '%{0}%' OR m.m_name like '%{0}%') ",where.phone);
            }
            if(where.status){
                sql.AppendFormat("AND apply.status={0} ",where.status);
            }
            sql.AppendFormat(" ORDER BY apply.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
            //总条数查询
            sqlCount.AppendFormat("select count(*) as count from gj_apply as apply " +
                "INNER JOIN gj_enroll_user_class as uc ON uc.en_uid=apply.foreign " +
                "INNER JOIN gj_members as m ON uc.en_mid=m.mid " +
                "WHERE apply.type=1 ")
            if(where.branch){
                sqlCount.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            if(where.phone){
                sqlCount.AppendFormat("AND (m.m_phone like '%{0}%' OR m.m_name like '%{0}%') ",where.phone);
            }
            if(where.status){
                sqlCount.AppendFormat("AND apply.status={0} ",where.status);
            }
            break;
        case 2:
            //记录查询
            sql.AppendFormat("select m.m_name,m.m_phone," +
                "newm.m_name as new_name," +
                "oldm.m_name as old_name," +
                "record.new_value as value," +
                "apply.createdAt as time,apply.id,apply.status,apply.foreign as mid from gj_apply as apply " +
                "INNER JOIN gj_members as m ON apply.foreign=m.mid " +
                "INNER JOIN gj_apply_record as record ON record.key=apply.id " +
                "LEFT JOIN gj_members as newm ON record.new_value=newm.mid " +
                "LEFT JOIN gj_members as oldm ON record.old_value=oldm.mid " +
                "WHERE apply.type=2 ")
            if(where.branch){
                sql.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            if(where.phone){
                sql.AppendFormat("AND (m.m_phone like '%{0}%' OR m.m_name like '%{0}%') ",where.phone);
            }
            if(where.status){
                sql.AppendFormat("AND apply.status={0} ",where.status);
            }
            sql.AppendFormat(" ORDER BY apply.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
            //总条数查询
            sqlCount.AppendFormat("select count(*) as count from gj_apply as apply " +
                "INNER JOIN gj_members as m ON apply.foreign=m.mid " +
                "WHERE apply.type=2 ")
            if(where.branch){
                sqlCount.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            if(where.phone){
                sqlCount.AppendFormat("AND (m.m_phone like '%{0}%' OR m.m_name like '%{0}%') ",where.phone);
            }
            if(where.status){
                sqlCount.AppendFormat("AND apply.status={0} ",where.status);
            }
            break;
        case 3:
            //记录查询
            sql.AppendFormat("select m.mid,m.m_phone,apply.createdAt as time,apply.id,apply.status,")
            proof.forEach(function (node,index) {
                if(index!=proof.length-1){
                    sql.AppendFormat("max(case when record.name = '{0}' then record.old_value else null end) as {1},",node.name,node.name)
                    sql.AppendFormat("max(case when record.name = '{0}' then record.new_value else null end) as {1},",node.name,node.name+'_n')
                }else {
                    sql.AppendFormat("max(case when record.name = '{0}' then record.old_value else null end) as {1},",node.name,node.name)
                    sql.AppendFormat("max(case when record.name = '{0}' then record.new_value else null end) as {1} ",node.name,node.name+'_n')

                }
            })
            sql.AppendFormat("from gj_apply as apply " +
                "INNER JOIN gj_members as m ON apply.foreign=m.mid " +
                "INNER JOIN gj_apply_record as record ON record.key=apply.id " +
                "WHERE apply.type=3 ")
            if(where.branch){
                sql.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            if(where.phone){
                sql.AppendFormat("AND (m.m_phone like '%{0}%' OR m.m_name like '%{0}%') ",where.phone);
            }
            if(where.status){
                sql.AppendFormat("AND apply.status={0} ",where.status);
            }
            sql.AppendFormat("group by mid,id,time,status ");
            sql.AppendFormat(" ORDER BY apply.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
            //总条数查询
            sqlCount.AppendFormat("select count(*) as count from gj_apply as apply " +
                "INNER JOIN gj_members as m ON apply.foreign=m.mid " +
                "WHERE apply.type=3 ")
            if(where.branch){
                sqlCount.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            if(where.phone){
                sqlCount.AppendFormat("AND (m.m_phone like '%{0}%' OR m.m_name like '%{0}%') ",where.phone);
            }
            if(where.status){
                sqlCount.AppendFormat("AND apply.status={0} ",where.status);
            }
            break;
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
};
/**
 * 设置申请审核的记录值
 * @param {Array} records - 需要记录的数据
 * @returns {Promise.<Array.<Instance>>}
 */
var setApplyRecord = (records) => {
    return models.ApplyRecord.bulkCreate(records)
}
/**
 * 获取单个申请的所有记录
 * @param id - 外键id
 * @returns {*}
 */
var getApplyRecord = (id) => {
    return models.ApplyRecord.findAll({
        where:{
            key:id
        },
        raw:true,
        attributes:['name','valeu']
    })
}
exports.list_render = (req,res)=> {
  var branch=req.Branch;
  var sql=new StringBuilder();
  sql.Append("select c.classroom,m.m_name,c.classroom_name,m.mid from gj_sales as sales " +
      "INNER JOIN gj_members as m ON m.mid=sales.sales_members " +
      "INNER JOIN gj_classroom as c ON c.classroom=sales.sales_classroom WHERE 1=1");
  if(branch){
    sql.AppendFormat(" AND sales.sales_classroom={0}",branch);
  }
  sql.AppendFormat(" AND m.m_status=0 ");
  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (list) {
    branch="报备转院"
    if(req.Branch){
      branch="申请转院"
    }
    return res.render('beian/list', {
      title: '客户列表(高级)',
      list:list,
      calssRoom:req.Classroom,
      branch:branch
    });
  }).catch(function (err) {
    console.log(err)
  })
};//高级客户列表页面
exports.branch_list_render = (req,res)=> {
  return res.render('beian/branch_list', {
    title: '客户列表',
  });
};//客户列表页面
exports.all_list_ajax = (req,res)=> {
  var branch=req.Branch //如果为0 表示的是总院账号，获取所有数据  不为0表示的分院获取，获取自己分院的数据
  var body=req.query;
  var options=utils.cms_get_page_options(req);
  var where={all:branch}
    if(body.phone){
        where.phone=body.phone
    }
    if(body.status){
        where.status=body.status
    }
    if(body.myPayStatus){
        where.myPayStatus=body.myPayStatus
    }
  co(function *() {
    try{
      var item=yield getList(where,options);
      var countSql = new StringBuilder();
      var formalCount;//正式学员人数：status：1
      var reportCount;//报备学员人数：status：3
      var enrollCount;//报名学员人数：status：2
      countSql.Append("SELECT baobei.STATUS,COUNT(baobei.STATUS) AS count FROM (");
      countSql.Append(item.statisticSql);
      countSql.Append(") baobei GROUP BY baobei.`STATUS`");
      var countList = yield models.sequelize.query(countSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
      countList.forEach(function (node,index) {
          switch (node.STATUS){
              case 1:
                  formalCount=node.count
                  break;
              case 2:
                  enrollCount=node.count
                  break;
              case 3:
                  reportCount=node.count
                  break;
          }
      });
      var countArr = [];
      countArr.push({name:"reportCount",value:reportCount});
      countArr.push({name:"enrollCount",value:enrollCount});
      countArr.push({name:"formalCount",value:formalCount});
      var list=item.raws;
      list.forEach( function(node, index) {
        node.index = options.offset + index + 1
        node.time = str.getUnixToTime(node.time)
      });
      return response.onSuccess(res, {
        list:list,
        pagecount:Math.ceil(item.count / options.pagesize),
        countArr:countArr
      })
    }catch (err){
      console.log(err)
    }
  })
};//获取所有客户 (高级)
exports.branch_list_ajax = (req,res)=> {
    var body=req.query;
    var user_branch = req.query.user_branch;
    console.log(body)
    var where={branch:user_branch}
    if(body.phone){
        where.phone=body.phone
    }
    if(body.status){
        where.status=body.status
    }
    if(body.payStatus){
        where.payStatus=body.payStatus
    }
    if(body.myPayStatus){
        where.myPayStatus=body.myPayStatus
    }
  var options=utils.cms_get_page_options(req);
  co(function *() {
    try{
      var item=yield getList(where,options);
      var list=item.raws;
      list.forEach( function(node, index) {
          node.index = options.offset + index + 1
          node.time = str.getUnixToTime(node.time)
      });
      return response.onSuccess(res, {
        list:list,
        pagecount: Math.ceil(item.count / options.pagesize)
      })
    }catch (err){
      console.log(err)
    }
  })
};//获取分院客户 (普通）
exports.set_clerk = (req,res)=>{
    var body=req.body;
    var branch=req.Branch;
    co(function *() {
        try{
            //验证是否可以修改招生老师 如果不是总院所在分所指派不是所在分院招生老师指派失败 总院可以随意指派招生老师
            //获取开始所属招生老师  TODO这里处理有点问题
            var clerk=yield getClerk(body.uid)
            if(branch && clerk.length>0 && branch!=clerk[0].classroom){
                return response.onError(res,{message:'没权限'})
            }
            //通过报备id 变更此人员下面所有招生老师
            yield updateClerk(body.mid,body.uid)
            //通过报备id 获取需要变更的记录条数id
            var list=yield getUserClassList(body.uid)
            //添加备注信息
            list.forEach(function (node) {
                if(clerk.length>0){
                    var content="招生老师【"+clerk[0].name+"】变更到【"+body.name+"】"
                }else {
                    var content="分配招生老师【"+body.name+"】"
                }
                Logs.remarkSave(req,{key:node.uid,type:2,content:content})
            })

            console.log(clerk)
/*            { mid: '3937',
                classroom: '1',
                name: '郭总院（北）',
                uid: '568',
                clerk: '17701809342',
                phone: '17701089958',
                mname: '你好' }*/
            var info=yield models.Members.findOne({
                where:{mid:body.mid},
                raw:true,
                attributes:['m_phone']
            })
            var XueYuanName=body.mname;
            var XueYuanPhone=body.phone;
            var OldHeHuoRenPhone=body.clerk;
            var NewHeHuoRenPhone=info.m_phone;
            if(!OldHeHuoRenPhone){//不存在原始招生老师通知一个人
                sms.putInform(informConfig,{phone:NewHeHuoRenPhone,data:[XueYuanName,XueYuanPhone]})
            }else {//存在原始招生老师通知两个人
                //已经转移到你的报备系统中
                informConfig.templateId=155196;
                sms.putInform(informConfig,{phone:NewHeHuoRenPhone,data:[XueYuanName,XueYuanPhone]});
                //已经转移，详情请联系本分院负责人
                informConfig.templateId=154567;
                sms.putInform(informConfig,{phone:OldHeHuoRenPhone,data:[XueYuanName,XueYuanPhone]})
            }
            return response.onSuccess(res,{message:'ok'})
        }catch (err){
            console.log(err)
            return response.onError(res,{message:err.toString()})
        }
    })

}//设置招生老师
exports.aging_render = (req,res)=> {
  var branch=req.Branch
    var sql=new StringBuilder();
    sql.Append("select classroom.classroom,classroom.classroom_report_time,classroom.classroom_name,classroom.classroom_report_time_min," +
        "classroom.classroom_report_time_max,classroom.max_query_num from gj_classroom as classroom WHERE 1=1");
    if(branch){
        sql.AppendFormat(" AND classroom.classroom={0}",branch);
    }
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (list) {
        return res.render('beian/aging', {
            title: '备案时效管理',
            list:JSON.stringify(list),
            branch:branch
        });
    }).catch(function (err) {
        console.log(err)
    })
};//设置分院时效页面
exports.set_aging = (req,res)=> {
    var body=req.body;
    console.log(body)
    if(!body.max_num){
        body.max_num=20;
    }
    if(!body.min){
        body.min=7;
    }
    if(!body.max){
        body.max=90;
    }
    co(function *() {
        models.Classroom.update({classroom_report_time:body.time,classroom_report_time_min:body.min,classroom_report_time_max:body.max,max_query_num:body.max_num}
            ,{where:{classroom:body.id}}).then(function (list) {
            return response.onSuccess(res,{message:'ok'})
        }).catch(function (err) {
            console.log(err)
            return response.onError(res,{message:err.toString()})
        })
    })

}//设置分院时效接口
//申请模块
exports.apply_info_render = (req,res)=> {
  return res.render('beian/apply/info', {
    title: '申请学员信息修改',
  });
};
exports.apply_affiliation_render = (req,res)=> {
  return res.render('beian/apply/affiliation', {
    title: '申请学员归属转移',
  });
};
exports.apply_transfer_render = (req,res)=> {
  return res.render('beian/apply/transfer', {
    title: '申请学员转院',
  });
};
exports.check_info_render = (req,res)=> {
  return res.render('beian/check/info', {
    title: '审核学员信息修改',
  });
};
/**
 * 学员项目修改的举证项目
 */
var getProof = () => {
    var sql=new StringBuilder();
    sql.AppendFormat("select record.name " +
        "from gj_apply as apply INNER JOIN gj_members as m ON apply.foreign=m.mid " +
        "INNER JOIN gj_apply_record as record ON record.key=apply.id WHERE apply.type=3 " +
        "group by record.name");
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
exports.check_info_list = (req,res)=> {
    var branch=req.Branch
    var body=req.query;
    console.log(body)
    var options=utils.cms_get_page_options(req);
    co(function *() {
        try{
            var where={type:3}
            if(branch){
                where.branch=branch
            }
            if(body.status){
                where.status=body.status
            }
            if(body.phone){
                where.phone=body.phone
            }
            var proof=yield getProof();
            if(proof.length==0){
                return response.onSuccess(res, {
                    list:[],
                    pagecount: 0
                })
            }
            var item=yield getApplyList(where,options,proof);
            var list=item.rows;
            list.forEach( function(node, index) {
                node.index = options.offset + index + 1;
                node.time=str.getUnixToTime(node.time);
                node.branch=branch
            });
            return response.onSuccess(res, {
                list:list,
                pagecount: Math.ceil(item.count / options.pagesize)
            })
        }catch (err){
            console.log(err)
        }
    })
};
/**
 * 获取用户信息（招生老师的）
 * @param mid 用户mid
 * @param id 招生老师id
 */
var getMemberInfo = (mid,id) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select uc.en_clerkid as mid,sales.sales_classroom as branch," +
        "m.m_name as name,m.m_card as card,m.m_company as company,m.m_position as position from gj_enroll_user_class as uc " +
        "INNER JOIN gj_sales as sales ON uc.en_clerkid=sales.sales_members " +
        "INNER JOIN gj_members as m ON m.mid=uc.en_mid " +
        "WHERE uc.en_mid={0} AND uc.en_clerkid={1}",mid,id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
}
exports.set_check_info = (req,res) => {
    // var body=req.query;
    var body={mid:3945,id:3937,name:'name',card:'card',company:'company',position:'position',desc:'desc'}//mid 用户id id招生老师id
    co(function *() {
        try {
            var info= yield getMemberInfo(body.mid,body.id)
            if(info.length==0){
                return response.ApiError(res,{message:'非本招生老师下学员'})
            }
            info=info[0]
            //记录变更的值
            setApply({
                foreign:body.mid,
                type:3,
                branch:info.branch,
            }).then(function (data) {
                Logs.remarkSave(req,{
                    key:data.dataValues.id,
                    type:3,
                    content:body.desc
                })
                Logs.remarkSave(req,{
                    key:data.dataValues.id,
                    type:3,
                    content:'申请学员信息变更【'+info.name+'】'
                })
                var records=[
                    {key:data.dataValues.id,name:'m_name',new_value:body.name,old_value:info.name},
                    {key:data.dataValues.id,name:'m_card',new_value:body.card,old_value:info.card},
                    {key:data.dataValues.id,name:'m_company',new_value:body.company,old_value:info.company},
                    {key:data.dataValues.id,name:'m_position',new_value:body.position,old_value:info.position},
                ];
                setApplyRecord(records).then(function (data) {
                    return response.ApiSuccess(res,{message:'申请学员信息变更【'+info.name+'】成功'})
                }).catch(function (err) {
                    console.log(err)
                    return response.ApiError(res,{message:err.toString()})
                })
            })
        }catch(err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
}//设置（申请修改）信息
exports.check_info = (req,res) => {
    var body=req.body;
    var branch=req.Branch;
/*    if(branch!=0){
        return response.onError(res,{message:'无权限'})
    }*/
    co(function *() {
        try{
            var content='审核信息修改';
            if(body.status==1){//通过
                yield updateApply({status:1},{where:{id:body.id}})
                console.log({m_company:body.company,m_name:body.name,m_card:body.card,m_position:body.position})
                var updateField = {};
                if(body.name != ''){
                    updateField['m_name'] = body.name;
                }
                if(body.card != ''){
                    updateField['m_card'] = body.card;
                }
                if(body.company != ''){
                    updateField['m_company'] = body.company;
                }
                if(body.position != ''){
                    updateField['m_position'] = body.position;
                }
                if(updateField){
                    yield models.Members.update(updateField,{where:{mid:body.uid}})
                }
                content+='通过'
                Logs.remarkSave(req,{
                    key:body.id,
                    type:3,
                    content:content
                })
            }else {//不通过
                yield updateApply({status:2},{where:{id:body.id}})
                content+='不通过'
                Logs.remarkSave(req,{
                    key:body.id,
                    type:3,
                    content:content
                })
            }
            return response.onSuccess(res,{message:content})
        }catch (err){
            console.log(err)
            return response.onError(res,{message:err.toString()})
        }
    })
}//审核（申请修改）信息修改
exports.check_affiliation_render = (req,res)=> {
    return res.render('beian/check/affiliation', {
        title: '审核学员归属转移',
    });
};
exports.check_affiliation_list = (req,res)=> {
    var branch=req.Branch
    var body=req.query;
    var options=utils.cms_get_page_options(req);
    co(function *() {
        try{
            var where={type:2}
            if(branch){
                where.branch=branch
            }
            if(body.status){
                where.status=body.status
            }
            if(body.phone){
                where.phone=body.phone
            }
            var item=yield getApplyList(where,options);
            var list=item.rows;
            list.forEach( function(node, index) {
                node.index = options.offset + index + 1;
                node.time=str.getUnixToTime(node.time);
                node.branch=branch
            });
            return response.onSuccess(res, {
                list:list,
                pagecount: Math.ceil(item.count / options.pagesize)
            })
        }catch (err){
            console.log(err)
        }
    })
};
/**
 * 通过用户id获取用的所属分院
 * @param mid 用户id
 * @returns {*}
 */
var midGetBranch = (mid) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select sales_classroom as branch,m_name as name from gj_members as m " +
        "INNER JOIN gj_sales as sales ON m.mid=sales.sales_members " +
        "WHERE m.mid={0}",mid);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
}
/**
 * 通过用户id获取所属招生老师
 * @param id 用户id
 * @returns {*}
 */
var idGetUserClass = (id) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select en_clerkid as mid,sales_classroom as branch,m_name as name from gj_enroll_user_class as uc " +
        "LEFT JOIN gj_sales as sales ON uc.en_clerkid=sales.sales_members  " +
        "LEFT JOIN gj_members as m ON m.mid=sales.sales_members  " +
        "WHERE uc.en_mid={0}",id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
}
exports.set_check_affiliation = (req,res) => {
    var body=req.query;
    // var body={mid:3937,id:3943}//mid 招生老师是谁 id对方id   我是谁要谁
    co(function *() {
        try{
            var myBranch=yield midGetBranch(body.mid);
            if(myBranch.length==0){
                return response.ApiError(res,{message:'招生老师不存在'})
            }
            var otherBranch=yield idGetUserClass(body.id);
            if(otherBranch.length==0){
                return response.ApiError(res,{message:'学员不存在'})
            }
            myBranch=myBranch[0];
            otherBranch=otherBranch[0];
            if(otherBranch.branch==null || otherBranch.branch==myBranch.branch){
                //记录变更的值
                setApply({
                    foreign:body.id,
                    type:2,
                    branch:myBranch.branch,
                }).then(function (data) {
                    Logs.remarkSave(req,{
                        key:data.dataValues.id,
                        type:3,
                        content:body.desc
                    })
                    Logs.remarkSave(req,{
                        key:data.dataValues.id,
                        type:3,
                        content:'申请招生老师变更【'+otherBranch.name+'】到【'+myBranch.name+'】'
                    })
                    var records=[{key:data.dataValues.id,name:'en_clerkid',new_value:body.mid,old_value:otherBranch.mid}];
                    setApplyRecord(records).then(function () {
                        return response.onSuccess(res,{message:'申请招生老师变更【'+otherBranch.name+'】到【'+myBranch.name+'】'})
                    }).catch(function (err) {
                        console.log(err)
                        return response.ApiError(res,{message:err.toString()})
                    })
                })
            }else {
                return response.ApiError(res,{message:'不是同一分院,不能申请'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
}//设置（申请修改）招生老师归属
exports.check_affiliation = (req,res) => {
    var body=req.body;
    var branch=req.Branch;
/*    if(branch!=0){
        return response.onError(res,{message:'无权限'})
    }*/
    co(function *() {
        try{
            var content='审核招生老师归属 '
            if(body.status==1){//通过
                yield updateApply({status:1},{where:{id:body.id}})
                yield updateClassRoom({en_clerkid:body.clerk,en_time:new Date()},{where:{en_mid:body.mid}});
                content+='通过'
                Logs.remarkSave(req,{
                    key:body.id,
                    type:3,
                    content:content
                })
            }else {//不通过
                yield updateApply({status:2},{where:{id:body.id}});
                content+='不通过'
                Logs.remarkSave(req,{
                    key:body.id,
                    type:3,
                    content:content
                })
            }
            return response.onSuccess(res,{message:content})
        }catch (err){
            console.log(err)
            return response.onError(res,{message:err.toString()})
        }
    })
}//审核（申请修改）招生老师归属
exports.check_transfer_render = (req,res)=> {
  return res.render('beian/check/transfer', {
    title: '审核学员转院',
  });
};
exports.check_transfer_list = (req,res)=> {
    var branch=req.Branch
    var body=req.query;
    var options=utils.cms_get_page_options(req);
    co(function *() {
        try{
            var where={type:1}
            if(branch){
                where.branch=branch
            }
            if(body.status){
                where.status=body.status
            }
            if(body.phone){
                where.phone=body.phone
            }
            var item=yield getApplyList(where,options);
            var list=item.rows;
            console.log(list)
            list.forEach( function(node, index) {
                node.index = options.offset + index + 1;
                node.time=str.getUnixToTime(node.time);
                node.branch=branch
            });
            return response.onSuccess(res, {
                list:list,
                pagecount: Math.ceil(item.count / options.pagesize)
            })
        }catch (err){
            console.log(err)
        }
    })
};
exports.set_check_transfer = (req,res) => {
    var body=req.body;
    var branch=req.Branch;
    co(function *() {
        try{
            //获取原始分院的名称
            var oldClassRoom=yield getUserClassRoomName(body.uid)
            var oldClassRoomName=oldClassRoom[0].name;
            var oldClassRoomid=oldClassRoom[0].id;
            if(branch){//分院是申请修改
                //记录变更的值
                setApply({
                    foreign:body.uid,
                    type:1,
                    branch:branch,
                }).then(function (data) {
                    console.log(data)
                    Logs.remarkSave(req,{
                        key:data.dataValues.id,
                        type:3,
                        content:'申请分院变更【'+oldClassRoomName+'】到【'+body.name+'】'
                    })
                    var records=[{key:data.dataValues.id,name:'en_classroomid',new_value:body.classroom,old_value:oldClassRoomid}];
                    setApplyRecord(records).then(function () {
                        Logs.remarkSave(req,{
                            key:body.uid,
                            type:2,
                            content:'申请分院变更【'+oldClassRoomName+'】到【'+body.name+'】'
                        })
                        return response.onSuccess(res,{message:'申请分院变更【'+oldClassRoomName+'】到【'+body.name+'】'})
                    }).catch(function (err) {
                        console.log(err)
                        return response.onError(res,{message:err.toString()})
                    })
                })
            }else {//总部是直接修改
                updateClassRoom({en_classroomid:body.classroom},{where:{en_uid:body.uid}}).then(function () {
                    Logs.remarkSave(req,{
                        key:body.uid,
                        type:2,
                        content:'分院变更【'+oldClassRoomName+'】到【'+body.name+'】'
                    })
                    return response.onSuccess(res,{message:'分院变更【'+oldClassRoomName+'】到【'+body.name+'】'})
                }).catch(function (err) {
                    console.log(err)
                    return response.onError(res,{message:err.toString()})
                })
            }
        }catch (err){
            console.log(err)
            return response.onError(res,{message:err.toString()})
        }
    })
}//设置（申请修改）分院
exports.check_transfer = (req,res) => {
    var body=req.body;
    console.log(body)
    var branch=req.Branch;
    if(branch!=0){
        return response.onError(res,{message:'无权限'})
    }
    co(function *() {
        try{
            var content='审核转院【'+body.o+'】到【'+body.n+'】'
            if(body.status==1){//通过
                yield updateApply({status:1},{where:{id:body.id}})
                yield updateClassRoom({en_classroomid:body.classroom},{where:{en_uid:body.uid}})
                content+='通过'
                Logs.remarkSave(req,{
                    key:body.id,
                    type:3,
                    content:content
                })
                Logs.remarkSave(req,{
                    key:body.uid,
                    type:2,
                    content:content
                })
            }else {//不通过
                yield updateApply({status:2},{where:{id:body.id}})
                content+='不通过'
                Logs.remarkSave(req,{
                    key:body.id,
                    type:3,
                    content:content
                })
                Logs.remarkSave(req,{
                    key:body.uid,
                    type:2,
                    content:content
                })
            }
            return response.onSuccess(res,{message:content})
        }catch (err){
            console.log(err)
            return response.onError(res,{message:err.toString()})
        }
    })
}//审核（申请修改）分院
//备案缴费模块
exports.pay_list_render = (req,res)=> {
  return res.render('beian/pay/list', {
    title: '缴费管理',
  });
};
exports.pay_list_ajax = (req,res)=> {
    var branch=req.Branch
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    if(branch){
        var where={branch:req.Branch}
    }
    models.paymentOrder.findAndCountAll({
        where:where,
        order:[['createdAt', 'DESC']],
        limit:options.pagesize,
        offset:options.offset,
        raw:true
    }).then(function (item) {
        var list=item.rows;
        list.forEach( function(node, index) {
            node.stime = str.getUnixToTime(node.stime);
            node.index = options.offset + index + 1;
            node.statusDesc=setStatus(node.status)
        });
        return response.onSuccess(res, {
            list:list,
            pagecount: Math.ceil(item.count / options.pagesize)
        })
    }).catch(function (err) {
        console.log(err)
    })
};
exports.pay_add_render = (req,res)=> {
   co(function *() {
       try{
           var where={}
           if(req.Branch){
               where.classroom=req.Branch;
               where.classroom_status=0
           }
           //所属分院
           var branch=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom','classroom_name']});
           return res.render('beian/pay/add', {
               title: '新增缴费',
               branch:branch,
               aly:config.aly
           });
       }catch (err){
           console.log(err);
       }
   })
};
exports.pay_create = (req,res)=> {
    var body=req.body
    var uidAndFeeArr=JSON.parse(body.uidAndFeeArr);
    if(body.members.length==0 || body.pics.length==0){
        return response.onError(res,{message:'参数错误'})
    }
    var id=0
    console.log(body.uidAndFeeArr,'uidAndFeeArr')
    uidAndFeeArr.forEach(function (node,index) {
        models.EnrollUserClass.update({en_fee:node.en_fee},{where:{en_uid:node.en_uid}});
    })
    console.log(body.user_branch,'user_branch')
    return models.sequelize.transaction(function (t) {

        // 要确保所有的查询链都有return返回
        return models.paymentOrder.create({
            stime: body.stime,
            etime:'',
            fee: body.fee,
            method:body.method,
            order:body.order,
            pics:body.pics,
            branch:body.user_branch
        }, {transaction: t}).then(function (data) {
            //构建对象
            id=data.dataValues.id
            var records=[]
            body.members.split(',').forEach(function (node) {
                records.push({uid:node,oid:id})
            })
            return models.OrderRelevanceUser.bulkCreate(records, {transaction: t});
        }).then(function (data) {
            return Logs.remarkSave(req,{
                type:1,
                key:id,
                content:body.desc
            }, {transaction: t})
        })

    }).then(function (result) {
        return response.onSuccess(res,{})
    }).catch(function (err) {
        console.log(err)
    });

};
exports.pay_edit_render = (req,res)=> {
   var id=req.params.id;
    co(function *() {
        try{
            var detail=yield models.paymentOrder.findOne({where:{id:id},raw:true})
            console.log(detail,'detail')
            if(!detail){
                return res.send('异常操作')
            }
            var sql=new StringBuilder();

            var info="uc.en_uid,uc.en_fee,goods.goods_name,member.m_pics,member.m_name,member.m_phone,member.m_card,clerk.m_name as clerk ";
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
                "where o.oid={0}",detail.id)

            var list=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
            var remakeList=yield Logs.remarkList(1,id)
            detail.pics=detail.pics.split(',')
            detail.stime=str.getUnixToTime(detail.stime)
            var where={}
            if(req.Branch){
                where.classroom=req.Branch;
                where.classroom_status=0
            }
            //所属分院
            var branch=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom','classroom_name']});
            return res.render('beian/pay/edit', {
                title: '修改缴费信息',
                item:detail,
                list:list,
                remakeList:remakeList,
                aly:config.aly,
                branch:branch
            });
        }catch (err){
            console.log(err)
        }
    })
};
exports.pay_update = (req,res)=> {
    var body=req.body
    var desc=body.desc;
    body.status=3
    delete body.desc;
    models.paymentOrder.update(body,{where:{id:body.id}}).then(function (item) {
        return Logs.remarkSave(req,{
            type:1,
            key:body.id,
            content:desc
        })
    }).then(function () {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
    })
};
exports.pay_del = (req,res)=> {
    var body=req.body
    var desc=body.desc;
    delete body.desc;
    body.status=-1;
    console.log(body)
    models.paymentOrder.update(body,{where:{id:body.id}}).then(function (item) {
        return response.onSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
    })
};
//备注列表
exports.remark_list = (req,res) => {
    var body=req.query;
    Logs.remarkList(body.type,body.id).then(function (list) {
        console.log(list)
        return response.onSuccess(res,{list:list})
    }).catch(function (err) {
        console.log(err)
    })
}


