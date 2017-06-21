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
  home:function(req,res){
    //获取首页广告
    co(function * (){
      try{
        //广告位置
        var places=yield models.PlacesItem.findAll({
          where:{pi_status:0,pi_stime:{'$lt': moment()},pi_etime:{'$gt': moment()}},
          attributes:['pi_img','pi_type','pi_name','pi_val','p_id'],
          order:[['pi_sort','desc']],
          raw:true
        });
        var placesTop=[]
        var placesRecommend=[]
        places.forEach(function(node,index){
          if(node.pi_img)node.pi_img=str.AbsolutePath(node.pi_img);
          if(node.p_id==0){
            placesTop.push(node)
          }
          if(node.p_id==1){
            placesRecommend.push(node)
          }
        });
        delete places
        //课程回顾
        var classback=yield models.Class.findAll({
          where:{class_end:{'$lt': moment()}},
          attributes:['classid','class_name','class_back_pics','class_img','class_teacher'],
          order:['class_end'],
          raw:true,
          limit:4
        });
        for(var i=0,len=classback.length;i<len;i++){
          var node=classback[i];
          var class_back_pics=node.class_back_pics;
          var class_img=node.class_img;
          node.class_back_pics=class_back_pics?str.AbsolutePath(class_back_pics):str.AbsolutePath(class_img);
          var arr=node.class_teacher.split(',');
          node.teacher=yield models.Members.findAll({
            where:{mid:{'$in':arr}},
            attributes:['m_name','m_desc']
          })
        }
        //精彩瞬间
        var splendid=yield models.Prdattach.getPrdidAndTypeApp({limit:2,offset:0});
        splendid.forEach( function(node, index) {
          node.attach_path=str.AbsoluteVideoPath(node.attach_path);
          node.attach_pics=node.attach_path.replace('.m3u8','.jpg')
        });
        //格局课程
        var course=yield models.Goods.findAll({
          where:{goods_status:1},
          order:[['goods_start']],
          attributes:['goodsid','goods_start','goods_end','goods_img','goods_name','goods_summary'],
          raw:true
        });
        course.forEach( function(node, index) {
          node.goods_start = moment(node.goods_start).locale('zh-cn').format('ll');
          node.goods_end = str.getUnixToTime(node.goods_end);
          node.goods_img=str.AbsolutePath(node.goods_img);
        });
        return response.ApiSuccess(res,{placesTop:placesTop,placesRecommend:placesRecommend,classback:classback,splendid:splendid,course:course})
      }catch (err){
        console.log(err)
        return response.ApiError(res,err.message)
      }
    })
  },
  splendid_video:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    co(function *(){
      try{
        var splendid=yield models.Prdattach.getPrdidAndTypeApp({limit:options.pagesize,offset:options.offset});
        splendid.forEach( function(node, index) {
          node.attach_path=str.AbsoluteVideoPath(node.attach_path);
          node.attach_pics=node.attach_path.replace('.m3u8','.jpg')
        });
        return response.ApiSuccess(res,{data:splendid})
      }catch (err){
        console.log(err)
        return response.ApiError(res,err.message)
      }
    })
  },
  set_attachrecord:function(req,res){
    var body=req.body;
    if(!body.attachid){
      return response.ApiError(res,{message:"attachid error"});
    }
    models.Attach.findOne({
      where:{attachid:body.attachid},
      attributes:['attach_count','attachid']
    }).then(function(item){
      //var count=parseInt(Math.random()*5,10)
      var count=1
      return item.increment({
        'attach_count':count
      })
    }).then(function(i){
      return response.ApiSuccess(res,{});
    }).catch(function(err){
      console.log(err)
      return response.ApiError(res,err.message);
    })
  },
  list:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    var where={goods_status:1};
    var arr=[];
    co(function * (){
      try{
        //获取未开课的课程班
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
        //获取所有课程班
        var goods=yield models.Goods.findAndCountAll({
          where:where,
          order:[['goods_start']],
          attributes:['goodsid','goods_start','goods_end','goods_img','goods_name','goods_summary'],
          limit:options.pagesize,
          offset:options.offset
        });
        //课程班处理格式化
        if(goods){
          var list=goods.rows;
          list.forEach( function(node, index) {
            node.dataValues.goods_start = moment(node.dataValues.goods_start).locale('zh-cn').format('ll');
            node.dataValues.goods_end = str.getUnixToTime(node.dataValues.goods_end);
            node.dataValues.goods_img=str.AbsolutePath(node.dataValues.goods_img);
          });
          return response.ApiSuccess(res,{list:list});
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message});
      }
    })
  },
  goodsrelated_detail:function(req,res){
    var body=req.query;

    if (!body.goodsid) {
      return response.ApiError(res,{message:"goodsid empty"});
    }
    co(function* (){
     try{
        var results = [];
        var item = yield models.Goodsrelated.findgoodsdetail({
          where:{goodsid:body.goodsid}
        });
        if (item) {
            item.forEach( function(node, index) {
                node.related_imgurl=str.AbsolutePath(node.related_imgurl);
                if(node.related_type==10000)
                {
                    results.forEach( function(parentnode, parentindex) {
                      if(parentnode.relatedid==node.related_parent)
                      {
                        results[parentindex].subrelateds.push(node);
                      }
                    });
                }else//非0为根目录
                {
                  results[index] = node;
                  results[index].subrelateds = [];
                } 
             });
          }

        var attachs = yield models.Goods.findgoodsmediaattach({
          where:{goodsid:body.goodsid}
        })
        if (attachs) {
          attachs.forEach( function(node, index) {
              //node.related_imgurl=str.AbsolutePath(node.related_imgurl);
              node.attach_path=str.AbsoluteVideoPath(node.attach_path);
              node.related_imgurl=node.attach_path.replace('.m3u8','.jpg')
            });
        }

         var goods = yield models.Goods.findOne({
          where:{goodsid:body.goodsid},
        });
        var resultgood = {};
         if (goods) {
           resultgood.goodsid=goods.goodsid;
           resultgood.goods_name=goods.goods_name;
            resultgood.goods_summary=goods.goods_summary;
            resultgood.goods_teacher=goods.goods_teacher;
            resultgood.goods_fee=goods.goods_fee;
            resultgood.goods_time=goods.goods_time;
            resultgood.goods_ismore=goods.goods_ismore;
            resultgood.goods_class=goods.goods_class;
            resultgood.goods_type=goods.goods_type;
            resultgood.goods_status=goods.goods_status;
            resultgood.goods_attr=goods.goods_attr;
            resultgood.goods_subtitle=goods.goods_subtitle;

           resultgood.goods_img_small=str.AbsolutePath(goods.goods_img_small);
           resultgood.goods_titleimg=str.AbsolutePath(goods.goods_titleimg);
           resultgood.goods_img=str.AbsolutePath(goods.goods_img);
           resultgood.group_imgurl=str.AbsolutePath(goods.group_imgurl); 
           resultgood.goods_start= moment(goods.goods_start).locale('zh-cn').format('ll');
           //=str.getUnixToTime(goods.goods_start); 
           resultgood.goods_end=str.getUnixToTime(goods.goods_end); 
         }
        return response.ApiSuccess(res,{goodsrelates:results,videoatts:attachs,goods:resultgood});
      }catch(err){
        console.log(err)
        return response.ApiError(res,{message:'get member error'})
      }
   });
  },
  goods_mediaattach:function(req,res){
    var body=req.query;

    if (!body.goodsid) {
      return response.ApiError(res,{message:"goodsid empty"});
    }
   
    models.Goods.findgoodsmediaattach({
      where:{goodsid:body.goodsid}
    }).then(function(item){
      if (item) {
        item.forEach( function(node, index) {
           //node.related_imgurl=str.AbsolutePath(node.related_imgurl);
           node.attach_path=str.AbsoluteVideoPath(node.attach_path);
           node.related_imgurl=node.attach_path.replace('.m3u8','.jpg')
        });
        return response.ApiSuccess(res,{data:item});
      }else {
        return response.ApiSuccess(res,{data:null});
      }
    }, function(err){
        return response.ApiError(res,{message:"get goods detail1 error"});
    });
  },
  goods_detail:function(req,res){
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
          //获取样式
          var style=yield models.Config.findOne({
            where:{key:'style'},
            attributes:['val']
          });
          detail.dataValues.goods_content=style.dataValues.val+detail.dataValues.goods_content;
          var Classes=yield models.Class.findAll({
            where:{class_goodsid:body.goodsid},
            attributes: ['classid','class_goodsid', 'class_start', 'class_name', 'class_teacherid', 'class_qustart','class_end','class_img','class_summary'],
            order:[['class_start']]
          });
          var detail=detail.dataValues;
          detail.goods_start = str.getUnixToTime(detail.goods_start);
          detail.goods_end = str.getUnixToTime(detail.goods_end);
          detail.goods_img=str.AbsolutePath(detail.goods_img);
          var system_time = str.getUnixToTime(moment());
          if(system_time>detail.goods_start){
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
            }
          };
          detail.Classes=Classes;
          return response.ApiSuccess(res,{data:detail})
        }else {
          return response.ApiError(res,{message:'课程班不存在'})
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  goods_classlist:function(req,res){
    var body=req.query;
    if (!body.goodsid) {
      return response.ApiError(res,{message:"goodsid empty"});
    }
    co(function* () {
      try{
        var list1=[]//全部
        var list2=[]//未开始
        var list3=[]//已结束
        var Classes=yield models.Class.findAll({
          where:{class_goodsid:body.goodsid},
          attributes: ['classid','class_goodsid', 'class_start', 'class_name', 'class_teacherid', 'class_qustart','class_end','class_img','class_summary'],
          order:[['class_start','DESC']]
        });
        if (Classes){
          for (var index=0,len=Classes.length;len>index;index++){
            var node=Classes[index].dataValues;
            node.class_start = str.getUnixToTime(node.class_start);
            node.class_end = str.getUnixToTime(node.class_end);
            node.class_qustart = str.getUnixToTime(node.class_qustart);
            node.class_img=str.AbsolutePath(node.class_img);
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
              where:{cou_classid:node.classid,cou_status:0},
              attributes:['couid']
            });
            if (courseware){
              isCourseware=1
            };
            node.isComment = isComment;
            node.isReference = isReference;
            node.isCourseware = isCourseware;
            var report = 0;//0 未开始  1提问 2 3 上课  4 结束
            var system_time=str.getUnixToTime(moment());
            if (system_time <= node.class_qustart) {//未开始
              list2.push(node)
            }
            if (system_time >= node.class_qustart && system_time <= node.class_start) {//提问阶段
              report = 1;
              list2.push(node)
            }
            if (system_time >= node.class_start && system_time <= node.class_end) {//上课阶段
              report = 3;
            }
            if (system_time >= node.class_end) {//结束
              report = 4;
              list3.push(node)
            }
            node.report = report;
          }
          list1=Classes
        };
        list2 = algorithm.quicksort.sortObj(list2, 'class_start', 'asc');
        return response.ApiSuccess(res,{all:list1,unstart:list2,end:list3})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  class_reward:function(req,res){
    var body=req.query;
    if(!body.classid){
      return response.ApiError(res,{message:"classid empty"})
    };
    models.Class.findOne({
      where:{classid:body.classid},
      attributes:['class_rewardstatus']
    }).then(function(item){
      return response.ApiSuccess(res,{data:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:err.message})
    })
  },
  class_detail:function(req,res){
    var body=req.query;
    if (!body.classid) {
      return response.ApiError(res,{message:"classid empty"});
    }
    co(function* (){
      try{
        var detail=yield models.Class.findOne({
          where:{classid:body.classid},
          attributes: ['classid','class_goodsid', 'class_start', 'class_end', 'class_name', 'class_teacherid','class_img','class_content','class_summary','class_qustart','class_teacher','class_back','class_quend'],
        });
        if (detail){
          var detail=detail.dataValues;
          var arr=detail.class_teacher.split(',')
          var theacher=yield models.Members.findAll({
            where:{mid:{'$in':arr}},
            attributes:['m_name','m_pics','m_desc','m_position']
          });
          var attach=yield models.Class.findclassmediaattach({
            where:{classid:body.classid}
          })
          if(attach){
            attach.forEach( function(node, index) {
              node.attach_path=str.AbsoluteVideoPath(node.attach_path);
              node.attach_pics=node.attach_path.replace('.m3u8','.jpg')
            });
          }
          if (theacher){
            theacher.forEach(function(node,i){
              node.dataValues.m_pics=str.AbsolutePath(node.dataValues.m_pics);
            })
          };
          //推荐书目
          var isReference=0
          var reference=yield models.Reference.findOne({
            where:{ref_classid:body.classid},
            attributes:['refid']
          });
          if (reference){
            isReference=1
          };
          //课件
          var isCourseware=0;
          var courseware=yield models.Courseware.findOne({
            where:{cou_classid:body.classid,cou_status:0},
            attributes:['couid']
          });
          if (courseware){
            isCourseware=1
          };
          var isComment=0;
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
          detail.class_quend=str.getUnixToTime(detail.class_quend);
          detail.class_qustart=str.getUnixToTime(detail.class_qustart);
          detail.isComment=isComment;
          detail.isReference = isReference;
          detail.isCourseware = isCourseware;
        }else {
          return response.ApiError(res,{message:'不存此课程'})
        }
        return response.ApiSuccess(res,{data:detail,video:attach})
      }catch (e){
        console.log(e)
        return response.ApiError(res,{message:e.message})
      }
    })
  },
  class_video:function(req,res){
    var body=req.query;
    if (!body.classid) {
      return response.ApiError(res,{message:"classid empty"});
    }
    co(function* (){
      try{
         var attach=yield models.Class.findclassmediaattach({
            where:{classid:body.classid}
          })
        if(attach) {
          attach.forEach(function (node, index) {
            node.attach_path = str.AbsoluteVideoPath(node.attach_path);
            node.attach_pics = node.attach_path.replace('.m3u8', '.jpg')
          });
        }
        return response.ApiSuccess(res,{data:attach})
      }catch (e){
        console.log(e)
        return response.ApiError(res,{message:e.message})
      }
    })
  },
  my_goods:function(req,res){
    var body=req.query;
    if (!body.userid) {
      return response.ApiError(res,{message:"userid empty"});
    }
    co(function*() {
      try{
        var member=yield models.Members.findOne({
          where:{mid:body.userid},
          attributes:['m_type']
        });
        var type=member.dataValues.m_type;
        var map = {},
            dest = [];
            arr = [];
        if(type>=4){//特殊身份处理我的课程
          var isAll=0;
          if(type==10){
            var isAll=1;
          }else {
            var b=yield models.Area.getGropuGoode({userid:body.userid});
            var goodssearcharr=[];
            for(var i=0,len=b.length;i<len;i++){
              if(b[i].group_type==5 || b[i].group_type==6 || b[i].group_type==8){
                isAll=1;
                break;
              }else {
                goodssearcharr.push(b[i].goodsid)
              }
            }
          }
          //获取课程
          if(isAll){
            arr=yield models.Userclass.getMyClassSpecial({});
          }else {
            var goodssearchstr=goodssearcharr.join(',');
            if(goodssearchstr){
              arr=yield models.Userclass.getMyClassSpecial({goodid:'('+goodssearchstr+')'});
            }else {
              arr=[]
            }
          }
        }else {//学员按照我的课程查询我的课程
          arr=yield models.Userclass.getMyClass({userid:body.userid});
        }
        for(var i = 0; i < arr.length; i++){
          var node = arr[i];
          if(!map[node.goodsid]){
            var data={
              goodsid: node.goodsid,
              goods_name: node.goods_name,
              goods_img: node.goods_img,
              goods_start: node.goods_start,
              goods_time: node.goods_time,
              goods_summary: node.goods_summary,
              goods_ismore: node.goods_ismore,
              Classes: []
            }
            if(node.late_null){
              data.Classes=[node]
            }
            dest.push(data);
            map[node.goodsid] = node;
          }else{
            for(var j = 0; j < dest.length; j++){
              var dj = dest[j];
              if(dj.goodsid == node.goodsid){
                dj.Classes.push(node);
                break;
              }
            }
          }
        };
        //处理业务
        dest.forEach(function(item,index){
          if(index>=1){
            item.Classes=[]
          }
          item.goods_start = str.getUnixToTime(item.goods_start);
          item.goods_img = str.AbsolutePath(item.goods_img);
          item.Classes.forEach(function(node,j){
            node.m_pics = str.AbsolutePath(node.m_pics);
            node.class_qustart = str.getUnixToTime(node.class_qustart);
            node.class_asstart = str.getUnixToTime(node.class_asstart);
            node.class_start = str.getUnixToTime(node.class_start);
            node.class_end = str.getUnixToTime(node.class_end);
            node.class_img = str.AbsolutePath(node.class_img);
            var report = 0;//0 未开始  1提问 2 3 上课  4 结束
            var system_time = str.getUnixToTime(moment());
            if (system_time >= node.class_qustart && system_time <= node.class_start) {//提问阶段
              report = 1;
            }
            //if (system_time>=n.class_asstart && system_time<=n.class_start){//课程准备阶段
            //  n.report=2;
            //}合并为课程开始阶段
            if (system_time >= node.class_start && system_time <= node.class_end) {//上课阶段
              report = 3;
              //控制是否在打赏阶段

            }
            if (system_time >= node.class_end) {//结束
              report = 4;
            }
            //if (system_time <= node.class_start) {
            //未开始的才有倒计时
            //var ms = moment(n.class_start, "YYYY-MM-DD HH:mm:ss").diff(moment(system_time, "YYYY-MM-DD HH:mm:ss"));
            //ms=parseInt(ms)/1000;
            ////var d = moment.duration(ms);
            ////var s = Math.floor(d.asHours()) + moment.utc(ms).format(":mm:ss");
            //n.counter = ms
            //}
            node.report = report; //未开始
          })
        });
        return response.ApiSuccess(res, {list: dest});
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  area_list:function(req,res){//TODO
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
        return response.ApiSuccess(res,{list:arr2});
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  put_classvalue:function(req,res){
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
      return response.ApiSuccess(res,{})
    },function(e){
      console.log(e)
      return response.ApiError(res,{message:e.message})
    })
  },
  classvalue_list:function(req,res){
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
          return response.ApiSuccess(res,{list:classvalue,data:classdetail});
        }
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.message})
      }
    });
  },
  classvalue_label:function(req,res){
    models.Valueitem.findAll({
        attributes:['val_name']
    }).then(function(item){
      return response.ApiSuccess(res,{list:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:err.message})
    })
  },
  notifics_list:function(req,res){
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
      return response.ApiSuccess(res,{list:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:err.message})
    })
  },
  notifics_detail:function(req,res){
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
      return response.ApiSuccess(res,{data:item})
    },function(err){
      console.log(err)
      return response.ApiError(res,{message:err.message})
    })
  },
  class_notice:function(req,res){
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
        return response.ApiSuccess(res,{data:data})
      }catch (err){
        console.log(err);
        return response.ApiError(res,{message:err.message})
      }
    })
  },
  get_reference:function(req,res){
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
      return response.ApiSuccess(res,{list:item})
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.message})
    })
  },
  get_courseware:function(req,res){
    //课件
    var body=req.query;
    if(!body.classid){
      return response.ApiError(res,{message:'classid empty'})
    }
    var kejian=[];//1课件 2笔记
    var biji=[];
    models.Courseware.findAll({
      where:{cou_classid:body.classid,cou_status:0},
      attributes:['cou_content','cou_title','cou_path','cou_pics','cou_path_size','cou_note','cou_note_size','createdAt','cou_type'],
      order:[['createdAt','DESC']],
    }).then(function(item){
      if(item){
        item.forEach(function(node,inde){
          var node=node.dataValues;
          node.cou_pics=str.AbsolutePath(node.cou_pics);
          node.cou_path=str.AbsolutePath(node.cou_path);
          node.cou_note=str.AbsolutePath(node.cou_note);
          node.createdAt=str.getUnix(node.createdAt);
          if(node.cou_type==1){
            kejian.push(node)
          }
          if(node.cou_type==2){
            node.cou_path=(node.cou_path)?(node.cou_path):(node.cou_note);
            node.cou_path_size=(node.cou_path_size)?(node.cou_path_size):(node.cou_note_size);
            biji.push(node)
          }
        })
      }
      item=item?item:[];
      return response.ApiSuccess(res,{kejian:kejian,biji:biji})
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.message})
    })
  }
};
module.exports=Class;