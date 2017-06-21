/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var token = require(process.cwd() + '/utils/token');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var hx = require(process.cwd() + '/utils/hxchat');
var page = require(process.cwd() + '/utils/page');
var str = require(process.cwd() + '/utils/str');
var co = require('co');
var moment = require('moment');

/**
 * 通过手机号码验证是否为招生老师并获取登陆密码
 * @param phone - 手机号码
 * @returns {*}
 */
var checkInfo = (phone) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select m.m_name as name,sales.sales_password as password from gj_members as m " +
        "INNER JOIN gj_sales as sales ON m.mid=sales.sales_members where m.m_phone={0} AND m.m_status=0 AND m.m_type=3",phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};
/**
 * 修改密码
 * @param password -
 * @param phone - 手机号码
 * @returns {*}
 */
var setPassword = (phone,password) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("update gj_sales as sales INNER JOIN gj_members as m on m.mid=sales.sales_members " +
        "set sales_password={0} where m.m_phone={1}",password,phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE });
};
/**
 * 获取可报备的列表
 * @returns {*}
 */
var goodsList = () =>{
    return models.Goods.findAll({
        where:{goods_report_status:1},
        attributes:[['goods_name','name'],['goodsid','id']]
    })
}
/**
 * 获取可报备的分院
 * @returns {*}
 */
var classroomList = () =>{
    var sql=new StringBuilder();
    sql.AppendFormat("select gj_classroom.classroom_areaid,gj_classroom.classroom,gj_classroom.classroom_name,gj_area.area_name from gj_area " +
        "INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid where classroom_status=0");
    sql.AppendFormat(" ORDER BY area_name,classroom_area_city DESC");
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });

    /*    return models.Classroom.findAll({
     where:{classroom_status:0},
     attributes:[['classroom_name','name'],['classroom','id']]
     })*/
}
/**
 * 检查报名状态 存在数据说明存在有效的报备
 * @param phone - 报备人员手机号码
 * @param id - 招生老师手机号码
 * @returns {*}
 */

var checkMember = (phone,id) => {
    var sql=new StringBuilder();
    //1部分检测是否正式学员 2部分检测是否在有效报备期间 3部分检测是否有在别的分院的无招生老师的报备
    //最后做一下排除 这个归属人如果就是我我就可以为他报备
    sql.AppendFormat("select info.en_clerkid,mb.m_phone,info.en_follow_status from (select m.mid,uc.en_clerkid,uc.en_follow_status from gj_enroll_user_class as uc " +
        "INNER JOIN gj_members as m ON m.mid=uc.en_mid AND m.m_phone={0} AND uc.en_status=1 " +
        "UNION ALL " +
        "select m.mid,uc.en_clerkid,uc.en_follow_status from gj_enroll_user_class as uc " +
        "INNER JOIN gj_members as m ON m.mid=uc.en_mid AND m.m_phone={0} " +
        "INNER JOIN gj_sales as sales ON uc.en_clerkid=sales.sales_members " +
        "INNER JOIN gj_classroom as c ON c.classroom=sales.sales_classroom " +
        "WHERE uc.createdAt>= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) " +
        "UNION ALL " +
        "select m.mid,uc.en_clerkid,uc.en_follow_status from gj_enroll_user_class as uc " +
        "INNER JOIN gj_members as me ON me.m_phone={1} " +
        "INNER JOIN gj_members as m ON m.m_phone={0} AND m.mid=uc.en_mid " +
        "INNER JOIN gj_sales as sales ON me.mid=sales.sales_members AND sales.sales_classroom!=uc.en_classroomid " +
        "WHERE uc.en_clerkid=0) as info " +
        "LEFT JOIN gj_members as mb ON info.en_clerkid=mb.mid " +
        "WHERE info.en_clerkid=0 OR mb.m_phone!={1}",phone,id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
/**
 * 通过手机号获取我的招生老师id
 * @param phone
 * @returns {*}
 */
var getClerkId = (phone) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select en_clerkid from gj_enroll_user_class as uc " +
        "INNER JOIN gj_members as m on m.mid=uc.en_mid " +
        "where m.m_phone={0} AND uc.en_follow_status=1 ",phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });

}
/**
 * 通过手机号获取我的id
 * @param phone
 * @returns {*}
 */
var getSalesId = (phone) => {
    "use strict";
    return models.Members.findOne({
        where:{m_phone:phone},
        raw:true,
        attributes:['mid']
    })

}
/**
 * 新增报备
 * @param body
 * @returns {body}
 */
var setClassRoom = (body) => {
    "use strict";
    return models.EnrollUserClass.create(body)
}
/**
 * 新增学员
 * @param body
 * @returns {body}
 */
var setMember = (body) => {
    "use strict";
    return models.Members.create(body)
}
/**
 * 查询是否存在报名记录
 * @param mid
 * @param goodsid
 * @returns {*}
 */
var checkClassRoomMidGoodsid = (mid,goodsid) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select en_uid,en_mid,en_clerkid from gj_enroll_user_class as uc " +
        "INNER JOIN gj_enroll_lesson as en ON en.lesson_id=uc.en_key_name AND en.lesson_name={1} AND en.type=0 " +
        "WHERE en_form=1 AND en_mid={0} " +
        "UNION ALL " +
        "select en_uid,en_mid,en_clerkid from gj_enroll_user_class as uc " +
        "WHERE en_form=0 AND en_goodsid={1} AND en_mid={0}",mid,goodsid);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
var checkClassRoomMid = (mid) => {
    "use strict";
    return models.EnrollUserClass.findOne({
        where:{en_mid:mid},
        raw:true,
        attributes:['en_time','en_clerkid','en_status'],
        order:[['en_status','DESC']]
    })
}
/**
 * 添加备注
 * @param {object} req
 * @param {object} body
 * @param {number} body.key - 外键
 * @param {number} body.type - 类型
 * @param {number} body.content - 内容
 * @returns {body}
 */
var remarkSave = (req,body) => {
    body.ip=req.ip
    return models.Remark.create(body)
};
/**
 * 备注列表
 * @param {number} type - 类型
 * @param {number} key - 外键
 * @returns {body}
 */
var remarkList = (type,key,phone) => {
    var where={key:key,type:type}
    if(phone){
        where.create=phone
    }
    console.log(where)
    return models.Remark.findAll({
        where:where,
        raw:true,
        attributes:['content','create','createdAt']
    })
};
/**
 * 新增申请审核
 * @param body - 需要记录的数据
 * @returns {Promise.<Array.<Instance>>}
 */
var setApply = (body) => {
    return models.Apply.create(body)
}
/**
 * 设置申请审核的记录值
 * @param {Array} records - 需要记录的数据
 * @returns {Promise.<Array.<Instance>>}
 */
var setApplyRecord = (records) => {
    return models.ApplyRecord.bulkCreate(records)
}
/**
 * 获取学员列表
 * @param {object} where - 查询条件（筛选条件）
 * @param {object} options - 分页参数
 * @returns {Promise.<TResult>}
 */
var getList = (where,options,flag) => {
    var item={rows:[],count:0};
    var sql=new StringBuilder();
    var info="uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_channel,uc.en_uid,uc.en_classroomid,uc.en_clerkid,classroom.classroom_name,goods.goods_name,member.m_name,member.m_phone,member.m_card,member.m_company,member.m_position,member.mid,clerk.m_name as clerk,uc.en_time as time ";
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
        "END) as status,(CASE " +
        "WHEN client.mid IN (SELECT ap.foreign FROM gj_apply as ap WHERE ap.type=3 AND ap.status=0) THEN 1 " +
        "ELSE 0 " +
        "END) as applyStatus" +
        " from "+ union)
    sql.AppendFormat("LEFT JOIN gj_sales as sales ON sales.sales_members=client.en_clerkid " +
        "LEFT JOIN gj_classroom as c ON sales.sales_classroom=c.classroom " +
        "where client.en_clerkid={0} ",where.mid)
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
    /*    if(where.phone){
     sql.AppendFormat("AND client.m_phone LIKE '%{0}%' ",where.phone);
     }*/
    if(where.name){
        sql.AppendFormat("AND (client.m_name LIKE '%{0}%' OR client.m_phone LIKE '%{0}%') ",where.name);
    }
    if(where.myPayStatus){
        sql.AppendFormat("AND client.en_pay_status={0} ",where.myPayStatus);
    }
    if(where.all){
        sql.AppendFormat("AND client.en_classroomid={0} ",where.all);
    }
    if(where.branch){
        sql.AppendFormat("AND client.en_classroomid={0} AND sales.sales_classroom IS NOT NULL ",where.branch)
    }
    sql.AppendFormat(" order by client.time DESC ");
    if(!flag){
        sql.AppendFormat(" LIMIT {0},{1}",options.offset,options.pagesize);
    }


    var sqlCount=new StringBuilder();
    sqlCount.AppendFormat("select count(*) as count from "+ union)
    sqlCount.AppendFormat("LEFT JOIN gj_sales as sales ON sales.sales_members=client.en_clerkid " +
        "LEFT JOIN gj_classroom as c ON sales.sales_classroom=c.classroom " +
        "where client.en_clerkid={0} ",where.mid)
    if(where.status){
        sqlCount.AppendFormat("AND (CASE " +
            "WHEN client.en_status=1 THEN 1 " +
            "WHEN client.en_status=0 AND client.en_clerkid=0 OR (client.en_clerkid!=0 AND client.en_follow_status=0) THEN 2 " +
            "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 3 " +
            "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) AND client.time<= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 4 " +
            "ELSE 5 " +
            "END) IN ({0}) ",where.status);
    }
    /*    if(where.phone){
     sqlCount.AppendFormat("AND client.m_phone LIKE '%{0}%' ",where.phone);
     }*/
    if(where.name){
        sqlCount.AppendFormat("AND (client.m_name LIKE '%{0}%' OR client.m_phone LIKE '%{0}%') ",where.name);
    }
    if(where.myPayStatus){
        sqlCount.AppendFormat("AND client.en_pay_status={0} ",where.myPayStatus);
    }
    if(where.all){
        sqlCount.AppendFormat("AND client.en_classroomid={0} ",where.all);
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
        item.rows=data
        return models.sequelize.query(sqlCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
    }).then(function (count) {
        item.count=count[0].count
        return item
    }).catch(function (err) {
        console.log(err)
    })
}
var getListCount = (where,options) => {
    var sql=new StringBuilder();
    var info="uc.en_status,uc.en_reference,uc.en_follow_status,uc.en_pay_status,uc.en_channel,uc.en_uid,uc.en_classroomid,uc.en_clerkid,classroom.classroom_name,goods.goods_name,member.m_name,member.m_phone,member.m_card,member.m_company,member.m_position,member.mid,clerk.m_name as clerk,uc.en_time as time ";
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

    var sqlCount=new StringBuilder();
    sqlCount.AppendFormat("select count(*) as count from "+ union)
    sqlCount.AppendFormat("LEFT JOIN gj_sales as sales ON sales.sales_members=client.en_clerkid " +
        "LEFT JOIN gj_classroom as c ON sales.sales_classroom=c.classroom " +
        "where client.en_clerkid={0} ",where.mid)
    sqlCount.AppendFormat("AND (CASE " +
        "WHEN client.en_status=1 THEN 1 " +
        "WHEN client.en_status=0 AND client.en_clerkid=0 OR (client.en_clerkid!=0 AND client.en_follow_status=0) THEN 2 " +
        "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 3 " +
        "WHEN client.en_status=0 AND client.en_clerkid!=0 AND client.en_follow_status=1 AND client.time>= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) AND client.time<= DATE_SUB(now(),INTERVAL c.classroom_report_time-5 DAY) THEN 4 " +
        "ELSE 5 " +
        "END) IN (1,2,3,4) ");
    if(where.en_pay_status){
        sqlCount.AppendFormat("AND client.en_pay_status = {0} ",where.en_pay_status);
    }
    if(where.phone){
        sqlCount.AppendFormat("AND client.m_phone LIKE '%{0}%' ",where.phone);
    }
    if(where.name){
        sqlCount.AppendFormat("AND client.m_name LIKE '%{0}%' ",where.name);
    }
    if(where.all){
        sqlCount.AppendFormat("AND client.en_classroomid={0} ",where.all);
    }
    if(where.branch){
        sqlCount.AppendFormat("AND client.en_classroomid={0} AND sales.sales_classroom IS NOT NULL ",where.branch)
    }

    return models.sequelize.query(sqlCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (count) {
        count=count[0].count
        return count
    }).catch(function (err) {
        console.log(err)
    })
}
/**
 * 获取用户信息（招生老师的）
 * @param mid 用户mid
 * @param id 合伙人id
 */
var getMemberInfo = (mid,id) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select uc.en_clerkid as mid,uc.en_uid,sales.sales_classroom as branch," +
        "m.m_name as name,m.m_card as card,m.m_company as company,m.m_position as position from gj_enroll_user_class as uc " +
        "INNER JOIN gj_sales as sales ON uc.en_clerkid=sales.sales_members " +
        "INNER JOIN gj_members as m ON m.mid=uc.en_mid " +
        "WHERE uc.en_mid={0} AND uc.en_clerkid={1}",mid,id);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
}
//设置（申请修改）招生老师归属
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
/**
 * 通过招生老师手机号码拉取本分院下的学员信息
 * @param phone - 招生老师手机号码
 * @param mid - 学员手机号码
 * @returns {*}
 */
var affiliationInfo = (phone,mid) => {
    var sql=new StringBuilder();
    sql.AppendFormat("select m.mid,m.m_name as kehu_name,m2.m_name as yewu_name,m2.m_phone as yewu_phone from gj_members as m " +
        "INNER JOIN gj_enroll_user_class as uc ON m.mid=uc.en_mid " +
        "INNER JOIN gj_sales as sales ON sales.sales_members=uc.en_clerkid " +
        "INNER JOIN gj_members as m1 ON m1.m_phone={0} " +
        "INNER JOIN gj_members as m2 ON m2.mid=uc.en_clerkid " +
        "INNER JOIN gj_sales as sales1 ON m1.mid=sales1.sales_members " +
        "WHERE m.m_phone={1} AND sales1.sales_classroom=sales.sales_classroom",phone,mid);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
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
            sql.AppendFormat(" ORDER BY apply.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
            //总条数查询
            sqlCount.AppendFormat("select count(*) as count from gj_apply as apply " +
                "WHERE apply.type=1")
            if(where.branch){
                sqlCount.AppendFormat("AND apply.branch={0} ",where.branch);
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
                "WHERE apply.status!=3 AND apply.type=2 AND record.new_value={0} ",where.mid)
            if(where.branch){
                sql.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            /*            if(where.phone){
             sql.AppendFormat("AND m.m_phone like '%{0}%' ",where.phone);
             }*/
            if(where.name){
                sql.AppendFormat("AND (m.m_name like '%{0}%' OR m.m_phone like '%{0}%') ",where.name);
            }
            sql.AppendFormat(" ORDER BY apply.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
            //总条数查询
            sqlCount.AppendFormat("select count(*) as count from gj_apply as apply " +
                "INNER JOIN gj_members as m ON apply.foreign=m.mid " +
                "INNER JOIN gj_apply_record as record ON record.key=apply.id " +
                "LEFT JOIN gj_members as newm ON record.new_value=newm.mid " +
                "LEFT JOIN gj_members as oldm ON record.old_value=oldm.mid " +
                "WHERE apply.status!=3 AND apply.type=2 AND record.new_value={0} ",where.mid)
            if(where.branch){
                sqlCount.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            /*            if(where.phone){
             sqlCount.AppendFormat("AND  ",where.phone);
             }*/
            if(where.name){
                sqlCount.AppendFormat("AND (m.m_name like '%{0}%' OR m.m_phone like '%{0}%') ",where.name);
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
            sql.AppendFormat("group by mid,id,time,status ");
            sql.AppendFormat(" ORDER BY apply.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
            //总条数查询
            sqlCount.AppendFormat("select count(*) as count from gj_apply as apply " +
                "WHERE apply.type=3")
            if(where.branch){
                sqlCount.AppendFormat("AND apply.branch={0} ",where.branch);
            }
            break;
    }

    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
        console.log(data)
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
 * 获取报备的详细信息
 * @param phone
 * @param uid
 * @returns {*}
 */
var getUserClassDetail = (phone,uid) => {
    var sql=new StringBuilder();
    var info="uc.en_status,uc.en_reference,uc.en_follow_status,uc.en_channel,uc.en_uid,uc.en_desc,uc.en_classroomid,uc.en_clerkid,classroom.classroom_name,goods.goods_name,member.m_name,member.m_phone,member.m_card,member.m_company,member.m_position,member.mid,clerk.m_name as clerk,uc.en_time as time ";
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
        "where client.en_uid={0} ",uid)
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })

}
router.all('/*/:id',function (req, res,next) {
    var k=req.cookies.business;
    var phone=req.params.id;
    if(!phone){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        if(!k){
            return response.ApiError(res,{code:401,message:'未登录'})
        }
        var info=yield checkInfo(phone);
        if(info.length==0){
            return response.ApiError(res,{code:401,message:'招生老师不存在，请联系分院管理部'})
        }
        try{
            var tokenPhone=token.decode_token(k).iss;
            if(tokenPhone==phone){
                next()
            }else {
                return response.ApiError(res,{code:401,message:'身份不合法，请重新登陆'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{code:401,message:'身份验证失败，请重新登陆'})
        }
    })
});
//修改密码
router.post('/change/password/:id', function (req, res) {
    var body=req.body;
    var phone=req.params.id;
    if(!body.password || !body.newPassword){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var info=yield checkInfo(phone);
            if(info.length==0){
                return response.ApiError(res,{message:'招生老师手机号码不存在'})
            }
            if(info[0].password!=body.password){
                return response.ApiError(res,{message:'密码验证不通过'})
            }
            setPassword(phone,body.newPassword).then(function (data) {
                res.clearCookie('business', { path: '/' });
                return response.ApiSuccess(res,{message:'请重新登陆'})
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})

        }
    })
});
//获取课程班列表
router.get('/goods/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    goodsList().then(function (data) {
        return response.ApiSuccess(res,{list:data})
    }).catch(function (err) {
        console.log(err);
        return response.ApiError(res,{message:err.toString()})
    })
})
//获取分院列表
router.get('/classroom/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    classroomList().then(function (area) {
        var arr=[];
        var arr2=[];
        area.forEach(function(node,index){
            if(arr.indexOf(node.area_name)==-1){
                arr.push(node.area_name)
            }
        });
        arr.forEach(function(i,j){
            arr2[j]={};
            arr2[j].area_name=i;
            arr2[j].classroom=[];
            area.forEach(function(node,index){
                if((node.area_name)==i){
                    arr2[j].classroom.push(node)
                }
            })
        });
        return response.ApiSuccess(res,{list:arr2})
    }).catch(function (err) {
        console.log(err);
        return response.ApiError(res,{message:err.toString()})
    })
})
//检查是否可以报备
router.post('/check/:id',function (req,res) {
    var body=req.body;
    var phone=req.params.id;
    if(!body.phone){
        return response.ApiError(res,{message:'参数缺失'})
    }
    checkMember(body.phone,phone).then(function (data) {
        if(data.length==0){
            return response.ApiSuccess(res,{message:'未报备'})
        }else {
            console.log(data[0].en_follow_status,'en_follow_status')
            return response.ApiError(res,{message:'已存在报备'})
        }
    }).catch(function (err) {
        console.log(err);
        return response.ApiError(res,{message:err.toString()})
    })
})
//新增报备
router.post('/add/:id',function (req,res) {
    var body=req.body;
    var phone=req.params.id;
    var en_desc = body.desc || '';
    if(!body.phone || !body.name || !body.goodsid || !body.classroom){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var check=yield checkMember(body.phone,phone);//检查是否是自己的合法报备
            var clerkId=yield getClerkId(body.phone);//通过用户手机查看我的所属招生老师
            var salesId=yield getSalesId(phone);//通过手机号码获取id
            var mid=salesId.mid;//招生老师id
            if(clerkId.length>0 && clerkId[0].en_clerkid!=0 && mid!=clerkId[0].en_clerkid){
                //存在其他招生老师，查看是否报备状态{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"}
                return response.ApiError(res,{code:402,message:'已存在报备!请重新填写!'})//已存在报备
            }
            if(check.length!=0){
                if(check[0].en_follow_status == '1'){
                    return response.ApiError(res,{message:'已存在报备'})
                }
            }
            //检查手机用户是否存在不存在创建 存在手机号码的直接拿出id
            var en_mid=yield getSalesId(body.phone);
            if(!en_mid){
                var addMember=yield setMember({
                    m_phone: body.phone,
                    m_card: body.card,
                    m_name: body.name,
                    m_company: body.company,
                    m_position: body.position,
                })
                en_mid={mid:addMember.dataValues.mid}
                //去环信注册
                hx.reghxuser({username:en_mid.mid},function(err,result){
                    console.log(err)
                    console.log(result)
                });
            }
            //检测这个用户这个课程是否报名过 报名过更新招生老师id 没报名新建
            var checkClassRoom=yield checkClassRoomMidGoodsid(en_mid.mid,body.goodsid);
            if(checkClassRoom.length>0){
                checkClassRoom=checkClassRoom[0]
                // { en_uid: 533, en_mid: 3943, en_clerkid: 3937 }
                if(checkClassRoom.en_clerkid==mid){
                    return response.ApiError(res,{message:'请勿重复报备'})
                }else {
                    var sql=new StringBuilder();
                    sql.AppendFormat("update gj_enroll_user_class set gj_enroll_user_class.en_clerkid={0},en_time=now(),en_follow_status={1},en_desc={2} " +
                        "where gj_enroll_user_class.en_mid={3}",mid,body.en_follow_status,en_desc,checkClassRoom.en_mid);
                    yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE });
                }
            }else {
                var baobeixinxi=yield checkClassRoomMid(en_mid.mid)
                if(baobeixinxi){
                    // { en_time: 2017-02-23T12:43:48.000Z, en_clerkid: 3937 ,en_status:0}
                    //获取这个用户的报备时间 如果我对其报备过用之前的时间 没有对其报备过用最新的时间
                    var time=(baobeixinxi.en_clerkid==mid)?baobeixinxi.en_time:(new Date());
                    checkClassRoom=yield setClassRoom({
                        en_clerkid:mid,
                        en_mid:en_mid.mid,
                        en_goodsid:body.goodsid,
                        en_classroomid:body.classroom,
                        en_reference:body.reference,
                        en_time:time,
                        en_status:baobeixinxi.en_status,
                        en_follow_status:body.en_follow_status,
                        en_desc:en_desc
                    })
                }else {
                    checkClassRoom=yield setClassRoom({
                        en_clerkid:mid,
                        en_mid:en_mid.mid,
                        en_goodsid:body.goodsid,
                        en_reference:body.reference,
                        en_classroomid:body.classroom,
                        en_time:new Date(),
                        en_follow_status:body.en_follow_status,
                        en_desc:en_desc
                    })
                }
                remarkSave(req,{
                    create:phone,
                    key:checkClassRoom.dataValues.en_uid,
                    type:2,
                    content:body.desc || '',
                })
            }
            return response.ApiSuccess(res,{message:'报备成功'})
        }catch (err){
            console.log(err)
        }
    })
})
//报备列表
router.get('/list/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    var options=page.get_page_options(req);
    co(function *() {
        try {
            var info=yield getSalesId(phone);
            var where={mid:info.mid,status:'1,2,3,4'};
            if(body.status){
                where.status=body.status
            }
            if(body.phone){
                where.phone=body.phone
            }
            if(body.name){
                where.name=body.name
            }
            if(body.myPayStatus){
                where.myPayStatus=body.myPayStatus
            }
            var item=yield getList(where,options,body.flag);
            var count1=yield getListCount({mid:info.mid,en_pay_status:'0'})//未缴费
            var count2=yield getListCount({mid:info.mid,en_pay_status:'1'})//交费
            var list=item.rows;
            list.forEach( function(node, index) {
                node.index = options.offset + index + 1
                node.time = str.getUnixToTime(node.time)
            });
            return response.ApiSuccess(res,{
                list:list,
                pagecount: Math.ceil(item.count / options.pagesize),
                count: item.count,
                payCount: count2,
                noPayCount: count1,
            })

        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
})
//检查修改记录是否需要进审核表
var checkRecords = (records) => {
    var flag = false;
    records.forEach(function (node,index) {
       if(node.new_value != node.old_value){
           flag = true;
       }
    })
    return flag;
}

//设置（申请修改）信息
router.post('/check/info/:id', (req,res) => {
    var body=req.body;
    var phone=req.params.id;
    if(!body.mid){
        return response.ApiError(res,{message:'参数缺失'})
    }
    // var body={mid:3945,name:'name',card:'card',company:'company',position:'position',desc:'desc'}//mid 用户id id招生老师id
    co(function *() {
        try {
            var salesId=yield getSalesId(phone)
            var info= yield getMemberInfo(body.mid,salesId.mid)
            if(info.length==0){
                return response.ApiError(res,{message:'非本招生老师下学员'})
            }
            info=info[0]
            console.log(info,'info')
            var memberInfo = yield models.Members.findOne({where:{mid:body.mid}});
            var member = memberInfo.dataValues;
            var records = [];
            var updateField = {};
            console.log(member.m_name,body.name)
            if(member.m_name != ''){
                records.push({key:'',name:'m_name',new_value:body.name,old_value:info.name});
            }
            if(member.m_name == '' && body.name != ''){
                updateField['m_name'] = body.name;
            }

            if(member.m_card != ''){
                records.push({key:'',name:'m_card',new_value:body.card,old_value:info.card});
            }
            if(member.m_card == '' && body.card != ''){
                updateField['m_card'] = body.card;
            }

            if(member.m_company != ''){
                records.push({key:'',name:'m_company',new_value:body.company,old_value:info.company});
            }
            if(member.m_company == '' && body.company != ''){
                updateField['m_company'] = body.company;
            }

            if(member.m_position != ''){
                records.push({key:'',name:'m_position',new_value:body.position,old_value:info.position});
            }
            if(member.m_position == '' && body.position != ''){
                updateField['m_position'] = body.position;
            }
            console.log(updateField,'updateField')
            console.log(records,'records')
            if(updateField){
                models.Members.update(updateField,{where:{mid:body.mid}});
            }
            //更新备注说明
            if(body.desc){
                yield models.EnrollUserClass.update({en_desc:body.desc},{where:{en_uid:info.en_uid}});
            }
            var noChangesFlag = member.m_name == body.name && member.m_card == body.card && member.m_company == body.company && member.m_position == body.position;
            console.log(records,noChangesFlag)
            var flag = false;
            if(records.length > 0){
                flag = checkRecords(records);
            }
            console.log(flag,'flag')
            if(records.length > 0 && !noChangesFlag && flag){
                //记录变更的值
                setApply({
                    foreign:body.mid,
                    type:3,
                    branch:info.branch,
                }).then(function (data) {
                    /*               remarkSave(req,{
                     create:phone,
                     key:data.dataValues.id,
                     type:3,
                     content:'申请学员信息变更【'+info.name+'】'
                     })*/
                    if(body.desc){
                        remarkSave(req,{
                            create:phone,
                            key:data.dataValues.id,
                            type:3,
                            content:body.desc
                        });
                    }

                    // var records=[
                    //     {key:data.dataValues.id,name:'m_name',new_value:body.name,old_value:info.name},
                    //     {key:data.dataValues.id,name:'m_card',new_value:body.card,old_value:info.card},
                    //     {key:data.dataValues.id,name:'m_company',new_value:body.company,old_value:info.company},
                    //     {key:data.dataValues.id,name:'m_position',new_value:body.position,old_value:info.position},
                    // ];
                    records.forEach(function (node,index) {
                        node.key=data.dataValues.id;
                    })
                    setApplyRecord(records).then(function (data) {
                        return response.ApiSuccess(res,{message:'申请学员信息变更【'+info.name+'】成功'})
                    }).catch(function (err) {
                        console.log(err)
                        return response.ApiError(res,{message:err.toString()})
                    })
                })
            }
            return response.ApiSuccess(res,{message:'申请学员信息变更【'+info.name+'】成功'})
        }catch(err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })

})
/**
 * 跟进mid查询是否存在报备记录
 * @param mid
 * @returns {*}
 */
var checkReportByMid = (mid) => {
    "use strict";
    return models.EnrollUserClass.findOne({
        where:{en_mid:mid,en_follow_status:1},
        raw:true,
        attributes:['en_time','en_clerkid','en_status','en_follow_status'],
        order:[['en_time','ASC']]
    })
}

//报备跟进
router.post('/follow/:id', (req,res) => {
    var body=req.body;
    var phone=req.params.id;
    var en_uid=body.en_uid;
    if(!body.mid){
        return response.ApiError(res,{message:'参数缺失'})
    }
    // var body={mid:3945,en_uid:667}//mid 用户id 报名：en_uid
    co(function *() {
        try {
            var salesId=yield getSalesId(phone)
            var info= yield getMemberInfo(body.mid,salesId.mid)
            if(info.length==0){
                return response.ApiError(res,{message:'非本招生老师下学员'})
            }

            /**/
            var baobeixinxi=yield checkReportByMid(body.mid)
            var enStatusSql = "";
            if(baobeixinxi){
                // { en_time: 2017-02-23T12:43:48.000Z, en_clerkid: 3937 ,en_status:0}
                //获取这个用户的报备时间 如果我对其报备过用之前的时间 没有对其报备过用最新的时间
                var time=(baobeixinxi.en_clerkid==salesId.mid)?baobeixinxi.en_time:(moment().format('YYYY-MM-DD HH:mm:ss'));
                en_time = moment(time).format('YYYY-MM-DD HH:mm:ss');
                en_status = baobeixinxi.en_status;
                enStatusSql = ",gj_enroll_user_class.en_status=" + en_status;
            }else {
                en_time = moment().format('YYYY-MM-DD HH:mm:ss');
            }

            /**/
            //通过报备id更新报备时间和报备跟进状态
            var sql=new StringBuilder();
            sql.AppendFormat("update gj_enroll_user_class SET gj_enroll_user_class.en_follow_status=1,gj_enroll_user_class.en_time = '{0}' ",en_time);
            if(enStatusSql){
                sql.AppendFormat(enStatusSql);
            }
            sql.AppendFormat(" WHERE gj_enroll_user_class.en_mid = {0} ",body.mid);
            models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.UPDATE }).then(function (result) {
                return response.ApiSuccess(res,{},"报备跟进成功!");
            });
        }catch(err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })

})

//归属转移
router.post('/check/affiliation/:id', (req,res) => {
    var body=req.body;
    var phone=req.params.id;
    if(!body.mid){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var salesId=yield getSalesId(phone)
            var myBranch=yield midGetBranch(salesId.mid);
            if(myBranch.length==0){
                return response.ApiError(res,{message:'招生老师不存在'})
            }
            var otherBranch=yield idGetUserClass(body.mid);
            if(otherBranch.length==0){
                return response.ApiError(res,{message:'学员不存在'})
            }
            myBranch=myBranch[0];
            otherBranch=otherBranch[0];
            if(otherBranch.branch==null || otherBranch.branch==myBranch.branch){
                //记录变更的值
                setApply({
                    foreign:body.mid,
                    type:2,
                    branch:myBranch.branch,
                }).then(function (data) {
                    remarkSave(req,{
                        create:phone,
                        key:data.dataValues.id,
                        type:3,
                        content:'申请招生老师变更【'+otherBranch.name+'】到【'+myBranch.name+'】'
                    })
                    remarkSave(req,{
                        create:phone,
                        key:data.dataValues.id,
                        type:3,
                        content:body.desc
                    })
                    var records=[{key:data.dataValues.id,name:'en_clerkid',new_value:salesId.mid,old_value:otherBranch.mid}];
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
})
//拉取我要申请人的信息
router.post('/check/affiliation/info/:id', (req,res) => {
    var body=req.body;
    var phone=req.params.id;
    if(!body.phone){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var info=yield affiliationInfo(phone,body.phone)
            if(info.length==0){
                return response.ApiError(res,{message:'非本分院学员不可转移'})
            }
            if(info.length > 0 && info[0].yewu_phone == phone){
                return response.ApiError(res,{message:'该学员已归属您,无需重复申请'})
            }
            return response.ApiSuccess(res,{data:info[0]})
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
})
//我的学员信息
router.post('/member/info/:id', (req,res) => {
    var body=req.body;
    var phone=req.params.id;
    if(!body.uid){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var detail=yield getUserClassDetail(phone,body.uid);

            var desc=yield remarkList(2,body.uid,phone)
            detail=detail[0]
            switch (detail.status){
                case 1:
                    detail.statusDesc='正式'
                    break;
                case 2:
                    detail.statusDesc='意向'
                    break;
                case 3:
                    detail.statusDesc='报备'
                    break;
                case 4:
                    detail.statusDesc='即将过期'
                    break;
                case 5:
                    detail.statusDesc='过期'
                    break;
            }
            detail.remake=desc
            detail.time=str.getUnixToTime(detail.time)
            return response.ApiSuccess(res,{data:detail})
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
})
//申请转院列表
router.get('/apply/affiliation/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    var options=page.get_page_options(req);
    co(function *() {
        try{
            var salesId=yield getSalesId(phone)
            var where={type:2,mid:salesId.mid};
            if(body.name){
                where.name=body.name
            }
            var item=yield getApplyList(where,options);
            var list=item.rows;
            list.forEach( function(node, index) {
                node.index = options.offset + index + 1;
                node.time=str.getUnixToTime(node.time);
            });
            return response.ApiSuccess(res, {
                list:list,
                pagecount: Math.ceil(item.count / options.pagesize)
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
})
//删除申请
router.post('/del/affiliation/:id',function (req,res) {
    var body=req.body;
    var phone=req.params.id;
    models.Apply.update({status:3},{where:{id:body.uid}}).then(function () {
        return response.ApiSuccess(res,{message:'ok'})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
})
//备注详情
router.get('/remake/detail/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    if(!body.uid){
        return response.ApiError(res,{message:'参数缺失'})
    }
    remarkList(2,body.uid).then(function (list) {
        console.log(list)
        return response.onSuccess(res,{list:list})
    }).catch(function (err) {
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
    })
})
//申请信息修改列表
router.get('/apply/info/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    if(!body.phone){
        return response.ApiError(res,{message:'参数缺失'})
    }
})
/**
 * 报备检查接口(根据手机号)
 */
router.post('/report-check/:id',function (req,res) {
    var body=req.body;
    var phone=req.params.id;
    // phone = '13521659027';//写死测试.
    console.log(phone,'phone')
    if(!body.phone){
        return response.ApiError(res,{message:'参数缺失'})
    }

    co(function *() {
        try{
            //获取最大查询次数
            var classroom = yield models.Classroom.findOne({where:{classroom:body.classroomid}})
            //查询是否存在报备检查记录，没有则创建
            var currentTime=moment().format('YYYY-MM-DD');
            var reportSql="SELECT * FROM gj_report_check WHERE clerk_phone ='"+ phone  + "' AND DATE_FORMAT(rc_check_time,'%Y-%m-%d') = '" + currentTime + "' LIMIT 1";
            var report = yield models.sequelize.query(reportSql, {type: models.sequelize.QueryTypes.SELECT});
            var rc_id = "";
            // console.log(report[0].rc_num,'report[0].rc_num')
            // console.log(classroom.dataValues.max_query_num,'max_query_num')
            if(report.length == 0){
                console.log('start create...')
                var createReport = yield models.ReportCheck.create({clerk_phone:phone,rc_num:0});
                console.log(createReport,'createReport')
                rc_id= createReport.dataValues.rc_id;
            }else{
                console.log(report[0].rc_num,classroom.dataValues.max_query_num)
                rc_id = report[0].rc_id;
                if(report[0].rc_num >= classroom.dataValues.max_query_num){//gj_classroom表中设置的最大值
                    var message="今日查询已达到最大限制" + classroom.dataValues.max_query_num +  "次,明天再查询";
                    return response.ApiError(res,{code:403,message:message});
                }
            }
            var sqlUpdate = "update gj_report_check set rc_check_time = now(),updated_at = now(),rc_num=rc_num+1 where clerk_phone=" + phone + " and rc_id=" + rc_id;
            yield models.sequelize.query(sqlUpdate, {type: models.sequelize.QueryTypes.UPDATE});
            var sql = new StringBuilder();
            sql.AppendFormat("SELECT client.classroom_name,client.clerk,client.clerk_phone,sales.sales_classroom,(CASE WHEN client.en_status = 1 THEN 1 ");
            sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid = 0 OR (client.en_clerkid != 0 ");
            sql.AppendFormat(" AND client.en_follow_status = 0) THEN 2 WHEN client.en_status = 0 AND client.en_clerkid != 0 ");
            sql.AppendFormat(" AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN 3 ");
            sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid != 0 AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(), ");
            sql.AppendFormat(" INTERVAL c.classroom_report_time DAY) AND client.time <= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN ");
            sql.AppendFormat(" 4 ELSE 5 END) AS reportStatus FROM (SELECT uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_mid, ");
            sql.AppendFormat(" uc.en_channel,uc.en_uid,uc.en_classroomid,uc.en_clerkid,uc.en_desc,classroom.classroom_name,goods.goods_name,member.m_name, ");
            sql.AppendFormat(" member.m_phone,member.m_card,member.m_company,member.m_position,member.m_email,clerk.m_name AS clerk,clerk.m_phone AS clerk_phone, ");
            sql.AppendFormat(" uc.en_time AS time FROM gj_enroll_user_class AS uc INNER JOIN gj_enroll_lesson AS en ON en.lesson_id = uc.en_key_name ");
            sql.AppendFormat(" AND en.type = 0 INNER JOIN gj_goods AS goods ON goods.goodsid = en.lesson_name LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid ");
            sql.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid WHERE ");
            sql.AppendFormat(" en_form = 1 UNION ALL SELECT uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_mid,uc.en_channel,uc.en_uid, ");
            sql.AppendFormat(" uc.en_classroomid,uc.en_clerkid,uc.en_desc,classroom.classroom_name,goods.goods_name,member.m_name,member.m_phone,member.m_card, ");
            sql.AppendFormat(" member.m_company,member.m_position,member.m_email,clerk.m_name AS clerk,clerk.m_phone AS clerk_phone,uc.en_time AS time ");
            sql.AppendFormat(" FROM gj_enroll_user_class AS uc INNER JOIN gj_goods AS goods ON goods.goodsid = uc.en_goodsid LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid ");
            sql.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid WHERE ");
            sql.AppendFormat(" en_form = 0) AS client LEFT JOIN gj_sales AS sales ON sales.sales_members = client.en_clerkid LEFT JOIN gj_classroom AS c ON sales.sales_classroom = c.classroom ");
            sql.AppendFormat(" WHERE 1 = 1 AND client.m_phone={0} AND client.en_follow_status=1 ORDER BY client.time DESC LIMIT 1", body.phone);
            models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
                if(result[0]){
                    var item = result[0];
                    console.log(result,'result')
                    console.log(item.classroom_name)
                    if(item.reportStatus != 5){
                        var message = "该学员已报备,报备人是"+ item.classroom_name + "," + item.clerk + "," + item.clerk_phone;
                        return response.ApiError(res,{code:202,message:message})
                    }
                }
                return response.ApiSuccess(res,{message:'该学员可以报备'})
            });
        }catch(err) {
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
})
/**
 * 检查该学员是否已经创建缴费订单
 */
router.post('/checkApplyPay/:id',function (req,res) {
    var body=req.body;
    var sql = new StringBuilder();
    sql.AppendFormat("SELECT porder.order FROM gj_payment_order porder ");
    sql.AppendFormat(" INNER JOIN gj_order_relevance_user ors ");
    sql.AppendFormat(" ON porder.id=ors.oid ");
    sql.AppendFormat(" WHERE ors.uid={0} ",body.en_uid);
    models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
        if(result[0]){
            var item = result[0];
            return response.ApiError(res,{message:'该学员已存在缴费订单'})
        }
        return response.ApiSuccess(res,{message:'可以创建缴费订单'})
    });
})
/**
 * 根据选中的学员报名id查询学员报备信息
 */
router.post('/get-apply-infos/:id',function (req,res) {
    var body=req.body;
    var phone=req.params.id;
    var orderInfo;
    console.log(body.oid);
    co(function *() {
        if(body.oid){
            orderInfo=yield models.paymentOrder.findOne({where:{id:body.oid},raw:true})
        }

        var pics = [];
        if(orderInfo){
            var picsArr = orderInfo.pics.split(',');
            picsArr.forEach(function (node,index) {
                pics.push(str.AbsolutePath(node));
            })
            orderInfo.pics=pics.join(',');
            console.log(orderInfo,'orderInfo')
            orderInfo.stime=str.getUnixToTime(orderInfo.stime);
        }

        var sql = new StringBuilder();
        sql.AppendFormat("SELECT client.*, sales.sales_classroom,(CASE WHEN client.en_status = 1 THEN '正式' ");
        sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid = 0 OR (client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 0) THEN '意向' WHEN client.en_status = 0 AND client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY ");
        sql.AppendFormat(" ) THEN '报备' WHEN client.en_status = 0 AND client.en_clerkid != 0 AND client.en_follow_status = 1 ");
        sql.AppendFormat(" AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) AND client.time <= DATE_SUB(now(), ");
        sql.AppendFormat(" INTERVAL c.classroom_report_time - 5 DAY) THEN '即将过期' ELSE '过期' END) AS reportStatus,(CASE WHEN client.mid IN (SELECT ");
        sql.AppendFormat(" ap.FOREIGN FROM gj_apply AS ap WHERE ap.type = 3 AND ap. STATUS = 0) THEN 1 ELSE 0 END) AS applyStatus ");
        sql.AppendFormat(" FROM (SELECT uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_channel,uc.en_uid,uc.en_fee,uc.en_classroomid, ");
        sql.AppendFormat(" uc.en_clerkid,classroom.classroom_name,goods.goods_name,member.m_name,member.m_phone,member.m_card,member.m_company, ");
        sql.AppendFormat(" member.m_position,member.mid,clerk.m_name AS clerk,clerk.m_phone AS clerk_phone,uc.en_time AS time FROM gj_enroll_user_class AS uc ");
        sql.AppendFormat(" INNER JOIN gj_enroll_lesson AS en ON en.lesson_id = uc.en_key_name AND en.type = 0 INNER JOIN gj_goods AS goods ON goods.goodsid = en.lesson_name ");
        sql.AppendFormat(" LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid INNER JOIN gj_members AS member ON member.mid = uc.en_mid ");
        sql.AppendFormat(" LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid WHERE en_form = 1 UNION ALL SELECT uc.en_pay_status,uc.en_status, ");
        sql.AppendFormat(" uc.en_follow_status,uc.en_reference,uc.en_channel,uc.en_uid,uc.en_fee,uc.en_classroomid,uc.en_clerkid,classroom.classroom_name,goods.goods_name, ");
        sql.AppendFormat(" member.m_name,member.m_phone,member.m_card,member.m_company,member.m_position,member.mid,clerk.m_name AS clerk,clerk.m_phone AS clerk_phone, ");
        sql.AppendFormat(" uc.en_time AS time FROM gj_enroll_user_class AS uc INNER JOIN gj_goods AS goods ON goods.goodsid = uc.en_goodsid ");
        sql.AppendFormat(" LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid INNER JOIN gj_members AS member ON member.mid = uc.en_mid ");
        sql.AppendFormat(" LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid WHERE en_form = 0) AS client ");
        sql.AppendFormat(" LEFT JOIN gj_sales AS sales ON sales.sales_members = client.en_clerkid LEFT JOIN gj_classroom AS c ON sales.sales_classroom = c.classroom ");
        sql.AppendFormat(" WHERE client.clerk_phone = {0} AND (CASE WHEN client.en_status = 1 THEN 1 WHEN client.en_status = 0 AND client.en_clerkid = 0 ",phone);
        sql.AppendFormat(" OR (client.en_clerkid != 0 AND client.en_follow_status = 0) THEN 2 WHEN client.en_status = 0 AND client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN 3 WHEN client.en_status = 0 ");
        sql.AppendFormat(" AND client.en_clerkid != 0 AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time DAY) ");
        sql.AppendFormat(" AND client.time <= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN 4 ELSE 5 END) IN (1,2,3,4,5) ");
        sql.AppendFormat(" AND client.en_uid in {0} ",body.enUids);
        models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
            result.forEach(function (node,index) {
                node.time=str.getUnixToTime(node.time);
                if(node.en_pay_status == 0){
                    node.en_pay_status="未缴费";
                }else{
                    node.en_pay_status="已缴费";
                }

                if(node.en_pay_status == 0){
                    node.en_pay_status="未缴费";
                }else{
                    node.en_pay_status="已缴费";
                }
            })
            return response.ApiSuccess(res, {result:result,orderInfo:orderInfo}, '获取成功');
        });
    })
})
/**
 * 保存申请学员缴费订单信息
 */
router.post('/submitApplyInfos/:id',function (req,res) {
    var phone=req.params.id;
    var body=req.body;
    var uidAndFeeArr=body.uidAndFeeArr;
    if(body.enUids.length==0 || body.pics.length==0 || body.uidAndFeeArr.length == 0){
        return response.onError(res,{message:'参数错误'})
    }
    var id=0
    console.log(body.enUids.length,body.pics.length,body.uidAndFeeArr.length)
    console.log(body,'body')
    console.log(body.uidAndFeeArr,'uidAndFeeArr')
    uidAndFeeArr.forEach(function (node,index) {
        models.EnrollUserClass.update({en_fee:node.en_fee},{where:{en_uid:node.en_uid}});
    })
    return models.sequelize.transaction(function (t) {

        // 要确保所有的查询链都有return返回
        return models.paymentOrder.create({
            stime: body.stime,
            etime:'',
            fee: body.fee,
            method:body.method,
            order:body.order,
            pics:body.pics,
            branch:body.branch,
            desc:body.desc
        }, {transaction: t}).then(function (data) {
            //构建对象
            id=data.dataValues.id
            var records=[]
            body.enUids.split(',').forEach(function (node) {
                records.push({uid:node,oid:id})
            })
            return models.OrderRelevanceUser.bulkCreate(records, {transaction: t});
        }).then(function (data) {
            return models.Remark.create({
                    type: 1,
                    key:id,
                    content:body.desc,
                    ip:req.ip,
                    create:phone
                }, {transaction: t})
        })

    }).then(function (result) {
        return response.onSuccess(res,{})
    }).catch(function (err) {
        console.log(err)
    });
})
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
    }
    return statusDesc
}
/**
 * 获取缴费订单管理列表数据
 */
router.get('/apply_pay_list/:id',function (req,res) {
    var body=req.query;
    var phone=req.params.id;
    var options=page.get_page_options(req);
    var where = [];
    co(function *() {
        try {
            var select = new StringBuilder();
            var selectCount = new StringBuilder();
            var selectExport = new StringBuilder();
            //列表
            select.AppendFormat("SELECT * FROM (SELECT o.oid, client.* FROM (SELECT classroom.classroom_area_city AS area_name,");
            select.AppendFormat("classroom.classroom_areaid AS areaid,classroom.classroom,classroom.classroom_name,uc.en_uid,uc.en_fee,");
            select.AppendFormat("goods.goodsid,goods.goods_name,member.mid,member.m_pics,member.m_name,member.m_phone,member.m_card,");
            select.AppendFormat("clerk.m_name AS clerk,clerk.m_phone as clerk_phone FROM gj_enroll_user_class AS uc INNER JOIN gj_enroll_lesson AS en ON en.lesson_id = uc.en_key_name");
            select.AppendFormat(" AND en.type = 0 INNER JOIN gj_goods AS goods ON goods.goodsid = en.lesson_name LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            select.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            select.AppendFormat(" WHERE en_form = 1 UNION ALL SELECT classroom.classroom_area_city AS area_name,classroom.classroom_areaid AS areaid,");
            select.AppendFormat("classroom.classroom,classroom.classroom_name,uc.en_uid,uc.en_fee,goods.goodsid,goods.goods_name,member.mid,member.m_pics,");
            select.AppendFormat("member.m_name,member.m_phone,member.m_card,clerk.m_name AS clerk,clerk.m_phone as clerk_phone FROM gj_enroll_user_class AS uc");
            select.AppendFormat(" INNER JOIN gj_goods AS goods ON goods.goodsid = uc.en_goodsid LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            select.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            select.AppendFormat(" WHERE en_form = 0 ) AS client INNER JOIN gj_order_relevance_user AS o ON o.uid = client.en_uid) member");
            select.AppendFormat(" INNER JOIN (SELECT * FROM gj_payment_order) orders");
            select.AppendFormat(" ON member.oid=orders.id WHERE 1=1 and orders.status in (0,1,2) AND member.clerk_phone='{0}'",phone);
            //总行数
            selectCount.AppendFormat("SELECT COUNT(*) AS count FROM (SELECT o.oid, client.* FROM (SELECT classroom.classroom_area_city AS area_name,");
            selectCount.AppendFormat("classroom.classroom_areaid AS areaid,classroom.classroom,classroom.classroom_name,uc.en_uid,");
            selectCount.AppendFormat("goods.goodsid,goods.goods_name,member.mid,member.m_pics,member.m_name,member.m_phone,member.m_card,");
            selectCount.AppendFormat("clerk.m_name AS clerk,clerk.m_phone as clerk_phone FROM gj_enroll_user_class AS uc INNER JOIN gj_enroll_lesson AS en ON en.lesson_id = uc.en_key_name");
            selectCount.AppendFormat(" AND en.type = 0 INNER JOIN gj_goods AS goods ON goods.goodsid = en.lesson_name LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            selectCount.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            selectCount.AppendFormat(" WHERE en_form = 1 UNION ALL SELECT classroom.classroom_area_city AS area_name,classroom.classroom_areaid AS areaid,");
            selectCount.AppendFormat("classroom.classroom,classroom.classroom_name,uc.en_uid,goods.goodsid,goods.goods_name,member.mid,member.m_pics,");
            selectCount.AppendFormat("member.m_name,member.m_phone,member.m_card,clerk.m_name AS clerk,clerk.m_phone as clerk_phone FROM gj_enroll_user_class AS uc");
            selectCount.AppendFormat(" INNER JOIN gj_goods AS goods ON goods.goodsid = uc.en_goodsid LEFT JOIN gj_classroom AS classroom ON classroom.classroom = uc.en_classroomid");
            selectCount.AppendFormat(" INNER JOIN gj_members AS member ON member.mid = uc.en_mid LEFT JOIN gj_members AS clerk ON clerk.mid = uc.en_clerkid");
            selectCount.AppendFormat(" WHERE en_form = 0 ) AS client INNER JOIN gj_order_relevance_user AS o ON o.uid = client.en_uid) member");
            selectCount.AppendFormat(" INNER JOIN (SELECT * FROM gj_payment_order) orders");
            selectCount.AppendFormat(" ON member.oid=orders.id WHERE 1=1 and orders.status in (0,1,2) AND member.clerk_phone='{0}' ",phone);

            if(body.status){
                select.AppendFormat(" AND orders.status = {0}", body.status);
                selectCount.AppendFormat(" AND orders.status = {0}", body.status);
            }
            if(body.name){
                select.AppendFormat(" AND (member.m_name LIKE '%{0}%' OR member.m_phone LIKE '%{0}%') ", body.name);
                selectCount.AppendFormat(" AND (member.m_name LIKE '%{0}%' OR member.m_phone LIKE '%{0}%') ", body.name);
            }
            select.AppendFormat("  order by find_in_set(orders.status,'0,2,1'),orders.createdat desc  ");
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
                console.log(count[0].count,'count[0].count')
                return response.onSuccess(res, {list: item,exportDataList:exportDataList, pagecount: count[0].count});
            });
        } catch (err) {
            console.log(err);
            return response.onError(res,'获取数据失败');
        }
    })
})
/**
 * 根据订单id查询关联学员信息
 */
router.post('/get-apply-enUids/:id',function (req,res) {
    var body=req.body;
    var sql = new StringBuilder();
    sql.AppendFormat("SELECT oru.uid AS en_uid FROM gj_order_relevance_user oru ");
    sql.AppendFormat(" INNER JOIN gj_payment_order porder ");
    sql.AppendFormat(" ON oru.oid=porder.id WHERE oru.oid={0} ",body.oid);
    models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
        return response.ApiSuccess(res,{list:result})
    });
})
module.exports = router;
