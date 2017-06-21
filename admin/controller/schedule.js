/**
 * 定时任务
 * Created by trlgml on 2017/5/12.
 */
var models  = require('../../models');
var config=require('../../config/config');
var Yunpian = require('../../utils/yunpian');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');;
var co = require('co');
var Logs=require("../controller/logs");
var database = require('../../database');
var hx = require('../../utils/hxchat');
var StringBuilder = require('../../utils/StringBuilder');
var UM = require('../../middlerware/um');
var _=require('lodash')
var schedule = require('../../utils/schedule');
console.log('定时任务运行')
//课程定时任务
schedule.scheduleCronstyle('00 00 20 * * *',function () {
    //获取需要的信息之后直接调用自己的接口直接发送
    console.log('**************触发上课提醒发送定时器*******************'+moment().format('YYYY-MM-DD HH:mm:ss'))
    var info=new StringBuilder();
    info.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time,m_name as name from gj_class as c " +
        "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
        "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) " +
        "WHERE DATE_SUB(CURDATE(), INTERVAL-1 DAY) <= class_start AND DATE_SUB(CURDATE(), INTERVAL-2 DAY) > class_start");
    models.sequelize.query(info.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (base) {
        var map = {},
            dest = [];
        for (var i = 0; i < base.length; i++) {
            var node = base[i];
            if (!map[node.id]) {
                dest.push(node);
                map[node.id] = 'true';
            } else {
                for (var j = 0; j < dest.length; j++) {
                    var dj = dest[j];
                    if (dj.id == node.id) {
                        dj.name = dj.name + '/' + node.name;
                        break;
                    }
                }
            }
        }
        function format(time) {
            return moment(time).locale('zh-cn').format('MMM Do') + ' ' + moment(time).locale('zh-cn').format('dddd') + ' ' + moment(time).format('HH:mm');
        }
        // 构建数据
        var request = require('request');
        dest.forEach(function (node,index) {
            var form={
                inform_type:1,
                inform_title:'您好，您的课程《'+node.title+'》即将开讲，不要忘记哦！',
                inform_key:node.id,
                inform_sub:node.goods+'：'+node.name+'主讲的《'+node.title+'》，'+format(node.time)+'准时开讲，请您提前做好安排，以免错过课程！'
            }
            request.post({
                url:config.baseUrl+'/admin/interior_inform_push',
                form: form
            }, function(err,httpResponse,body){
                console.log(body)
                console.log(err)
            })
        })
        //调用自身的请求
    }).catch(function (err) {
        console.log(err)
    })

})
//短信定时任务
/*var sql=new StringBuilder();
sql.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time from gj_class as c " +
    "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
    "WHERE DATE_SUB(NOW(), INTERVAL-2 HOUR) >= class_start AND NOW() <= class_start");
models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
    data=data[0]
    data.time=moment(data.time).format('HH:mm')
    console.log(data)
})*/
//历史推送逻辑
/*schedule.scheduleRecurrenceRule({minute:[0],hour:[4,6,8,10,12,14,16,18,20]},function () {
    //获取需要的信息之后直接调用自己的接口直接发送
    console.log('**************触发短信任务*******************'+moment().format('YYYY-MM-DD HH:mm:ss'))
    co(function *() {
        try{
            //查询课程
            var sql=new StringBuilder();
            sql.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time from gj_class as c " +
                "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
                "WHERE DATE_SUB(NOW(), INTERVAL-2 HOUR) >= class_start AND NOW() <= class_start");
            var info=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            if(info.length==0){//不存在课程
                return
            }
            for (var i=0,len=info.length;i<len;i++){
                var node=info[i]

                //查询人员
                var targetSql=new StringBuilder();
                var targetArr=[];
                targetSql.AppendFormat("select uc_userid as id from gj_class as c " +
                    "INNER JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid WHERE classid={0} " +
                    "UNION ALL " +
                    "select mid as id from gj_members WHERE gj_members.m_type=10 " +
                    "UNION ALL " +
                    "select member as id from gj_branch_manage as b " +
                    "INNER JOIN gj_class ON gj_class.class_goodsid=b.goods WHERE gj_class.classid={0} " +
                    "UNION ALL " +
                    "select member as id from gj_branch_manage as b WHERE type in (1,2,5)",node.id);
                var targetList=yield models.sequelize.query(targetSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                targetList.forEach(function (node,index) {
                    targetArr.push(node.id)
                });
                if(targetArr==0){//不存在人
                    return
                }
                targetArr=_.union(targetArr)//去除重复
                //用户id换用户手机号码
                var Phone=yield models.Members.findAll({
                    where:{mid:{"$in":targetArr}},
                    raw:true,
                    attributes:['m_phone']
                })
                var phoneArr=[];//最终手机号
                Phone.forEach(function (node) {
                    phoneArr.push(node.m_phone)
                })
                //对于超过1000的分组发送
                var content='【格局商学】 课程"'+node.goods+'"之《'+node.title+'》，今日'+moment(node.time).format('HH:mm')+'准时开讲，请您不要忘记上课！App中可参与互动提问、下载课件、查看最新课程预告、课后回顾及课后评价：http://t.geju.com/rk5XUgvkW。'
                if(phoneArr.length>1000){
                    for(var i=0,len=phoneArr.length;i<len;i+=1000){
                        yield Yunpian.batch_send({mobile:phoneArr.slice(i,i+1000),text:content})
                    }
                }else {
                        yield Yunpian.batch_send({mobile:phoneArr,text:content})
                }
            }
        }catch (err){
            console.log(err)
        }
    })
})*/
//上午上课的课程：前一天下午13:00提醒
/*schedule.scheduleCronstyle('00 00 13 * * *',function () {
 //获取需要的信息之后直接调用自己的接口直接发送
 console.log('**************触发短信任务*******************'+moment().format('YYYY-MM-DD HH:mm:ss'))
 return
 co(function *() {
 try{
 //查询课程
 var sql=new StringBuilder();
 sql.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time from gj_class as c " +
 "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
 "WHERE DATE_SUB(NOW(), INTERVAL-2 HOUR) >= class_start AND NOW() <= class_start");
 var info=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
 if(info.length==0){//不存在课程
 return
 }
 for (var i=0,len=info.length;i<len;i++){
 var node=info[i]

 //查询人员
 var targetSql=new StringBuilder();
 var targetArr=[];
 targetSql.AppendFormat("select uc_userid as id from gj_class as c " +
 "INNER JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid WHERE classid={0} " +
 "UNION ALL " +
 "select mid as id from gj_members WHERE gj_members.m_type=10 " +
 "UNION ALL " +
 "select member as id from gj_branch_manage as b " +
 "INNER JOIN gj_class ON gj_class.class_goodsid=b.goods WHERE gj_class.classid={0} " +
 "UNION ALL " +
 "select member as id from gj_branch_manage as b WHERE type in (1,2,5)",node.id);
 var targetList=yield models.sequelize.query(targetSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
 targetList.forEach(function (node,index) {
 targetArr.push(node.id)
 });
 if(targetArr==0){//不存在人
 return
 }
 targetArr=_.union(targetArr)//去除重复
 //用户id换用户手机号码
 var Phone=yield models.Members.findAll({
 where:{mid:{"$in":targetArr}},
 raw:true,
 attributes:['m_phone']
 })
 var phoneArr=[];//最终手机号
 Phone.forEach(function (node) {
 phoneArr.push(node.m_phone)
 })
 //对于超过1000的分组发送
 var content='【格局商学】 课程"'+node.goods+'"之《'+node.title+'》，今日'+moment(node.time).format('HH:mm')+'准时开讲，请您不要忘记上课！App中可参与互动提问、下载课件、查看最新课程预告、课后回顾及课后评价：http://t.geju.com/rk5XUgvkW。'
 if(phoneArr.length>1000){
 for(var i=0,len=phoneArr.length;i<len;i+=1000){
 yield Yunpian.batch_send({mobile:phoneArr.slice(i,i+1000),text:content})
 }
 }else {
 yield Yunpian.batch_send({mobile:phoneArr,text:content})
 }
 }
 }catch (err){
 console.log(err)
 }
 })
 })
//下午6点以前上课的课程：当天上午10:00提醒
schedule.scheduleCronstyle('00 00 10 * * *',function () {
    //获取需要的信息之后直接调用自己的接口直接发送
    console.log('**************触发短信任务*******************'+moment().format('YYYY-MM-DD HH:mm:ss'))
    return
    co(function *() {
        try{
            //查询课程
            var sql=new StringBuilder();
            sql.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time from gj_class as c " +
                "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
                "WHERE DATE_SUB(NOW(), INTERVAL-2 HOUR) >= class_start AND NOW() <= class_start");
            var info=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            if(info.length==0){//不存在课程
                return
            }
            for (var i=0,len=info.length;i<len;i++){
                var node=info[i]

                //查询人员
                var targetSql=new StringBuilder();
                var targetArr=[];
                targetSql.AppendFormat("select uc_userid as id from gj_class as c " +
                    "INNER JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid WHERE classid={0} " +
                    "UNION ALL " +
                    "select mid as id from gj_members WHERE gj_members.m_type=10 " +
                    "UNION ALL " +
                    "select member as id from gj_branch_manage as b " +
                    "INNER JOIN gj_class ON gj_class.class_goodsid=b.goods WHERE gj_class.classid={0} " +
                    "UNION ALL " +
                    "select member as id from gj_branch_manage as b WHERE type in (1,2,5)",node.id);
                var targetList=yield models.sequelize.query(targetSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                targetList.forEach(function (node,index) {
                    targetArr.push(node.id)
                });
                if(targetArr==0){//不存在人
                    return
                }
                targetArr=_.union(targetArr)//去除重复
                //用户id换用户手机号码
                var Phone=yield models.Members.findAll({
                    where:{mid:{"$in":targetArr}},
                    raw:true,
                    attributes:['m_phone']
                })
                var phoneArr=[];//最终手机号
                Phone.forEach(function (node) {
                    phoneArr.push(node.m_phone)
                })
                //对于超过1000的分组发送
                var content='【格局商学】 课程"'+node.goods+'"之《'+node.title+'》，今日'+moment(node.time).format('HH:mm')+'准时开讲，请您不要忘记上课！App中可参与互动提问、下载课件、查看最新课程预告、课后回顾及课后评价：http://t.geju.com/rk5XUgvkW。'
                if(phoneArr.length>1000){
                    for(var i=0,len=phoneArr.length;i<len;i+=1000){
                        yield Yunpian.batch_send({mobile:phoneArr.slice(i,i+1000),text:content})
                    }
                }else {
                    yield Yunpian.batch_send({mobile:phoneArr,text:content})
                }
            }
        }catch (err){
            console.log(err)
        }
    })
})
//晚上18:00及以后上课的课程：前一天下午13:00提醒
schedule.scheduleCronstyle('00 00 13 * * *',function () {
    //获取需要的信息之后直接调用自己的接口直接发送
    console.log('**************触发短信任务*******************'+moment().format('YYYY-MM-DD HH:mm:ss'))
    return
    co(function *() {
        try{
            //查询课程
            var sql=new StringBuilder();
            sql.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time from gj_class as c " +
                "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
                "WHERE DATE_SUB(NOW(), INTERVAL-2 HOUR) >= class_start AND NOW() <= class_start");
            var info=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
            if(info.length==0){//不存在课程
                return
            }
            for (var i=0,len=info.length;i<len;i++){
                var node=info[i]

                //查询人员
                var targetSql=new StringBuilder();
                var targetArr=[];
                targetSql.AppendFormat("select uc_userid as id from gj_class as c " +
                    "INNER JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid WHERE classid={0} " +
                    "UNION ALL " +
                    "select mid as id from gj_members WHERE gj_members.m_type=10 " +
                    "UNION ALL " +
                    "select member as id from gj_branch_manage as b " +
                    "INNER JOIN gj_class ON gj_class.class_goodsid=b.goods WHERE gj_class.classid={0} " +
                    "UNION ALL " +
                    "select member as id from gj_branch_manage as b WHERE type in (1,2,5)",node.id);
                var targetList=yield models.sequelize.query(targetSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                targetList.forEach(function (node,index) {
                    targetArr.push(node.id)
                });
                if(targetArr==0){//不存在人
                    return
                }
                targetArr=_.union(targetArr)//去除重复
                //用户id换用户手机号码
                var Phone=yield models.Members.findAll({
                    where:{mid:{"$in":targetArr}},
                    raw:true,
                    attributes:['m_phone']
                })
                var phoneArr=[];//最终手机号
                Phone.forEach(function (node) {
                    phoneArr.push(node.m_phone)
                })
                //对于超过1000的分组发送
                var content='【格局商学】 课程"'+node.goods+'"之《'+node.title+'》，今日'+moment(node.time).format('HH:mm')+'准时开讲，请您不要忘记上课！App中可参与互动提问、下载课件、查看最新课程预告、课后回顾及课后评价：http://t.geju.com/rk5XUgvkW。'
                if(phoneArr.length>1000){
                    for(var i=0,len=phoneArr.length;i<len;i+=1000){
                        yield Yunpian.batch_send({mobile:phoneArr.slice(i,i+1000),text:content})
                    }
                }else {
                    yield Yunpian.batch_send({mobile:phoneArr,text:content})
                }
            }
        }catch (err){
            console.log(err)
        }
    })
})*/
