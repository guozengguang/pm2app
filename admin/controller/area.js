"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var co = require('co');
var Logs=require("../controller/logs");
var StringBuilder = require('../../utils/StringBuilder');
var database = require('../../database');

exports.AllArea = function(req,res,next){
  co(function*(){
    try{
      var area=yield models.Area.getAllArea();
      req.area=area?area:[]
      next()
    }catch (err){
      console.log(err)
    }
  })
}
exports.AllClassRoom = function(req,res,next){
  co(function*(){
    try{
      var branch=req.Branch
      var where={}
      if(branch){
        where.classroom=branch
      }
      var Classroom=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom_name','classroom']});
      req.Classroom=Classroom?Classroom:[]
      next()
    }catch (err){
      console.log(err)
    }
  })
}
exports.AllClassRoomBaoBei = function(req,res,next){
  co(function*(){
    try{
      var branch=req.Branch
      var where={}
      var Classroom=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom_name','classroom']});
      req.Classroom=Classroom?Classroom:[]
      next()
    }catch (err){
      console.log(err)
    }
  })
}
exports.area_render = function (req, res) {
  return res.render('area/area', {
    title: '学区列表',
    area:req.area,
    aly:config.aly
  });
};
exports.area_list = function (req, res) {
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    var where={};
    co(function *(){
      try{
        var sql=new StringBuilder();
        sql.AppendFormat("select gj_classroom.classroom_status,gj_classroom.classroom_areaid,gj_classroom.classroom_head,gj_classroom.classroom,gj_classroom.classroom_name,gj_classroom.classroom_area_city,gj_classroom.classroom_pics,gj_area.area_name from gj_area INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid where 1=1");
        if(body.area_name){
          sql.AppendFormat(" and area_name='{0}'",body.area_name);
        }
        if(body.classroom_name){
          sql.AppendFormat(" and classroom_name LIKE '%{0}%'",body.classroom_name);
        }
        sql.AppendFormat(" ORDER BY area_name,classroom_area_city DESC");
        var area=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        return response.onSuccess(res, {
          list:area
        })
      }catch (err){
        console.log(err)
      }
  })
};
exports.area_create = function (req, res) {
  var body=req.body;
  co(function *(){
    try{
      //检查校区是否存在
      var area=yield models.Area.findOne({
        where:{
          area_name:body.area_city,
          area_city:body.area_name
        }
      });
      if(!area){
        area=yield models.Area.create({
          area_name:body.area_city,
          area_city:body.area_name,
          area_region:body.area_region
        })
      }
      //获取校区id
      var areaid=area.dataValues.areaid;
      //确定分院是否存在
      var classroom=yield models.Classroom.findOne({where:{
        classroom_name:body.classroom_name,        //教室名称
        classroom_area_city:body.area_name,     //学区城市
        classroom_areaid:areaid
      }});
      if(classroom){
        return response.onError(res,{message:'分院存在'})
      }
      classroom=yield models.Classroom.create({
        classroom_areaid: areaid,          //学区id
        classroom_name: body.classroom_name,        //教室名称
        classroom_area_city: body.area_name,     //学区城市
        classroom_address: body.classroom_address,     //地址
        classroom_address_work: body.classroom_address_work,
        classroom_coordinates:body.classroom_coordinates,    //纬度
        classroom_longitude:body.classroom_longitude,   //经度
        classroom_pics:body.logo_img,    //logo
        classroom_qrcode:body.code_img,   //二维码
        classroom_banner:body.logo_banner,   //二维码
        classroom_code:body.classroom_code,    //邮编
        classroom_time:body.classroom_time,    //创建时间
        classroom_phone:body.classroom_phone,    //招生电话
        classroom_email:body.classroom_email,    //招生邮箱
        classroom_telephone:body.classroom_telephone,   //招生手机号
        classroom_phone_bus:body.classroom_phone_bus,    //商务电话
        classroom_email_bus:body.classroom_email_bus,    //商务邮箱
        classroom_telephone_bus:body.classroom_telephone_bus,    //商务手机号
        classroom_phone_media:body.classroom_phone_media,    //媒体电话
        classroom_email_media:body.classroom_email_media,    //媒体邮箱
        classroom_telephone_media:body.classroom_telephone_media,    //媒体手机号
        classroom_content:body.classroom_content    //详情
      });
      /* 1.5不需要这些分组  暂时保留
      //确定这个分院的id
      var classroomid=classroom.dataValues.classroom;
      //创建分院群组
      //思想的格局班主任群
      var bendi=yield models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:'本院通讯录',//群名称
        group_imgurl:'public/fenyuan.png',//群图片
        group_maxnums:2000,//群最大成员
        group_desc:body.classroom_name+'本院通讯录',//群描述
        group_goodid:0,//产品id
        group_areaid:areaid,//地区id
        group_classroomid:classroomid,//学区id
        group_type:9//通讯录
      })
      //分院分配人员 为院长 教务 运维添加群  分院群和全国的教务院长运维群  每人两个  班主任的暂时挪开
      //获取院长 教务 运维群
      var yuazhang=yield models.Group.findOne({where:{group_type:5}});
      var jiaowu=yield models.Group.findOne({where:{group_type:6}});
      var yunwei=yield models.Group.findOne({where:{group_type:8}});
      var v=body.v;
      var t=body.t;
      if(v && t){
        for(var i=0,len=v.length;i<len;i++){
          //yield models.Arearole.create({
          //  arearole_classroom: classroomid,
          //  arearole_members: v[i],
          //  arearole_type: t[i],
          //  arearole_role: ''
          //})
          var a=yield models.Groupuser.findOne({where:{
            groupuser_user:v[i],
            groupuser_group:bendi.dataValues.groupid,
            group_classroom:classroomid
          }});
          if(!a){
            yield models.Groupuser.create({
              groupuser_user:v[i],
              groupuser_group:bendi.dataValues.groupid,
              group_classroom:classroomid
            });
          }
          if(t[i]==4){//院长
            yield models.Groupuser.create({
              groupuser_user:v[i],
              groupuser_group:yuazhang.dataValues.groupid,
              group_classroom:classroomid
            });
          }
          if(t[i]==5){//教务
            yield models.Groupuser.create({
              groupuser_user:v[i],
              groupuser_group:jiaowu.dataValues.groupid,
              group_classroom:classroomid
            });
          }
          if(t[i]==7){//运维
            yield models.Groupuser.create({
              groupuser_user:v[i],
              groupuser_group:yunwei.dataValues.groupid,
              group_classroom:classroomid
            });
          }
        }
      }
      */
      Logs.logsSave({
        lg_content: "新建分院【"+body.classroom_name+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功'});
    }catch (err){
      console.log(err)
    }
  });
};
exports.area_update = function (req, res) {
  var body=req.body;
  var classroom=body.classroom;
  models.Area.update({
    area_region:body.area_region
  },{where:{areaid:body.classroom_areaid}});
  models.Classroom.update({
    classroom_pics:body.logo_img,
    classroom_address: body.classroom_address,
    classroom_address_work: body.classroom_address_work,
    classroom_qrcode:body.code_img,
    classroom_code:body.classroom_code,
    classroom_time:body.classroom_time,
    classroom_phone:body.classroom_phone,
    classroom_email:body.classroom_email,
    classroom_telephone:body.classroom_telephone,
    classroom_coordinates:body.classroom_coordinates,
    classroom_longitude:body.classroom_longitude,
    classroom_phone_bus:body.classroom_phone_bus,    //商务电话
    classroom_email_bus:body.classroom_email_bus,    //商务邮箱
    classroom_telephone_bus:body.classroom_telephone_bus,    //商务手机号
    classroom_phone_media:body.classroom_phone_media,    //媒体电话
    classroom_email_media:body.classroom_email_media,    //媒体邮箱
    classroom_telephone_media:body.classroom_telephone_media,    //媒体手机号
    classroom_content:body.classroom_content,   //详情
    classroom_banner:body.logo_banner,   //二维码
  },{where:{classroom:classroom}}).then(function(){
    Logs.logsSave({
      lg_content: "修改分院【"+body.classroom_name+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};
exports.area_add_render = function (req, res) {
  return res.render('area/add_classroom', {
    title: '添加校区',
    aly:config.aly
  });
};
exports.area_edit_render = function (req, res) {
  var body=req.query;
  co(function *(){
    try{
      var item=yield models.Area.getAreaClassroom({classroom:body.classroom});
      /*
      var yuanzhang=yield models.Area.getGroupUser({goodsid:0,type:5,classroom:body.classroom})
      var jiaowu=yield models.Area.getGroupUser({goodsid:0,type:6,classroom:body.classroom})
      var yunwei=yield models.Area.getGroupUser({goodsid:0,type:8,classroom:body.classroom})
      var kaitongde=yield models.Area.findAllGoods({group_classroomid:body.classroom})
      */
      item[0].classroom_time = str.getUnixToTime(item[0].classroom_time);
      return res.render('area/edit_classroom', {
        title: '修改校区',
        item:item[0],
        yuanzhang:{},
        jiaowu:{},
        yunwei:{},
        aly:config.aly
      });
      /*
      return res.render('area/edit_classroom', {
        title: '修改校区',
        item:item[0],
        yuanzhang:yuanzhang[0]?yuanzhang[0]:{},
        jiaowu:jiaowu[0]?jiaowu[0]:{},
        yunwei:yunwei[0]?yunwei[0]:{},
        kaitongde:kaitongde,
        aly:config.aly
      });
      */
    }catch (err){
      console.log(err)
    }
  })
};
exports.area_classroom = function(req,res){
  var where={};
  models.Area.findAll({
    where:where,
    attributes:['areaid','area_name','area_city'],
    include: [{
      model:models.Classroom,
      attributes:['classroom','classroom_name','classroom_areaid']
    }]
  }).then(function(item){
    return response.onSuccess(res, {list:item,})
  },function(err){
    console.log(err)
  })
};
exports.area_delete = function (req, res) {
  var body=req.body;
  var classroom=body.id;
  models.Classroom.update({
    classroom_status:body.status,
  },{where:{classroom:classroom}}).then(function(){
    Logs.logsSave({
      lg_content: "分院设置【"+body.id+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};
exports.area_manage_render = function (req, res) {
  var body=req.query;
  co(function *() {
    try{
      var goods=yield models.Goods.findAll({
        attributes:[['goods_name','name'],['goodsid','id']],
        raw:true
      });
      var item=yield models.Classroom.findOne({
        where:{
          classroom:body.classroom,
        },
        raw:true,
        attributes:['classroom','classroom_name']
      });
      return res.render('area/manage', {
        title: '人员管理',
        item:item,
        goods:JSON.stringify(goods),
        aly:config.aly,
        type: JSON.stringify(database.branch),
      });
    }catch (err){
      console.log(err)
    }
  })
};
exports.branch_manage_push = function (req, res) {
  var body=req.body;
  //学员和分院和身份三个值唯一
  var defaults={
    classroom:body.classroom,
    type:body.type,
    member:body.mid
  }
  if(body.type==3 || body.type==4){
    defaults.goods=body.goods
  }
  models.branchManage.findOrCreate({where:{classroom:body.classroom,type:body.type,member:body.mid},defaults:defaults}).then(function (item) {
    return response.onSuccess(res,{message:'ok'})
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{message:err.toString()})
  })
};
exports.branch_manage_del = function (req, res) {
  var body=req.body;
  models.branchManage.destroy({where:{id:body.id}}).then(function (item) {
    console.log(item)
    return response.onSuccess(res,{message:'ok'})
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{message:err.toString()})
  })
};
exports.branch_manage_list = function (req, res) {
  var body=req.query;
  var sql=new StringBuilder();
  sql.AppendFormat("select branch.id,branch.type,m.m_name,g.goods_name,m.m_pics from gj_branch_manage as branch " +
      "INNER JOIN gj_members as m ON branch.member=m.mid " +
      "LEFT JOIN gj_goods as g ON branch.goods=g.goodsid " +
      "WHERE branch.classroom={0}",body.classroom);
  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (item) {
    item.forEach(function (node,index) {
      node.m_pics=str.AbsolutePath(node.m_pics)
      for(var i=0,len=database.branch.length;i<len;i++){
        var item=database.branch[i];
        if(item.id==node.type){
          node.type_name=item.name;
          break;
        }
      }
    })
    return response.onSuccess(res,{list:item})
  }).catch(function (err) {
    console.log(err);
    return response.onError(res,{message:err.toString()})
  })
};

