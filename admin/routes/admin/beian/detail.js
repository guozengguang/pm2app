/**
 * Created by guozengguang on 2017/04/17.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var str = require(process.cwd() + '/utils/str');
var models = require(process.cwd() + '/models/index');
var moment = require('moment');
var co = require('co');
var sms = require(process.cwd() + '/utils/sms');
var Logs=require(process.cwd() + "/admin/controller/logs");
router.all('/*', Filter.authorize);
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
 * 跳转到报备学员详情、修改页
 */
router.get('/report_detail', function (req, res) {
    var body = req.query;
    var branch = req.Branch;
    var sql = new StringBuilder()
    co(function *() {
        var where={}
        var Classroom=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom_name','classroom']});
        Classroom=Classroom?Classroom:[]
        var remarkList = yield Logs.remarkList(2,body.en_uid);
        remarkList.forEach(function (node,index) {
            node.createdAt=str.getUnixToTime(node.createdAt)
        })
        /*start*/
        var sqlTeacher=new StringBuilder();
        sqlTeacher.Append("select c.classroom,m.m_name,c.classroom_name,m.mid from gj_sales as sales " +
            "INNER JOIN gj_members as m ON m.mid=sales.sales_members " +
            "INNER JOIN gj_classroom as c ON c.classroom=sales.sales_classroom WHERE 1=1");
        if(branch){
            sqlTeacher.AppendFormat(" AND sales.sales_classroom={0}",branch);
        }
        sqlTeacher.AppendFormat(" AND m.m_status=0 ");
        var teacher = yield models.sequelize.query(sqlTeacher.ToString(),{ type: models.sequelize.QueryTypes.SELECT,raw:true});
        /*end*/
        sql.AppendFormat("SELECT client.*, sales.sales_classroom,(CASE WHEN client.en_status = 1 THEN '正式' ");
        sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid = 0 OR (client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 0) THEN '意向' WHEN client.en_status = 0 AND client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN '报备' ");
        sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid != 0 AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(), ");
        sql.AppendFormat(" INTERVAL c.classroom_report_time DAY) AND client.time <= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN ");
        sql.AppendFormat(" '即将过期' ELSE '过期' END) AS statusDesc FROM (SELECT uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_mid, ");
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
        sql.AppendFormat(" WHERE 1 = 1 AND en_uid = {0} ", body.en_uid);
        models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT}).then(function (result) {
            branch="报备转院"
            if(req.Branch){
                branch="申请转院"
            }
            var item = result[0];
            item.time = moment(item.time).format('YYYY-MM-DD HH:mm:ss');
            item.flag = body.flag;
            return res.render('beian/detail/report_detail', {
                title: '报备学员详细信息',
                item: JSON.stringify(item),
                calssRoom:Classroom,
                branchName:branch,
                list:teacher,
                remarkList:JSON.stringify(remarkList)
            });
        });
    })
})

/**
 * 跳转到正式学员详情、修改页
 */
router.get('/formal_detail', function (req, res) {
    var branch = req.Branch;
    var body = req.query;
    co(function *() {
        var where={}
        var Classroom=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom_name','classroom']});
        Classroom=Classroom?Classroom:[]
        var remarkList = yield Logs.remarkList(2,body.en_uid);
        remarkList.forEach(function (node,index) {
            node.createdAt=str.getUnixToTime(node.createdAt)
        })
        /*start*/
        var sqlTeacher=new StringBuilder();
        sqlTeacher.Append("select c.classroom,m.m_name,c.classroom_name,m.mid from gj_sales as sales " +
            "INNER JOIN gj_members as m ON m.mid=sales.sales_members " +
            "INNER JOIN gj_classroom as c ON c.classroom=sales.sales_classroom WHERE 1=1");
        if(branch){
            sqlTeacher.AppendFormat(" AND sales.sales_classroom={0}",branch);
        }
        sqlTeacher.AppendFormat(" AND m.m_status=0 ");
        var teacher = yield models.sequelize.query(sqlTeacher.ToString(),{ type: models.sequelize.QueryTypes.SELECT,raw:true});
        /*end*/
        var sql = new StringBuilder()
        sql.AppendFormat("SELECT client.*, sales.sales_classroom,(CASE WHEN client.en_status = 1 THEN '正式' ");
        sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid = 0 OR (client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 0) THEN '意向' WHEN client.en_status = 0 AND client.en_clerkid != 0 ");
        sql.AppendFormat(" AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN '报备' ");
        sql.AppendFormat(" WHEN client.en_status = 0 AND client.en_clerkid != 0 AND client.en_follow_status = 1 AND client.time >= DATE_SUB(now(), ");
        sql.AppendFormat(" INTERVAL c.classroom_report_time DAY) AND client.time <= DATE_SUB(now(),INTERVAL c.classroom_report_time - 5 DAY) THEN ");
        sql.AppendFormat(" '即将过期' ELSE '过期' END) AS statusDesc FROM (SELECT uc.en_pay_status,uc.en_status,uc.en_follow_status,uc.en_reference,uc.en_mid, ");
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
        sql.AppendFormat(" WHERE 1 = 1 AND en_uid = {0} ", body.en_uid);
        var item = yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
        var sqlTime = new StringBuilder();
        sqlTime.AppendFormat("SELECT porder.stime as payTime,porder.etime as arrvalTime FROM gj_order_relevance_user oru INNER JOIN gj_payment_order porder ");
        sqlTime.AppendFormat(" ON oru.oid=porder.id INNER JOIN gj_enroll_user_class class ON oru.uid=class.en_uid INNER JOIN gj_goods goods ");
        sqlTime.AppendFormat(" INNER JOIN gj_members members ON class.en_mid=members.mid ");
        sqlTime.AppendFormat(" WHERE 1=1 AND class.en_mid={0} AND class.en_status=1  AND goods.goodsid={1} LIMIT 1 ",body.en_mid,body.goodsid);
        var timeInfo = yield models.sequelize.query(sqlTime.ToString(), {type: models.sequelize.QueryTypes.SELECT});

        var item = item[0];
        item.time = moment(item.time).format('YYYY-MM-DD  HH:mm:ss');
        item.flag = body.flag;
        item.payTime=moment(timeInfo[0].payTime).format('YYYY-MM-DD HH:mm:ss') != 'Invalid date'?moment(timeInfo[0].payTime).format('YYYY-MM-DD HH:mm:ss'):'';
        item.arrvalTime=moment(timeInfo[0].arrvalTime).format('YYYY-MM-DD HH:mm:ss') != 'Invalid date'?moment(timeInfo[0].arrvalTime).format('YYYY-MM-DD HH:mm:ss'):'';
        // console.log(item.en_mid)
        item.branch=branch;
        console.log(item.time)
        console.log(item.payTime)
        console.log(item.arrvalTime)
        var family = yield models.Family.findOne({where: {mid: item.en_mid}});
        if (family) {
            item.family = family.dataValues;
            var newFieldList = yield models.FamilyDynamicField.findAll({where: {family_id: family.dataValues.family_id},raw:true});
            if (newFieldList) {
                item.family.newFieldList = newFieldList;
            } else {
                item.family.newFieldList = {};
            }
        } else {
            item.family = {};
            item.family.newFieldList = {};
        }
        //filter duty data
        var configs =  yield models.FamilyDynamicConfig.findAll({raw:true});
        if(item.family.newFieldList && item.family.newFieldList.length > 0){
            console.log(configs,'configs')
            console.log(item.family.newFieldList,'item.family.newFieldList')
            configs.forEach(function (nodeConfig,indexConfig) {
                item.family.newFieldList.forEach(function (node,index) {
                    if(nodeConfig.key == node.key){
                        nodeConfig.value=node.value;
                    }
                })
            })
            item.family.newFieldList = configs;
        }else{
            item.family.newFieldList=[];
            configs.forEach(function (nodeConfig,indexConfig) {
                item.family.newFieldList.push({key:nodeConfig.key,value:''})
            })
        }

        branch="报备转院"
        if(req.Branch){
            branch="申请转院"
        }
        return res.render('beian/detail/formal_detail', {
            title: '正式学员详细信息',
            item: JSON.stringify(item),
            calssRoom:Classroom,
            branchName:branch,
            list:teacher,
            remarkList:JSON.stringify(remarkList)
        });
    })
})
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
 *修改报备转院信息
 */
var updateClassroomInfo = (req,ClassRoomInfo) => {
    var body=ClassRoomInfo;
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
 * 修改归属信息
 * @param req
 * @param ClerkInfo
 */
var updateClerkInfo = (req,ClerkInfo)=>{
    var body=ClerkInfo;
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
                console.log({phone:NewHeHuoRenPhone,data:[XueYuanName,XueYuanPhone]})
                sms.putInform(informConfig,{phone:NewHeHuoRenPhone,data:[XueYuanName,XueYuanPhone]})
            }else {//存在原始招生老师通知两个人
                //已经转移到你的报备系统中
                informConfig.templateId=155196;
                console.log(11111111111)
                console.log({phone:NewHeHuoRenPhone,data:[XueYuanName,XueYuanPhone + '']})
                sms.putInform(informConfig,{phone:NewHeHuoRenPhone + '',data:[XueYuanName,XueYuanPhone + '']});
                //已经转移，详情请联系本分院负责人
                informConfig.templateId=154567;
                console.log({phone:OldHeHuoRenPhone,data:[XueYuanName,XueYuanPhone]})
                sms.putInform(informConfig,{phone:OldHeHuoRenPhone + '',data:[XueYuanName,XueYuanPhone + '']}).then(function (data) {
                    console.log(data)
                }).catch(function (err) {
                    console.log(err)
                })

            }
        }catch (err){
            console.log(err)
            return response.onError(res,{message:err.toString()})
        }
    })

}
/**
 * 修改报备学员信息
 */
router.post('/updateReport', function (req, res) {
    // var body = req.body.baseInfo;
    var baseInfo;
    var ClassRoomInfo;
    var ClerkInfo;
    req.body.forEach(function (node,index) {
        if("baseInfo" == node.name){
            baseInfo=node.value;
        }

        if("ClassRoomInfo" == node.name){
            ClassRoomInfo=node.value;
        }

        if("ClerkInfo" == node.name){
            ClerkInfo=node.value;
        }
    })
    co(function *() {
        try{
            //查询身份证号是否重复
            if(baseInfo.m_card){
                var member = yield models.Members.findOne({where:{m_card:baseInfo.m_card,mid:{$ne:baseInfo.en_mid}}})
                if(member){
                    console.log("=====sssss")
                    return response.ApiError(res,{message:'身份证号已存在'})
                }
            }
            yield models.EnrollUserClass.update({
                en_reference: baseInfo.en_reference,
                en_desc: baseInfo.en_desc
            }, {where: {en_uid: baseInfo.en_uid}});
            yield models.Members.update({
                m_name: baseInfo.m_name,
                m_company: baseInfo.m_company,
                m_position: baseInfo.m_position,
                m_card: baseInfo.m_card
            }, {where: {mid: baseInfo.en_mid}});

            //报备转院
            if(ClassRoomInfo){
                updateClassroomInfo(req,ClassRoomInfo);
            }

            //修改归属
            if(ClerkInfo){
                console.log('start......')
                updateClerkInfo(req,ClerkInfo);
            }
            return response.ApiSuccess(res, {}, '修改成功');
        }catch(err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
})

/**
 * 修改正式学员家庭信息
 */
router.post('/updateFamilyInfo', function (req, res) {
    var body = req.body;
    co(function *() {
        // console.log(!body.family_id)
        //delete config
        yield models.FamilyDynamicConfig.destroy({where:{}});

        if (!body.family_id) {
            var family = yield models.Family.create(body);
            body.family_id = family.dataValues.family_id;
        } else {
            yield models.Family.update(body, {where: {family_id: body.family_id}});
        }
        yield models.FamilyDynamicField.destroy({where: {family_id: body.family_id}});
        var configArr = [];
        if (body.newFieldList != null && body.newFieldList.length > 0) {
            body.newFieldList.forEach(function (node, index) {
                node.family_id = body.family_id;
                node.creater = req.session.user.uid;
                node.updater = req.session.user.uid;
                node.field_id = '';
                configArr.push({key:node.key,creater:node.creater,updater:node.updater})
            })
            console.log(configArr,'configArr')
            yield models.FamilyDynamicConfig.bulkCreate(configArr);
            yield models.FamilyDynamicField.bulkCreate(body.newFieldList);
            return response.ApiSuccess(res, {}, '修改成功');
        }
        return response.ApiSuccess(res, {}, '修改成功');
    })
})

module.exports = router;