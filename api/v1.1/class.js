var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var algorithm = require('ape-algorithm');
var utils = require('../../utils/page');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');
var moment=require('moment');
var py = require('../../utils/strChineseFirstPY');
var hx = require('../../utils/hxchat');

var Class={
  list:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    var where={goods_status:1};
    var arr=[];
    co(function * (){
      try{
        if(body.type==1){// 获取可以报名的课程
          where.goods_start={'$gt': new Date()}; //小于结束时间 历史
          if(body.userid){
            //说明登陆状态获取的是没有报名过的课程列表
            var my_class=yield models.Userclass.findAll({
              where:{uc_userid:body.userid},
              attributes:['uc_goodsid']
            })
            if(my_class){
              my_class.forEach(function(node,index){
                arr.push(node.dataValues.uc_goodsid)
              })
              where.goodsid={'$ne':arr}
            }
          }
        }
        var goods=yield models.Goods.findAndCountAll({
          where:where,
          order:[['createdAt']],
          attributes:['goodsid','goods_start','goods_end','goods_img','goods_name','goods_summary','goods_subtitle'],
          limit:options.pagesize,
          offset:options.offset
        })
        if(goods){
          var list=goods.rows;
          list.forEach( function(node, index) {
            node.dataValues.goods_start = str.getUnixToTime(node.dataValues.goods_start);
            node.dataValues.goods_end = str.getUnixToTime(node.dataValues.goods_end);
            node.dataValues.goods_img=str.AbsolutePath(node.dataValues.goods_img);
          });
          return response.onListSuccess(res,{list:list});
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:"class_list error"});
      }
    })
  },goods_detail:function(req,res){
    var body=req.query;
    var apply='yes';
    if (!body.goodsid) {
      return response.ApiError(res,{message:"goodsid empty"});
    }
    co(function* () {
      try{
        var detail=yield models.Goods.findOne({
          where:{goodsid:body.goodsid},
          attributes: ['goodsid', 'goods_name', 'goods_content','goods_img', 'goods_start','goods_summary','goods_ismore','goods_subtitle'],
        });
        //获取样式
        var style=yield models.Config.findOne({
          where:{key:'style'},
          attributes:['val']
        });
        detail.dataValues.goods_content=style.dataValues.val+detail.dataValues.goods_content;
        //最近开课的
        var latelys=yield models.Class.findOne({
          where:{class_goodsid:body.goodsid,class_start:{'$gt': new Date()}},
          attributes: ['class_start'],
          order:[['class_start']]
        });
        var lately='';
        if(latelys){
          latelys.dataValues.class_start = str.getUnixToTime(latelys.dataValues.class_start);
          lately=latelys.dataValues.class_start
        }
        if(body.userid){
          //存在用户id
          var userclass=yield models.Userclass.findOne({
            where:{uc_goodsid:body.goodsid,uc_userid:body.userid}
          })
          if(userclass){
            apply='no';
          }
        }
        if (detail) {
          var Classes=yield models.Class.findAll({
            where:{class_goodsid:body.goodsid},
            attributes: ['classid','class_goodsid', 'class_start', 'class_name', 'class_teacherid', 'class_qustart','class_end','class_img','class_summary'],
            order:[['class_start']]
          });
          var detail=detail.dataValues;
          detail.goods_start = str.getUnixToTime(detail.goods_start);
          detail.goods_end = str.getUnixToTime(detail.goods_end);
          detail.goods_img=str.AbsolutePath(detail.goods_img);
          detail.system_time = str.getUnixToTime(moment());
          detail.lately = lately;
          if(detail.system_time>detail.goods_start){
            //开课以后不能报名
            apply='no';
          }
          detail.goods_apply = apply;
          if (Classes){
            for (var index=0,len=Classes.length;len>index;index++){
              var node=Classes[index].dataValues;
              node.class_start = str.getUnixToTime(node.class_start);
              node.class_end = str.getUnixToTime(node.class_end);
              node.class_qustart = str.getUnixToTime(node.class_qustart);
              node.class_img=str.AbsolutePath(node.class_img);
              var te = yield models.Members.findOne({
                where: {mid: node.class_teacherid},
                attributes: ['m_name','m_pics']
              });
              if(te){
                te.dataValues.m_pics = str.AbsolutePath(te.dataValues.m_pics);
              }
              var isComment=0;
              var isReference=0;
              var isCourseware=0;
              if (body.userid){
                var valueclass=yield models.Classvalue.findOne({
                  where:{
                    value_classid:node.classid,
                    value_user:body.userid
                  }
                });
                if(valueclass){
                  isComment=1
                }
              }
              //推荐书目
              var reference=yield models.Reference.findOne({
                where:{ref_classid:node.classid},
                attributes:['refid']
              });
              if (reference){
                isReference=1
              };
              //课件
              var courseware=yield models.Courseware.findOne({
                where:{cou_classid:node.classid},
                attributes:['couid']
              });
              if (courseware){
                isCourseware=1
              };
              var system_time=str.getUnixToTime(moment());
              var report = 0;//0 未开始  1提问 2 3 上课  4 结束
              if (system_time >= node.class_qustart && system_time <= node.class_start) {//提问阶段
                report = 1;
              }
              //if (system_time>=n.class_asstart && system_time<=n.class_start){//课程准备阶段
              //  n.report=2;
              //}合并为课程开始阶段
              if (system_time >= node.class_start && system_time <= node.class_end) {//上课阶段
                report = 3;
              }
              if (system_time >= node.class_end) {//结束
                report = 4;
              }
              node.report = report;
              node.isComment = isComment;
              node.isReference = isReference;
              node.isCourseware = isCourseware;
              node.teacher = te?te:{};
            }
          };
          detail.Classes=Classes;
          return response.onDataSuccess(res,{data:detail})
        }else {
          return response.ApiError(res,{message:'不存在此课程'})
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:'err'})
      }
    })
  },class_reward:function(req,res){
    var body=req.query;
    if(!body.classid){
      return response.ApiError(res,{message:"classid empty"})
    };
    models.Class.findOne({
      where:{classid:body.classid},
      attributes:['class_rewardstatus']
    }).then(function(item){
      return response.onDataSuccess(res,{data:item})
    },function(err){
      console.log(err)
    })
  },class_detail:function(req,res){
    var body=req.query;
    if (!body.classid) {
      return response.ApiError(res,{message:"classid empty"});
    }
    co(function* (){
      try{
        var detail=yield models.Class.findOne({
          where:{classid:body.classid},
          attributes: ['classid','class_goodsid', 'class_start', 'class_end', 'class_name', 'class_teacherid','class_img','class_content','class_summary','class_qustart'],
        });
        if (detail){
          var detail=detail.dataValues;
          var theacher=yield models.Members.findOne({
            where:{mid:detail.class_teacherid},
            attributes:['m_name','m_pics','m_desc']
          });
          if (theacher){
            theacher.dataValues.m_pics=str.AbsolutePath(theacher.dataValues.m_pics);
          };
          //推荐书目
          var reference=yield models.Reference.findAll({
            where:{ref_classid:body.classid},
            attributes:['ref_pics','ref_content','ref_author','ref_title']
          });
          if (reference){
            reference.forEach(function(node,inde){
              node.dataValues.ref_pics=str.AbsolutePath(node.dataValues.ref_pics);
            })
          };
          //课件
          var courseware=yield models.Courseware.findOne({
            where:{cou_classid:body.classid},
            attributes:['cou_content','cou_title','cou_path','cou_pics']
          });
          if (courseware){
            courseware.dataValues.cou_pics=str.AbsolutePath(courseware.dataValues.cou_pics);
            courseware.dataValues.cou_path=str.AbsolutePath(courseware.dataValues.cou_path);
          };
          var isComment=0
          if (body.userid){
            var valueclass=yield models.Classvalue.findOne({
              where:{
                value_classid:body.classid,
                value_user:body.userid
              }
            });
            if(valueclass){
              isComment=1
            }
          }
          var report = 0;//0 未开始  1提问 2 3 上课  4 结束
          if (moment() >= moment(detail.class_qustart) && moment() <= moment(detail.class_start)) {//提问阶段
            report = 1;
          }
          if (moment() >= moment(detail.class_start) && moment() <= moment(detail.class_end)) {//上课阶段
            report = 3;
          }
          if (moment() >= moment(detail.class_end)) {//结束
            report = 4;
          }
          detail.class_img=str.AbsolutePath(detail.class_img);
          detail.report=report;
          detail.theacher=theacher?theacher:[];
          detail.class_start=str.getUnixToTime(detail.class_start);
          detail.class_end=str.getUnixToTime(detail.class_end);
          detail.class_qustart=str.getUnixToTime(detail.class_qustart);
          detail.reference=reference?reference:[];
          detail.courseware=courseware?courseware:{};
          detail.isComment=isComment;
        }else {
          return response.ApiError(res,{message:'不存在课程'})
        }
        return response.onDataSuccess(res,{data:detail})
      }catch (e){
        console.log(e)
        return response.ApiError(res,{message:'classitem_detail error'})
      }
    })
  },my_goods:function(req,res){
    var body=req.query;
    if (!body.userid) {
      return response.ApiError(res,{message:"userid empty"});
    }
    var type=0,content={};
    if  (body.type==1){//历史课程
      type=1
    };
    if  (body.type==0){//进行中
      type=2
    };
    switch (type){
      case 1 :
        content.class_end={'$lt': new Date()}; //小于结束时间 历史
        break;
      case 2 :
        content.class_end={'$gt': new Date()}; // 大于结束时间 进行中
        break;
    }
    var where={};
    if (body.status){
      where.uc_status=body.status;
    }
    where.uc_userid=body.userid;
    var options=utils.get_page_options(req);
    co(function*() {
      try{
      var item=yield models.Userclass.findAndCountAll({
        where: where,
        order: [['createdAt', 'DESC']],
        limit: options.pagesize,
        offset: options.offset,
        attributes: ['uc_status', 'uc_goodsid', 'createdAt'],
        include: [{
          model: models.Goods,
          attributes: ['goodsid', 'goods_name', 'goods_img', 'goods_start','goods_time','goods_summary'],
        }]
      });
      if(item){
        var list = item.rows;
        for (var i = 0; i < list.length; i++) {
          var node = list[i].dataValues;
          node.createdAt = str.getUnixToTime(node.createdAt);
          var system_time = str.getUnixToTime(moment());
          //var mygoodsid = node.uc_goodsid;
          //var percent = '0';
          //var all =  yield models.Class.findAndCountAll({where: {class_goodsid: mygoodsid}});
          //var old =  yield models.Class.findAndCountAll({where: {class_goodsid: mygoodsid, class_end: {'$lt': system_time}}});
          //if (all.count && old.count) {
          //  percent = (old.count / all.count).toFixed(2);
          //}
          if (node.Good) {
            var good = node.Good.dataValues;
            good.goods_start = str.getUnixToTime(good.goods_start);
            good.goods_img = str.AbsolutePath(good.goods_img);
            //var chatroom= yield models.Group.findOne({
            //  where:{group_goodid:good.goodsid,group_type:4},
            //  attributes:['groupid']
            //});
            //good.percent = percent;
            if (node.uc_status==1) {
              content.class_goodsid=good.goodsid;
              var goods_class=yield models.Class.findAndCountAll({
                where: content,
                attributes: ['classid','class_goodsid', 'class_start', 'class_name', 'class_teacherid', 'class_qustart', 'class_asstart', 'class_end'],
              });
              good.Classes=goods_class.rows;
              for (var j = 0,len=good.Classes.length; j <len ; j++) {
                var n = good.Classes[j].dataValues;
                n.class_qustart = str.getUnixToTime(n.class_qustart);
                n.class_asstart = str.getUnixToTime(n.class_asstart);
                n.class_start = str.getUnixToTime(n.class_start);
                n.class_end = str.getUnixToTime(n.class_end);
                //n.class_img = str.AbsolutePath(n.class_img);
                var te = yield models.Members.findOne({
                  where: {mid: n.class_teacherid},
                  attributes: ['m_name','m_pics']
                });
                if(te){
                  te.dataValues.m_pics = str.AbsolutePath(te.dataValues.m_pics);
                }
                n.teacher = te ? te : {};
                //n.chatroom = chatroom ? chatroom : {};
                var report = 0;//0 未开始  1提问 2 3 上课  4 结束
                if (system_time >= n.class_qustart && system_time <= n.class_start) {//提问阶段
                  report = 1;
                }
                //if (system_time>=n.class_asstart && system_time<=n.class_start){//课程准备阶段
                //  n.report=2;
                //}合并为课程开始阶段
                if (system_time >= n.class_start && system_time <= n.class_end) {//上课阶段
                  report = 3;
                  //控制是否在打赏阶段

                }
                if (system_time >= n.class_end) {//结束
                  report = 4;
                }
                if (system_time <= n.class_start) {
                  //未开始的才有倒计时
                  var ms = moment(n.class_start, "YYYY-MM-DD HH:mm:ss").diff(moment(system_time, "YYYY-MM-DD HH:mm:ss"));
                  ms=parseInt(ms)/1000;
                  //var d = moment.duration(ms);
                  //var s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
                  n.counter = ms
                }
                n.report = report; //未开始
              }
              good.Classes = algorithm.quicksort.sortObj(good.Classes, 'class_start', 'asc');
            }else {
              good.Classes=[]
            }
          }
        }
        return response.onListSuccess(res, {list: list});
      }else {
        return response.onListSuccess(res, {list: []});
      }
      }catch (Err){
        console.log(Err)
      }
    })
  },class_progress:function(req,res){
    var body=req.query;
    if(!body.goodsid){
      return response.ApiError(res,{message:"goodsid empty"})
    }
    co(function*(){
      try{
        var all=yield models.Class.findAndCountAll({where:{class_goodsid:body.goodsid}});
        var time=str.getUnixToTime(moment());
        var old=yield models.Class.findAndCountAll({where:{class_goodsid:body.goodsid,class_start:{'$lt':time}}});
        console.log(all.count)
        console.log(old.count)
        var percent='0'
        if (all.count && old.count){
          percent=((old.count/all.count).toFixed(2)*100)+'%';
        }
        return response.onDataSuccess(res,{data:{percent:percent}})
      }catch (err){
        console.log(err)
      }
    })
  },class_register:function(req,res){
    var body=req.body;
    console.log(body)
    if (!body.goodsid || !body.headid || !body.classroomid || !body.userphone) {
      return response.ApiError(res,{message:"goodsid or userphone or headid or classroomid empty"});
    }
    //报名分为用户登陆报名和未登录报名
    var apply_type=body.apply_type?body.apply_type:'no_send';//默认为未登录报名
    //用户的基本信息
    var userinfo={};
    if (body.m_name){
      userinfo.m_name=body.m_name;
      userinfo.m_firstabv=py.makePy(body.m_name);
    }
    if (body.m_company){
      userinfo.m_company=body.m_company;
    }
    if (body.m_position){
      userinfo.m_position=body.m_position;
    }
    co(function* (){
      try{
        var isuserclass=true,userid,myuser;
        if(apply_type=='no_send'){//用户未登陆报名
          if (!body.m_code){//未登陆必传值
            return response.ApiError(res,{message:"code empty"});
          }
          var smscode=yield models.Smscode.findOne({
            where:{smscode:body.m_code,phoneno:body.userphone,createdAt:{'$gt': moment().add('-10','minute').format()}}
          });
          smscode=1
          if (!smscode){//未登陆必传值
            return response.ApiError(res,{message:"验证码错误"});
          }
          var access_token=req.access_token;
          if (access_token) {
            var isvip=yield models.Members.findOne({
              where:{m_phone:body.userphone},
              attributes:['mid']
            });
            if(isvip){//存在用户更新信息
              userid=isvip.dataValues.mid;
              yield models.Members.update(userinfo,{where:{mid:userid}});
              myuser=yield models.Members.findOne({
                where:{m_phone:body.userphone}
              });

              //判断用户是否报名过次课程
              var userclass=yield models.Userclass.findOne({where:{uc_userid:userid,uc_goodsid:body.goodsid}});
              if (userclass){
                isuserclass=false;
              }
            }else {//不存在用户创建用户
              userinfo.m_phone=body.userphone;
              var myuser=yield models.Members.create(userinfo);
              userid=myuser.dataValues.mid;
              //注册通讯用户
              console.log(myuser.dataValues.mid);
              hx.reghxuser({username:userid},function(err,result){
                console.log(err)
                console.log(result)
              });
              //res.setHeader('Set-Cookie',cookie.set_cookie('isSend',body.userphone,{httpOnly:true,path:'/',maxAge:60*60*24*366}));
            }
          }else {
            return response.ApiError(res,{message:"token 验证失败"});
          }
        }else if(apply_type=='yes_send'){//用户登陆报名
          if (!body.userid){//登陆必传值
            return response.ApiError(res,{message:"userid empty"});
          }
          userid=body.userid;
          //判断用户是否在此学区报名过次课程
          var userclass=yield models.Userclass.findOne({where:{uc_userid:userid,uc_goodsid:body.goodsid}});
          if (userclass){
            isuserclass=false;
          }
          //更新用户信息
          yield models.Members.update(userinfo,{where:{mid:userid}});
        }else {
          return response.ApiError(res,{message:"apply error"});
        }
        //获取负责老师信息
        var teuser= yield models.Members.findOne({where:{mid:body.headid},attributes:['m_pics','m_name','m_phone']});
        var count=yield models.Userclass.findAndCountAll({
          where:{uc_calssroomid:body.classroomid}
        })
        if(teuser){
          teuser.dataValues.m_pics=str.AbsolutePath(teuser.dataValues.m_pics);
        }
        if (!userid){//处理莫名异常
          return response.ApiError(res,{message:"userid error"});
          console.log('userid empty');
        }
        if (isuserclass){//未报名报名
          console.log('新报名')
          userclass=yield models.Userclass.create({
            uc_goodsid:body.goodsid,
            uc_userid:userid,
            uc_areaid:body.areaid,
            uc_calssroomid:body.classroomid,
            uc_userphone:body.userphone,
            uc_areaname:body.areaname,
            uc_calssroomname:body.classroomname
          })

        }
        console.log(userclass)
        var create=userclass.dataValues.createdAt;
        create=str.getUnixToTime(create)
        return response.onDataSuccess(res,{data:{teuser:teuser,myuser:myuser,server:count.count,create:create}})
      }catch (e){
        console.log(e);
        return response.ApiError(res,{message:"报名 error"});
      }
    });
  },area_list:function(req,res){//TODO
    var body=req.query;
    var where={};
    co(function* (){
      try{
        var area = yield models.Area.list({});
        var arr=[];
        var arr2=[];
        area.forEach(function(node,index){
          if(arr.indexOf(node.area_name)==-1){
            arr.push(node.area_name)
          }
        });
        arr.forEach(function(i,j){
          arr2[j]={};
          arr2[j].area_name=i;
          arr2[j].classroom=[];
          area.forEach(function(node,index){
            if((node.area_name)==i){
              arr2[j].classroom.push(node)
            }
          })
        });
        return response.onListSuccess(res,{list:arr2});
      }catch (err){
        console.log(err)
      }
    })
  },put_classvalue:function(req,res){
    var body=req.body;
    if(!body.classid){
      return response.ApiError(res,{message:'classid empty'})
    };
    models.Classvalue.create({
      value_classid:body.classid,
      value_user:body.userid,
      value_content:body.content,
      value_votes:body.votes,
      value_label:body.label
    }).then(function(item){
      return response.onDataSuccess(res,{data:''})
    },function(e){
      console.log(e)
      return response.ApiError(res,{message:'error'})
    })
  },classvalue_list:function(req,res){
    co(function*(){
      try{
        var body=req.query;
        if(!body.userid && !body.classid){
          return response.ApiError(res,{message:'userid && classid empty'})
        }
        var options=utils.get_page_options(req);
        var where={};
        if(body.userid)where.value_user=body.userid;
        if(body.classid){
          where.value_classid=body.classid;
          classdetail=yield models.Class.findOne({
            where:{classid:body.classid},
            attributes:['class_name'],
            include: [{
              attributes:['m_pics','m_name'],
              model:models.Members
            }]
          })
        }
        var classvalue=yield models.Classvalue.findAll({
          where:where,
          order:[['createdAt']],
          limit:options.pagesize,
          offset:options.offset,
          attributes:['value_content','value_votes','value_label','createdAt'],
          include: [{
            attributes:['m_pics','m_name'],
            model:models.Members
          }]
        })
        if(classvalue){
          classvalue.forEach(function(node,index){
            node.dataValues.createdAt = str.getUnixToTime(node.dataValues.createdAt);
            node.dataValues.Member.m_pics=str.AbsolutePath(node.dataValues.Member.m_pics);
          })
          return response.onListSuccess(res,{list:classvalue,data:classdetail});
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:'error'})
      }
    });
  },classvalue_label:function(req,res){
    models.Valueitem.findAll({
        attributes:['val_name']
    }).then(function(item){
      return response.onListSuccess(res,{list:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:'error'})
    })
  },notifics_list:function(req,res){
    var options=utils.get_page_options(req);
    var where={not_type:1};
    models.Notifics.findAll({
      where:where,
      order:[['createdAt','DESC']],
      limit:options.pagesize,
      offset:options.offset
    }).then(function(item){
      if(item){
        item.forEach(function(node,index){
          var node=node.dataValues;
          node.createdAt = str.getUnixToTime(node.createdAt);
          node.not_pics=str.AbsolutePath(node.not_pics);
        })
      }
      return response.onListSuccess(res,{list:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:'error'})
    })
  },notifics_detail:function(req,res){
    var body=req.query;
    if(!body.notid){
      return response.ApiError(res,{message:'notid empty'})
    }
    models.Notifics.findOne({
      where:{notid:body.notid},
    }).then(function(item){
      var item=item.dataValues;
      item.createdAt = str.getUnixToTime(item.createdAt);
      item.not_pics=str.AbsolutePath(item.not_pics);
      return response.onDataSuccess(res,{data:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:'error'})
    })
  },class_notice:function(req,res){
    var body=req.query;
    if(!body.mid){
      return response.ApiError(res,{message:'mid empty'})
    }
    co(function*(){
      try{
        //先确定会员报名的课程
        var data={class_name:'',classid:'',class_goodsid:'',type:0};
        var my_goods=yield models.Userclass.findAll({
          where:{uc_userid:body.mid},
          attributes:['uc_goodsid']
        });
        //如果存在讲他的goodsid转为数组
        if(my_goods.length>0){
          var goodsid_arr=[];
          my_goods.forEach(function(node,index){
            goodsid_arr.push(node.dataValues.uc_goodsid)
          });
          if(goodsid_arr){
            my_class=yield models.Class.findOne({
              where:{class_goodsid:{$in:goodsid_arr},class_end:{$gt:moment()}},
              order:['class_end'],
              attributes: ['classid','class_goodsid','class_rewardstatus', 'class_start', 'class_name', 'class_qustart','class_end'],
            });
            var n=my_class.dataValues;
            n.class_qustart = str.getUnixToTime(n.class_qustart);
            n.class_start = str.getUnixToTime(n.class_start);
            n.class_end = str.getUnixToTime(n.class_end);
            var system_time=str.getUnixToTime(moment());
            var report = 0;//0 不做处理  1提问 2 3 上课  5打赏
            if (system_time >= n.class_qustart && system_time <= n.class_start) {//提问阶段
              report = 1;
            }
            if (system_time >= n.class_start && system_time <= n.class_end) {//上课阶段
              report = 3;
            }
            if(n.class_rewardstatus==1){
              report = 5;
            }
            data.class_name=n.class_name;
            data.classid=n.classid;
            data.class_goodsid=n.class_goodsid;
            data.type=report;
          }
        }
        return response.onDataSuccess(res,{data:data})
      }catch (err){
        console.log(err);
        return response.ApiError(res,{message:'err'})
      }
    })
  },get_reference:function(req,res){
    //推荐书目
    var body=req.query;
    if(!body.classid){
      return response.ApiError(res,{message:'classid empty'})
    }
    models.Reference.findAll({
      where:{ref_classid:body.classid},
      attributes:['ref_pics','ref_content','ref_author','ref_title']
    }).then(function(item){
      if(item){
        item.forEach(function(node,inde){
          node.dataValues.ref_pics=str.AbsolutePath(node.dataValues.ref_pics);
        })
      }
      item=item?item:[];
      return response.onListSuccess(res,{list:item})
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:'err'})
    })
  },get_courseware:function(req,res){
    //课件
    var body=req.query;
    if(!body.classid){
      return response.ApiError(res,{message:'classid empty'})
    }
    models.Courseware.findOne({
      where:{cou_classid:body.classid},
      attributes:['cou_content','cou_title','cou_path','cou_pics','cou_path_size','cou_note','cou_note_size','createdAt']
    }).then(function(item){
      if(item){
        item.dataValues.cou_pics=str.AbsolutePath(item.dataValues.cou_pics);
        item.dataValues.cou_path=str.AbsolutePath(item.dataValues.cou_path);
        item.dataValues.cou_note=str.AbsolutePath(item.dataValues.cou_note);
        item.dataValues.createdAt=str.getUnix(item.dataValues.createdAt);
      }
      item=item?item:{};
      return response.onDataSuccess(res,{data:item})
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:'err'})
    })
  }
};
module.exports=Class;