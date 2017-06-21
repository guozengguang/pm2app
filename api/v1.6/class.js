var express = require('express');
var router = express.Router();
var models  = require('../../models');
var validator = require('validator');
var algorithm = require('ape-algorithm');
var utils = require('../../utils/page');
var cache = require('../../utils/cache');
var str = require('../../utils/str');
var token = require('../../utils/token');
var response = require('../../utils/response');
var config=require('../../config/config');
var co = require('co');
var moment=require('moment');
var hx = require('../../utils/hxchat');
var _ = require('lodash');
var StringBuilder = require('../../utils/StringBuilder');
var py = require('../../utils/strChineseFirstPY');

var Class={
  home:function(req,res){
    var body=req.query;
    co(function * (){
      try{
        //查询缓存
        var homeCatch=yield new Promise(function(resolve,reject){
          "use strict";
          cache.get('home',function (err,data) {
            if(err){
              reject(err)
              console.log('读取缓存失败')
            }else {
              console.log('读取缓存成功')
              resolve(data)
            }
          })
        });
        if(homeCatch){
          if(body.long && body.lat && body.city && homeCatch.branch) {
            var sql = new StringBuilder();
            sql.AppendFormat("(select (2 * 6378.137* ASIN(SQRT(POW(SIN(PI() * ({1}-classroom_coordinates) / 360), 2)+COS(PI() * {1} / 180)* COS(classroom_coordinates* PI() / 180) * POW(SIN(PI() * ({0}-classroom_longitude) / 360), 2)))) AS " +
                "distance,gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_phone,gj_classroom.classroom_telephone,gj_classroom.classroom_pics,gj_classroom.classroom_name,gj_classroom.classroom_address " +
                "from gj_classroom WHERE gj_classroom.classroom_status=0 ORDER BY distance LIMIT 3) " +
                "UNION ALL " +
                "(select 0 as distance,gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_phone,gj_classroom.classroom_telephone,gj_classroom.classroom_pics,gj_classroom.classroom_name,gj_classroom.classroom_address " +
                "from gj_classroom WHERE gj_classroom.classroom_status=0 AND gj_classroom.classroom_area_city='{2}' LIMIT 0,10)", body.long, body.lat ,body.city);
            branch=yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
            //根据长度，如果大于三条取后面的小于取前面的
            if(branch.length>3){
              branch=branch.slice(3)
            }else {
              branch=branch.slice(0,3)
            }
            branch.forEach(function(node){
              "use strict";
              node.classroom_pics=str.AbsolutePath(node.classroom_pics);
            })
            homeCatch.middle.forEach(function(node){
              if(node.ItemType==5){
                node.branch=branch
              }
            })
          } else {
            var sql = new StringBuilder();
            sql.AppendFormat("select 0 as distance,'一致性' as area_region,gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_phone,gj_classroom.classroom_telephone,gj_classroom.classroom_pics,gj_classroom.classroom_name,gj_classroom.classroom_address " +
                "from gj_classroom WHERE gj_classroom.classroom_status=0 AND gj_classroom.classroom=2 LIMIT 0,1");
            branch=yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
            branch.forEach(function(node){
              "use strict";
              node.classroom_pics=str.AbsolutePath(node.classroom_pics);
            })
            homeCatch.middle.forEach(function(node){
              if(node.ItemType==5){
                node.branch=branch
              }
            })
          }
          delete homeCatch.branch
          return response.ApiSuccess(res,homeCatch)
        }
        //不存在缓存需要查询了
        var branch=false;
        var top={};
        //顶部广告位置和课程预告
        //广告位置
        var ad=yield models.PlacesItem.findAll({
          where:{pi_status:0,p_id:0,pi_stime:{'$lt': moment()},pi_etime:{'$gt': moment()}},
          attributes:['pi_img','pi_type','pi_name','pi_val'],
          order:[['pi_sort','desc']],
          raw:true
        });
        ad.forEach(function(node,index){
          if(node.pi_img)node.pi_img=str.AbsolutePath(node.pi_img);
        });
        //课程预告
        var prophetsql=new StringBuilder();
        prophetsql.AppendFormat("select classid,class_name as title,class_start as time,m_name as name from gj_class as c " +
            "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
            "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) WHERE c.class_start > now() AND gj_goods.goods_status=1 ORDER BY c.class_start DESC");
        var prophet=yield models.sequelize.query(prophetsql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        prophet.forEach(function(node){
          "use strict";
          node.time=str.getUnixToTime(node.time)
        })

        var prophetMap = {},
            prophetDest = [];

        for(var i = 0; i < prophet.length; i++) {
          var node = prophet[i];
          node.time=str.getUnixToTime(node.time)
          if (!prophetMap[node.classid]) {
            prophetDest.push(node);
            prophetMap[node.classid] = 'true';
          } else {
            for (var j = 0; j < prophetDest.length; j++) {
              var dj = prophetDest[j];
              if (dj.classid == node.classid) {
                dj.name = dj.name + '/' + node.name;
                break;
              }
            }
          }
        }

        top.ad=ad;
        top.Item=[{name:'课程'},{name:'活动'},{name:'专辑'}]
        top.prophet=prophetDest;
        //首先确定所需要的模块
        var homeList=yield models.Home.findAll({
          where:{home_status:1},
          attributes:[['home_title','title'],['home_type','ItemType']],
          include:[{
            model:models.HomeItem,
            as:'Item',
            attributes:[['subitem_title','title'],['subitem_key','key'],['subitem_sort','sort']],
            raw:true,
            where:{subitem_status:1},
            required: false
          }],
          order:[
              ['home_sort','DESC'],
              [{ model: models.HomeItem, as: 'Item' },'subitem_sort','DESC']
          ]
        });
        //模块处理
        var middle=yield Promise.all(homeList.map(function(node,index){
          'use strict';
          let sql=new StringBuilder();
          let nodeItem=node.dataValues;
          let type=nodeItem.ItemType;
          let item=nodeItem.Item;
          let arr=[];
          item.map(function(node){
            arr.push(node.dataValues.key)
          });
          let count=arr.length>0?false:true;
          switch (type){
            case 1://课程班  只取第一节课
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select m_name,c.* from (select goodsid,goods_name,goods_img,classid,class_img,class_name,class_start,class_teacher " +
                  "from gj_goods " +
                  "INNER JOIN gj_class ON gj_goods.goodsid=gj_class.class_goodsid " +
                  "where goodsid in ({0}) AND gj_class.class_end < now() ORDER BY gj_class.class_start desc " +
                  "LIMIT 0,3) as c " +
                  "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) ORDER BY c.class_start desc",arr[0]);
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                var map = {},
                    dest = [],
                    goods={};
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  if(!map[node.classid]){
                    node.class_img=str.AbsolutePath(node.class_img);
                    node.class_start=str.getUnixToTime(node.class_start);
                    var Classes={
                        name:node.m_name,
                        title:node.class_name,
                        classid:node.classid,
                        img:node.class_img,
                        time:node.class_start,
                    }
                    dest.push(Classes);
                    map[node.classid] = 'true';
                  }else{
                    for(var j = 0; j < dest.length; j++){
                      var dj = dest[j];
                      if(dj.classid == node.classid){
                        dj.name=dj.name+'/'+node.m_name;
                        break;
                      }
                    }
                  }
                  node.goods_img=str.AbsolutePath(node.goods_img);
                  goods.goodsid=node.goodsid;
                  goods.name=node.goods_name;
                  goods.img=node.goods_img;
                  goods.Classes=dest;
                };
                if(goods.name){
                  nodeItem.Item=[goods]
                }else {
                  nodeItem.Item=[]
                }
                return nodeItem
              });
              break;
            case 2://活动
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select activity_stime as stime,activity_etime as etime,activity_id as id,activity_title as title,activity_img as img,activity_official as official,activity_address as address,activity_link as `link` " +
                  "from gj_activity where activity_id in ({0}) ORDER BY FIELD(activity_id,{0})",arr.join())
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  var newDate=str.getUnixToTime(moment())
                  node.tag=1
                  node.stime=str.getUnixToTime(node.stime)
                  node.etime=str.getUnixToTime(node.etime)
                  node.img=str.AbsolutePath(node.img);
                  if(newDate>node.stime && newDate<node.etime){
                    node.tag=2
                  }else if(newDate>node.etime){
                    node.tag=3
                  }
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 3://专辑
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select special_id as id,special_title as title,special_img as img from gj_special where special_id in ({0}) ORDER BY FIELD(special_id,{0})",arr.join())
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.img=str.AbsolutePath(node.img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 4://讲师
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select mid as id,m_name as name,m_pics as img,m_desc as `desc`,m_position as position,m_title as title " +
                  "from gj_members where mid in ({0}) ORDER BY rand()  LIMIT 0,10",arr.join());
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.img=str.AbsolutePath(node.img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 5://分院
              branch=true;
              sql.AppendFormat("select gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_areaid,area_region,gj_classroom.classroom,gj_classroom.classroom_name,gj_classroom.classroom_area_city,gj_classroom.classroom_pics,gj_area.area_name from gj_area " +
                  "INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid WHERE gj_classroom.classroom_status=0 AND gj_area.area_region <> '' ORDER BY FIELD(area_region,'华东','华北','华中','华南','西南','西北','东北')");
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                var map = {},
                    dest = [];
                for(var i = 0; i < data.length; i++){
                  var node = data[i];

                  node.classroom_pics=str.AbsolutePath(node.classroom_pics);
                  if(!map[node.area_region]){
                    var Area={
                      region:node.area_region,
                      item:[node]
                    }
                    dest.push(Area);
                    map[node.area_region] = 'true';
                  }else{
                    for(var j = 0; j < dest.length; j++){
                      var dj = dest[j];
                      if(dj.region == node.area_region){
                        dj.item.push(node);
                        break;
                      }
                    }
                  }
                };
                nodeItem.Item=dest;
                nodeItem.branch=[];
                return nodeItem
              })
              break;
            case 6://广告
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select pi_img,pi_type,pi_name,pi_val from gj_placesitem " +
                  "where pi_status=0 AND pi_stime < now() AND pi_etime > now() AND pi_id in ({0}) ORDER BY FIELD(pi_id,{0})",arr.join())
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.pi_img=str.AbsolutePath(node.pi_img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 7://精彩视频
              sql.Append("select prdattachid as id,prd_title as tag,prd_auther as title,prd_pics as img from gj_prdattach as prd");
              sql.Append(" INNER JOIN gj_attach as at on at.attachid=prd.attachid");
              sql.AppendFormat(" where prd.prd_type=20");
              sql.AppendFormat(" ORDER BY prd.prd_desc*1 desc");
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.img=str.AbsolutePath(node.img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            default:
              nodeItem.Item=[];
              return nodeItem
          }

        }));
        var result={top:top,middle:middle,branch:branch};
        // 缓存result;
        cache.set('home',result,config.redis.time*0.1,function (err,data) {
          if(err){
            console.log('设置缓存错误')
          }else {
            console.log('设置缓存成功')
          }
        })
        if(body.long && body.lat && body.city && branch) {
           var sql = new StringBuilder();
           sql.AppendFormat("(select (2 * 6378.137* ASIN(SQRT(POW(SIN(PI() * ({1}-classroom_coordinates) / 360), 2)+COS(PI() * {1} / 180)* COS(classroom_coordinates* PI() / 180) * POW(SIN(PI() * ({0}-classroom_longitude) / 360), 2)))) AS " +
               "distance,'一致性' as area_region,gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_phone,gj_classroom.classroom_telephone,gj_classroom.classroom_pics,gj_classroom.classroom_name,gj_classroom.classroom_address " +
               "from gj_classroom WHERE gj_classroom.classroom_status=0 ORDER BY distance LIMIT 3) " +
               "UNION ALL " +
               "(select 0 as distance,'一致性' as area_region,gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_phone,gj_classroom.classroom_telephone,gj_classroom.classroom_pics,gj_classroom.classroom_name,gj_classroom.classroom_address " +
               "from gj_classroom WHERE gj_classroom.classroom_status=0 AND gj_classroom.classroom_area_city='{2}' LIMIT 0,10)", body.long, body.lat ,body.city);
           branch=yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
           //根据长度，如果大于三条取后面的小于取前面的
           if(branch.length>3){
             branch=branch.slice(3)
           }else {
             branch=branch.slice(0,3)
           }
           branch.forEach(function(node){
             "use strict";
             node.classroom_pics=str.AbsolutePath(node.classroom_pics);
           })
          middle.forEach(function(node){
            if(node.ItemType==5){
               node.branch=branch
             }
           })
        }else {
          var sql = new StringBuilder();
          sql.AppendFormat("select 0 as distance,'一致性' as area_region,gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_phone,gj_classroom.classroom_telephone,gj_classroom.classroom_pics,gj_classroom.classroom_name,gj_classroom.classroom_address " +
              "from gj_classroom WHERE gj_classroom.classroom_status=0 AND gj_classroom.classroom=2 LIMIT 0,1");
          branch=yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
          branch.forEach(function(node){
            "use strict";
            node.classroom_pics=str.AbsolutePath(node.classroom_pics);
          })
          middle.forEach(function(node){
            if(node.ItemType==5){
              node.branch=branch
            }
          })
        }
        return response.ApiSuccess(res,{top:top,middle:middle})
      }catch (err){
        console.log(err);
        return response.ApiError(res,err.message)
      }
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
          order:[['goods_start','desc']],
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
              node.related_imgurl=node.prd_pics?str.AbsolutePath(node.prd_pics):node.attach_path.replace('.m3u8','.jpg');
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
           //node.related_imgurl=node.attach_path.replace('.m3u8','.jpg');
           node.related_imgurl=node.prd_pics?str.AbsolutePath(node.prd_pics):node.attach_path.replace('.m3u8','.jpg');
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
    if (!body.goodsid) {
      return response.ApiError(res,{message:"goodsid empty"});
    }
    co(function *() {
      try{
        //获取样式
        var style=yield models.Config.findOne({
          where:{key:'style'},
          attributes:['val'],
          raw:true
        });
        var sql=new StringBuilder();
        sql.AppendFormat("select m_name,goodsid,goods_name,goods_img,goods_content,classid,class_img,class_name,class_start,class_end,class_qustart,class_teacher " +
            "from gj_goods " +
            "LEFT JOIN gj_class ON gj_goods.goodsid=gj_class.class_goodsid " +
            "LEFT JOIN gj_members ON find_in_set(gj_members.mid,gj_class.class_teacher) where goodsid={0} ORDER BY gj_class.class_start desc",body.goodsid);
        models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data) {
          var map = {},
              dest = [],
              goods = {};
          var system_time = str.getUnixToTime(moment());
          for (var i = 0; i < data.length; i++) {
            var node = data[i];
            if (!map[node.classid]) {
              node.class_img = str.AbsolutePath(node.class_img);
              node.class_start = str.getUnixToTime(node.class_start);
              node.class_end = str.getUnixToTime(node.class_end);
              node.class_qustart = str.getUnixToTime(node.class_qustart);
              var report = 0;//0 未开始  1提问 2 3 上课  4 结束
              if (system_time >= node.class_start && system_time <= node.class_end) {//上课阶段
                report = 3;
              }
              if (system_time >= node.class_end) {//结束
                report = 4;
              }
              var Classes = {
                name: node.m_name,
                title: node.class_name,
                classid: node.classid,
                img: node.class_img,
                time: node.class_start,
                report:report
              };
              dest.push(Classes);
              map[node.classid] = 'true';
            } else {
              for (var j = 0; j < dest.length; j++) {
                var dj = dest[j];
                if (dj.classid == node.classid) {
                  dj.name = dj.name + '/' + node.m_name;
                  break;
                }
              }
            }
            node.goods_img = str.AbsolutePath(node.goods_img);
            goods.goodsid = node.goodsid;
            goods.content = style.val+node.goods_content;
            goods.name = node.goods_name;
            goods.img = node.goods_img;
            goods.Classes = (dest.length==1 && dest[0].classid==null)?[]:dest;
          }
          return response.ApiSuccess(res,{detail:goods})
        })
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
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
    co(function *() {
      try{
        var sql=new StringBuilder();
        sql.AppendFormat("select topic_title,topic_id,mid,m_name,m_pics,m_title,class_value_link,m_desc,classid,class_qustatus,class_img,class_content,class_name,class_start,class_end,class_qustart,class_teacher " +
            "from gj_class " +
            "LEFT JOIN gj_topic ON gj_topic.topic_classid=gj_class.classid " +
            "INNER JOIN gj_members ON find_in_set(gj_members.mid,gj_class.class_teacher) where classid={0}",body.classid);
        var detail=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
          if(detail.length==0){
            return response.ApiError(res,{message:'课程不存在'})
          }
          var system_time = str.getUnixToTime(moment()),
              map = {},
              dest = [];
          for (var i = 0; i < detail.length; i++) {
            var node = detail[i];
            node.m_pics=str.AbsolutePath(node.m_pics);
            if(!map[node.classid]){
              node.class_img=str.AbsolutePath(node.class_img);
              node.class_start = str.getUnixToTime(node.class_start);
              node.class_end = str.getUnixToTime(node.class_end);
              var system_time = str.getUnixToTime(moment());
              var report = 0;//0 未开始  1提问 2 3 上课  4 结束
              if (system_time >= node.class_start && system_time <= node.class_end) {//上课阶段
                report = 3;
              }
              if (system_time >= node.class_end) {//结束
                report = 4;
              }
              var D={
                classid:node.classid,
                pics:node.class_img,
                title:node.class_name,
                time:node.class_start,
                content:node.class_content,
                qustatus:node.class_qustatus,
                link:node.class_value_link,
                report:report,
                item:[{mid:node.mid,name:node.m_name,pics:node.m_pics,title:node.m_title,desc:node.m_desc}],
                backList:[]
              }
              if(node.topic_id){
                D.backList.push({id:node.topic_id,title:node.topic_title})
              }
              dest.push(D);
              map[node.classid] = 'true';
            }else{
              for(var j = 0; j < dest.length; j++){
                var dj = dest[j];
                if(dj.classid == node.classid){
                  dj.item.push({mid:node.mid,name:node.m_name,pics:node.m_pics,title:node.m_title,desc:node.m_desc});
                  if(node.topic_id){
                    dj.backList.push({id:node.topic_id,title:node.topic_title});
                  }
                  break;
                }
              }
            }
          }
          var detail=dest[0]
          //处理四个按钮功能
          //提问 推荐书目 课件 评价
          var isComment=0,
              isReference=0,
              isValue=0,
              isCourseware=0,
              isVip=0;
          if(body.userid){//用户权限的判定 1如果是会员判定是否是此课程的  2如果是特护身份直接放行
            var userSql=new StringBuilder();
            userSql.AppendFormat("select m_type as type,gj_class.classid " +
                "from gj_members " +
                "LEFT JOIN gj_userclass ON gj_userclass.uc_userid=gj_members.mid " +
                "LEFT JOIN gj_class ON gj_userclass.uc_goodsid=gj_class.class_goodsid AND classid={1} " +
                "where mid={0}",body.userid,body.classid);
            var userDetail=yield models.sequelize.query(userSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
            for (var i=0,len=userDetail.length;i<len;i++){
              var node=userDetail[i]
              if(node && node.type==0 && node.classid){//付费的课程会员
                if(detail.link){
                  isValue=1;
                }
                isVip=1;
                console.log('会员')
                break;
              }else if(node && node.type>0){//特殊身份
                isVip=1;
                console.log('特殊身份')
                break;
              }else {
                console.log('没有权限')
              }
            }
          }
          if(detail.qustatus>0){
            isComment=1
          }
          var statusSql=new StringBuilder();
          statusSql.AppendFormat("(select '书目' as title from gj_reference where ref_classid={0} limit 0,1) " +
              "union all " +
              "(select '课件' as title from gj_courseware where cou_classid={0} limit 0,1)",body.classid);
          var statusDetail=yield models.sequelize.query(statusSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
          var statusArr=[]
          statusDetail.forEach(function (node) {
            statusArr.push(node.title)
          })
          if (statusArr.indexOf('书目')>-1){
            isReference=1
          };
          if (statusArr.indexOf('课件')>-1){
            isCourseware=1
          };
          detail.isComment=isComment;
          detail.isReference=isReference;
          detail.isValue=isValue;
          detail.isCourseware=isCourseware;
          detail.item=_.uniq(detail.item,'mid')
          detail.backList=_.uniq(detail.backList,'id')
          delete detail.qustatus;
          return response.ApiSuccess(res,{detail:detail})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  topic_detail:function(req,res){
    var body=req.query;
    if (!body.id) {
      return response.ApiError(res,{message:"topic_id empty"});
    }
    co(function *() {
      try{
        //课后回顾的关联type40  则需要在20下面对应的id做操作
        var sql=new StringBuilder();
        sql.Append("select prdattachid as pid,topic_id as id,topic_title as title,topic_content as content,prd_pics as img,attach_duration as duration,attach_path as path,prd_title from gj_topic");
        sql.Append(" LEFT JOIN gj_prdattach as prd on gj_topic.topic_id=prd.prdid AND prd.prd_type=40");
        sql.AppendFormat(" LEFT JOIN gj_attach on gj_attach.attachid=prd.attachid");
        sql.AppendFormat(" where gj_topic.topic_id={0} ORDER BY prd.prd_desc*1 desc",body.id);
        models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (detail) {
          if(detail.length==0){
            return response.ApiError(res,{message:'话题不存在'})
          }
          var map = {},
              dest = [];
          for (var i = 0; i < detail.length; i++) {
            var node = detail[i];
            node.img=node.img?str.AbsolutePath(node.img):'';
            node.path=node.path?str.AbsoluteVideoPath(node.path):'';
            if(!map[node.id]){
              var D={
                id:node.id,
                title:node.title,
                content:node.content,
                item:[],
              }
              if(node.pid){
                D.item.push({img:node.img,durationTime:node.duration,path:node.path,title:node.prd_title})
              }
              dest.push(D);
              map[node.id] = 'true';
            }else{
              for(var j = 0; j < dest.length; j++){
                var dj = dest[j];
                if(dj.id == node.id){
                  if(node.pid){
                    dj.item.push({img:node.img,durationTime:node.duration,path:node.path,title:node.prd_title});
                  }
                  break;
                }
              }
            }
          }
          return response.ApiSuccess(res, {detail: dest[0]})
        })
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  class_prophet:function(req,res){
    var body=req.query;
    var prophetsql=new StringBuilder();
    prophetsql.AppendFormat("select goods_name as title,classid,class_name as subtitle,class_start as time,m_name as name,class_img as img from gj_class as c " +
        "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
        "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) WHERE c.class_start > now() AND gj_goods.goods_status=1 ORDER BY c.class_start");
    models.sequelize.query(prophetsql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
      data.forEach(function(node){
        "use strict";
        node.time=str.getUnixToTime(node.time)
        node.img=str.AbsolutePath(node.img)
      });
      var map = {},
          dest = [];
      for(var i = 0; i < data.length; i++) {
        var node = data[i];
        node.time=str.getUnixToTime(node.time)
        var today=moment(moment(node.time).format('YYYY-MM-DD')).format('X')-moment(moment().format('YYYY-MM-DD')).format('X');
        node.today=parseInt(today/(3600*24));
        node.img=str.AbsolutePath(node.img)
        if (!map[node.classid]) {
          dest.push(node);
          map[node.classid] = 'true';
        } else {
          for (var j = 0; j < dest.length; j++) {
            var dj = dest[j];
            if (dj.classid == node.classid) {
              dj.name = dj.name + '/' + node.name;
              break;
            }
          }
        }
      }
      return response.ApiSuccess(res,{list:dest})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })

  },
  class_back:function(req,res){
    var body=req.query;
    var prophetsql=new StringBuilder();
    prophetsql.AppendFormat("select goods_name as title,classid,class_name as subtitle,class_start as time,m_name as name,class_img as img from gj_class as c " +
        "INNER JOIN gj_goods ON gj_goods.goodsid=c.class_goodsid " +
        "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) WHERE c.class_start < now() AND gj_goods.goods_status=1 ORDER BY c.class_start limit 0,10");
    models.sequelize.query(prophetsql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (data) {
      data.forEach(function(node){
        "use strict";
        node.time=str.getUnixToTime(node.time)
        node.img=str.AbsolutePath(node.img)
      });
      var map = {},
          dest = [];
      for(var i = 0; i < data.length; i++) {
        var node = data[i];
        node.time=str.getUnixToTime(node.time)
        var today=moment(moment(node.time).format('YYYY-MM-DD')).format('X')-moment(moment().format('YYYY-MM-DD')).format('X');
        node.today=parseInt(today/(3600*24));
        node.img=str.AbsolutePath(node.img)
        if (!map[node.classid]) {
          dest.push(node);
          map[node.classid] = 'true';
        } else {
          for (var j = 0; j < dest.length; j++) {
            var dj = dest[j];
            if (dj.classid == node.classid) {
              dj.name = dj.name + '/' + node.name;
              break;
            }
          }
        }
      }
      return response.ApiSuccess(res,{list:dest})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
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
            node.attach_pics=prd_pics?str.AbsolutePath(prd_pics):node.attach_path.replace('.m3u8','.jpg')
            //node.attach_pics = node.attach_path.replace('.m3u8', '.jpg')
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
            console.log(type)
            var b=yield models.branchManage.findAll({
              where:{member:body.userid,status:1},
              attributes:['type','goods'],
              raw:true
            })
            // var b=yield models.Area.getGropuGoode({userid:body.userid});
            var goodssearcharr=[];
            for(var i=0,len=b.length;i<len;i++){
              if(b[i].type==1 || b[i].type==2 || b[i].type==5){
                isAll=1;
                break;
              }else {
                goodssearcharr.push(b[i].goods)
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
    var where={not_type:1,not_stime:{'$lt': moment()},not_etime:{'$gt': moment()}};
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
      return response.ApiSuccess(res,{kejian:kejian,biji:biji,isVip:req.isVip})
    },function(err){
      console.log(err);
      return response.ApiError(res,{message:err.message})
    })
  },
  splendid_video:function(req,res){
    var body=req.query;
    var options=utils.get_page_options(req);
    co(function *(){
      try{
        var splendid=yield models.Prdattach.getPrdidAndTypeApp({limit:options.pagesize,offset:options.offset});
        splendid.forEach( function(node, index) {
          var prd_pics=node.prd_pics;
          node.attach_path=str.AbsoluteVideoPath(node.attach_path);
          node.attach_pics=prd_pics?str.AbsolutePath(prd_pics):node.attach_path.replace('.m3u8','.jpg')
        });
        return response.ApiSuccess(res,{data:splendid})
      }catch (err){
        console.log(err)
        return response.ApiError(res,err.message)
      }
    })
  },
  splendid_detail:function(req,res){
    var body=req.query;
    if(!body.id){
      return response.ApiError(res,{message:"参数缺失"})
    }
    //精彩视频的id一定为20  则需要在20下面对应的id做操作
    var sql=new StringBuilder();
    sql.Append("select prdattachid as id,prd_auther as title,prd_content as content,prd_pics as img,attach_duration as duration,attach_path as path from gj_prdattach as prd");
    sql.Append(" INNER JOIN gj_attach as at on at.attachid=prd.attachid");
    sql.AppendFormat(" where prd.prd_type=20 AND prdattachid={0}",body.id);
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function (item) {
      var data={}
      if(item.length>0){
        data=item[0]
        data.img=str.AbsolutePath(data.img);
        data.path=str.AbsoluteVideoPath(data.path);
      }
      return response.ApiSuccess(res,{detail:data})

    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
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
  get_lecturer:function(req,res){
    var body=req.query;
    var where={m_type:1,m_status:0};
    if(body.mid){
      where.mid=body.mid
    }
    models.Members.findAll({
      raw:true,
      where:where,
      order:[['m_firstabv']],
      attributes:[['m_name','name'],['m_desc','desc'],['m_pics','img'],['m_firstabv','firstabv'],['m_position','position'],['m_title','title']]
    }).then(function (data) {
      data.forEach(function(node,index){
        "use strict";
        node.img=str.AbsolutePath(node.img)
      })
      return response.ApiSuccess(res,{list:data})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  get_branch:function (req,res) {
    var body=req.query;
    co(function *() {
      try{
        var sql=new StringBuilder();
        sql.AppendFormat("select b.classroom,b.classroom_longitude,b.classroom_coordinates,a.area_region,b.classroom_name,b.classroom_telephone,b.classroom_phone,b.classroom_address,b.classroom_pics,b.classroom_firstabv " +
            "from gj_area as a " +
            "INNER JOIN gj_classroom as b ON a.areaid=b.classroom_areaid " +
            "WHERE b.classroom_status=0 ORDER BY classroom_firstabv");
        var data=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
        var dest = [{item:'全国',list:[],head:[]},{item:'华东',list:[],head:[]},{item:'华北',list:[],head:[]},{item:'华中',list:[],head:[]},{item:'华南',list:[],head:[]},{item:'西南',list:[],head:[]},{item:'西北',list:[],head:[]},{item:'东北',list:[],head:[]}];
        for(var i = 0; i < data.length; i++){
          var node = data[i];
          node.classroom_pics=str.AbsolutePath(node.classroom_pics);
          dest[0].list.push(node)
          if(dest[0].head.indexOf(node.classroom_firstabv)==-1){
            dest[0].head.push(node.classroom_firstabv)
          }
          for(var j = 1; j < dest.length; j++){
            var dj = dest[j];
            if(dj.item == node.area_region){
              dj.list.push(node);
              if(dj.head.indexOf(node.classroom_firstabv)==-1){
                dj.head.push(node.classroom_firstabv)
              }
              break;
            }
          }
        };
        //剔除不需要的数组
        for(var i = 0; i < dest.length; i++){
          var dj = dest[i];
          if(dj.list.length == 0){//不符合的条件判断
            for(var j = i; j < dest.length - 1; j++){
              dest[j] = dest[j + 1];
            }
            dest.length--;
            i--;
          }
        }
        //dest  设置缓存
        var branch=[]
        if(body.city){
          var sql = new StringBuilder();
          sql.AppendFormat("select b.classroom,b.classroom_longitude,b.classroom_coordinates,b.classroom_name,b.classroom_telephone,b.classroom_phone,b.classroom_address,b.classroom_pics,b.classroom_firstabv " +
              "from gj_classroom as b WHERE b.classroom_status=0 AND b.classroom_area_city='{0}' ORDER BY b.classroom_firstabv LIMIT 0,10", body.city);
          branch=yield models.sequelize.query(sql.ToString(), {type: models.sequelize.QueryTypes.SELECT});
          for(var i = 0; i < branch.length; i++){
            var node = branch[i];
            node.classroom_pics=str.AbsolutePath(node.classroom_pics);
          };
        }
        return response.ApiSuccess(res,{branch:branch,list:dest})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  branch_list:function (req,res) {
    var body=req.query;
    co(function *() {
      try{
        var sql=new StringBuilder();
        sql.Append("select '为了保持一直' as area_region,b.classroom,b.classroom_longitude,b.classroom_coordinates,b.classroom_name,b.classroom_telephone,b.classroom_phone,b.classroom_address,b.classroom_pics,b.classroom_firstabv from gj_classroom as b WHERE b.classroom_status=0 ");
        if(body.content){
          sql.AppendFormat("AND (classroom_address like '%{0}%' OR classroom_area_city like '%{0}%') ",body.content);
        }
        if(body.order=='createdAt'){
          sql.Append("ORDER BY createdAt desc");
        }else {
          sql.Append("ORDER BY classroom_firstabv");
        }
        var data=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        var firstabv=[];
        for(var i = 0; i < data.length; i++){
          var node = data[i];
          node.classroom_pics=str.AbsolutePath(node.classroom_pics);
          if(firstabv.indexOf(node.classroom_firstabv)==-1){
            firstabv.push(node.classroom_firstabv)
          }
        };
        return response.ApiSuccess(res,{list:data,firstabv:firstabv})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  },
  home_module:function (req,res) {
    var body=req.query;
    if(!body.type){
      return response.ApiError(res,{message:'参数缺失'})
    }
    body.type=(typeof body.type)=='object'?body.type:body.type.split(',')
    co(function *() {
      try{
        var homeList=yield models.Home.findAll({
          where:{home_status:1,home_type:{'$in':body.type}},
          attributes:[['home_title','title'],['home_type','ItemType']],
          include:[{
            model:models.HomeItem,
            as:'Item',
            attributes:[['subitem_title','title'],['subitem_key','key'],['subitem_sort','sort']],
            raw:true,
            where:{subitem_status:1},
            required: false,
          }],
          order:[
            ['home_sort','DESC'],
            [{ model: models.HomeItem, as: 'Item' },'subitem_sort','DESC']
          ]
        });
        //模块处理
        var middle=yield Promise.all(homeList.map(function(node,index){
          'use strict';
          let sql=new StringBuilder();
          let nodeItem=node.dataValues;
          let type=nodeItem.ItemType;
          let item=nodeItem.Item;
          let arr=[];
          item.map(function(node){
            arr.push(node.dataValues.key)
          });
          let count=arr.length>0?false:true;
          switch (type){
            case 1://课程班  只取第一节课
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select m_name,c.* from (select goodsid,goods_name,goods_img,classid,class_img,class_name,class_start,class_teacher " +
                  "from gj_goods " +
                  "INNER JOIN gj_class ON gj_goods.goodsid=gj_class.class_goodsid " +
                  "where goodsid in ({0}) AND gj_class.class_end < now() ORDER BY gj_class.class_start desc " +
                  "LIMIT 0,3) as c " +
                  "INNER JOIN gj_members ON find_in_set(gj_members.mid,c.class_teacher) ORDER BY c.class_start desc",arr[0]);
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                var map = {},
                    dest = [],
                    goods={};
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  if(!map[node.classid]){
                    node.class_img=str.AbsolutePath(node.class_img);
                    node.class_start=str.getUnixToTime(node.class_start);
                    var Classes={
                      name:node.m_name,
                      title:node.class_name,
                      classid:node.classid,
                      img:node.class_img,
                      time:node.class_start,
                    }
                    dest.push(Classes);
                    map[node.classid] = 'true';
                  }else{
                    for(var j = 0; j < dest.length; j++){
                      var dj = dest[j];
                      if(dj.classid == node.classid){
                        dj.name=dj.name+'/'+node.m_name;
                        break;
                      }
                    }
                  }
                  node.goods_img=str.AbsolutePath(node.goods_img);
                  goods.goodsid=node.goodsid;
                  goods.name=node.goods_name;
                  goods.img=node.goods_img;
                  goods.Classes=dest;
                };
                if(goods.name){
                  nodeItem.Item=[goods]
                }else {
                  nodeItem.Item=[]
                }
                return nodeItem
              });
              break;
            case 2://活动
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select activity_stime as stime,activity_etime as etime,activity_id as id,activity_title as title,activity_img as img,activity_official as official,activity_address as address,activity_link as `link` " +
                  "from gj_activity where activity_id in ({0}) ORDER BY FIELD(activity_id,{0})",arr.join())
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  var newDate=str.getUnixToTime(moment())
                  node.tag=1
                  node.stime=str.getUnixToTime(node.stime)
                  node.etime=str.getUnixToTime(node.etime)
                  node.img=str.AbsolutePath(node.img);
                  if(newDate>node.stime && newDate<node.etime){
                    node.tag=2
                  }else if(newDate>node.etime){
                    node.tag=3
                  }
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 3://专辑
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select special_id as id,special_title as title,special_img as img from gj_special where special_id in ({0}) ORDER BY FIELD(special_id,{0})",arr.join())
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.img=str.AbsolutePath(node.img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 4://讲师
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select mid as id,m_name as name,m_pics as img,m_desc as `desc`,m_position as position,m_title as title " +
                  "from gj_members where mid in ({0}) ORDER BY rand()  LIMIT 0,10",arr.join());
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.img=str.AbsolutePath(node.img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 5://分院
              var branch=true;
              sql.AppendFormat("select gj_classroom.classroom_longitude,gj_classroom.classroom_coordinates,gj_classroom.classroom_areaid,area_region,gj_classroom.classroom,gj_classroom.classroom_name,gj_classroom.classroom_area_city,gj_classroom.classroom_pics,gj_area.area_name from gj_area " +
                  "INNER JOIN gj_classroom ON gj_area.areaid=gj_classroom.classroom_areaid WHERE gj_classroom.classroom_status=0 AND gj_area.area_region <> '' ORDER BY FIELD(area_region,'华东','华北','华中','华南','西南','西北','东北')");
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                var map = {},
                    dest = [];
                for(var i = 0; i < data.length; i++){
                  var node = data[i];

                  node.classroom_pics=str.AbsolutePath(node.classroom_pics);
                  if(!map[node.area_region]){
                    var Area={
                      region:node.area_region,
                      item:[node]
                    }
                    dest.push(Area);
                    map[node.area_region] = 'true';
                  }else{
                    for(var j = 0; j < dest.length; j++){
                      var dj = dest[j];
                      if(dj.region == node.area_region){
                        dj.item.push(node);
                        break;
                      }
                    }
                  }
                };
                nodeItem.Item=dest;
                nodeItem.branch=[];
                return nodeItem
              })
              break;
            case 6://广告
              if(count){
                nodeItem.Item=[];
                return nodeItem
              }
              sql.AppendFormat("select pi_img,pi_type,pi_name,pi_val from gj_placesitem " +
                  "where pi_status=0 AND pi_stime < now() AND pi_etime > now() AND pi_id in ({0}) ORDER BY FIELD(pi_id,{0})",arr.join())
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.pi_img=str.AbsolutePath(node.pi_img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
            case 7://精彩视频
              sql.Append("select prdattachid as id,prd_title as tag,prd_auther as title,prd_pics as img from gj_prdattach as prd");
              sql.Append(" INNER JOIN gj_attach as at on at.attachid=prd.attachid");
              sql.AppendFormat(" where prd.prd_type=20");
              sql.AppendFormat(" ORDER BY prd.prd_desc*1 desc");
              return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
                for(var i = 0; i < data.length; i++){
                  var node = data[i];
                  node.img=str.AbsolutePath(node.img);
                };
                nodeItem.Item=data;
                return nodeItem
              });
              break;
          }

        }));
        return response.ApiSuccess(res,{detail:_.uniq(middle,'ItemType')})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })

  },
  branch_detail:function (req,res) {
    var body=req.query;
    if(!body.id){
      return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
      try{
        var detail=yield models.Classroom.findOne({
          where:{classroom:body.id},
          raw:true,
          attributes:[['classroom_name','name'],['classroom_banner','banner'],['classroom_qrcode','qrcode'],
            ['classroom_content','content'],['classroom_address','address'],['classroom_code','code'],
            ['classroom_longitude','longitude'],['classroom_coordinates','coordinates'],['classroom_address_work','addressWork'],
            ['classroom_email','email'],['classroom_telephone','telephone'],['classroom_phone','phone'],
            ['classroom_email_bus','busEmail'],['classroom_telephone_bus','busTelephone'],['classroom_phone_bus','busPhone'],
            ['classroom_email_media','mediaEmail'],['classroom_telephone_media','mediaTelephone'],['classroom_phone_media','mediaPhone']]
        })
        detail.qrcode=str.AbsolutePath(detail.qrcode)
        detail.banner=str.AbsolutePath(detail.banner)
        return response.ApiSuccess(res,{detail:detail || {}})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })

  },
  is_vip:function (req,res,next) {
    var body=req.query
    co(function *() {
      try{
        var isVip=0;
        if(body.userid){//用户权限的判定 1如果是会员判定是否是此课程的  2如果是特护身份直接放行
          var userSql=new StringBuilder();
          userSql.AppendFormat("select m_type as type,gj_class.classid " +
              "from gj_members " +
              "LEFT JOIN gj_userclass ON gj_userclass.uc_userid=gj_members.mid " +
              "LEFT JOIN gj_class ON gj_userclass.uc_goodsid=gj_class.class_goodsid AND classid={1} " +
              "where mid={0}",body.userid,body.classid);
          var userDetail=yield models.sequelize.query(userSql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
          for (var i=0,len=userDetail.length;i<len;i++){
            var node=userDetail[i]
            if(node && node.type==0 && node.classid){//付费的课程会员
              isVip=1;
              console.log('会员')
              break;
            }else if(node && node.type>0){//特殊身份
              isVip=1;
              console.log('特殊身份')
              break;
            }else {
              console.log('没有权限')
            }
          }
          /*userDetail.forEach(function (node,index) {
            if(node && node.type==0 && node.classid){//付费的课程会员
              isVip=1;
              console.log('会员')
            }else if(node && node.type>0){//特殊身份
              isVip=1;
              console.log('特殊身份')
            }else {
              console.log('没有权限')
            }
          })*/
        }
      }catch (err){
        console.log(err)
      }
      req.isVip=isVip
      next()
    })
  },
  goods_web_detail:function(req,res){
    var body=req.query;
    if(!body.id){
      return response.ApiError(res,{message:'参数缺失'})
    }
    models.Goods.findOne({
      where:{goodsid:body.id},
      raw:true,
      attributes:['goods_branch','goods_desc','goods_fee','goods_start']
    }).then(function (item) {
      console.log(1111)
      item.goods_start=str.getUnixToTime(item.goods_start)
      return response.ApiSuccess(res,{detail:item})
    }).catch(function (err) {
      console.log(err)
      return response.ApiError(res,{message:err.toString()})
    })
  },
  branch_web_list:function(req,res){
    var body=req.query;
    co(function *() {
      try{
        var sql=new StringBuilder();
        sql.Append("select a.area_name,b.* from gj_classroom as b " +
            "INNER JOIN gj_area as a ON b.classroom_areaid=a.areaid " +
            "WHERE b.classroom_status=0 ");
        if(body.name){
          sql.AppendFormat("AND classroom_name like '%{0}%' ",body.name);
        }
        if(body.city){
          sql.AppendFormat("AND classroom_area_city like '%{0}%' ",body.city);
        }
        if(body.province){
          sql.AppendFormat("AND area_name like '%{0}%' ",body.province);
        }
        sql.Append("ORDER BY b.createdAt desc");
        var item=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        for(var i = 0; i < item.length; i++){
          var node = item[i];
          node.classroom_pics=str.AbsolutePath(node.classroom_pics);
        };
        return response.ApiSuccess(res,{list:item})
      }catch (err){
        console.log(err)
        return response.ApiError(res,{message:err.toString()})
      }
    })
  }
};
module.exports=Class;