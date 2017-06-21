"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var co = require('co');
var hx = require('../../utils/hxchat');
var StringBuilder = require('../../utils/StringBuilder');
//创建院长副院长教务群
exports.addgroup = function (req,res){
  //院长 教务 运维群
  co(function *(){
    try{
      //先删除
      yield models.Group.destroy({where:{group_type:{'$in':[5,6,7,8,9,10]}}})
      //开始执行
      yield models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:'全国分院院长',//群名称
        group_imgurl:'public/yuanzhang.png',//群图片
        group_maxnums:2000,//群最大成员
        group_desc:'全国分院院长',//群描述
        group_goodid:0,//产品id
        group_areaid:0,//地区id
        group_classroomid:0,//学区id
        group_type:5//通讯录
      })
      yield models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:'全国分院教学管理',//群名称
        group_imgurl:'public/jiaowu.png',//群图片
        group_maxnums:2000,//群最大成员
        group_desc:'全国分院教学管理',//群描述
        group_goodid:0,//产品id
        group_areaid:0,//地区id
        group_classroomid:0,//学区id
        group_type:6//通讯录
      })
      yield models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:'全国系统运维',//群名称
        group_imgurl:'public/yunwei.png',//群图片
        group_maxnums:2000,//群最大成员
        group_desc:'全国系统运维',//群描述
        group_goodid:0,//产品id
        group_areaid:0,//地区id
        group_classroomid:0,//学区id
        group_type:8//通讯录
      })
      //存在学区添加分院群
      var item=yield models.Classroom.findAll();
      for(var i=0;i<item.length;i++){
        var node=item[i].dataValues;
        yield models.Group.create({
          groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
          group_owner:config.hx_admin,//群主
          group_name:'本院通讯录',//群名称
          group_imgurl:'public/fenyuan.png',//群图片
          group_maxnums:2000,//群最大成员
          group_desc:node.classroom_name+'本院通讯录',//群描述
          group_goodid:0,//产品id
          group_areaid:node.classroom_areaid,//地区id
          group_classroomid:node.classroom,//学区id
          group_type:9//通讯录
        })
      }
      //存在的课程添加班主任群
      var item1=yield models.Goods.findAll();
      for(var j=0;j<item1.length;j++){
        var node=item1[j].dataValues;
        yield models.Group.create({
          groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
          group_owner:config.hx_admin,//群主
          group_name:node.goods_subtitle+'全国班主任',//群名称
          group_imgurl:'public/banzhuren.png',//群图片
          group_maxnums:2000,//群最大成员
          group_desc:node.goods_subtitle+'全国班主任',//群描述
          group_goodid:node.goodsid,//产品id
          group_areaid:'0',//地区id
          group_classroomid:'0',//学区id
          group_type:7//通讯录
        });
        yield models.Group.create({
          groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
          group_owner:config.hx_admin,//群主
          group_name:node.goods_subtitle+'全国班级助理',//群名称
          group_imgurl:'public/banzhuren.png',//群图片
          group_maxnums:2000,//群最大成员
          group_desc:node.goods_subtitle+'全国班级助理',//群描述
          group_goodid:node.goodsid,//产品id
          group_areaid:'0',//地区id
          group_classroomid:'0',//学区id
          group_type:10//通讯录
        })
      }
      res.send('完成')
    }catch (err){
      console.log(err)
    }
  })
};
//hx通讯

exports.setHxGroup = function(req,res){
  co(function*(){
    //获取为3的群组
    let group=yield models.Group.findAll({where:{group_type:3}});
    for (let i=0,len=group.length;i<len;i++){
      let item=group[i].dataValues;
      let g=group[i];
      var s=null
      yield new Promise(function(resolve, reject){
        hx.createhxgroup({groupname:item.group_name,desc:item.group_desc,maxusers:2000,owner:config.hx_admin},function(err,result){
          if(!err){
            result=JSON.parse(result);
            var groupid=result.data.groupid;
            resolve(groupid)
          }else {
            reject(err)
          }
        });
      }).then(function(data){
        g.update({group_hxid:data})
      }).catch(function(err){
        console.log(err)
      })
    }

    return res.send('完成')
  })
}
exports.setHxMember = function (req,res){
  var sql=new StringBuilder();
  sql.AppendFormat("select g.group_hxid as hx,gu.groupuser_user as mid from gj_groupuser as gu INNER JOIN gj_group as g ON g.groupid=gu.groupuser_group where g.group_type=3");
  co(function *(){
    try {
      var member=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
      var map = {},
          dest = [];
      for(var i = 0; i < member.length; i++){
        var ai = member[i];
        if(!map[ai.hx]){
          dest.push({
            id: ai.hx,
            data: [ai.mid+'']
          });
          map[ai.hx] = ai;
        }else{
          for(var j = 0; j < dest.length; j++){
            var dj = dest[j];
            if(dj.id == ai.hx){
              dj.data.push(ai.mid+'');
              break;
            }
          }
        }
      }


      for(var h = 0; h < dest.length; h++){
        var node=dest[h];
        let arr=node.data;
        let id=node.id;
        if(arr.length>59){
          yield new Promise(function(resolve, reject){
            hx.addhxgroupuserbatch({username:arr.slice(59),groupid:id},function(err,result){
              if(!err){
                resolve(id)
              }else {
                reject(err)
              }
            })
          }).then(function(data){
            console.log('成功:'+data)
          }).catch(function(err){
            console.log(err)
          })

          yield new Promise(function(resolve, reject){
            hx.addhxgroupuserbatch({username:arr.slice(0,59),groupid:id},function(err,result){
              if(!err){
                resolve(id)
              }else {
                reject(err)
              }
            })
          }).then(function(data){
            console.log('成功:'+data)
          }).catch(function(err){
            console.log(err)
          })
        }else {
          yield new Promise(function(resolve, reject){
            hx.addhxgroupuserbatch({username:arr,groupid:id},function(err,result){
              if(!err){
                resolve(id)
              }else {
                reject(err)
              }
            })
          }).then(function(data){
            console.log('成功:'+data)
          }).catch(function(err){
            console.log(err)
          })
        }
      }
    }catch (err){
      console.log(err)
    }
    return res.send('完成')
  })

}
exports.setAllHx = function(req,res){
  co(function *(){
    var m=yield models.Members.findAll({raw:true})
    var num=0
    for(let i=0,len=m.length;i<len;i++){
      let node=m[i]
      yield new Promise(function(resolve, reject){
        hx.reghxuser({username:node.mid},function(err,result){
          if(!err){
            resolve('成功')
          }else {
            reject(err)
          }
        });
      }).then(function(data){
        num++
      }).catch(function(err){
        console.log(err)
      })
    }

    console.log(num)
  })
}



