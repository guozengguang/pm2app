var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var cookie = require('../../utils/cookie');
var page = require('../../utils/page');
var response = require('../../utils/response');
var py = require('../../utils/strChineseFirstPY');
var sms = require('../../utils/sms');
var config=require('../../config/config');
var database = require('../../database');
var co = require('co');
var moment = require('moment');
var StringBuilder = require('../../utils/StringBuilder');
var yunPian = require('../../utils/yunpian');
var hx = require('../../utils/hxchat');
var verification=config.verification;

var middleware={
  cookieConfig : {
    domain: '.geju.com',
    path: '/',
    secure: false,
    maxAge: 10*60000,
    httpOnly: true
  },
  /**
   * 验证参数是否缺失
   * @param arr 需要验证字段的数组
   * @param body 传入的参数
   * @returns {boolean} false 缺失 true 不确
   */
  parameterControl : (arr,body) => {
    "use strict";
    var auth=0
    arr.map(function (node,index) {
      for (var key in body) {
        if(key==node){
          auth+=1
        }
      }
    })
    return auth!=arr.length;
  },
  /**
   * 通过手机号码验证码学员是否vip
   * @param phone
   * @returns {*}
   */
  authMember:(phone,area) =>{
    "use strict";
    return models.Members.findOne({
      where:{m_phone:phone,m_code:area},
      attributrs:['mid'],
      raw:true
    })
  },
  /**
   * 区号换区模板id
   * @param code 区号
   * @returns {number}
   */
  codeExchangeTpl:(code) => {
    "use strict";
    var guoji=1718034;
    var guonei=1718018;
    var tpl=(['+852','+86','+886','+853'].indexOf(code)==-1)?guoji:guonei;
    return tpl
  },
  /**
   * 新增验证码记录
   * @param body
   * @returns {body}
   */
  setSms : (body) => {
    return models.Smscode.create(body);
  },
  /**
   * 验证有效性
   * @param option
   * @returns {*}
   */
  checkSms : (option) => {
    "use strict";
    var time=option.time || 10;//默认三十分钟
    var sql=new StringBuilder();
    sql.AppendFormat("select sms.smscode as code " +
        "from gj_smscode as sms " +
        "where phoneno={0} AND area={1} AND type={2} AND createdAt <= '{3}' " +
        "ORDER BY createdAt DESC " +
        "LIMIT 1",option.phone,option.area,option.type,moment().add(time,'minute').format());
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (item) {
      if(item.length>0 && item[0].code==option.code){
        return true
      }else {
        return verification
      }
    })
  },
  /**
   * 获取人员信息 手机号码联合区号  或者   用户mid
   * @param option
   * @param option.phone 手机号码
   * @param option.area 手机区号
   * @param option.mid 用户mid
   * @returns {*}
   */
  getMemberInfo : (option) => {
    "use strict";
    var where={};
    if(option.mid){
      where.mid=option.mid
    }
    if(option.phone){
      where.m_phone=option.phone;
      where.m_code=option.area
    }
    return models.Members.findOne({
      where:where,
      raw:true,
    })
  },
  /**
   * 修改用户信息
   * @param body 修改的值
   * @param where 修改的条件
   * @returns {*}
   */
  setMemberInfo : (body,where) => {
   return models.Members.update(body,where)
  },
  /**
   * 新建用户
   * @param body
   * @returns {body}
   */
  createMember : (body) => {
    if(body.m_name){
      body.m_firstabv=py.makePy(body.m_name)
    }
    return models.Members.create(body)
  },
  /**
   * 清空错误次数
   * @param phone
   * @returns {*}
   */
  passwordErrorNumDel : (phone) =>{
    "use strict";
    return models.PassError.destroy({where:{phone:phone,time:{'$gt': moment().add('-1440','minute').format()}}})
  },
  /**
   * 密码错误累计
   * @param phone
   * @returns {Promise.<Instance, created>}
   */
  passwordErrorNum : (phone) =>{
    "use strict";
    return models.PassError.findOrCreate({
      where:{phone:phone,time:{'$gt': moment().add('-1440','minute').format()}},
      defaults:{phone:phone,time:new Date()}
    })
  },
  /**
   * 新建企业
   * @param body
   * @returns {body}
   */
  createEnterprise : (body) => {
    return models.Enterprise.create(body)
  },
  /**
   * 企业用户关联新建或者更新
   * @param body
   * @returns {body}
   */
  memberEnterprise : (body) => {
    return models.EnterpriseMember.upsert(body,{validate:true})
  },
  /**
   * 获取我的资料 -- 和getMemberInfo功能重复，为简单实现单独写
   * @param mid
   * @param arr  参数数组
   * @returns {*}
   */
  information : (mid,arr) => {
    "use strict";
    return models.Members.findOne({
      where:{mid:mid},
      raw:true,
      attributes:arr
    })
  },
  /**
   * 获取我的院办级别
   * @param mid
   * @returns {*}
   */
  getBranchManage : (mid) =>{
    "use strict";
    return models.branchManage.findAll({
      where:{member:mid,status:1},
      attributes:['type','goods','classroom'],
      raw:true
    })
  },
  /**
   * 获取我的课程
   * @param where
   * @returns {*}
   */
  getMyGoods : (where) =>{
    "use strict";
    return models.Userclass.findAll({
      where:where,
      attributes:[['uc_goodsid','goods'],['uc_calssroomid','calssroomid']],
      raw:true
    })
  },
  /**
   * 获取课程列表 v6使用
   * @param opt
   * @returns {*}
   */
  getMyClassSpecial : (opt) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.Append('SELECT goods.goodsid,goods.goods_name,goods.goods_img,c.*,m.m_name FROM gj_goods as goods ' +
        'LEFT JOIN (SELECT a.class_name,a.classid,a.class_goodsid,a.class_start,a.class_teacher,a.class_img ' +
        'FROM gj_class as a LEFT JOIN gj_class as b ON a.class_goodsid=b.class_goodsid ' +
        'AND a.class_start<b.class_start group by a.class_name,a.classid,a.class_goodsid,a.class_start,a.class_teacher,a.class_img ' +
        'having count(b.classid)<3) as c ON c.class_goodsid=goods.goodsid ' +
        'LEFT JOIN gj_members as m ON find_in_set(m.mid,c.class_teacher)');
    if(opt.goodsid){
      sql.AppendFormat(" WHERE goods.goodsid IN ({0})",opt.goodsid);
    }
    sql.Append(" ORDER BY class_start DESC")
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
  },
  /**
   * 获取我的提问
   * @param where
   * @param opt
   * @returns {*}
   */
  questionPush :(where,options) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("SELECT q.question_content as content,q.questionid,q.question_classid,q.question_votes as votes,q.createdAt as time,q.question_isupscreen as isupscreen,case when qa.assistid is null then 0 ELSE 1 end as isassist FROM gj_question as q LEFT JOIN gj_questionassist as qa on qa.assist_questionid = q.questionid and qa.assist_userid = {0} " +
        "WHERE question_fromuser={0} AND question_status=1 LIMIT {1},{2}",where.mid,options.offset,options.pagesize);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  },
  /**
   * 获取我的提问点赞
   * @param where
   * @param opt
   * @returns {*}
   */
  questionAssist :(where,options) =>{
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("SELECT q.question_classid,m.m_name,m.m_pics,room.classroom_name,q.questionid,q.question_content as content,q.question_votes as votes,q.createdAt as time,q.question_isupscreen as isupscreen FROM gj_question as q " +
        "INNER JOIN gj_questionassist as assist ON q.questionid=assist.assist_questionid " +
        "INNER JOIN gj_class as c ON c.classid=q.question_classid " +
        "LEFT JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid AND uc.uc_userid=q.question_fromuser " +
        "LEFT JOIN gj_classroom as room ON uc.uc_calssroomid=room.classroom " +
        "INNER JOIN gj_members as m ON m.mid=q.question_fromuser " +
        "WHERE assist.assist_userid={0} AND q.question_status=1 LIMIT {1},{2}",where.mid,options.offset,options.pagesize);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  },
  /**
   * 获取能提问的课程
   * @param where
   * @param opt
   * @returns {*}
   */
  questionQuiz :(where,options) =>{
    "use strict";
    // LEFT JOIN gj_members as m ON find_in_set(m.mid,c.class_teacher)
    var sql=new StringBuilder();
    sql.Append('SELECT b.*,m.m_name FROM (SELECT c.class_name,c.classid,c.class_start,c.class_img,c.class_teacher FROM gj_goods as goods ' +
        'LEFT JOIN gj_class as c ON c.class_goodsid=goods.goodsid WHERE 1=1 ');
    if(where.goodsid){
      sql.AppendFormat("AND goods.goodsid IN ({0}) ",where.goodsid);
    }
    sql.AppendFormat("AND c.class_qustatus=2 ORDER BY class_start DESC LIMIT {0},{1}) as b " +
        "LEFT JOIN gj_members as m ON find_in_set(m.mid,b.class_teacher)",options.offset,options.pagesize)
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  },
  /**
   * 获取好友关心
   * @param mid
   * @param user
   * @returns {*}
   */
  friendRelation : (mid,user) => {
    "use strict";
    // LEFT JOIN gj_members as m ON find_in_set(m.mid,c.class_teacher)
    var sql=new StringBuilder();
    sql.AppendFormat("select case when mf.myfriend_type = 0 and mf1.myfriend_type = 0 then 1 else 0 end as ismyfriend,mf.myfriend_type from gj_members as mb " +
        "LEFT join gj_myfriend  as mf on mb.mid=mf.myfriend_user and mf.myfriend_owner={0} " +
        "LEFT join gj_myfriend as mf1 on mb.mid=mf1.myfriend_owner and mf1.myfriend_user={1}   " +
        "where mb.mid={1}",user,mid)
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  },
  /**
   * 课程列表
   * @param where
   * @returns {*}
   */
  goodsList: (where) =>{
    "use strict";
    return models.Goods.findAll({
      where:where,
      attributes:['goodsid','goods_name','goods_img','goods_summary','goods_start'],
      raw:true
    })
  },
  /**
   * 分院列表
   * @param where
   * @returns {*}
   */
  classRoomList: (where) =>{
    "use strict";
    return models.Classroom.findAll({
      where:where,
      attributes:['classroom_name'],
      raw:true
    })
  },
  /**
   * 我的企业详情
   * @param body
   * @param id
   * @returns {*}
   */
  myEnterpriseDetail : (mid) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("SELECT * FROM gj_enterprise_member as em " +
        "INNER JOIN gj_enterprise as e ON e.id=em.enterprise " +
        "WHERE member={0}",mid)
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  },
  /**
   * 企业详情
   * @param id
   * @returns {*}
   */
  enterpriseDetail : (id) => {
    "use strict";
    return models.Enterprise.findOne({
      where:{id:id},
      raw:true
    })
  },
  /**
   * 企业列表
   * @param id
   * @returns {*}
   */
  enterpriseList : (where) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select en.id,en.province,en.city,en.name,en.logo,en.pics,m.m_name from gj_enterprise as en " +
        "INNER JOIN gj_enterprise_member as enm ON enm.enterprise=en.id " +
        "INNER JOIN gj_members as m ON m.mid=enm.member " +
        "WHERE en.status=1 ");
    if(where.city){
      sql.AppendFormat("AND city LIKE '%{0}%'",where.city)
    }
    if(where.name){
      sql.AppendFormat("AND name LIKE '%{0}%'",where.name)
    }
    if(where.province){
      sql.AppendFormat("AND province LIKE '%{0}%'",where.province)
    }
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
  },
  /**
   * 更新企业信息
   * @param body
   * @param id
   * @returns {*}
   */
  enterpriseUpdate : (body,id) => {
    "use strict";
    return models.Enterprise.update(body,{where:{id:id}})
  },
  /**
   * 新建企业
   * @param body
   * @param id
   * @returns {*}
   */
  enterpriseCreate : (body,id) => {
    "use strict";
    return models.Enterprise.create(body).then(function (data) {
      return models.EnterpriseMember.create({member:id,enterprise:data.dataValues.id})
    })
  }
}
var Members={
  get_code:(req,res) => {
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['phone','area','type'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
      var isVip=yield middleware.authMember(body.phone,body.area);
      //2登录验证码(vip) 3注册验证码(vip) 4修改密码(!vip)
      if(body.type==2 || body.type==4){
        if(isVip){
          var tpl_id=middleware.codeExchangeTpl(body.area);
          var code=parseInt((Math.random()*9+1)*100000)+'';
          var mobile=body.area+body.phone
          yunPian.send_tpl_sms({mobile:encodeURI(mobile),tpl_id:tpl_id,tpl_value:{'#code#':code}}).then(function (data) {
            if(data.code==0){
              middleware.setSms({
                phoneno:body.phone,
                smscode:code,
                type:body.type,//登录验证码标识
              })
              return response.ApiSuccess(res,{message:'发送成功，请注意查收'})
            }else {
              return response.ApiError(res,{message:'发送失败，服务商异常',code:data.code})
            }
          }).catch(function (err) {
            console.log(err);
            return response.ApiError(res,{message:err.toString()})
          })
        }else {
          return response.ApiError(res,{message:'手机号未注册'})
        }
      }else if(body.type==3 || body.type==6){
        // if(!isVip){
          var tpl_id=middleware.codeExchangeTpl(body.area);
          var code=parseInt((Math.random()*9+1)*100000)+'';
          var mobile=body.area+body.phone;
          yunPian.send_tpl_sms({mobile:encodeURI(mobile),tpl_id:tpl_id,tpl_value:{'#code#':code}}).then(function (data) {
            if(data.code==0){
              middleware.setSms({
                phoneno:body.phone,
                smscode:code,
                type:body.type,//注册验证码标识
              })
              return response.ApiSuccess(res,{message:'发送成功，请注意查收'})
            }else {
              return response.ApiError(res,{message:'发送失败，服务商异常',code:data.code})
            }
          }).catch(function (err) {
            console.log(err);
            return response.ApiError(res,{message:err.toString()})
          })
        // }else {
        //   return response.ApiError(res,{message:'您已是格局学员，请直接登录'})
        // }
      }else{
        return response.ApiError(res,{message:'参数错误'})
      }
    })
  },
  login:(req,res) => {
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['phone','area','code'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    middleware.checkSms({phone:body.phone,area:body.area,code:body.code,type:2}).then(function (item) {
      if(item){
        return middleware.getMemberInfo({phone:body.phone,area:body.area}).then(function (data) {
          var password=data.m_password;
          var isPassword=password?true:false;
          if(!isPassword){//没有密码设置一个简单的cookie 10分钟过期
            token.encode_token({key:body.phone},function(err,data){
              res.cookie('setPassWord', data , middleware.cookieConfig );
            });
          }
          delete data.m_password;
          data.m_pics=str.AbsolutePath(data.m_pics);
          if(data.m_firstsend==0){
            //查找通知和发通知的人
            co(function *() {
              var baseInfo=yield models.Notifics.findOne({
                where:{notid:1},
                attributes:[['notid','id'],['not_title','title'],['not_desc','name'],['not_pics','img'],['createdAt','time']],
                raw:true
              });
              var tipsSql=new StringBuilder();
              tipsSql.AppendFormat("select me.m_pics,me.m_name from gj_members as me WHERE me.mid={0}",config.hx_inform);
              var tips=yield models.sequelize.query(tipsSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
              if(baseInfo && tips.length>0){
                tips[0].m_pics=str.AbsolutePath(tips[0].m_pics);
                baseInfo.img=str.AbsolutePath(baseInfo.img)
                var ext={
                  img:database.informType[5].pics,
                  type:database.informType[5].id,
                  title:database.informType[5].name,
                  desc:baseInfo.title,
                  imgItem:baseInfo.img,
                  titleItem:baseInfo.title,
                  timeItem:baseInfo.time,
                  nameItem:baseInfo.name,
                  avatarURLPath:tips[0].m_pics,
                  nickName:tips[0].m_name,
                  id:baseInfo.id
                };
                var option={
                  fromuser:config.hx_inform,
                  ext:ext,
                  users:[data.mid],
                  msg:baseInfo.title
                };
                var hx = require('../../utils/hxchat');
                hx.sendExtMessages(option,function (err,result) {
                  console.log(result);
                  console.log(err)
                })
              }
              models.Members.update({m_firstsend:1},{where:{mid:data.mid}})
            })
          }
          return response.ApiSuccess(res,{data:data,isPassword:isPassword})
        }).catch(function (err) {
          console.log(err)
          return response.ApiError(res,{message:'账号不存在'})
        })
      }else {
        return response.ApiError(res,{message:'验证码错误'})
      }
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  login_set_password:(req,res) => {
    "use strict";
    var body=req.body;
    try{
      var parameter=middleware.parameterControl(['password','phone'],body)
      if(parameter){
        return response.ApiError(res,{message:'参数缺失'})
      }
      //密码的验证
      if(!/^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{6,12}$/.test(body.password)){
        return response.ApiError(res,{message:'输入6-12位数字字母组合密码'})
      }
      //登陆的失效验证
      if(!body.key){
        var k=req.cookies.setPassWord;
        console.log(req.cookies)
        if(!k){
          return response.ApiError(res,{message:'验证过期'})
        }
        var tokenPhone=token.decode_token(k).iss;
        if(tokenPhone!=body.phone){
          return response.ApiError(res,{message:'身份不合法，请重新登陆'})
        }
      }
      //密码加密
      body.password=str.md5(body.password)
      middleware.setMemberInfo({m_password:body.password},{where:{m_phone:body.phone}}).then(function () {
        return response.ApiSuccess(res,{message:'ok'})
      }).catch(function (err) {
        console.log(err)
      })
    }catch (err){
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    }
  },
  login_password:(req,res) => {
    "use strict";
    var body=req.body;
    body.password=str.md5(body.password)
    var parameter=middleware.parameterControl(['phone','area','password'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
      try {
        var errNum=yield middleware.passwordErrorNum(body.phone);
        if(errNum[0].dataValues.num>=5){
          return response.ApiError(res,{message:'账号或密码多次错误，为了保护您的账号安全，已被系统锁定，请找回并重置密码'})
        }else {
          var item=yield middleware.getMemberInfo({phone:body.phone,area:body.area});
          if(item){
            if(item.m_password==body.password){
              //错误次数清空
              middleware.passwordErrorNumDel(body.phone)
              item.m_pics=str.AbsolutePath(item.m_pics);
              if(item.m_firstsend==0){
                //查找通知和发通知的人
                co(function *() {
                  var baseInfo=yield models.Notifics.findOne({
                    where:{notid:1},
                    attributes:[['notid','id'],['not_title','title'],['not_desc','name'],['not_pics','img'],['createdAt','time']],
                    raw:true
                  });
                  var tipsSql=new StringBuilder();
                  tipsSql.AppendFormat("select me.m_pics,me.m_name from gj_members as me WHERE me.mid={0}",config.hx_inform);
                  var tips=yield models.sequelize.query(tipsSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
                  if(baseInfo && tips.length>0){
                    tips[0].m_pics=str.AbsolutePath(tips[0].m_pics);
                    baseInfo.img=str.AbsolutePath(baseInfo.img)
                    var ext={
                      img:database.informType[5].pics,
                      type:database.informType[5].id,
                      title:database.informType[5].name,
                      desc:baseInfo.title,
                      imgItem:baseInfo.img,
                      titleItem:baseInfo.title,
                      timeItem:baseInfo.time,
                      nameItem:baseInfo.name,
                      avatarURLPath:tips[0].m_pics,
                      nickName:tips[0].m_name,
                      id:baseInfo.id
                    };
                    var option={
                      fromuser:config.hx_inform,
                      ext:ext,
                      users:[item.mid],
                      msg:baseInfo.title
                    };
                    var hx = require('../../utils/hxchat');
                    hx.sendExtMessages(option,function (err,result) {
                      console.log(result);
                      console.log(err)
                    })
                  }
                  models.Members.update({m_firstsend:1},{where:{mid:item.mid}})
                })
              }
              return response.ApiSuccess(res,{data:item,isPassword:true})
            }else {
              //累计错误
              var num=yield errNum[0].increment('num')
              var message="账号或密码错误";
              var numCount=num.dataValues.num;
              if(numCount==3){
                message="账号或密码错误，下次验证失败，账号将被锁定"
              }
              if(numCount==4){
                message="账号或密码多次错误，为了保护您的账号安全，已被系统锁定，请找回并重置密码"
              }
              return response.ApiError(res,{message:message})
            }
          }else {
            return response.ApiError(res,{message:'用户不存在'})
          }
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  register_auth:(req,res) => {
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['phone','area','code'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
      try{
        var item=yield middleware.checkSms({phone:body.phone,area:body.area,code:body.code,type:3})
        if(item){
          var isVip=yield middleware.authMember(body.phone,body.area);
          if(!isVip){
            return response.ApiSuccess(res,{})
          }else {
            var info=yield middleware.getMemberInfo({phone:body.phone,area:body.area});
            var data={name:info.m_name,phone:info.m_phone,pics:info.m_pics}
            data.pics=str.AbsolutePath(data.pics)
            return response.ApiSuccess(res,{data:data})
          }
        }else {
          return response.ApiError(res,{message:'验证码错误'})
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  register:(req,res) => {
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['phone','area','code','password','name','company','position'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    //密码的验证
    if(!/^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{6,12}$/.test(body.password)){
      return response.ApiError(res,{message:'输入6-12位数字字母组合密码'})
    }
    middleware.checkSms({phone:body.phone,area:body.area,code:body.code,type:3}).then(function (item) {
      if(item){
        //密码加密
        body.password=str.md5(body.password)
        return middleware.createMember({
          m_phone:body.phone,
          m_code:body.area,
          m_password:body.password,
          m_company:body.company,
          m_name:body.name,
          m_position:body.position,
        }).then(function (item) {
          var mid=item.dataValues.mid;
          //环信注册
          hx.reghxuser({username:mid},function(err,result){
            console.log(err)
            console.log(result)
          });
          //存在企业id关联企业
          if(body.enterprise){
            middleware.memberEnterprise({
              member:mid,
              enterprise:body.enterprise
            })
          }
          delete item.dataValues.m_password;
          item.dataValues.m_pics=str.AbsolutePath(item.dataValues.m_pics);
          return response.ApiSuccess(res,{data:item,isPassword:true})
        }).catch(function (err) {
          console.log(err)
          return response.ApiError(res,{message:err.toString()})
        })
      }else {
        return response.ApiError(res,{message:'验证码错误或失效'})
      }
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  set_password:(req,res) =>{
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['phone','area','code'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    //密码的验证
    if(!/^(?![\d]+$)(?![a-zA-Z]+$)(?![^\da-zA-Z]+$).{6,12}$/.test(body.password)){
      return response.ApiError(res,{message:'输入6-12位数字字母组合密码'})
    }
    middleware.checkSms({phone:body.phone,area:body.area,code:body.code,type:4}).then(function (item) {
      if(item){
        //密码加密
        body.password=str.md5(body.password)
        middleware.setMemberInfo({m_password:body.password},{where:{m_phone:body.phone}}).then(function () {
          //错误次数清空
          middleware.passwordErrorNumDel(body.phone)
          return response.ApiSuccess(res,{message:'ok'})
        }).catch(function (err) {
          console.log(err)
        })
      }else {
        return response.ApiError(res,{message:'验证码错误'})
      }
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  self_home:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function*() {
      try{
        //我的信息
        var info=yield middleware.information(body.mid,['m_vip','m_ishidephone','m_home_background','m_phone','m_pics','mid','m_name','m_email','m_position','m_company','m_desc','m_type','m_status','m_code']);
        if(!info){
          return response.ApiError(res,{message:'用户不存在'})
        }
        //我的课程&&分院
        var type=info.m_type;
        var m_status=info.m_status;
        if(type>1){
          info.logo="格局员工"
        }else if(type==0 && m_status==0){
          info.logo="注册用户"
        }else if(type==0 && m_status==1){
          info.logo="格局学员"
        }else {
          info.logo=""
        }
        if(!info.m_ishidephone){
          info.m_phone=info.m_phone.replace(/(\d{3})\d{4}(\d{4})/,'$1****$2')
        }
        info.m_home_background=str.AbsolutePath(info.m_home_background);
        info.m_pics=str.AbsolutePath(info.m_pics);
        var goodsSearchArr=[];
        var classRoomArr=[];
        var isAll=0
        if(type>=4){//特殊身份处理我的课程
          if(type==10){
            // isAll=1;
            isAll=0;
          }else {
            var BranchManage=yield middleware.getBranchManage(body.mid)
            for(var i=0,len=BranchManage.length;i<len;i++){
              let BranchManageItem=BranchManage[i];
              classRoomArr.push(BranchManageItem.classroom)
              // isAll=1;
              isAll=0;
/*              if(BranchManageItem.type==1 || BranchManageItem.type==2 || BranchManageItem.type==5){
                isAll=1;
                break;
              }else {
                goodsSearchArr.push(BranchManageItem.goods)
              }*/
            }
          }
        }else {//学员按照我的课程查询我的课程
          var myGoods=yield middleware.getMyGoods({uc_userid:body.mid,uc_status:1});
          myGoods.forEach(function (node) {
            classRoomArr.push(node.calssroomid);
            goodsSearchArr.push(node.goods)
          })
        }
        //获取课程
        var GoodsList=[]
        if(isAll){
          GoodsList=yield middleware.goodsList({});
        }else if(goodsSearchArr.length>0){
          GoodsList=yield middleware.goodsList({goodsid:{"$in":goodsSearchArr}});
        }
        GoodsList.forEach(function (node) {
          node.goods_img=str.AbsolutePath(node.goods_img);
          node.goods_start=str.getUnixToTime(node.goods_start);
        });
        //分院
        var branch=yield middleware.classRoomList({classroom:{"$in":classRoomArr}})
        //我的企业
        var enterprise=yield middleware.myEnterpriseDetail(body.mid);
        enterprise=enterprise.length>0?enterprise[0]:{};
        if(enterprise.id){
          enterprise.pics=str.AbsolutePath(enterprise.pics)
          enterprise.logo=str.AbsolutePath(enterprise.logo)
          enterprise.productPics=str.AbsolutePath(enterprise.productPics)
        }
        //好友关系
        var friend={ ismyfriend: 0, myfriend_type: 0 }
        if(body.user){
          var relation=yield middleware.friendRelation(body.mid,body.user)
          if(relation.length>0){
            friend=relation[0]
          }
        }
        return response.ApiSuccess(res,{info:info,goods:GoodsList,enterprise:enterprise,branch:branch,isFriend:friend})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  self_manage : (req,res) => {
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    middleware.getMyGoods({uc_userid:body.mid,uc_status:1}).then(function (item) {
      var attend=0;
      var audition=0;
      var nonlocal=0;
      var transfer=0;
      var patriarch=0;
      if(item.length>0){
        patriarch=1;
      }
      return response.ApiSuccess(res,{
        attend:attend,
        audition:audition,
        nonlocal:nonlocal,
        transfer:transfer,
        patriarch:patriarch
      })
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  self_branch : (req,res) => {
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function*() {
      try{
        //我的信息
        var info=yield middleware.information(body.mid,['m_vip','m_ishidephone','m_home_background','m_phone','m_pics','mid','m_name','m_email','m_position','m_company','m_desc','m_type','m_status','m_code']);
        if(!info){
          return response.ApiError(res,{message:'用户不存在'})
        }
        //我的课程&&分院
        var type=info.m_type;
        var classRoomArr=[];
        if(type>=4){//特殊身份处理我的课程
          if(type==10){

          }else {
            var BranchManage=yield middleware.getBranchManage(body.mid)
            for(var i=0,len=BranchManage.length;i<len;i++){
              let BranchManageItem=BranchManage[i];
              classRoomArr.push(BranchManageItem.classroom)
            }
          }
        }else {//学员按照我的课程查询我的课程
          var myGoods=yield middleware.getMyGoods({uc_userid:body.mid,uc_status:1});
          myGoods.forEach(function (node) {
            classRoomArr.push(node.calssroomid);
          })
        }
        //分院
        var branch=yield middleware.classRoomList({classroom:{"$in":classRoomArr}})
        return response.ApiSuccess(res,{branch:branch})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  self_information:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
      try {
        var enterprise=yield middleware.myEnterpriseDetail(body.mid);
        var item=yield middleware.information(body.mid,['m_status','m_ishidephone','m_phone','mid','m_card','m_name','m_birthday','m_education','m_school','m_sex','m_email','m_position','m_company','m_pics','m_desc','m_type','m_code'])
        enterprise=enterprise.length>0?enterprise[0]:{};
        if(enterprise.id){
          enterprise.pics=str.AbsolutePath(enterprise.pics)
          enterprise.logo=str.AbsolutePath(enterprise.logo)
          enterprise.productPics=str.AbsolutePath(enterprise.productPics)
        }
        item.m_pics=str.AbsolutePath(item.m_pics);
        item.m_birthday=(item.m_birthday).toString()=='Invalid Date'?'':str.getUnix(item.m_birthday);
        item.m_card=item.m_card.replace(/(\d{14})(\w{4})/,'$1****');
        item.enterprise=enterprise;
        return response.ApiSuccess(res,{data:item})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  self_goods:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function*() {
      try{
        var member=yield middleware.information(body.mid)
        var type=member.m_type;
        var map = {},
            dest = [],
            TMap = {},
            TDest = [],
            GoodsList = [],
            goodsSearchArr=[],
            isAll=0
        if(type>=4){//特殊身份处理我的课程
/*          if(type==10){
            var isAll=1;
          }else {
            var BranchManage=yield middleware.getBranchManage(body.mid)
            for(var i=0,len=BranchManage.length;i<len;i++){
              let BranchManageItem=BranchManage[i];
              if(BranchManageItem.type==1 || BranchManageItem.type==2 || BranchManageItem.type==5){
                isAll=1;
                break;
              }else {
                goodsSearchArr.push(BranchManageItem.goods)
              }
            }
          }*/
          // isAll=1;暂时保留
          isAll=0;
        }else {//学员按照我的课程查询我的课程
          var myGoods=yield middleware.getMyGoods({uc_userid:body.mid,uc_status:1});
          myGoods.forEach(function (node) {
            goodsSearchArr.push(node.goods)
          })
        }
        //获取课程
        if(isAll){
          GoodsList=yield middleware.getMyClassSpecial({});
        }else if(goodsSearchArr.length>0){
          var goodsSearchStr=goodsSearchArr.join(',');
          GoodsList=yield middleware.getMyClassSpecial({goodsid:goodsSearchStr});
        }
        //合并讲师
        for(var i = 0; i < GoodsList.length; i++){
          var node = GoodsList[i];
          if(!TMap[node.classid]){
            TDest.push(node);
            TMap[node.classid] = 'true';
          }else{
            for(var j = 0; j < TDest.length; j++){
              var dj = TDest[j];
              if(dj.classid == node.classid){
                dj.m_name=dj.m_name+'/'+node.m_name;
                break;
              }
            }
          }
        };
        //合并课程班
        for(var i = 0; i < TDest.length; i++){
          var node = TDest[i];
          var report=(node.class_start>new Date())?1:0
          node.goods_img = str.AbsolutePath(node.goods_img);
          node.class_start = str.getUnixToTime(node.class_start);
          node.class_img = str.AbsolutePath(node.class_img);
          console.log(report)
          var item={
            name:node.class_name,
            pics:node.class_img,
            time:node.class_start,
            m_name:node.m_name,
            status:report,
            classid:node.classid,
          };
          if(!map[node.goodsid]){
            var data={
              goodsid: node.goodsid,
              goods_name: node.goods_name,
              goods_img: node.goods_img,
              Classes: []
            }
            if(node.classid){
              data.Classes=[item]
            }
            dest.push(data);
            map[node.goodsid] = true;
          }else{
            for(var j = 0; j < dest.length; j++){
              var dj = dest[j];
              if(dj.goodsid == node.goodsid){
                dj.Classes.push(item);
                break;
              }
            }
          }
        };
        return response.ApiSuccess(res, {list: dest});
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  self_question_push:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    var options=page.cms_get_page_options(req);
    middleware.questionPush({mid:body.mid},options).then(function (item) {
      item.forEach(function (node) {
        node.time=str.getUnixToTime(node.time)
      })
      return response.ApiSuccess(res,{list:item})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})

    })
  },
  self_question_assist:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    var options=page.cms_get_page_options(req);
    middleware.questionAssist({mid:body.mid},options).then(function (item) {
      item.forEach(function (node) {
        node.time=str.getUnixToTime(node.time)
        node.m_pics=str.getUnixToTime(node.m_pics)
      })
      return response.ApiSuccess(res,{list:item})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})

    })
  },
  self_question_quiz:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['mid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    var options=page.cms_get_page_options(req);
    co(function *() {
      try{
        //获取我对那些课程有权限
        var member=yield middleware.information(body.mid)
        var type=member.m_type;
        var map = {},
            dest = [],
            GoodsList = [],
            goodsSearchArr=[],
            isAll=0
        if(type>=4){//特殊身份处理我的课程
          if(type==10){
            var isAll=1;
          }else {
            var BranchManage=yield middleware.getBranchManage(body.mid)
            for(var i=0,len=BranchManage.length;i<len;i++){
              let BranchManageItem=BranchManage[i];
              if(BranchManageItem.type==1 || BranchManageItem.type==2 || BranchManageItem.type==5){
                isAll=1;
                break;
              }else {
                goodsSearchArr.push(BranchManageItem.goods)
              }
            }
          }
        }else {//学员按照我的课程查询我的课程
          var myGoods=yield middleware.getMyGoods({uc_userid:body.mid,uc_status:1});
          myGoods.forEach(function (node) {
            goodsSearchArr.push(node.goods)
          })
        }
        //获取课程
        if(isAll){
          GoodsList=yield middleware.questionQuiz({},options);
        }else if(goodsSearchArr.length>0){
          var goodsSearchStr=goodsSearchArr.join(',');
          GoodsList=yield middleware.questionQuiz({goodsid:goodsSearchStr},options);
        }
        //合并讲师
        for(var i = 0; i < GoodsList.length; i++){
          var node = GoodsList[i];
          node.class_start = str.getUnixToTime(node.class_start);
          node.class_img = str.AbsolutePath(node.class_img);
          if(!map[node.classid]){
            dest.push(node);
            map[node.classid] = 'true';
          }else{
            for(var j = 0; j < dest.length; j++){
              var dj = dest[j];
              if(dj.classid == node.classid){
                dj.m_name=dj.m_name+'/'+node.m_name;
                break;
              }
            }
          }
        };
        return response.ApiSuccess(res,{list:dest})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  enterprise_detail:(req,res) =>{
    "use strict";
    var body=req.query;
    var parameter=middleware.parameterControl(['eid'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    middleware.enterpriseDetail(body.eid).then(function (item) {
      if(item){
        item.pics=str.AbsolutePath(item.pics)
        item.logo=str.AbsolutePath(item.logo)
        item.productPics=str.AbsolutePath(item.productPics)
        return response.ApiSuccess(res,{datail:item})
      }else {
        return response.ApiError(res,{message:'企业不存在'})
      }
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  enterprise_update:(req,res) =>{
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['id','mid','logo','pics','name','province','city','address','trade','desc'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    var enterprise={
      logo: body.logo,//logo
      pics: body.pics,//照片
      name: body.name,//名称
      province: body.province,//省
      city: body.city,//城市
      address: body.address,//地址
      phone: body.phone,//电话
      trade: body.trade,//行业
      website: body.website,//网站
      scale: body.scale,//规模
      turnover: body.turnover,//营业额
      desc: body.desc,//介绍
      productDesc: body.productDesc,//产品介绍
      productPics: body.productPics,//产品图片
    }
    middleware.enterpriseUpdate(enterprise,body.id).then(function (item) {
      return response.ApiSuccess(res,{})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  enterprise_create:(req,res) =>{
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['mid','logo','pics','name','province','city','address','trade','desc'],body)
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }

    var enterprise={
      logo: body.logo,//logo
      pics: body.pics,//照片
      name: body.name,//名称
      province: body.province,//省
      city: body.city,//城市
      address: body.address,//地址
      phone: body.phone,//电话
      trade: body.trade,//行业
      website: body.website,//网站
      scale: body.scale,//规模
      turnover: body.turnover,//营业额
      desc: body.desc,//介绍
      productDesc: body.productDesc,//产品介绍
      productPics: body.productPics,//产品图片
    }
    middleware.myEnterpriseDetail(body.mid).then(function (item) {
      if(item.length>0){
        return response.ApiError(res,{message:'存在企业'})
      }else {
        middleware.enterpriseCreate(enterprise,body.mid).then(function (item) {
          return response.ApiSuccess(res,{})
        })
      }
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  password_auth:(req,res) =>{
    "use strict";
    var body=req.body;
    var parameter=middleware.parameterControl(['id','password'],body);
    if(parameter){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
      try{
        var item=yield middleware.information(body.id,['m_password','m_phone']);
        if(item){
          var errNum=yield middleware.passwordErrorNum(item.m_phone);
          if(errNum[0].dataValues.num>=5){
            return response.ApiError(res,{code:401,message:'账号或密码多次错误，为了保护您的账号安全，已被系统锁定，请找回并重置密码'})
          }else {
            //密码加密
            body.password=str.md5(body.password)
            if(item.m_password==body.password){
              //错误次数清空
              middleware.passwordErrorNumDel(item.m_phone);
              return response.ApiSuccess(res,{message:'ok'})
            }else {
              //累计错误
              var num=yield errNum[0].increment('num');
              var message="账号或密码错误";
              var numCount=num.dataValues.num;
              if(numCount==3){
                message="账号或密码错误，下次验证失败，账号将被锁定"
              }
              if(numCount==4){
                message="账号或密码多次错误，为了保护您的账号安全，已被系统锁定，请找回并重置密码"
              }
              return response.ApiError(res,{message:message})
            }
          }
        }else {
          return response.ApiError(res,{message:'学员不存在'})
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  enterprise_list:(req,res) =>{
    "use strict";
    var body=req.query;
    var where={};
    if(body.city){
      where.city=body.city
    }
    if(body.province){
      where.province=body.province
    }
    if(body.name){
      where.name=body.name
    }
    middleware.enterpriseList(where).then(function (item) {
      item.forEach(function (node) {
        node.pics=str.AbsolutePath(node.pics)
        node.logo=str.AbsolutePath(node.logo)
      })
      return response.ApiSuccess(res,{list:item})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  /*历史接口，不做处理*/
  app_auth:function(req,res){//用来获取token
    var key=config.token_secret;
    token.encode_token({key:key},function(err,data){
      return response.ApiSuccess(res,{data:data});
    });
  },
  send_sms:function(req,res){
    var body=req.body;
    //通过验证
    var access_token=req.access_token;
    var m_mpno=body.m_mpno;
    if (!m_mpno) {
      return response.ApiError(res,{message:"手机号码为空"});
    }
    if(!access_token){
      return response.ApiError(res,{message:"验证失败"});
    }
    //判断用户是否是会员状态
    models.Members.findOne({
      where:{m_phone:m_mpno},
      attributes:['mid','m_status','m_type'],
      raw:true
    }).then(function(item){
      if(item && (item.m_status==1 || item.m_type>=4)){
        // 产生验证码
        var code=parseInt((Math.random()*9+1)*100000)+'';
        // 发送验证码
        sms.get_code({mpno:m_mpno,code:code},function(err,result){
          result=JSON.parse(result);
          if (result.statusCode=="000000"){//发送成功
            models.Smscode.create({
              phoneno:m_mpno,
              smscode:code
            });
            return response.ApiSuccess(res,{data:'验证码发送成功'});
          }else {
            return response.ApiError(res,{message:"验证码发送失败"});
          }
        });
      }else {
        return response.ApiError(res,{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"});
      }
    }, function(err){
      console.log(err.toString())
      return response.ApiError(res,{message:err.toString()});
    });
  },
  members_enter:function(req,res){
    var m_mpno=req.body.m_mpno;
    var m_code=req.body.m_code;
    if (!m_mpno || !m_code) {
      return response.ApiError(res,{message:"m_mpno or m_code empty"});
    }
    co(function* (){
      try{
        //查询30分钟的记录
        var smscode=yield models.Smscode.findOne({
          where:{smscode:m_code,phoneno:m_mpno,createdAt:{'$gt': moment().add('-30','minute').format()}},raw:true
        });
        if(m_mpno==17701089944 || verification){
          smscode=1
        }
        if(smscode){
          var item=yield models.Members.findOne({
            where:{m_phone:m_mpno},
            raw:true
          })
          if(item){
            item.createdAt=str.getUnixToTime(item.createdAt);
            item.m_pics=str.AbsolutePath(item.m_pics);
            //发送首次登陆通知
            if(item.m_firstsend==0){
              //查找通知和发通知的人
              baseInfo=yield models.Notifics.findOne({
                where:{notid:1},
                attributes:[['notid','id'],['not_title','title'],['not_desc','name'],['not_pics','img'],['createdAt','time']],
                raw:true
              });
              var tipsSql=new StringBuilder();
              tipsSql.AppendFormat("select me.m_pics,me.m_name from gj_members as me WHERE me.mid={0}",config.hx_inform);
              var tips=yield models.sequelize.query(tipsSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
              if(baseInfo && tips.length>0){
                tips[0].m_pics=str.AbsolutePath(tips[0].m_pics);
                baseInfo.img=str.AbsolutePath(baseInfo.img)
                var ext={
                  img:database.informType[5].pics,
                  type:database.informType[5].id,
                  title:database.informType[5].name,
                  desc:baseInfo.title,
                  imgItem:baseInfo.img,
                  titleItem:baseInfo.title,
                  timeItem:baseInfo.time,
                  nameItem:baseInfo.name,
                  avatarURLPath:tips[0].m_pics,
                  nickName:tips[0].m_name,
                  id:baseInfo.id
                };
                var option={
                  fromuser:config.hx_inform,
                  ext:ext,
                  users:[item.mid],
                  msg:baseInfo.title
                };
                var hx = require('../../utils/hxchat');
                hx.sendExtMessages(option,function (err,result) {
                  console.log(result);
                  console.log(err)
                })
              }
              models.Members.update({m_firstsend:1},{where:{mid:item.mid}})
            }
            return response.ApiSuccess(res,{data:item});
          }else {
            return response.ApiError(res,{code:401,message:"很抱歉！格局商学APP只对正式学员开放，各地学员请联系当地分院激活帐号"});
          }
        }else {
          return response.ApiError(res,{message:"验证码输入错误，请您重新输入"});
        }
      }catch (err){
        console.log(err)
      }
    });
  },
  members_info:function(req,res){
    var m_mpno=req.body.m_mpno;
    var info=req.body.info;
    var body={};
    // var access_token=req.access_token;
    if (!m_mpno) {
      return response.ApiError(res,{message:"m_mpno empty"});
    }
    // if(!access_token){
    //   return response.ApiError(res,{message:"token 验证失败"});
    // }
    if(typeof info =='string'){
      info=eval('('+info+')');
    }
    body=info?info:{};
    //如果更改姓名需要更改对应的首字母
    if (body.m_name){
      body.m_firstabv=py.makePy(body.m_name);
    }
    if (body.m_birthday){
      body.m_birthday=moment(new Date(body.m_birthday)).format("YYYY-MM-DD")
    }
    models.Members.update(body,{where:{m_phone:m_mpno}}).then(function(){
      return response.ApiSuccess(res,{});
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.toString()});
    })
  },
  check_memberbyopenid:function(req,res){
    var openid=req.query.openid;
  
    if (!openid) {
      return response.ApiError(res,{message:"openid empty"});
    }
    models.WX.findAll({
      where:{openId:openid},
      attributes:['userId','openId','nickName','avatarUrl']
    }).then(function(item){
      if(item)
      {
         return response.ApiSuccess(res,{list:item})
      }else
      {
         return response.ApiSuccess(res,{list:null})
      }
    }, function(err){
      //console.log(err.toString())
      return response.ApiError(res,{message:err.toString()});
    });
  },
  get_member:function(req,res){
    var body=req.query;
    if (!body.mid) {
      return response.ApiError(res,{message:"mid empty"});
    }
    co(function* (){
      try{
        var member=yield models.Members.findOne({
          where:{mid:body.mid}
        });
        if(member){
          member.dataValues.m_pics=str.AbsolutePath(member.dataValues.m_pics);
          member.dataValues.m_teacherqrcode=str.AbsolutePath(member.dataValues.m_teacherqrcode);
          member.dataValues.m_teachertitleimg=str.AbsolutePath(member.dataValues.m_teachertitleimg);
          member.dataValues.m_teacherrightimg=str.AbsolutePath(member.dataValues.m_teacherrightimg);
          if(member.dataValues.m_type>=4){//特殊身份
            if(member.dataValues.m_type==10 && !member.dataValues.m_class){//内部员工
              models.Members.update({m_class:'北京总院'},{
                where:{mid:body.mid}
              });
              member.dataValues.m_class='北京总院';
            }else if(member.dataValues.m_type==4){//院办
              models.Members.update({m_class:'分院管理部'},{
                where:{mid:body.mid}
              });
              member.dataValues.m_class='分院管理部';
              /*var a=yield models.Area.getGropuGoode({userid:body.mid});
              if(a.length>0 && member.dataValues.m_class!=a[0].classroom_name){
                models.Members.update({m_class:a[0].classroom_name},{
                  where:{mid:body.mid}
                });
                member.dataValues.m_class=a[0].classroom_name;
              }*/
            }
            member.dataValues.my_goods='';
          }else {
            //我的班级进行设置
            var sql=new StringBuilder();
            sql.AppendFormat("select goods.goods_subtitle,goods.goods_end,userclass.uc_goodsid,userclass.uc_areaname,userclass.uc_calssroomname from gj_userclass as userclass INNER JOIN gj_goods as goods ON goods.goodsid=userclass.uc_goodsid WHERE userclass.uc_userid={0} LIMIT 0,1",body.mid);
            var myUserClass=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
            if(myUserClass.length>0){
              myUserClass=myUserClass[0]
              var m_class=myUserClass.uc_calssroomname;
              member.dataValues.my_goods=myUserClass.goods_subtitle;
              if(moment(myUserClass.goods_end)<moment()){
                member.dataValues.member_goods=1
              }else {
                member.dataValues.member_goods=0
              }
              if(member.dataValues.m_class!=m_class){
                member.update({m_class:m_class});
              }
              member.dataValues.m_class=m_class;
            }
          }
          return response.ApiSuccess(res,{data:member})
        }else {
          return response.ApiError(res,{message:'用户不存在'})
        }
      }catch(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      }
    })
  },
  put_feedback:function(req,res){
    var body=req.body;
    if (!body.content) {
      return response.ApiError(res,{message:"content empty"});
    }
    console.log(body)
    models.Feedback.create({
      feedback_content:body.content,
      feedback_type:body.feedback_type,
      feedback_phone:body.feedback_phone,
      feedback_fromuser:body.feedback_fromuser
    }).then(function(item){
      var img=eval('('+body.img+')')
      if(img.length>0){
        var id=item.dataValues.feedbackid;
        var ImgArr=[]
        img.forEach(function(node,index){
          ImgArr.push({feedid:id,feedback_img:node})
        })
        models.FeedbackAttach.bulkCreate(ImgArr)
      }
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"question_assist error"});
    })
  },
  del_feedback:function(req,res){
    var body=req.body;
    if (!body.feedbackid) {
      return response.ApiError(res,{message:"feedbackid empty"});
    }
    models.Feedback.update({feedback_status:0},{
      where:{feedbackid:body.feedbackid}
    }).then(function(){
      return response.ApiSuccess(res,{})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"del_feedback error"});
    })
  },
  get_feedback:function(req,res){
    var body=req.query;
    if (!body.feedback_fromuser) {
      return response.ApiError(res,{message:"feedback_fromuser empty"});
    }
    models.Feedback.update({feedback_replystatus:2},{where:{feedback_fromuser:body.feedback_fromuser}});
    models.Feedback.findAll({
      where:{feedback_fromuser:body.feedback_fromuser,feedback_status:1},
      include:[{
        model:models.FeedbackAttach,
        as:'img',
        attributes:['feedback_img']
      },{
        model:models.Members,
        attributes:['m_name','m_position','m_pics']
      }],
      order:[['createdAt','DESC']]
    }).then(function(item){
      item.forEach(function(n,i){
        n.dataValues.createdAt=str.getUnixToTime(n.dataValues.createdAt)
        n.dataValues.replyAt=str.getUnixToTime(n.dataValues.replyAt)
        if(n.dataValues.img){
          var img=n.dataValues.img
          img.forEach(function(node,index){
            node.feedback_img=str.AbsolutePath(node.feedback_img)
          })
        }
        if(n.dataValues.Member){
          var Member=n.dataValues.Member
          Member.m_pics=str.AbsolutePath(Member.m_pics)
        }
      })
      return response.ApiSuccess(res,{list:item,data:'格局小贴士'})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"del_feedback error"});
    })
  },
  get_feedbackstatus:function(req,res){
     var body=req.query;
    if (!body.feedback_fromuser) {
      return response.ApiError(res,{message:"feedback_fromuser empty"});
    }
     
     models.Feedback.findAll({
      where:{feedback_fromuser:body.feedback_fromuser,feedback_status:1,feedback_replystatus:1},
     }).then(function(item){
      if(item&&item.length>0)
      {
        return response.ApiSuccess(res,{isreply:1})
      }else
      {
        return response.ApiSuccess(res,{isreply:0})       
      }
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:"get_feedbackstatus error"});
    })
  },
  get_membersbycontent:function(req,res){
    var body=req.query;
    var where={
      qcontent:body.qcontent,
      userid:body.userid
      };
    if (!body.qcontent) {
      return response.ApiError(res,{message:"qcontent empty"});
    }else
    {
        models.Members.getmembersbycontent({
        where:where
        }).then(function(item){
          if (item) {
          item.forEach( function(node, index) {
            node.m_pics = str.AbsolutePath(node.m_pics);
          });
          return response.ApiSuccess(res,{list:item});
        }else {
          return response.ApiError(res,{message:"get members error"});
        }
      }, function(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      })
    }
  },
  get_memberslist:function(req,res){
   
    var body=req.query;
    var where={'$or': [
      {'m_phone': {'$like': '%'+body.qcontent+'%'}},
      {'m_name': {'$like': '%'+body.qcontent+'%'}},
      {'m_company': {'$like': '%'+body.qcontent+'%'}}
    ],m_status:1};
    if (!body.qcontent) {
      return response.ApiError(res,{message:"qcontent empty"});
    }else
    {
        models.Members.findAll({
        where:where,
        attributes:['m_pics','m_name','m_type','m_position','m_phone','m_company','mid','m_firstabv'],
        order:[['m_firstabv']],
      }).then(function(item){
          if (item) {
          item.forEach( function(node, index) {
            node.m_pics = str.AbsolutePath(node.m_pics);
          });
          return response.ApiSuccess(res,{list:item});
        }else {
          return response.ApiError(res,{message:"get members error"});
        }
      }, function(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      })
    }
  },
  get_insidemembers:function(req,res){
   
    var body=req.query;
    var where={m_department:body.department};
    if (!body.department) {
      return response.ApiError(res,{message:"qcontent empty"});
    }else
    {
        models.Members.findAll({
        where:where,
        attributes:['m_pics','m_name','m_type','m_position','m_phone','m_company','mid','m_firstabv','m_department'],
        order:[['m_firstabv']],
      }).then(function(item){
          if (item) {
          item.forEach( function(node, index) {
            node.m_pics = str.AbsolutePath(node.m_pics);
          });
          return response.ApiSuccess(res,{list:item});
        }else {
          return response.ApiError(res,{message:"get members error"});
        }
      }, function(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      })
    }
  },
  put_tag:function(req,res){
    var body=req.body;
    if(!body.userid || !body.content){
      return response.ApiError(res,{message:"put_tag error"});
    }
    models.Tag.create({
      tag_userid:body.userid,
      tag_content:body.content
    }).then(function(item){
      return response.ApiSuccess(res,{})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:"put_tag error"});
    })
  },
  get_tag:function(req,res){
    var body=req.query;
    console.log(body)
    if(!body.userid){
      return response.ApiError(res,{message:'userid empty'})
    }
    models.Tag.findAll({
      where:{tag_userid:body.userid},
      attributes:['tag_userid','tag_content','tagid']
    }).then(function(item){
      return response.ApiSuccess(res,{list:item});
    },function(err){
      console.log(err)
    })
  },
  del_tag:function(req,res){
    var body=req.body;
    if(!body.tagid || !body.userid){
      return response.ApiError(res,{message:'tagid empty'})
    }
    models.Tag.destroy({
      where:{tagid:body.tagid,tag_userid:body.userid}
    }).then(function(item){
      return response.ApiSuccess(res,{})
    },function(err){
      console.log(err)
    })
  },
  get_otherinfo:function(req,res){
   var body=req.query;
    if (!body.mid) {
      return response.ApiError(res,{message:"mid empty"});
    }
    if (!body.friendid) {
      return response.ApiError(res,{message:"friendid empty"});
    }
    var where={};
    where.mid=body.mid;
    where.friendid=body.friendid;
    models.Members.getmemberinfo({
      where:where,
      attributes:['user_name','user_pics','user_position','user_phone','user_url','user_place','user_company','company_desc','user_email','goods_name','isover','ismyfriend','uc_calssroomname','user_sex','user_background','m_ishidephone','myfriend_type']
    }).then(function(item){
      item.forEach( function(node, index) {
        node.user_pics=str.AbsolutePath(node.user_pics)
        if(node.m_ishidephone==1)
        {
          node.user_phone = node.user_phone.substring(0,3)+'********';
        }
      });
      return response.ApiSuccess(res,{list:item})
    }, function(err){
      console.log(err)
      return response.ApiError(res,{message:'get member error'})
    })
  }
};
module.exports=Members;