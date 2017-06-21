"use strict";

var models  = require('../../models');
var config=require('../../config/config');
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

exports.inform_render = function (req, res) {
  return res.render('inform/list', {
    title: '通知记录',
  });
};
exports.inform_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  models.Inform.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset,
    raw:true
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.createdAt = str.getUnixToTime(node.createdAt);
        node.index = options.offset + index + 1
        database.informType.forEach(function (item) {
          if(node.inform_type==item.id){
            node.typeTitle=item.name
          }
        })
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
exports.inform_add=function(req,res){
  co(function *() {
    var goods=yield models.Goods.findAll({
      attributes:[['goods_name','name'],['goodsid','id']],
      raw:true
    });
    var notifics=yield models.Notifics.findAll({
      raw:true,
      attributes:[['notid','id'],['not_title','name']]
    })
    return res.render('inform/add',{
      title:'推送消息',
      type: JSON.stringify(database.informType),
      notifics:JSON.stringify(notifics),
      goods:JSON.stringify(goods)
    })
  })
};
exports.inform_push = function (req, res) {
  var body=req.body;
  co(function *() {
    try{
      var typeInfo={};
      var baseInfo={};
      var targetArr=[];
      //通过body.inform_type确认需要的类型信息
      for(var i=0,len=database.informType.length;i<len;i++){
        var node=database.informType[i]
        if(node.id==body.inform_type){
          typeInfo=node
          break;
        }
      }
      //通过body.inform_key确认需要发送的人员赋值给inform_target并且拿到所需要的信息
      if(body.inform_target){//不存在需要构建inform_target，存在对人员信息监测确保是id字符串形式
        if(/^[0-9,]+$/.exec(body.inform_target)){
          body.inform_target=body.inform_target.split(',')
        }else {
          return response.onError(res,{message:'参数错误'})
        }
      }else {
        var targetSql=new StringBuilder();
        if(body.inform_type==6){//全员推送 公告
          targetSql.AppendFormat("select mid as id from gj_members as m WHERE m.m_type in (0,4,3,9)");
        }else if(body.inform_type==2){//学员推送 课后评价
          targetSql.AppendFormat("select uc_userid as id from gj_class as c " +
              "INNER JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid WHERE classid={0}",body.inform_key);
        }else{//学员推送 && 院办推送 && 特殊身份推送
          targetSql.AppendFormat("select uc_userid as id from gj_class as c " +
              "INNER JOIN gj_userclass as uc ON uc.uc_goodsid=c.class_goodsid WHERE classid={0} " +
              "UNION ALL " +
              "select mid as id from gj_members WHERE gj_members.m_type=10 " +
              "UNION ALL " +
              "select member as id from gj_branch_manage as b " +
              "INNER JOIN gj_class ON gj_class.class_goodsid=b.goods WHERE gj_class.classid={0} " +
              "UNION ALL " +
              "select member as id from gj_branch_manage as b WHERE type in (1,2,5)",body.inform_key);
        }
        var targetList=yield models.sequelize.query(targetSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        targetList.forEach(function (node,index) {
          targetArr.push(node.id)
        });
        body.inform_target=targetArr;
      }
      if(body.inform_target.length==0){
        return response.onError(res,{message:'不存在人员'})
      }
      if(body.inform_type==6){//公告信息
        baseInfo=yield models.Notifics.findOne({
          where:{notid:body.inform_key},
          attributes:[['notid','id'],['not_title','title'],['not_desc','name'],['not_pics','img'],['createdAt','time']],
          raw:true
        })
      }else {//课程信息
        var basesql=new StringBuilder();
        basesql.AppendFormat("select classid as id,class_name as title,class_img as img,class_start as time,m_name as name from gj_class as c " +
            "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) WHERE classid={0}",body.inform_key);
        var base=yield models.sequelize.query(basesql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        var basetMap = {},
            baseDest = [];
        for(var i = 0; i < base.length; i++) {
          var node = base[i];
          if (!basetMap[node.id]) {
            baseDest.push(node);
            basetMap[node.id] = 'true';
          } else {
            for (var j = 0; j < baseDest.length; j++) {
              var dj = baseDest[j];
              if (dj.id == node.id) {
                dj.name = dj.name + '/' + node.name;
                break;
              }
            }
          }
        }
        baseInfo=baseDest[0]
      }
      baseInfo.time=str.getUnixToTime(baseInfo.time)
      baseInfo.img=str.AbsolutePath(baseInfo.img)
      var members=yield models.Members.findOne({
        where:{mid:config.hx_inform},
        attributes:[['m_name','name'],['m_pics','pics']],
        raw:true
      });
      members.pics=str.AbsolutePath(members.pics);
      //baseInfo 和 typeInfo 信息组合
      var ext={
        img:typeInfo.pics,
        type:typeInfo.id,
        title:typeInfo.name,
        desc:body.inform_title,
        imgItem:baseInfo.img,
        titleItem:baseInfo.title,
        timeItem:baseInfo.time,
        nameItem:baseInfo.name,
        avatarURLPath:members.pics,
        nickName:members.name,
        id:baseInfo.id
      };
      var successNum=0
      var errorNum=0
      body.inform_target=_.union(body.inform_target)
      //用户id换用户手机号码
      var umPhone=yield models.Members.findAll({
        where:{mid:{"$in":body.inform_target}},
        raw:true,
        attributes:['m_phone']
      })
      var phoneArr=[];
      umPhone.forEach(function (node) {
        phoneArr.push(node.m_phone)
      })
      var unDesc={
        describe: ext.title,
        title: ext.title,
        subtitle: ext.titleItem,
        content: body.inform_sub,
        type: 37,
        custom:{
          chatname:ext.nickName,
          avatarURLPath:ext.avatarURLPath
        }
      }
      new UM('ios').alias(phoneArr,unDesc )
      new UM('android').alias(phoneArr,unDesc)
      for(var i=0,len=body.inform_target.length;i<len;i+=500){
        var option={
          fromuser:config.hx_inform,
          ext:ext,
          users:body.inform_target.slice(i,i+500),
          msg:body.inform_title
        }
        yield new Promise(function (resolve,reject) {
          hx.sendExtMessages(option,function (err,result) {
            if(!err){
              successNum+=option.users.length
              resolve(result)
            }else {
              errorNum+=option.users.length
              resolve(err)
            }
          })
        })
      }
      //记录信息
      body.inform_target=body.inform_target.join(',')
      body.inform_create=req.session.user?req.session.user.user_login:'系统自动推送';
      models.Inform.create(body)
      //写日志
      Logs.logsSave({
        lg_content: "消息推送【"+body.inform_title+"】",
        lg_ip: req.ip,
        uid:req.session.user?req.session.user.uid:1
      });
      return response.onSuccess(res, {success:successNum,error:errorNum,message:'推送成功'})
    }catch (err){
      console.log(err)
    }
  })
};
exports.inform_title = function (req,res) {
  var body=req.query
  //body.type=4 思想的格局：03月20日周一 19：30，陈全生/刘玲玲/王忠明将为您讲解《聚焦两会最热点》，精彩不容错过。
  //body.type=1 “思想的格局：陈全生/刘玲玲/王忠明 主讲的《聚焦两会最热点》，03月16日星期一19：30 准时开讲，请您提前做好安排，以免错过课程。”
  //body.type=5 “思想的格局：陈全生/刘玲玲/王忠明 主讲的《聚焦两会最热点》邀请您与讲师互动，马上开始提问吧！“
  //body.type=2 《聚焦两会最热点》课程已结束，留下您的评价，我们将做的更好。
  //body.type=3  我们为您提供了“思想的格局”：《聚焦量会最热点》课件，快来下载吧！
  //body.type=3  思想的格局：《聚焦两会热点》发布了课程回顾，来一起重温吧！
  //通过课程id获取 课程班名称 讲师 课程名称 开课时间
  var info=new StringBuilder();
  info.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time,m_name as name from gj_class as c " +
      "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
      "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) WHERE classid={0}",body.id);
  models.sequelize.query(info.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (base) {
    var map = {},
        dest = [];
    for(var i = 0; i < base.length; i++) {
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
    var baseInfo=dest[0],baseDetail='';
    function format(time) {
      return moment(time).locale('zh-cn').format('MMM Do') +''+ moment(time).locale('zh-cn').format('dddd') +''+ moment(time).format('HH:mm');
    }
    switch (body.type){
      case '1':
        baseDetail=baseInfo.goods+'：'+baseInfo.name+'主讲的《'+baseInfo.title+'》，'+format(baseInfo.time)+'准时开讲，请您提前做好安排，以免错过课程！'
        break;
      case '2':
        baseDetail='《'+baseInfo.title+'》课程已结束，留下您的评价，我们将做的更好！'
        break;
      case '3':
        console.log(body.desc.indexOf('课件'))
        if(body.desc.indexOf('课件')!=-1){
          baseDetail='我们为您提供了“'+baseInfo.goods+'”：《'+baseInfo.title+'》课件，快来下载吧！'
        }
        if(body.desc.indexOf('回顾')!=-1){
          baseDetail=baseInfo.goods+'：《'+baseInfo.title+'》发布了课程回顾，来一起重温吧！'
        }
        break;
      case '4':
        baseDetail=baseInfo.goods+'：'+format(baseInfo.time)+'，'+baseInfo.name+'将为您讲解《'+baseInfo.title+'》，精彩不容错过！'
        break;
      case '5':
        baseDetail=baseInfo.goods+'：'+baseInfo.name+'主讲的《'+baseInfo.title+'》邀请您与讲师互动，马上开始提问吧！'
        break;
      default:
        baseDetail=''
        break;
    }
    return response.onSuccess(res,{detail:baseDetail})
  }).catch(function (err) {
    console.log(err)
  })
};
