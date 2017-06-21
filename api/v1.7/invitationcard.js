var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config = require('../../config/config');
var moment = require('moment');
var py = require('../../utils/strChineseFirstPY');
var hx = require('../../utils/hxchat');

var co = require('co');
var StringBuilder = require('../../utils/StringBuilder');
var InvitationCard={ 
    get_invitationcardbyid:function(req,res){
    var icid=req.query.icid;
   
    var sql=new StringBuilder();
    sql.AppendFormat("  select ic_toid,ic.ic_id,ic.ic_phone,ic.ic_name,ic.ic_classnameid,ic.ic_classname,ic_status,ic_frommid,uc_calssroomid,uc_calssroomname,mb.m_name from gj_invitation_card  as ic left JOIN gj_userclass as uc on uc.uc_userid = ic.ic_frommid LEFT JOIN gj_members as mb on mb.mid=ic_frommid where ic_id = {0} ",icid);
    models.sequelize.query(sql.ToString(),{type: models.sequelize.QueryTypes.SELECT }).then(function (result) {
      if (result) {
        return response.ApiSuccess(res,{list:result});
      }else {
        return response.ApiSuccess(res,{list:null});
      }      
    }, function (err) {
      return response.ApiError(res, err);
    });    
  },
  get_invitationcards:function(req,res){
    var mid=req.query.mid;
   
    var sql=new StringBuilder();
    sql.AppendFormat(" select ic_toid,ic.ic_id,ic.ic_phone,ic.ic_name,ic.ic_classnameid,ic.ic_classname,ic_status,m.m_pics from gj_invitation_card  as ic left JOIN gj_members as m on m.m_phone = ic.ic_phone where ic_frommid = {0} and ic.ic_status in (0,1) ",mid);
    models.sequelize.query(sql.ToString(),{type: models.sequelize.QueryTypes.SELECT }).then(function (result) {
      if (result) {
        return response.ApiSuccess(res,{list:result});
      }else {
        return response.ApiSuccess(res,{list:null});
      }      
    }, function (err) {
      return response.ApiError(res, err);
    });    
  },set_invitationcard:function(req,res){
    var body=req.body;
    if (!body.phone) {
      return response.ApiError(res,{message:"phone empty"});
    }
    if (!body.name) {
      return response.ApiError(res,{message:"name empty"});
    }
    if (!body.mid) {    
      return response.ApiError(res,{message:"user id empty"});
    }
    if (!body.submittype) {
      return response.ApiError(res,{message:"submittype empty"});
    }
    co(function* (){
      try{
        if(body.submittype==1)
        {
           yield models.InvitationCard.update({
              ic_status:2
            },{
                where:{ic_frommid:body.mid}
            })
        }
              var userclass =yield models.Userclass.findAll({
                where:{uc_userid:body.mid},
                attributes:['uc_calssroomid','uc_calssroomname']
                })
            
                if(userclass){
                  var ic_classnameid = 0;
                  var ic_classname = "";
                  userclass.forEach(function(node,index){
                    ic_classnameid = node.dataValues.uc_calssroomid;
                    ic_classname = node.dataValues.uc_calssroomname;
                  })
                  models.InvitationCard.create({
                        ic_phone:body.phone,
                        ic_name:body.name,
                        ic_frommid:body.mid,
                        ic_classnameid:ic_classnameid,
                        ic_classname:ic_classname,
                        ic_status:0
                    }).then(function(item){
                        return response.ApiSuccess(res,{data:item})
                    }, function(err){
                        return response.ApiError(res,{message:"set invitationcard error"});
                    })
                }else
                {
                    return response.ApiError(res,{message:"set invitationcard error"});
                }
          
        }catch (err){
           return response.ApiError(res,{message:"ic_classnameid error"});
        }
      });
  },invite_success:function(req,res){
    var body=req.body;
    if (!body.phone) {
      return response.ApiError(res,{message:"phone empty"});
    }
    if (!body.name) {
      return response.ApiError(res,{message:"name empty"});
    }
    if (!body.icid) {
      return response.ApiError(res,{message:"icid empty"});
    }
    if (!body.classnameid) {
      return response.ApiError(res,{message:"classnameid empty"});
    }
    if (!body.classname) {
      return response.ApiError(res,{message:"classname empty"});
    }
    if (!body.smscode) {
      return response.ApiError(res,{message:"smscode empty"});
    }
    co(function* (){
      try{
        var checkresult = yield checkSms({phone:body.phone,area:'+86',code:body.smscode,type:6})
          if(checkresult){
              var m_firstabv=py.makePy(body.m_name);
              var memberitem =  yield  models.Members.findOne({where:{m_phone:body.phone}})
              if(!memberitem)
              {
                  memberitem =  yield   models.Members.create({
                      m_phone:body.phone,
                      m_name:body.name,
                      m_firstabv:m_firstabv
                  })

                  var mid = memberitem.dataValues.mid;
                  hx.reghxuser({username:mid},function(err,result){});
              }
              var classroom = yield models.Classroom.findOne({where:{classroom:body.classnameid}})
              var uc_areaid = classroom.classroom_areaid;
              var uc_areaname = classroom.classroom_area_city;

              userclas = yield models.Userclass.create({
                uc_userphone:body.phone,
                uc_calssroomid:body.classnameid,
                uc_areaid:uc_areaid,
                uc_status:1,
                uc_remark:'',
                uc_calssroomname:body.classname,
                uc_areaname:uc_areaname,
                uc_goodsid:6,
                uc_userid:memberitem.mid
              });
              var icname = body.name;
              if(memberitem)
              {
                 icname=memberitem.m_name;
              }
              yield models.InvitationCard.update({
                  ic_phone:body.phone,
                  ic_toid:memberitem.mid,
                  ic_name:icname,
                  ic_classnameid:body.classnameid,
                  ic_classname:body.classname,
                  ic_status:1
              },{
                  where:{ic_id:body.icid}
              })
              return response.ApiSuccess(res,{});
          }else
          {
            return response.ApiError(res,{message:"check smscode error"});
          }
      }catch (err){
         return response.ApiError(res,{message:"invite error"});
      }
    })
  }
};
 var checkSms = (option) => {
    "use strict";
    var time=option.time || 10;//默认三十分钟
    var sql=new StringBuilder();
    sql.AppendFormat("select sms.smscode as code " +
        "from gj_smscode as sms " +
        "where phoneno={0} AND area={1}  AND createdAt <= '{2}' " +
        "ORDER BY createdAt DESC " +
        "LIMIT 1",option.phone,option.area,moment().add(time,'minute').format());
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (item) {
      if(item.length>0 && item[0].code==option.code){
        return true
      }else {
        return false
      }
    })
  };
module.exports=InvitationCard;