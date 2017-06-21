"use strict";
var models  = require('../../models');
var config=require('../../config/config');
var response = require('../../utils/response');
var sms = require('../../utils/sms');
var actions = require('../../actions');
var co = require('co');
var moment = require('moment');
var Logs=require("../controller/logs");
var _=require('lodash')
var StringBuilder = require('../../utils/StringBuilder');

//登陆部分
exports.login = function (req, res) {
  return res.render('login', {
      title: config.wwwname,
      version:config.version
  });
};
//重置密码
exports.reset = function (req, res) {
  return res.render('reset', {
    title: config.wwwname,
    version:config.version
  });
};
/**
 * 新增验证码记录
 * @param body
 * @returns {body}
 */
var setSms = (body) => {
  return models.Smscode.create(body);
}
/**
 * 验证有效性
 * @param option
 * @returns {*}
 */
var checkSms = (option) => {
  "use strict";
  var time=option.time || 30;//默认三十分钟
  var sql=new StringBuilder();
  sql.AppendFormat("select sms.smscode as code " +
      "from gj_smscode as sms " +
      "where phoneno={0} AND type={1} AND createdAt <= '{2}' " +
      "ORDER BY createdAt DESC " +
      "LIMIT 1",option.phone,option.type,moment().add(time,'minute').format());
  return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
//获取重置密码短信
exports.reset_code = function (req, res) {
  var body=req.body;
  var condition={user_login:body.user,user_phone:body.phone,user_status:1}
  models.User.findOne({
    where:condition,
    include: [ {
      where:{r_status:1},
      model:models.Role,
    }]
  }).then(function (item) {
    if(item){
      sms.putCode(config.rlsms,{phone:body.phone}).then(function (item) {

        setSms({
          phoneno:body.phone,
          smscode:item.data,
          type:5,//业务员验证码标识
        });
        return response.onSuccess(res,{message:'ok'})
      })
    }else {
      return response.onError(res,{message:'手机号或用户名错误'})
    }
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{message:err.toString()})
  })
};
exports.reset_password = function (req, res) {
  var body=req.body;
  if(!/(?=^.{6,18}$)(?=(?:.*?\d){1})(?=.*[a-z])(?=(?:.*?[A-Z]){1})(?!.*\s)[0-9a-zA-Z!@#$%*()_+^&]*$/.test(body.password)){
    return response.onError(res,{message:'密码强度不够'})
  }
  checkSms({phone:body.phone,type:5}).then(function (item) {
    if(item.length==1 && item[0].code==body.code){
      models.User.update({user_pass:body.password},{where:{user_phone:body.phone,user_login:body.user}})
      return response.onSuccess(res,{message:'ok'})
    }else {
      return response.onError(res,{message:'验证码错误'})
    }
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{message:err.toString()})
  })
};
exports.signin = function (req, res){
  var user_login = req.body.user_login;
  var user_pass = req.body.user_pass;
  var condition={user_login:user_login,user_pass:user_pass,user_status:1}
  models.User.findOne({
    where:condition,
    include: [ {
      where:{r_status:1},
      model:models.Role,
    }]
  }).then(function(items) {
    if(items){
      var user=items;
      var role=items.Role.dataValues;
      var str=role.r_permission;
      var menustr=role.r_permission_menu;
      var permissionArr=[];
      var menuPermissionArr=[];
      var isAdmin=(user.dataValues.uid==1);
      if(str.length>0){
        _.cloneDeep(actions.permission).forEach(function (node) {
          if(str.indexOf(node.code) != -1){
            if(node.buttons.length != -1){//存在按钮处理按钮
              var buttons=[]
              node.buttons.forEach(function (item) {
                if(str.indexOf(item.code)>0){
                  buttons.push(item)
                }
              });
              node.buttons=buttons
            }
            permissionArr.push(node)
          }
        });
      }
      if(menustr.length>0){
        _.cloneDeep(actions.permission).forEach(function (node) {
          if(menustr.indexOf(node.code) != -1){
            if(node.buttons.length != -1){//存在按钮处理按钮
              var buttons=[]
              node.buttons.forEach(function (item) {
                if(menustr.indexOf(item.code)>0){
                  buttons.push(item)
                }
              });
              node.buttons=buttons
            }
            menuPermissionArr.push(node)
          }
        });
      }
      req.session.user = user;
      req.session.roles = role;
      req.session.permission = permissionArr.length==0 && isAdmin?actions.permission:permissionArr;
      req.session.menuPermission = menuPermissionArr.length==0 && isAdmin?actions.permission:menuPermissionArr;
      req.session.wwwname = config.wwwname;
      Logs.logsSave({
        lg_content: "用户登录【"+req.session.user.uid+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'登陆成功'});
    }else{
      return response.onError(res, {message:"用户不存在或者密码错误"});
    }
  },function(err){
    console.log(err)
  });
};
exports.index_render = function (req, res){
  return res.render('index', {
      title: config.wwwname+'管理系统',
  });
};
exports.changepwd=function(req,res){
  var uid = req.session.user.uid;
  var user_pass = req.body.user_pass;
  var user_pass_new = req.body.user_pass_new;
  var user_pass_new_confim = req.body.user_pass_new_confim;
  var where={uid: uid , user_pass: user_pass}
  if (user_pass === "" || user_pass_new === "") {
    return response.onError(res, { message: '密码为空' });
  }
  if (user_pass_new !== user_pass_new_confim) {
    return response.onError(res, {message:'密码不一致'});
  } else {
    models.User.findOne({
      where:where,
    }).then(function(items) {
      if(items){
        items.update({
          'user_pass': user_pass_new
        }).then(function(){
        Logs.logsSave({
          lg_content: "用户修改密码【"+uid+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
          return response.onSuccess(res,{message:"操作成功"});
        },function(err){
          console.log(err.message)
          return response.onError(res, {message:'修改失败'});
        });
      }else{
        return response.onError(res, {message:"修改失败"});
      }
    },function(err){
      console.log(err.message)
      return response.onError(res, {message:err.message});
    })
  }
};
exports.loginout = function (req, res) {
  if(req.session.user){
    Logs.logsSave({
      lg_content: "退出登录【"+req.session.user.uid+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    req.session.user = null;
    return res.redirect('/login');
  }else {
    return res.redirect('/login');
  }
};
//用户
exports.user_render = function (req, res) {
  return res.render('user/user', {
    title: '用户管理',
  });
};
exports.user_list = function (req,res){
  //查看自己分管的角色  并且不能查看自己还有admin
  var myUserId=req.session.user.uid+','+1;
  var where={uid: {'$notIn': myUserId.split(',')}};
  if(req.Branch){
    where.user_branch=req.Branch
  }
  models.User.findAll({
    where:where
  }).then(function(items){
    if(items){
      return response.onSuccess(res,{list:items})
    }else{
      response.onError(res,'不存在用户')
    }
  },function(err){
    console.log(err)
  })
};
exports.user_add_render=function(req,res){
  co(function *() {
    try{
      var Role=yield models.Role.findAll({where:{r_status:1,r_branch:req.Branch,r_parent:req.Uid}});
      var where={}
      if(req.Branch){
        where.classroom=req.Branch;
        where.classroom_status=0
      }
      var branch=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom','classroom_name']})
      if(!req.Branch){
        branch.unshift({ classroom: 0, classroom_name: '总部账号' })
      }
      return res.render("user/user_add",{
        title:'新建用户',
        list:Role,
        branch:branch
      })
    }catch(err) {
      console.log(err)
    }
  })
};
exports.user_create = function(req,res){
  var body=req.body;
  body.user_parent=req.Uid
  models.User.create(body).then(function() {
    Logs.logsSave({
      lg_content: "新建用户【"+body.user_login+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }).catch(function(err){
    return response.onError(res, {message:'修改失败'});
  })
};
exports.user_edit_render=function(req,res){
  var uid=req.query.uid;
  co(function* () {
    var where={uid:uid}
    if(req.Branch){
      where.user_branch=req.Branch
    }
    var user=yield models.User.findOne({
      where:where,
      include:[{
        model:models.Role
      }]
    });
    var role=yield models.Role.findAll({where:{r_status:1,r_branch:req.Branch,r_parent:req.Uid}});
    if(!user){
      return res.send('非法操作')
    }
    var where={}
    if(req.Branch){
      where.classroom=req.Branch;
      where.classroom_status=0
    }
    var branch=yield models.Classroom.findAll({where:where,raw:true,attributes:['classroom','classroom_name']})
    if(!req.Branch){
      branch.unshift({ classroom: 0, classroom_name: '总部账号' })
    }
    return res.render("user/user_edit",{
      title:'修改角色',
      list:user,
      rolelist:role,
      branch:branch
    })
  }).catch(function(e) {
    console.log(e);
  });
};
exports.user_update = function(req,res){
  var body=req.body;
  var uid=body.uid;
  models.User.findOne({
    where:{uid:uid}
  }).then(function(items) {
    items.update(body).then(function(){
      Logs.logsSave({
        lg_content: "修改用户【"+body.user_login+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:"操作成功"});
    },function(err){
      console.log(err)
    });
  },function(err){
    console.log(err)
  })
};
exports.user_del=function(req,res){
  var where=req.query;
  models.User.destroy({
    where:where
  }).then(function(){
    Logs.logsSave({
      lg_content: "删除用户【"+where.uid+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res,{message:"操作成功"});
  },function(err){
    console.log(err)
  });
};
exports.user_update_status=function(req,res){
  var body=req.body;
  models.User.findOne({
    where:{uid:body.uid}
  }).then(function(items) {
    items.update(body).then(function(){
      Logs.logsSave({
        lg_content: "修改用户【"+body.uid+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:"操作成功"});
    },function(err){
      console.log(err)
    });
  },function(err){
    console.log(err)
  })
};