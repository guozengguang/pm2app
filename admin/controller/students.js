"use strict";

var models  = require('../../models');
var config=require('../../config/config');
var moment = require('moment');
var response = require('../../utils/response');
var str = require('../../utils/str');
var utils = require('../../utils/page');
var co = require('co');
var Logs=require("../controller/logs");
var py = require('../../utils/strChineseFirstPY');
var hx = require('../../utils/hxchat');
var _=require('lodash')
var StringBuilder = require('../../utils/StringBuilder');
var database = require('../../database');

exports.AllTea = function (req,res,next){
  models.Members.findAll({
    where:{m_type:1},
    attribute:['mid','m_name','m_phone']
  }).then(function(item){
    req.teacher=item?item:[];
    next()
  }, function(err){
    console.log(err)
  });
};
exports.AllBadge = function (req,res,next){
  models.badgeItem.findAll({}).then(function(item){
    req.tag=item?item:[];
    next()
  }, function(err){
    console.log(err)
  });
};
//学员 0
exports.vip_render = function (req, res) {
  return res.render('students/vip/vip_list', {
    title: '学员列表',
    aly:config.aly
  });
};
exports.vip_add = function(req,res){
  return res.render('students/vip/vip_add',{
    title:'添加学员'
  })
};
exports.vip_edit = function(req,res){
  var body=req.query;
  models.Members.findOne({
    where:{mid:body.mid,m_type:0},
    raw:true
  }).then(function(item){
    if (item){
      return res.render('students/vip/vip_edit',{
        title:'修改学员信息',
        item:item,
        aly:config.aly
      })
    }
  },function(err){
    console.log(err)
  })
};
exports.vip_enterprise = function(req,res){
  var body=req.query
  var sql=new StringBuilder();
  sql.AppendFormat("SELECT * FROM gj_enterprise_member as em " +
      "INNER JOIN gj_enterprise as e ON e.id=em.enterprise " +
      "WHERE member={0}",body.mid)
  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (item) {
    var item=item.length>0?item[0]:{}
    item.pics=str.AbsolutePath(item.pics)
    item.logo=str.AbsolutePath(item.logo)
    item.subscription=str.AbsolutePath(item.subscription)
    item.productPics=str.AbsolutePath(item.productPics)
    return res.render('students/vip/vip_enterprise',{
      title:'学员企业',
      item:item,
      mid:body.mid,
      turnover:database.turnover,
      scale:database.lnasset,
      trade:database.trade
    })
  }).catch(function (err) {
    console.log(err)
    return response.onError(res,{messsage:err.toString()})
  })
};
/**
 * 更新企业信息
 * @param body
 * @param id
 * @returns {*}
 */
var enterpriseUpdate = (body,id) => {
  "use strict";
  return models.Enterprise.update(body,{where:{id:id}})
};
/**
 * 新建企业
 * @param body
 * @param id
 * @returns {*}
 */
var enterpriseCreate = (body,id) => {
  "use strict";
  return models.Enterprise.create(body).then(function (data) {
    return models.EnterpriseMember.create({member:id,enterprise:data.dataValues.id})
  })
};
exports.vip_enterprise_update = function (req,res) {
  var body=req.body;
  var id=body.id;
  var member=body.member;
  delete body.id
  delete body.member
  co(function *() {
    try{
      if(id){//更新信息
        yield enterpriseUpdate(body,id)
      }else {//新建企业
        yield enterpriseCreate(body,member)
      }
      return response.onSuccess(res,{})
    }catch (err){
      console.log(err)
      return response.onError(res,{message:err.toString()})
    }
  })
}
//讲师 1
exports.lecturer_render = function (req, res) {
  return res.render('students/lecturer/lecturer_list', {
    title: '讲师列表',
    aly:config.aly
  });
};
exports.lecturer_add = function(req,res){
  return res.render('students/lecturer/lecturer_add',{
    title:'添加讲师'
  })
};
exports.lecturer_edit = function(req,res){
  var body=req.query;
  models.Members.findOne({
    where:{mid:body.mid,m_type:1},
    raw:true
  }).then(function(item){
    if (item){
      return res.render('students/lecturer/lecturer_edit',{
        title:'修改讲师信息',
        item:item,
        aly:config.aly
      })
    }
  },function(err){
    console.log(err)
  })
};
//系统 2
exports.system_render = function (req, res) {
  return res.render('students/system/system_list', {
    title: '系统列表',
    aly:config.aly
  });
};
exports.system_add = function(req,res){
  return res.render('students/system/system_add',{
    title:'添加系统用户'
  })
};
exports.system_edit = function(req,res){
  var body=req.query;
  models.Members.findOne({
    where:{mid:body.mid,m_type:2},
    raw:true
  }).then(function(item){
    console.log(item)
    if (item){
      return res.render('students/system/system_edit',{
        title:'修改系统用户信息',
        item:item,
        aly:config.aly
      })
    }
  },function(err){
    console.log(err)
  })
};
//业务员 3
exports.sales_render = function (req, res) {
  return res.render('students/sales/sales_list', {
    title: '招生老师列表',
    aly:config.aly
  });
};
exports.sales_add = function(req,res){
  return res.render('students/sales/sales_add',{
    title:'添加招生老师',
    classroom:req.Classroom
  })
};
exports.sales_edit = function(req,res){
  var body=req.query;
  var sql=new StringBuilder();
  sql.AppendFormat("select * from gj_members as m " +
      "INNER JOIN gj_sales as s ON m.mid=s.sales_members " +
      "INNER JOIN gj_classroom as c ON c.classroom=s.sales_classroom " +
      "where m.m_type=3 AND m.mid={0} ",body.mid);
  var branch=req.Branch;
  if(branch){
    sql.AppendFormat("AND s.sales_classroom={0}",branch)
  }

  models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
    if (item[0]){
      return res.render('students/sales/sales_edit',{
        title:'修改招生老师信息',
        item:item[0],
        aly:config.aly,
        classroom:req.Classroom
      })
    }else {
      return res.send('数据不存在')
    }
  }).catch(function(err){
    console.log(err)
  })
};
//院办 4
exports.council_render = function (req, res) {
  return res.render('students/council/council_list', {
    title: '院办列表',
    aly:config.aly
  });
};
exports.council_add = function(req,res){
  return res.render('students/council/council_add',{
    title:'添加院办'
  })
};
exports.council_edit = function(req,res){
  var body=req.query;
  models.Members.findOne({
    where:{mid:body.mid,m_type:4},
    raw:true
  }).then(function(item){
    if (item){
      return res.render('students/council/council_edit',{
        title:'修改院办信息',
        item:item,
        aly:config.aly
      })
    }
  },function(err){
    console.log(err)
  })
};
//员工 10
exports.staff_render = function (req, res) {
  return res.render('students/staff/staff_list', {
    title: '员工列表',
  });
};
exports.staff_add = function(req,res){
  return res.render('students/staff/staff_add',{
    title:'添加员工',
    level:database.level
  })
};
exports.staff_edit = function(req,res){
  var body=req.query;
  models.Members.findOne({
    where:{mid:body.mid,m_type:10},
    raw:true
  }).then(function(item){
    if (item){
      return res.render('students/staff/staff_edit',{
        title:'修改员工信息',
        item:item,
        aly:config.aly,
        level:database.level
      })
    }
  },function(err){
    console.log(err)
  })
};
//三个事件
exports.students_list = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  if (body.m_phone){
    where.m_phone={'$like': '%'+body.m_phone+'%'}
  };
  if (body.m_name){
    where.m_name={'$like': '%'+body.m_name+'%'}
  };
  if(body.type){
    where.m_type={'$in':body.type.split(',')}
  }
  if(body.stime){
    where.createdAt={'$gt':body.stime}
  }
  if(body.etime ){
    _.merge(where,{createdAt:{
      '$lt':body.etime
    }})
  }
  //为报名查询单条留用的条件
  if (body.phone){
    where.m_phone=body.phone
  };
  co(function * (){
    try{
      if(body.goods){
        var sql=new StringBuilder();
        var midArr=[]
        sql.AppendFormat("select b.related_fkey as mid from gj_goodsrelated as a INNER JOIN gj_goodsrelated as b ON a.relatedid=b.related_parent WHERE a.related_goodid={0} AND a.related_type=2",body.goods);
        var arr=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
          return Promise.all(item.map(function(node,index){
            midArr.push(node.mid)
          }))
        })
        if(midArr.length>0){
          _.merge(where,{mid:{
            '$notIn':midArr
          }})
        }
      }
      if(body.type==3){
        var sqlSales=new StringBuilder();
        var sqlSalesCount=new StringBuilder();
        var branch=req.Branch;
        sqlSales.Append("select * from gj_members as m " +
            "INNER JOIN gj_sales as s ON m.mid=s.sales_members " +
            "INNER JOIN gj_classroom as c ON c.classroom=s.sales_classroom " +
            "where m.m_type=3 ");
        sqlSalesCount.Append("select count(*) as count from gj_members as m " +
            "INNER JOIN gj_sales as s ON m.mid=s.sales_members " +
            "INNER JOIN gj_classroom as c ON c.classroom=s.sales_classroom " +
            "where m.m_type=3 ");
        if(body.sales_classroom){
          sqlSales.AppendFormat("AND s.sales_classroom={0} ",body.sales_classroom);
          sqlSalesCount.AppendFormat("AND s.sales_classroom={0} ",body.sales_classroom);
        }
        if(branch){
          sqlSales.AppendFormat("AND s.sales_classroom={0} ",branch);
          sqlSalesCount.AppendFormat("AND s.sales_classroom={0} ",branch);
        }
        if(body.m_phone){
          sqlSales.AppendFormat("AND m.m_phone LIKE '%{0}%' ",body.m_phone);
          sqlSalesCount.AppendFormat("AND m.m_phone LIKE '%{0}%' ",body.m_phone);
        }
        if(body.m_name){
          sqlSales.AppendFormat("AND m.m_name LIKE '%{0}%' ",body.m_name);
          sqlSalesCount.AppendFormat("AND m.m_name LIKE '%{0}%' ",body.m_name);
        }
        sqlSales.AppendFormat("ORDER BY m.createdAt DESC LIMIT {0},{1}",options.offset,options.pagesize);
        var list=yield models.sequelize.query(sqlSales.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
        var count=yield models.sequelize.query(sqlSalesCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        list.forEach( function(node, index) {
          node.index = options.offset + index + 1
        });
        return response.onSuccess(res, {
          list:list,
          pagecount: Math.ceil(count[0].count / options.pagesize)
        })
      }
      models.Members.findAndCountAll({
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
    }catch (err){
      console.log(err)
    }
  })
};
exports.students_create = function (req, res) {
  var body=req.body;
  var m_classroom=body.m_classroom
  var sales_password=body.sales_password
  delete body.m_classroom
  delete body.sales_password
  if(!body.m_phone){
    return response.onError(res,{message:'错误操作'})
  }
  models.Members.findOne({
    where:{m_phone:body.m_phone}
  }).then(function(item){
    if (item){
      return response.onError(res,{message:'用户存在'})
    }else {
      if (body.m_name){
        body.m_firstabv=py.makePy(body.m_name);
      }
      models.Members.create(body).then(function(item){
        var mid=item.dataValues.mid;
        if(m_classroom){
          models.Sales.create({sales_classroom:m_classroom,sales_members:mid,sales_password:sales_password})
        }
         hx.reghxuser({username:mid},function(err,result){
          console.log(err)
          console.log(result)
         });
        Logs.logsSave({
          lg_content: "新建用户【"+body.m_phone+"】",
          lg_ip: req.ip,
          uid:req.session.user.uid
        });
        return response.onSuccess(res, {message:'创建成功'})
      },function(err){
        console.log(err)
      })
    }
  },function(err){
    console.log(err)
  });
};
exports.students_update = function (req,res) {
  var body=req.body;
  var mid=body.mid;
  var m_phone=body.m_phone;
  var sales_password=body.sales_password
  if (body.m_name){
    body.m_firstabv=py.makePy(body.m_name);
  }
  delete body.mid;
  delete body.m_phone;
  delete body.sales_password;
  if(sales_password){
    models.Sales.update({sales_password:sales_password},{where:{sales_members:mid}})
  }
  models.Members.update(body,{where:{mid:mid}}).then(function(){
    Logs.logsSave({
      lg_content: "修改用户【"+body.m_phone+"】",
      lg_ip: req.ip,
      uid:req.session.user.uid
    });
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
  });
};


exports.feedback = function (req, res) {
  return res.render('students/feedback', {
    title: '学员反馈',
  });
};
exports.feedback_ajax = function (req, res) {
  var options=utils.cms_get_page_options(req);
  var body=req.query;
  var where={};
  models.Feedback.findAll({
    where:where,
    order:[['createdAt', 'DESC']],
    limit:options.pagesize,
    offset:options.offset,
    include:[{
      model:models.FeedbackAttach,
      as:'img',
      attributes:['feedback_img']
    },{
      model:models.Members,
      attributes:['m_name','m_position']
    }]
  }).then(function(list){
    list.forEach(function(n,i){
      n.dataValues.createdAt=str.getUnixToTime(n.dataValues.createdAt)
      n.dataValues.updatedAt=str.getUnixToTime(n.dataValues.updatedAt)
      n.dataValues.index = options.offset + i + 1
      if(n.dataValues.img){
        var img=n.dataValues.img
        img.forEach(function(node,index){
          node.feedback_img=str.AbsolutePath(node.feedback_img)
        })
      }
    });
    models.Feedback.count().then(function(data){
      return response.onSuccess(res, {
        list:list,
        pagecount: Math.ceil(data / options.pagesize)
      })
    })
  }, function(err){
    console.log(err)
    return response.onError(res,{message:"del_feedback error"});
  })
};
exports.feedback_update = function (req, res) {
  var body=req.body;
  if(!body.feedbackid){
    return response.onError(res,{message:"update_feedback error"});
  }
  models.Feedback.update({feedback_reply:body.feedback_reply,feedback_replystatus:1},{where:{feedbackid:body.feedbackid}}).then(function(item){
    return response.onSuccess(res, {message:'操作成功'});
  }, function(err){
    console.log(err)
    return response.onError(res,{message:"del_feedback error"});
  })
};
exports.students_wechat = function(req,res){
  var body=req.query;
  var mid=body.mid;
  co(function*(){
    try{
      var v=yield models.Config.findOne({where:{key:'wechat'}});
      var n=yield models.Config.findOne({where:{key:'wechat_web'}});
      var members=yield models.Members.findOne({where:{mid:mid}});
      var wechat=v.dataValues.val+'?mid='+mid;
      var wechat_web=n.dataValues.val+'?mid='+mid;
      console.log(members)
      return res.render('students/wechat', {
        title: '打赏',
        wechat:wechat,
        wechat_web:wechat_web,
        member:members?members:[],
        aly:config.aly
      });
    }catch (err){
      console.log(err)
    }
  })
};
exports.get_qrcode = function (req,res){

  var body=req.query;
  var url=body.url;
  var id=body.id;
  var size=body.size?body.size:10;
  var type=body.type?body.type:'png';
  if(!(type=="png" || type=="jpg")){
    type="png"
  }
  size=parseInt(size);
  var  qr_image = require( 'qr-image' );
  console.log(url+'&id='+id)
  var qrcode=qr_image.image(url,{ type: type, ec_level: 'H', size: size, margin: 0 })
  res.type(type);
  qrcode.pipe(res);
}