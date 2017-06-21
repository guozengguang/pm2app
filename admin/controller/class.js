"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var hx = require('../../utils/hxchat');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var co = require('co');
var Logs=require("../controller/logs");
var xlsx = require('node-xlsx');
var path=require('path');
var py = require('../../utils/strChineseFirstPY');
var seque = require('../../utils/sequelizeQuery');
var StringBuilder = require('../../utils/StringBuilder');
var Yunpian = require('../../utils/yunpian');
var _=require('lodash')


//产品相关
exports.AllGoods = function (req, res,next) {
  models.Goods.findAll({
    where:{},
    attributes:['goods_name','goodsid'],
  }).then(function(item){
    req.Goods=item?item:[]
    next()
  },function(err){
    console.log(err)
  })
};
//产品相关
exports.goods_render = function (req, res) {
  return res.render('goods/goods', {
    title: '商品列表',
  });
};
exports.goods_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  if(body.goods_name){
    where.goods_name={'$like': '%'+body.goods_name+'%'}
  }
  models.Goods.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.goods_start = moment(node.dataValues.goods_start).format('YYYY-MM-DD');
        node.dataValues.goods_end = moment(node.dataValues.goods_end).format('YYYY-MM-DD');
        node.dataValues.createdAt = moment(node.dataValues.createdAt).format('YYYY-MM-DD');
        node.dataValues.index = options.offset + index + 1
      });
      return response.onSuccess(res, {
        list:list,
        pagecount: Math.ceil(item.count / options.pagesize),
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
  });
};
exports.goods_add=function(req,res){
  return res.render('goods/goods_add',{
    title:'添加课程',
  })
};
exports.goods_edit=function(req,res){
  co(function *() {
    try{
      var body=req.query;
      var where={};
      where.goodsid=body.goodsid;
      var item=yield models.Goods.findOne({
        where:where
      })
      var payCode=yield models.Config.findOne({
        where:{'key':'payCode'},
        raw:true,
        attributes:['val']
      })
      if (item){
        item.dataValues.goods_start = str.getUnixToTime(item.dataValues.goods_start);
        item.dataValues.goods_end = str.getUnixToTime(item.dataValues.goods_end);
        return res.render('goods/goods_edit',{
          title:'修改课程',
          item:item,
          aly:config.aly,
          code:payCode.val+'?id='+body.goodsid
        })
      }
    }catch (err){
      console.log(err)
    }
  })
};
exports.goods_create = function (req, res) {
  var body=req.body;
  var sub=body.goods_subtitle;
  var group_imgurl=body.goods_img_small;
  co(function*(){
    try{
      var goods=yield models.Goods.create(body);
      goods=goods.dataValues;
      //创建产品聊天室
      hx.createhxchatrooms({name:sub+'聊天室',description:sub,maxusers:50000,owner:config.hx_admin},function(err,result){
        if(!err){
          var result=(typeof result)=="string"?JSON.parse(result):result;
          var groupid=result.data.id;
          models.Group.create({
            groupid:groupid,
            group_owner:config.hx_admin,//群主
            group_name:sub+'聊天室',//群名称
            group_imgurl:group_imgurl,//群图片
            group_maxnums:50000,//群最大成员
            group_desc:sub,//群描述
            group_goodid:goods.goodsid,//产品id
            group_areaid:'0',//地区id
            group_classroomid:'0',//学区id
            group_type:4//聊天室
          })
        }else {
          console.log(err)
        }
      });
      //思想的格局通讯录
      models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:sub+'同学录',//群名称
        group_imgurl:group_imgurl,//群图片
        group_maxnums:2000,//群最大成员
        group_desc:sub,//群描述
        group_goodid:goods.goodsid,//产品id
        group_areaid:'0',//地区id
        group_classroomid:'0',//学区id
        group_type:1//通讯录
      })
      /* //1.5  剔除
      //思想的格局班主任群
      models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:sub+'全国班主任',//群名称
        group_imgurl:'public/banzhuren.png',//群图片
        group_maxnums:2000,//群最大成员
        group_desc:sub,//群描述
        group_goodid:goods.goodsid,//产品id
        group_areaid:'0',//地区id
        group_classroomid:'0',//学区id
        group_type:7//通讯录
      })
      //思想的格局班级助理
      models.Group.create({
        groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
        group_owner:config.hx_admin,//群主
        group_name:sub+'全国班级助理',//群名称
        group_imgurl:'public/banzhuren.png',//群图片
        group_maxnums:2000,//群最大成员
        group_desc:sub,//群描述
        group_goodid:goods.goodsid,//产品id
        group_areaid:'0',//地区id
        group_classroomid:'0',//学区id
        group_type:10//通讯录
      })
      */
      //记录返回
      Logs.logsSave({
        lg_content: "新建课程【"+body.goods_name+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功',goodsid:goods.goodsid});
    }catch(err){
      console.log(err)
    }
  });
};
exports.goods_update = function (req,res) {
  var body=req.body;
  var goodsid=body.goodsid;
  delete body.goodsid;
  models.Goods.update(body,{where:{goodsid:goodsid}}).then(function(){
    //更新群组的图片
    models.Group.update({group_imgurl:body.goods_img_small},{where:{group_goodid:goodsid,group_type:1}});
    Logs.logsSave({
      lg_content: "修改课程【"+body.goods_name+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};
//分院管理
exports.branch_render = function (req,res) {
  var body=req.query;
  var where={};
  where.goodsid=body.goodsid;
  co(function *() {
    try{
      var item=yield models.Goods.findOne({
        where:where,
        raw:true,
        attributes:['goods_branch']
      });
      var classroom=yield models.Classroom.findAll({
        raw:true,
        attributes:['classroom_name']
      });
      return res.render('goods/goods_branch',{
        title:'设置开课区域',
        item:item.goods_branch?item.goods_branch.split(','):[],
        classroom:classroom
      })
    }catch (err){
      console.log(err)
      return response.onError(res,{message:err.toString()})
    }
  })
};
//产品模块
exports.goods_related_add = function(req,res){
  var body=req.body;
  if(body.relatedid==0){//新建
    models.Goodsrelated.create(body).then(function(){
      Logs.logsSave({
        lg_content: "新建产品模块【"+body.related_title+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功'});
    }, function(err){
      console.log(err)
    });
  }else {//修改
    models.Goodsrelated.update(body,{where:{relatedid:body.relatedid}}).then(function(){
      Logs.logsSave({
        lg_content: "修改产品模块【"+body.related_title+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功'});
    }, function(err){
      console.log(err)
    });
  }

}
exports.goods_related_del = function(req,res){
  var body=req.body;
  //先确认下面没有子栏目方可以删除
  models.Goodsrelated.findOne({
    where:{related_parent:body.relatedid}
  }).then(function(item){
    if(item){//说明存在子元素,不许删除
      return response.onError(res,{message:'存在子节点'})
    }else {
      models.Goodsrelated.destroy({where:{relatedid:body.relatedid}})
      return response.onSuccess(res,{message:'删除成功'})
    }
  },function(err){
    console.log(err)
    return response.onError(res,{message:err.message})
  })
}
exports.goods_related_ajax = function(req,res){
  var body=req.query;
  var where={};
  if(body.related_parent){
    where.related_parent=body.related_parent;
  }else {
    where.related_parent=0;
  }
  if(body.relatedid){
    where.relatedid=body.relatedid;
  }
  where.related_goodid=body.goodsid;
  models.Goodsrelated.findAll({
    where:where,
    order:[['related_order']]
  }).then(function(item){
    if (item) {
      return response.onSuccess(res, {
        list:item,
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
  });
}

//子课程相关
exports.class_render = function (req, res) {
  return res.render('goods/class/list', {
    title: '子课程管理',
  });
};
exports.class_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  if (!body.goodsid){
    return response.onError(res,'goodsid empty')
  };
  where.class_goodsid=body.goodsid;
  models.Class.findAndCountAll({
    where:where,
    order:[['class_start', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        var isdel=1;
        if(moment(node.dataValues.class_qustart)>moment()){
          isdel=0
        }
        var report = 0;//0 未开始  1提问 2 3 上课  4 结束
        if (moment() >= moment(node.dataValues.class_qustart) && moment() <= moment(node.dataValues.class_start)) {//提问阶段
          report = 1;
        }
        if (moment() >= moment(node.dataValues.class_start) && moment() <= moment(node.dataValues.class_end)) {//上课阶段
          report = 3;
        }
        if (moment() >= moment(node.dataValues.class_end)) {//结束
          report = 4;
        }
        node.dataValues.class_start = str.getUnixToTime(node.dataValues.class_start);
        node.dataValues.createdAt = str.getUnixToTime(node.dataValues.createdAt);
        node.dataValues.class_end = moment(node.dataValues.class_end).format('HH:mm:ss');
        node.dataValues.index = options.offset + index + 1;
        node.dataValues.isdel = isdel;
        node.dataValues.report = report
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
exports.class_add=function(req,res){
  return res.render('goods/class/add',{
    title:'添加子课程',
    teacher:req.teacher,
    aly:config.aly
  })
};
exports.class_edit=function(req,res){
  var body=req.query;
  var where={};
  where.classid=body.classid;
  models.Class.findOne({
    where:where
  }).then(function(item){
    if (item){
      item=item.dataValues;
      item.class_start = str.getUnixToTime(item.class_start);
      item.class_end = str.getUnixToTime(item.class_end);
      item.class_qustart = str.getUnixToTime(item.class_qustart);
      item.class_quend = str.getUnixToTime(item.class_quend);
      item.class_asstart = str.getUnixToTime(item.class_asstart);
      item.class_asend = str.getUnixToTime(item.class_asend);
      var arr=item.class_teacher.split(',')
      models.Members.findAll({
        where:{mid:{'$in':arr}},
        attributes:['mid','m_name','m_pics']
      }).then(function(n){
        return res.render('goods/class/edit',{
          title:'修改子课程',
          item:item,
          aly:config.aly,
          teacher:req.teacher,
          n:n
        })
      }, function(err){
        console.log(err)
      });
    }
  },function(err){
    console.log(err)
  })
};
exports.class_create = function (req, res) {
  var body=req.body;
  models.Class.create(body).then(function(){
    Logs.logsSave({
      lg_content: "新建子课程【"+body.class_name+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};
exports.class_update = function (req,res) {
  var body=req.body;
  var classid=body.classid;
  delete body.classid;
  console.log(body)
  models.Class.update(body,{where:{classid:classid}}).then(function(){
    Logs.logsSave({
      lg_content: "修改子课程【"+body.class_name+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};
exports.class_del = function (req,res){
  var body=req.body;
  models.Class.findOne({
    where:{classid:body.classid}
  }).then(function(item){
    if(item){
      if(moment(item.dataValues.class_qustart).format('YYYY-MM-DD')>moment().format('YYYY-MM-DD')){
        item.destroy()
        response.onSuccess(res,{message:'删除成功'})
      }
    }
  },function(err){
    console.log(err)
  })
};
//短信通知
exports.class_note = function (req,res){
  var body=req.body;
  if(!body.id){
    return response.onError(res,{message:'操作失败'})
  }
  co(function *() {
    try{
      //查询课程
      //查询课程状态
      var sql=new StringBuilder();
      sql.AppendFormat("select goods_name as goods,classid as id,class_name as title,class_start as time from gj_class as c " +
          "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
          "where c.classid={0} and c.class_note=0",body.id);
      var info=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
      if(info.length==0){//不存在课程
        return response.onError(res,{message:'操作失败'})
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
        //置换状态
        console.log(phoneArr.toString())
        models.Class.update({class_note:1},{where:{classid:body.id}})
        //对于超过1000的分组发送
        var content='【格局商学】 课程"'+node.goods+'"之《'+node.title+'》，今日'+moment(node.time).format('HH:mm')+'准时开讲，请您不要忘记上课！App中可参与互动提问、下载课件、查看最新课程预告、课后回顾及课后评价：http://t.geju.com/rk5XUgvkW。'
        if(phoneArr.length>1000){
          for(var i=0,len=phoneArr.length;i<len;i+=1000){
            yield Yunpian.batch_send({mobile:phoneArr.slice(i,i+1000),text:content})
          }
        }else {
          yield Yunpian.batch_send({mobile:phoneArr,text:content})
        }

        Logs.logsSave({
          lg_content: "短信发送【"+node.title+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
        return response.onSuccess(res,{message:'ok'})
      }
    }catch (err){
      console.log(err)
      return response.onError(res,{message:'操作失败'})
    }
  })
};
//课程回顾
exports.class_back_render=function(req,res){
  var body=req.query;
  var where={};
  where.classid=body.classid;
  models.Class.findOne({
    where:where
  }).then(function(item){
    if (item){
      return res.render('goods/class/back',{
        title:'编辑课后回顾',
        item:item,
      })
    }
  },function(err){
    console.log(err)
  })
};
//课程话题
exports.class_topic_render=function(req,res){
  var body=req.query;
  var where={};
  where.topic_classid=body.classid;
  models.Topic.findAll({
    where:where,
    raw:true
  }).then(function(item){
    console.log(item)
    if (item){
      item.forEach(function (node) {
        node.createdAt=str.getUnixToTime(node.createdAt)
      })
      return res.render('goods/class/topic/list',{
        title:'话题',
        item:item,
        classid:body.classid
      })
    }
  },function(err){
    console.log(err)
  })
};
exports.class_topic_add=function(req,res){
  return res.render('goods/class/topic/add',{
    title:'新增话题',
    classid:req.query.classid
  })
};
exports.class_topic_video=function(req,res){
  return res.render('goods/class/topic/video',{
    title:'新增视频',
    id:req.query.id
  })
};
exports.class_topic_create=function(req,res){
  var body=req.body;
  models.Topic.create(body).then(function () {
    return response.onSuccess(res,{message:'成功'})
  }).then(function (err) {
    console.log(err)
    return response.onError(res,{})
  })
};
exports.class_topic_update=function(req,res){
  var body=req.body;
  models.Topic.update(body,{where:{topic_id:body.topic_id}}).then(function () {
    return response.onSuccess(res,{message:'成功'})
  }).then(function (err) {
    console.log(err)
    return response.onError(res,{})
  })
};
exports.class_topic_edit=function(req,res){
  var body=req.query;
  var where={};
  where.topic_id=body.id;
  models.Topic.findOne({
    where:where
  }).then(function(item){
    if (item){
      return res.render('goods/class/topic/edit',{
        title:'新增话题',
        item:item
      })
    }
  },function(err){
    console.log(err)
  })
};
//课程课件
exports.class_courseware_render = function (req,res){
  var body=req.query;
  return res.render('goods/class/courseware', {
    title: '添加课件',
    aly:config.aly
  });
};
exports.class_courseware_list = function (req,res){
  var body=req.query;
  var where={};
  if (!body.classid){
    return response.onError(res,'classid empty')
  };
  where.cou_classid=body.classid;
  models.Courseware.findAndCountAll({
    where:where,
    order:[['cou_status'],['cou_type', 'DESC']]
  }).then(function(item){
    if (item) {
      var list=item.rows;
      return response.onSuccess(res, {
        list:list
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
    return response.onError(res,err)
  });
};
exports.class_courseware_update = function (req,res){
  var body=req.body;
  var where={};
  //确认课件是否存在
  co(function*(){
    try{
      var cour=false;
      if(body.couid){
        //是否存在课件id,存在则为更新,不存在则创建
        cour=yield models.Courseware.findOne({where:{couid:body.couid}});
      }
      if(cour){
        //存在课程
        yield models.Courseware.update(body,{where:{couid:body.couid}})
      }else {
        //不存在课程
        yield models.Courseware.create(body)
      }
      Logs.logsSave({
        lg_content: "上传课件【"+body.cou_title+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res,{message:'操作成功'})
    }catch (err){
      console.log(err)
    }
  })
};
exports.class_courseware_transcoding = function (req,res){
  var body=req.body;
  var where={};
  co(function*(){
    try{
      var info=yield models.Courseware.findOne({where:{couid:body.couid}});
      var path=info.dataValues.cou_note || info.dataValues.cou_path;
      if(path.indexOf('.pdf')==-1){
        return response.onError(res,{message:'操作失败'})
      }
      var url=str.AbsolutePath(path);
      path=path.substring(0,path.indexOf('.pdf'))+'/';
      var request=require('request')
      request.post({url:config.transcodUrl+'/pdf/getPDF2JPG', form: {path:url,key:path}}, function(err,httpResponse,body){
        body=JSON.parse(body)
        console.log(body)
        if(!err && body.code==200){
          info.update({cou_transcoding:1})
          Logs.logsSave({
            lg_content: "课件转码",
            lg_ip: req.ip,
            uid:req.session.user.uid
          });
          return response.onSuccess(res,{message:'操作成功'})
        }else {
          return response.onError(res,{message:'操作失败'})
        }
      })
    }catch (err){
      console.log(err)
      return response.onError(res,{message:'操作失败'})
    }
  })
};
//课程问题
exports.class_question_render = function (req,res){
  models.Config.findOne({where:{key:'transfercode'},raw:true}).then(function (data) {
    return res.render('goods/class/question', {
      title: '课程问题',
      url:data.val+'?transfertype=20&id='+req.query.classid
    });
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{message:err.toString()})
  })

};
exports.class_question_update = function (req,res){
  var body=req.body;
  var where={};
  where.questionid=body.questionid;
  models.Question.update(body,{where:where}).then(function(){
    return response.onSuccess(res,{message:'操作成功'})
  },function(err){
    console.log(err)
  })
};
exports.class_question_list = function (req,res){
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={question_status:1};
  if (!body.classid){
    return response.onError(res,'classid empty')
  };
  where.question_classid=body.classid;
  if(body.classroom_name){
    where.classroom_name=body.classroom_name;
  }
  co(function *(){
    try{
      var count=yield models.Question.getCount(where);
      where.limit=options.pagesize;
      where.offset=options.offset;
      var qlist=yield models.Question.getList(where);
      qlist.forEach(function(node,index){
        node.m_pics=str.AbsolutePath(node.m_pics)
      })
      return response.onSuccess(res, {
        list:qlist,
        pagecount: Math.ceil(count[0].count / options.pagesize)
      })
    }catch (err){
      console.log(err)
    }
  });
};
//课程评价
exports.class_vlaue_render = function (req,res){
  return res.render('goods/class/value', {
    title: '课程评价'
  });
};
exports.class_vlaue_list = function (req,res){
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  if (!body.classid){
    return response.onError(res,'classid empty')
  };
  where.value_classid=body.classid;
  models.Classvalue.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset,
    include:[{
      model:models.Members,
      attributes:['m_name','m_phone']
    }]
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.createAt = moment(node.dataValues.createAt).format('YYYY-MM-DD');
        node.dataValues.index = options.offset + index + 1
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
//推荐书目
exports.class_reference_render = function (req,res){
  return res.render('goods/class/reference', {
    title: '推荐书目',
  });
};
exports.class_reference_list = function (req,res){
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  console.log(body)
  if (!body.classid){
    return response.onError(res,'classid empty')
  };
  where.ref_classid=body.classid;
  if(body.refid){
    where.refid=body.refid;
  }
  models.Reference.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.old_ref_pics=node.dataValues.ref_pics;
        node.dataValues.ref_pics=str.AbsolutePath(node.dataValues.ref_pics);
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
exports.class_reference_create = function (req,res){
  var body=req.body;
  if(body.refid){
    //存在id代表修改
    var refid=body.refid
    delete body.refid
    models.Reference.update(body,{where:{refid:refid}}).then(function(){
      Logs.logsSave({
        lg_content: "修改推荐书目【"+body.ref_author+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功'});
    }, function(err){
      console.log(err)
    });
  }else {
    models.Reference.create(body).then(function(){
      Logs.logsSave({
        lg_content: "上传推荐书目【"+body.ref_author+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功'});
    }, function(err){
      console.log(err)
    });
  }
};
exports.class_reference_del = function (req,res){
  var body=req.body;
  models.Reference.destroy({
    where:{refid:body.id}
  }).then(function(){
    response.onSuccess(res,{message:'删除成功'})
  },function(err){
    console.log(err)
  })
};
//课程学员相关
exports.vip_render = function (req, res) {
  //获取全部课程
  models.Goods.findAll({
    where:{},
    attributes:['goods_name','goodsid'],
  }).then(function(item){
    return res.render('goods/vip/list', {
      title: '学员管理',
      item:item?item:[],
      room:req.Classroom
    });
  },function(err){
    console.log(err)
  })
};
exports.vip_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  var where1={}
  if (body.goodsid){
    where.uc_goodsid=body.goodsid;
  };
  if (body.calssroom){
    where.uc_calssroomid=body.calssroom;
  };
  if(body.uc_userphone){
    where.uc_userphone={'$like': '%'+body.uc_userphone+'%'}
  }
  if(body.m_position){
    where1.m_position={'$like': '%'+body.m_position+'%'}
  }
  models.Userclass.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset,
    include:[{
      model:models.Members,
      attributes:['m_name','m_position'],
      where:where1
    },{
      model:models.Goods,
    }]
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.createdAt = moment(node.dataValues.createdAt).format('YYYY-MM-DD');
        node.dataValues.index = options.offset + index + 1
      });
      return response.onSuccess(res, {
        list:list,
        count:item.count,
        pagecount: Math.ceil(item.count / options.pagesize)
      })
    }else {
      return response.onError(res,'没有数据')
    }
  }, function(err){
    console.log(err)
  });
};
exports.vip_add=function(req,res){
  //获取全部课程
  models.Goods.findAll({
    where:{},
    attributes:['goods_name','goodsid']
  }).then(function(item){
    return res.render('goods/vip/vip_add',{
      title:'新增学员',
      item:item?item:[]
    });
  },function(err){
    console.log(err)
  })
};
exports.vip_edit=function(req,res){
  var body=req.query;
  var where={};
  where.ucid=body.ucid;
  co(function*(){
    try{
      var goods=yield models.Goods.findAll({
        where:{},
        attributes:['goods_name','goodsid']
      });
      var userclass=yield models.Userclass.findOne({
        where:where,
        include:[{
          model:models.Members,
          attributes:['m_name','m_email','m_url','m_place','m_company','m_position']
        }]
      });
      userclass=userclass?userclass:{};
      return res.render('goods/vip/vip_edit',{
        title:'修改学员信息',
        item:userclass,
        goods:goods
      })
    }catch (err){
      console.log(err)
    }
  })
};
exports.vip_create = function (req, res) {
  var body=req.body;
  var members;
  co(function* (){
    try{
      //判断是否报名过课程
      var userclass=yield models.Userclass.findOne({where:{uc_userphone:body.uc_userphone,uc_goodsid:body.goodsid}});
      if (!userclass){
        //判断是否新用户
        members=yield models.Members.findOne({where:{m_phone:body.uc_userphone}});
        if (!members){
          var m={
            m_phone:body.uc_userphone,
            m_name:body.m_name,
            m_email:body.m_email,
            m_url:body.m_url,
            m_place:body.m_place,
            m_company:body.m_company,
            m_position:body.m_position
          };
          if (m.m_name){
            m.m_firstabv=py.makePy(m.m_name);
          }
          members = yield models.Members.create(m);
          //注册通讯用户
          hx.reghxuser({username:members.dataValues.mid},function(err,result){
            console.log(err)
            console.log(result)
          });
        }
        userclass=yield models.Userclass.create({
          uc_userphone:body.uc_userphone,
          uc_calssroomid:body.uc_calssroomid,
          uc_areaid:body.uc_areaid,
          uc_status:body.uc_status,
          uc_remark:body.uc_remark,
          uc_calssroomname:body.uc_calssroomname,
          uc_areaname:body.uc_areaname,
          uc_goodsid:body.goodsid,
          uc_userid:members.dataValues.mid
        });
        if(body.uc_status==1){
          //获取产品的部分信息
          var goods=yield models.Goods.findOne({where:{goodsid:body.goodsid},attributes:['goods_subtitle']});
          //状态为缴费的 查找群 全国 地区 分校
          var item=userclass.dataValues;
          var sub=goods.dataValues.goods_subtitle;
          var goodsgroup=yield models.Group.findOne({where:{group_goodid:item.uc_goodsid,group_areaid:0,group_classroomid:0,group_type:1}});
          //var areagroup=yield models.Group.findOne({where:{group_goodid:item.uc_goodsid,group_areaid:item.uc_areaid,group_classroomid:0}});
          var classroomgroup=yield models.Group.findOne({where:{group_goodid:item.uc_goodsid,group_areaid:item.uc_areaid,group_classroomid:item.uc_calssroomid}});
          //全国组
          if (!goodsgroup){//不存在全国通讯录
            goodsgroup=yield models.Group.create({
              groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
              group_owner:config.hx_admin,//群主
              group_name:sub+'同学录',//群名称
              group_imgurl:config.hx_group_img,//群图片
              group_maxnums:2000,//群最大成员
              group_desc:sub,//群描述
              group_goodid:item.uc_goodsid,//产品id
              group_areaid:'0',//地区id
              group_classroomid:'0',//学区id
              group_type:1//全国通讯录
            })
          }
          //用户添加到全国的组
          models.Groupuser.create({
            groupuser_user:members.dataValues.mid,
            groupuser_group:goodsgroup.dataValues.groupid
          });
          //地区组
          if (classroomgroup){//地区群
            hx.addhxgroupuser({username:members.dataValues.mid+'',groupid:classroomgroup.dataValues.group_hxid},function(err,result){
              if(!err){
                //用户添加到地区的组
 /*               models.Groupuser.create({
                  groupuser_user:members.dataValues.mid,
                  groupuser_group:classroomgroup.dataValues.groupid
                });*/
              }
              models.Groupuser.create({
                groupuser_user:members.dataValues.mid,
                groupuser_group:classroomgroup.dataValues.groupid
              });
            })
          }
          if (!classroomgroup){//不存在地区组
            hx.createhxgroup({groupname:item.uc_calssroomname,desc:sub,maxusers:2000,owner:config.hx_admin},function(err,result){
              if(!err){
                var result=(typeof result)=="string"?JSON.parse(result):result;
                var groupid=result.data.groupid;
                models.Group.create({
                  groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
                  group_owner:config.hx_admin,//群主
                  group_name:item.uc_calssroomname,//群名称
                  group_imgurl:config.hx_group_img,//群图片
                  group_maxnums:2000,//群最大成员
                  group_desc:sub,//群描述
                  group_goodid:item.uc_goodsid,//产品id
                  group_areaid:item.uc_areaid,//地区id
                  group_classroomid:item.uc_calssroomid,//学区id
                  group_type:3,//聊天室
                  group_hxid:groupid
                }).then(function(item){
                  hx.addhxgroupuser({username:members.dataValues.mid,groupid:item.dataValues.group_hxid},function(err,result){
                    if(!err){
                      //用户添加到地区的组
/*                      models.Groupuser.create({
                        groupuser_user:members.dataValues.mid,
                        groupuser_group:item.dataValues.groupid
                      });*/
                    }
                    models.Groupuser.create({
                      groupuser_user:members.dataValues.mid,
                      groupuser_group:item.dataValues.groupid
                    });
                  })
                },function(err){
                  console.log(err)
                })
              }else {
                console.log(err)
              }
            });
          }
          //状态调整为会员
          yield models.Members.update({m_status:1},{where:{mid:members.dataValues.mid}})
        }
        Logs.logsSave({
          lg_content: "学员报名【"+body.uc_userphone+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
        return response.onSuccess(res, {message:'操作成功'});
      }else {
        return response.onError(res, {message:'学员存在'});
      }
      //待修改
    }catch (err){
      console.log(err)
    }
  });
};
exports.vip_update = function (req,res) {
  var body=req.body;
  var ucid=body.ucid;
  delete body.ucid;
  //var content={
  //  uc_calssroomid:body.uc_calssroomid,
  //  uc_areaid:body.uc_areaid,
  //  uc_status:body.uc_status,
  //  uc_remark:body.uc_remark,
  //  uc_calssroomname:body.uc_calssroomname,
  //  uc_areaname:body.uc_areaname,
  //};
  var content=body;
  co(function*(){
    try{
      //变为缴费1 //退费0
      if(body.uc_status==1){
        //获取该课程相关的用户mid和课程班的副标题
        var userClassInfo=yield seque.getUserClassById({ucid:ucid});
        //状态为缴费的 查找群 全国 地区 分校
        var sub=userClassInfo.goods_subtitle;
        var goodsgroup=yield models.Group.findOne({where:{group_goodid:userClassInfo.uc_goodsid,group_areaid:0,group_classroomid:0,group_type:1}});
        var classroomgroup=yield models.Group.findOne({where:{group_goodid:userClassInfo.uc_goodsid,group_areaid:userClassInfo.uc_areaid,group_classroomid:userClassInfo.uc_calssroomid}});
        //全国组
        if (!goodsgroup){//不存在创建组
          goodsgroup=yield models.Group.create({
            groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
            group_owner:config.hx_admin,//群主
            group_name:sub+'同学录',//群名称
            group_imgurl:config.hx_group_img,//群图片
            group_maxnums:2000,//群最大成员
            group_desc:sub,//群描述
            group_goodid:userClassInfo.uc_goodsid,//产品id
            group_areaid:'0',//地区id
            group_classroomid:'0',//学区id
            group_type:1//聊天室
          })
        }
        //用户添加到全国的组
        models.Groupuser.create({
          groupuser_user:userClassInfo.mid,
          groupuser_group:goodsgroup.dataValues.groupid
        });
        //地区组
        if (!classroomgroup){//不存在全国通讯录
          classroomgroup=yield models.Group.create({
            groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
            group_owner:config.hx_admin,//群主
            group_name:userClassInfo.uc_calssroomname,//群名称
            group_imgurl:config.hx_group_img,//群图片
            group_maxnums:2000,//群最大成员
            group_desc:sub,//群描述
            group_goodid:userClassInfo.uc_goodsid,//产品id
            group_areaid:userClassInfo.uc_areaid,//地区id
            group_classroomid:userClassInfo.uc_calssroomid,//学区id
            group_type:3//聊天室
          })
        }
        //用户添加到地区的组
        models.Groupuser.create({
          groupuser_user:userClassInfo.mid,
          groupuser_group:classroomgroup.dataValues.groupid
        });
        //状态改为缴费
        yield models.Userclass.update(content,{where:{ucid:ucid}});
        //状态调整为会员
        yield models.Members.update({m_status:1},{where:{mid:userClassInfo.mid}})
      }
      if(body.uc_status==0){
        //获取所报课程
        var userclass=yield models.Userclass.findOne({where:{ucid:ucid}});
        //或许产品的部分信息
        var goods=yield models.Goods.findOne({where:{goodsid:userclass.dataValues.uc_goodsid},attributes:['goods_subtitle']});
        //获取用户信息
        var members=yield models.Members.findOne({where:{m_phone:userclass.dataValues.uc_userphone}});
        //状态为缴费的 查找群 全国 地区 分校
        var item=userclass.dataValues;
        var sub=goods.dataValues.goods_subtitle;
        var goodsgroup=yield models.Group.findOne({where:{group_goodid:item.uc_goodsid,group_areaid:0,group_classroomid:0,group_type:1}});
        //var areagroup=yield models.Group.findOne({where:{group_goodid:item.uc_goodsid,group_areaid:item.uc_areaid,group_classroomid:0}});
        var classroomgroup=yield models.Group.findOne({where:{group_goodid:item.uc_goodsid,group_areaid:item.uc_areaid,group_classroomid:item.uc_calssroomid}});
        //用户添加到全国的组
        models.Groupuser.destroy({where:{
          groupuser_user:members.dataValues.mid,
          groupuser_group:goodsgroup.dataValues.groupid
        }});
        //用户添加到地区的组
        models.Groupuser.destroy({where:{
          groupuser_user:members.dataValues.mid,
          groupuser_group:classroomgroup.dataValues.groupid
        }});
        //状态改为未缴费
        yield models.Userclass.update(content,{where:{ucid:ucid}});
        //如果这是该学员的唯一一节课状态调整为非会员
        var onlyclass=yield models.Userclass.findOne({where:{ucid:ucid,uc_status:1}});
        if(!onlyclass){
          console.log('置换为非会员')
          yield models.Members.update({m_status:0},{where:{mid:members.dataValues.mid}})
        }
      }
      Logs.logsSave({
        lg_content: "学员修改【"+body.ucid+"】",
        lg_ip: req.ip,
        uid:req.session.user.uid
      });
      return response.onSuccess(res, {message:'操作成功'});
    }catch (err){
      console.log(err)
      return response.onError(res,'err')
    }
  })
};
exports.vip_delete = function (req,res) {
  var body=req.body
  //删除本身记录  删除群组 删除HX
  co(function *() {
    try{
      var userClass=yield models.Userclass.findOne({where:{ucid:body.id}});//课程信息
      var base=userClass.dataValues;
      if(base.uc_status==0){
        models.Userclass.destroy({
          where:{
            ucid:body.id,
          }
        }).then(function () {
          return response.onSuccess(res,{})
        }).catch(function (err) {
          console.log(err)
          return response.onError(res,{})
        })
      }
      var goodsGroup=yield models.Group.findOne({where:{group_goodid:base.uc_goodsid,group_areaid:0,group_classroomid:0,group_type:1},attributes:['groupid','group_hxid']});
      var classRoomGroup=yield models.Group.findOne({where:{group_goodid:base.uc_goodsid,group_areaid:base.uc_areaid,group_classroomid:base.uc_calssroomid},attributes:['groupid','group_hxid']});
      if(!goodsGroup){
        return response.onError(res,{})
      }
      if(classRoomGroup){
        hx.deletehxgroupuser({username:base.uc_userid,groupid:classRoomGroup.dataValues.group_hxid},function(err,result){
          console.log(err)
          console.log(result)
        })
      }
      yield models.sequelize.transaction(function (t) {

        // 要确保所有的查询链都有return返回
        return models.Groupuser.destroy({
          where:{
            groupuser_user:base.uc_userid,
            groupuser_group:goodsGroup.dataValues.groupid
          }
        }, {transaction: t}).then(function () {
          return models.Groupuser.destroy({
            where: {
              groupuser_user: base.uc_userid,
              groupuser_group: classRoomGroup?classRoomGroup.dataValues.groupid:0
            }
          }, {transaction: t})
        }).then(function () {
          return models.Userclass.destroy({
            where:{
              ucid:body.id,
            }
          }, {transaction: t});
        });
      })
      var myClass=yield models.Userclass.findOne({where:{uc_userid:userClass.uc_userid}});

      if(!myClass){
        models.Members.update({m_status:0},{where:{mid:userClass.uc_userid}})
      }
      return response.onSuccess(res,{})
    }catch (err){
      console.log(err)
      return response.onError(res,{})
    }
  })
};
//用户组群
exports.group_render = function (req,res){
   var body=req.query;
   return res.render('goods/group/list', {
     title: '用户组群',
     aly:config.aly
   });
};
exports.group_list = function (req,res){
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  if (!body.goodsid){
    return response.onError(res,'goodsid empty')
  };
  where.group_goodid=body.goodsid;
  co(function*(){
    try{
      var list=yield models.Group.findAllGoodsid({group_goodid:body.goodsid})
      if(!list){
        return response.onError(res,'没有数据')
      }else {
        list.forEach(function(item,index){
          if(item.group_type==1){
            item.classroom_pics=str.AbsolutePath(item.group_imgurl);
          }
          item.classroom_pics=str.AbsolutePath(item.classroom_pics);
        });
        return response.onSuccess(res, {
          list:list,
        })
      }
    }catch (err){
      console.log(err)
    }
  });
  /**
  models.Group.findAndCountAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset
  }).then(function(item){
    if (item) {
      var list=item.rows;
      list.forEach( function(node, index) {
        node.dataValues.createAt = moment(node.dataValues.createAt).format('YYYY-MM-DD');
        node.dataValues.index = options.offset + index + 1
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
   **/
};

//课程班主任
exports.teacher_list_render = function (req,res){
  var body=req.query;
  co(function *(){
    try{
      var banzhuren=yield models.Area.getGroupUser({goodsid:body.goodsid,type:7});
      var zhuli=yield models.Area.getGroupUser({goodsid:body.goodsid,type:10})
      models.Classroom.findAll({
        attributes:['classroom','classroom_name']
      }).then(function(item){
        return res.render('goods/teacher/list', {
          title: '课程班主任',
          item:item,
          banzhuren:banzhuren,
          zhuli:zhuli,
          aly:config.aly
        });
      },function(err){
        console.log(err)
      })
    }catch (err){
      console.log(err)
    }
  })
};
//班主任 班级助理 添加更换
exports.set_groupuser = function(req,res){
  var body=req.body;
  co(function *(){
    try{
      //{ name: '班主任2号', id: '483', type: '6', goodsid: '1', room: '1' } { name: '院长2号', id: '479', type: '4', room: '1' }
      var type=body.type  //4院长  5教学助理 6 班主任 7运维 9班级助理
      var benyuan=yield models.Group.findOne({where:{group_type:9,group_classroomid:body.room},attributes:['groupid','group_desc','group_name']});
      var isbenyuanyser=yield models.Groupuser.findOne({where:{
        groupuser_user:body.id,
        groupuser_group:benyuan.dataValues.groupid,
        group_classroom:body.room
      }});
      console.log(isbenyuanyser)
      switch (type){
        case '4' :
          //院长
          var yuanzhang=yield models.Group.findOne({where:{group_type:5},attributes:['groupid']});
          var yuanzhanguser=yield models.Groupuser.findOne({where:{groupuser_group:yuanzhang.dataValues.groupid,group_classroom:body.room}});
          if(yuanzhanguser){
            //角色替换同事要替换本地的这个人
            var benyuanuser=yield models.Groupuser.findOne({where:{groupuser_group:benyuan.dataValues.groupid,groupuser_user:yuanzhanguser.dataValues.groupuser_user}});
            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_user:benyuanuser.dataValues.groupuser_user,
              groupuser_group:benyuan.dataValues.groupid
            }});

            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_group:yuanzhang.dataValues.groupid,
              group_classroom:body.room,
            }});
          }else {
            yield models.Groupuser.create({
              groupuser_user:body.id,
              groupuser_group:yuanzhang.dataValues.groupid,
              group_classroom:body.room
            });
            if(!isbenyuanyser){
              //新角色必然要新添加到本地通讯录
              yield models.Groupuser.create({
                groupuser_user:body.id,
                groupuser_group:benyuan.dataValues.groupid,
                group_classroom:body.room
              });
            }
          }
        break;
        case '5' :
          //教学管理
          var jiaowu=yield models.Group.findOne({where:{group_type:6},attributes:['groupid']});
          var jiaowuuser=yield models.Groupuser.findOne({where:{groupuser_group:jiaowu.dataValues.groupid,group_classroom:body.room}});
          if(jiaowuuser){
            //角色替换同事要替换本地的这个人
            var benyuanuser=yield models.Groupuser.findOne({where:{groupuser_group:benyuan.dataValues.groupid,groupuser_user:jiaowuuser.dataValues.groupuser_user}});
            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_user:benyuanuser.dataValues.groupuser_user,
              groupuser_group:benyuan.dataValues.groupid
            }});

            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_group:jiaowu.dataValues.groupid,
              group_classroom:body.room
            }});
          }else {
            yield models.Groupuser.create({
              groupuser_user:body.id,
              groupuser_group:jiaowu.dataValues.groupid,
              group_classroom:body.room
            });
            if(!isbenyuanyser){
              //新角色必然要新添加到本地通讯录
              yield models.Groupuser.create({
                groupuser_user:body.id,
                groupuser_group:benyuan.dataValues.groupid,
                group_classroom:body.room
              });
            }
          }
        break;
        case '6' :
          //本节产品的班主任群
          var banzhuren=yield models.Group.findOne({where:{group_type:7,group_goodid:body.goodsid},attributes:['groupid']});
          var banzhurenuser=yield models.Groupuser.findOne({where:{groupuser_group:banzhuren.dataValues.groupid,group_classroom:body.room}});
          if(banzhurenuser){
            //角色替换同事要替换本地的这个人
            var benyuanuser=yield models.Groupuser.findOne({where:{groupuser_group:benyuan.dataValues.groupid,groupuser_user:banzhurenuser.dataValues.groupuser_user}});
            console.log(benyuanuser)
            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_user:benyuanuser.dataValues.groupuser_user,
              groupuser_group:benyuan.dataValues.groupid
            }});

            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_group:banzhuren.dataValues.groupid,
              group_classroom:body.room
            }});
          }else {
            yield models.Groupuser.create({
              groupuser_user:body.id,
              groupuser_group:banzhuren.dataValues.groupid,
              group_classroom:body.room
            });
            if(!isbenyuanyser){
              //新角色必然要新添加到本地通讯录
              yield models.Groupuser.create({
                groupuser_user:body.id,
                groupuser_group:benyuan.dataValues.groupid,
                group_classroom:body.room
              });
            }
          }
        break;
        case '7' :
          //运维
          var yunwei=yield models.Group.findOne({where:{group_type:8},attributes:['groupid']});
          var yunweiuser=yield models.Groupuser.findOne({where:{groupuser_group:yunwei.dataValues.groupid,group_classroom:body.room}});
          if(yunweiuser){
            //角色替换同事要替换本地的这个人
            var benyuanuser=yield models.Groupuser.findOne({where:{groupuser_group:benyuan.dataValues.groupid,groupuser_user:yunweiuser.dataValues.groupuser_user}});
            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_user:benyuanuser.dataValues.groupuser_user,
              groupuser_group:benyuan.dataValues.groupid
            }});

            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_group:yunwei.dataValues.groupid,
              group_classroom:body.room
            }});
          }else {
            yield models.Groupuser.create({
              groupuser_user:body.id,
              groupuser_group:yunwei.dataValues.groupid,
              group_classroom:body.room
            });
            if(!isbenyuanyser){
              //新角色必然要新添加到本地通讯录
              yield models.Groupuser.create({
                groupuser_user:body.id,
                groupuser_group:benyuan.dataValues.groupid,
                group_classroom:body.room
              });
            }
          }
        break;
        case '9' :
          //本节产品的助理群
          var zhuli=yield models.Group.findOne({where:{group_type:10,group_goodid:body.goodsid},attributes:['groupid']});
          var zhuliuser=yield models.Groupuser.findOne({where:{groupuser_group:zhuli.dataValues.groupid,group_classroom:body.room}});
          if(zhuliuser){
            //角色替换同事要替换本地的这个人
            var benyuanuser=yield models.Groupuser.findOne({where:{groupuser_group:benyuan.dataValues.groupid,groupuser_user:zhuliuser.dataValues.groupuser_user}});
            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_user:benyuanuser.dataValues.groupuser_user,
              groupuser_group:benyuan.dataValues.groupid
            }});

            yield models.Groupuser.update({groupuser_user:body.id},{where:{
              groupuser_group:zhuli.dataValues.groupid,
              group_classroom:body.room
            }});
          }else {
            yield models.Groupuser.create({
              groupuser_user:body.id,
              groupuser_group:zhuli.dataValues.groupid,
              group_classroom:body.room
            });
            if(!isbenyuanyser){
              //新角色必然要新添加到本地通讯录
              yield models.Groupuser.create({
                groupuser_user:body.id,
                groupuser_group:benyuan.dataValues.groupid,
                group_classroom:body.room
              });
            }
          }
        break;
      }
      return response.onSuccess(res, {})
    }catch (err){
      console.log(err)
    }
  })
}

//视频
exports.video_render = function (req,res){
  var body=req.query;
  return res.render('goods/video/list', {
    title: '关联视频',
    aly:config.aly
  });
};
exports.video_list = function (req,res){
  var body=req.query;
  var where={};
  if (!body.id){
    return response.onError(res,'goodsid empty')
  };
  co(function*(){
    try{
      var list=yield models.Prdattach.getPrdidAndType({type:body.type,id:body.id});
      if(!list){
        return response.onError(res,'没有数据')
      }else {
        list.forEach( function(node, index) {
          node.index = index+1;
          node.source_attach_path = node.attach_path;
          node.source_prd_pics = node.prd_pics;
          node.attach_path = str.AbsoluteVideoPath(node.attach_path);
          node.prd_pics = str.AbsolutePath(node.prd_pics);
        });
        return response.onSuccess(res, {
          list:list
        })
      }
    }catch (err){
      console.log(err)
    }
  });
};
exports.video_create= function (req,res){
  var body=req.body;
  var prd={
    prdid:body.prdid,
    attachid:body.attachid,
    prd_title:body.prd_title,
    prd_type:body.prd_type,
    prd_auther:body.prd_auther,
    prd_desc:body.prd_desc,
    prd_pics:body.prd_pics,
    prd_content:body.prd_content?body.prd_content:''
  }
  if(body.prdattachid){
    models.Prdattach.update(prd,{where:{prdattachid:body.prdattachid}}).then(function(){
      return response.onSuccess(res,{})
    },function(err){
      return response.onError(res,{message:'err'})
    })
  }else {
    models.Prdattach.create(prd).then(function(){
      return response.onSuccess(res,{})
    },function(err){
      return response.onError(res,{message:'err'})
    })
  }

};
exports.video_update = function (req,res){
  var body=req.body;
  models.Prdattach.destroy({where:{prdattachid:body.id}}).then(function(){
    return response.onSuccess(res,{})
  },function(err){
    return response.onError(res,{message:'err'})
  })
};

//学员导入
exports.import=function(req,res){
  co(function* () {
    try{
      var filename=req.query.filename || '';
      var obj = xlsx.parse(path.join("./admin/public",filename));
      var result={};
      result.list=[];
      if(obj.length>0){
        result.total= obj[0].data.length-2;//总数,-1去掉标题
        if(!result.total){
          return response.onError(res, "没有数据啊");
        }else{
          for(var i=2;i<obj[0].data.length;i++){
            var node=obj[0].data[i];
            //去除首尾空格
            node.forEach(function(x,y){
              node[y]=(node[y]+'').replace(/^\s+|\s+$/g,"")
            });
            //得到一条信息
            var body={
              mpno:node[0] || "",
              name:node[1] || "",
              sex:node[2] || "",
              position:node[3] || "",
              company:node[4] || "",
              area:node[5] || "",
              classroom:node[6] || "",
              goods:node[7] || "",
              email:node[8] || "",
            };
            let pushdata={name:body.name,mpno:body.mpno};
            //获取地区信息
            var area=yield models.Area.findOne({where:{area_city:body.area}});
            if(!area){//如果分院信息有错误直接退出
              pushdata.message='地区信息错误';
              pushdata.ismember='';
              pushdata.isvip='';
              pushdata.code=500;
              result.list.push(pushdata);
              continue;
            }
            //获取分院信息
            var classroom=yield models.Classroom.findOne({where:{classroom_name:body.classroom,classroom_areaid:area.dataValues.areaid}});
            if(!classroom){//如果分院信息有错误直接退出
              pushdata.message='校区信息错误';
              pushdata.ismember='';
              pushdata.isvip='';
              pushdata.code=500;
              result.list.push(pushdata);
              continue;
            }
            //存在获取地区和分校的id
            var areaid=area.dataValues.areaid;
            var classroomid=classroom.dataValues.classroom;
            //获取产品
            var goods=yield models.Goods.findOne({where:{goodsid:body.goods}});
            if(!goods){//如果课程错误直接退出
              pushdata.message='产品信息错误';
              pushdata.ismember='';
              pushdata.isvip='';
              pushdata.code=500;
              result.list.push(pushdata);
              continue;
            }
            if(!/^[1][0-9]{10}$/.test(body.mpno)){
              pushdata.message='手机号码错误';
              pushdata.ismember='';
              pushdata.isvip='';
              pushdata.code=500;
              result.list.push(pushdata);
              continue;
            }
            //确定用户 不存在创建 拿到mid
            var member=yield models.Members.findOne({
              where: {m_phone: body.mpno}
            });
            pushdata.ismember='老会员';
            //如果不存在
            if(!member){
              var m={
                m_name:body.name,
                m_company:body.company,
                m_position:body.position,
                m_phone:body.mpno,
                m_sex:body.sex,
                m_email:body.email,
              };
              if(m.m_name){
                m.m_firstabv=py.makePy(m.m_name);
              }
              member=yield models.Members.create(m);
              pushdata.ismember='新增会员';
            }
            let mid=member.dataValues.mid;
            var userclass=yield models.Userclass.findOne({where:{uc_userphone:body.mpno,uc_goodsid:body.goods}});
            if(userclass){
              pushdata.message='学员已报名';
              pushdata.ismember='';
              pushdata.isvip='';
              pushdata.code=500;
              result.list.push(pushdata);
              continue;
            }
            var goodsgroup=yield models.Group.findOne({where:{group_goodid:body.goods,group_areaid:0,group_classroomid:0,group_type:1}});
            var classroomgroup=yield models.Group.findOne({where:{group_goodid:body.goods,group_areaid:areaid,group_classroomid:classroomid}});
            if (!goodsgroup){//不存在全国通讯录
              goodsgroup=yield models.Group.create({
                groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
                group_owner:config.hx_admin,//群主
                group_name:goods.dataValues.goods_subtitle+'同学录',//群名称
                group_imgurl:config.hx_group_img,//群图片
                group_maxnums:2000,//群最大成员
                group_desc:goods.dataValues.goods_subtitle,//群描述
                group_goodid:body.goods,//产品id
                group_areaid:'0',//地区id
                group_classroomid:'0',//学区id
                group_type:1//全国通讯录
              })
            }
            if (!classroomgroup){//不存在分院通讯录
              yield new Promise(function(resolve,reject){
                hx.createhxgroup({groupname:body.classroom,desc:goods.dataValues.goods_subtitle,maxusers:2000,owner:config.hx_admin},function(err,result){
                  if(!err){
                    resolve(result)
                  }else {
                    reject(err)
                  }
                })
              }).then(function(data){
                var result=(typeof data)=="string"?JSON.parse(data):data;
                var groupid=result.data.groupid;
                return models.Group.create({
                  groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
                  group_owner:config.hx_admin,//群主
                  group_name:body.classroom,//群名称
                  group_imgurl:config.hx_group_img,//群图片
                  group_maxnums:2000,//群最大成员
                  group_desc:goods.dataValues.goods_subtitle,//群描述
                  group_goodid:body.goods,//产品id
                  group_areaid:areaid,//地区id
                  group_classroomid:classroomid,//学区id
                  group_type:3,//聊天室
                  group_hxid:groupid
                })
              }).then(function(data){
                classroomgroup=data
              }).catch(function(err){
                console.log(err)
              })
            }
            //确保了全国群组和地区群组都存在 写事物
            yield new Promise(function (resolve,reject) {
              hx.reghxuser({username:mid},function(err,result){
                resolve(result)
              })
            }).then(function(data){
              return new Promise(function(resolve,reject){
                hx.addhxgroupuser({username:mid,groupid:classroomgroup.dataValues.group_hxid+''},function(err,result){
                  if(!err){
                    resolve(result)
                  }else {
                    reject(err)
                  }
                })
              })
            }).then(function(data){
              if(data){
                models.Groupuser.create({
                  groupuser_user:mid,
                  groupuser_group:goodsgroup.dataValues.groupid
                });
                models.Groupuser.create({
                  groupuser_user:mid,
                  groupuser_group:classroomgroup.dataValues.groupid
                })
                models.Userclass.create({
                  uc_userphone:body.mpno,
                  uc_calssroomid:classroomid,
                  uc_areaid:areaid,
                  uc_status:1,
                  uc_calssroomname:body.classroom,
                  uc_areaname:body.area,
                  uc_goodsid:body.goods,
                  uc_userid:mid
                })
                models.Members.update({m_status:1},{where:{mid:mid}})
              }
            }).then(function () {
              pushdata.isvip='报名成功';
              pushdata.code=200;
              result.list.push(pushdata)
            }).catch(function(err){
              console.log(err)
              pushdata.isvip='报名失败';
              pushdata.code=500;
              result.list.push(pushdata)
            })
          }
          return response.onDataSuccess(res, {data:result});
        }
      }else{
        return response.onError(res, "没有数据啊");
      }
    }catch(err) {
      console.log(err)
    }
  })
};
