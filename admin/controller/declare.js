var models  = require('../../models');
var config=require('../../config/config')
var response = require('../../utils/response');
var utils = require('../../utils/page');
var Str = require('../../utils/str');
var co = require('co');
var Logs=require("../controller/logs");
var xlsx = require('node-xlsx');
var path=require('path');
var moment=require('moment');
var _=require('lodash');
var StringBuilder = require('../../utils/StringBuilder');
var py = require('../../utils/strChineseFirstPY');
var hx = require('../../utils/hxchat');
var sql=new StringBuilder();

var declare={
  all_pos:function(req,res,next){
    var sql=new StringBuilder();
    sql.AppendFormat("select cl.classroom,cl.classroom_name,pos.ecp_posid from gj_classroom as cl INNER JOIN gj_enroll_crpos as pos ON pos.ecp_classroomid=cl.classroom");
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
      req.pos=item?item:[];
      next()
    },function(err){
      console.log(err)
    })
  },
  all_content:function(req,res,next){
    var database = require('../../database');
    var where={};
    var body=req.body || req.query;
    //获取身份权限
    body.classroom=req.session.user.user_branch
    if(body.classroom){
      where.classroom=body.classroom
    }
    models.Classroom.findAll({
      raw:true,
      attributes:['classroom_name','classroom'],
      where:where
    }).then(function(item){
      req.classroom=item?item:[];
      req.education=database.education;
      req.lnasset=database.lnasset;
      req.trade=database.trade;
      next()
    }).catch(function(err){
      console.log(err)
      return response.ApiError(res,{message:'错误'})
    })
  },
  all_goods:function(req,res,next){
    models.Goods.findAll({
      raw:true,
      attributes:['goods_name','goodsid','goods_fee'],
    }).then(function(item){
      req.goods=item?item:[];
      next()
    }).catch(function(err){
      console.log(err)
      return response.ApiError(res,{message:'错误'})
    })
  },
  swipe:function(req,res){
    return res.render('declare/swipe', {
      title: 'pos总院',
      goods:req.goods
    });
  },
  branch_swipe:function(req,res){
    return res.render('declare/swipe_branch', {
      title: 'pos分院',
      goods:req.goods
    });
  },
  transfer:function(req,res){
    return res.render('declare/transfer', {
      title: '转账总院',
      goods:req.goods
    });
  },
  branch_transfer:function(req,res){
    return res.render('declare/transfer_branch', {
      title: '转账分院',
      goods:req.goods
    });
  },
  transfer_add:function(req,res){
    return res.render('declare/transfer_add', {
      title: '新增转账记录',
      classroom:req.classroom,
    });
  },
  transfer_edit:function(req,res){
    var body=req.query;
    var classroom=req.session.user.user_branch
    if(!classroom){
      return res.send('非法操作')
    }
    models.EnrollStatement.findOne({where:{statement_id:body.id,statement_documents_form:1,statement_classroomid:classroom},raw:true}).then(function(item){
      if(!item){
        return res.send('不存在')
      }
      item.statement_payment_data=Str.getUnixToTime(item.statement_payment_data)
      if(item.statement_pics){
        item.statement_pics=item.statement_pics.split(',')
      }
      return res.render('declare/transfer_edit', {
        title: '修改转账记录',
        item:item,
        classroom:req.classroom,
      });
    }).catch(function(err){
      console.log(err)
    })
  },
  transfer_create:function(req,res){
    var body=req.body;
    body.statement_money=body.statement_money_remaining;
    models.EnrollStatement.create(body).then(function(item){
      return response.onSuccess(res,{})
    }).catch(function(err){
      console.log(err)
    })
  },
  transfer_update:function(req,res){
    var body=req.body;
    var mid=body.statement_id;
    body.statement_money=body.statement_money_remaining;
    models.EnrollStatement.update(body,{where:{statement_id:mid,statement_status:{'$in':[1,2]}}}).then(function(item){
      console.log(item)
      return response.onSuccess(res,{})
    }).catch(function(err){
      console.log(err)
    })
  },
  financial_one:function(req,res){
    var body=req.query;
    var where={};
    models.EnrollStatement.findById(body.id).then(function(item){
      return response.onSuccess(res, {data:item})
    }).catch(function(err){
      console.log(err)
    })
  },
  financial_branch_list:function(req,res){
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    var branch=req.session.user.user_branch;
    var where1={
      statement_documents_type:{'$in':[0,1]},
      statement_documents_form:body.form
    };
    var where2={
      statement_documents_type:{'$in':[2]},
      statement_documents_form:body.form
    };
    if(branch){
      where1.statement_classroomid=branch;
      where2.statement_classroomid=branch;
    }
    if(body.sTime){
      if(body.form==0){
        _.merge(where1,{statement_trade_data:{"$gte":moment(body.sTime).format('YYYY-MM-DD')}})
      }
      if(body.form==1){
        _.merge(where1,{statement_payment_data:{"$gte":moment(body.sTime).format('YYYY-MM-DD')}})
      }
    }
    if(body.eTime){
      if(body.form==0){
        _.merge(where1,{statement_trade_data:{"$lt":moment(body.eTime).add(1,'days').format('YYYY-MM-DD')}})
      }
      if(body.form==1){
        _.merge(where1,{statement_payment_data:{"$lte":moment(body.eTime).add(1,'days').format('YYYY-MM-DD')}})
      }
    }
    co(function*(){
      try{
        var typeArr=[];
        var childlist=[];
        var list=yield models.EnrollStatement.findAndCountAll({
          where:where1,
          raw:true,
          order:[['createdAt','desc']],
          limit:options.pagesize,
          offset:options.offset
        });
        list.rows.forEach(function(n,i){
          n.statement_payment_data=Str.getUnixToTime(n.statement_payment_data);
          n.index=options.offset + i + 1;
          if(n.statement_pics){
            n.statement_pics=n.statement_pics.split(',');
          }
          if(n.statement_documents_type==1){
            typeArr.push(n.statement_id)
          }
        });
        if(typeArr.length>0){
          var childlist=yield models.EnrollStatement.findAll({
            where:where2,
            raw:true
          });
        }
        list.rows.forEach(function(k){
          k.children=[]
          childlist.forEach(function(v){
            if(k.statement_id==v.statement_complicated){
              v.statement_payment_data=Str.getUnixToTime(v.statement_payment_data)
              if(v.statement_pics){
                v.statement_pics=v.statement_pics.split(',');
              }
              k.children.push(v)
            }
          })
        });
        yield Promise.all(list.rows.map(function(item){
          var sql=new StringBuilder();
          sql.AppendFormat("select * from gj_enroll_user_class as uc INNER JOIN gj_enroll_statement as st ON uc.en_cid=st.statement_id INNER JOIN gj_members as m ON m.mid=uc.en_mid INNER JOIN gj_goods as goods ON goods.goodsid=uc.en_goodsid where uc.en_cid={0}",item.statement_id);
          return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
            item.m=data
          });
        }))
        return response.onSuccess(res, {
          list:list.rows,
          pagecount: Math.ceil(list.count / options.pagesize),
        })
      }catch (err){
        console.log(err)
      }
    })
  },
  financial_list:function(req,res){
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    var where={
      statement_documents_type:{'$in':[0,1]},
      statement_documents_form:body.form
    };
    // if(body.sTime){
    //   _.merge(where,{statement_trade_data:{"$gt":body.sTime}})
    // }
    // if(body.eTime){
    //   _.merge(where,{statement_trade_data:{"$lt":body.eTime}})
    // }
    if(body.sTime){
      if(body.form==0){
        _.merge(where,{statement_trade_data:{"$gte":moment(body.sTime).format('YYYY-MM-DD')}})
      }
      if(body.form==1){
        _.merge(where,{statement_payment_data:{"$gte":moment(body.sTime).format('YYYY-MM-DD')}})
      }
    }
    if(body.eTime){
      if(body.form==0){
        _.merge(where,{statement_trade_data:{"$lt":moment(body.eTime).add(1,'days').format('YYYY-MM-DD')}})
      }
      if(body.form==1){
        _.merge(where,{statement_payment_data:{"$lte":moment(body.eTime).add(1,'days').format('YYYY-MM-DD')}})
      }
    }
    co(function*(){
      try{
        var typeArr=[];
        var childlist=[];
        var list=yield models.EnrollStatement.findAndCountAll({
          where:where,
          raw:true,
          order:[['createdAt','desc']],
          limit:options.pagesize,
          offset:options.offset
        });
        list.rows.forEach(function(n,i){
          n.statement_payment_data=Str.getUnixToTime(n.statement_payment_data);
          n.index=options.offset + i + 1;
          if(n.statement_pics){
            n.statement_pics=n.statement_pics.split(',');
          }
          if(n.statement_documents_type==1){
            typeArr.push(n.statement_id)
          }
        });
        if(typeArr.length>0){
          var childlist=yield models.EnrollStatement.findAll({
            where:{
              statement_documents_type:{'$in':[2]},
              statement_documents_form:body.form
            },
            raw:true
          });
        }
        list.rows.forEach(function(k){
          k.children=[]
          childlist.forEach(function(v){
            if(k.statement_id==v.statement_complicated){
              v.statement_payment_data=Str.getUnixToTime(v.statement_payment_data)
              if(v.statement_pics){
                v.statement_pics=v.statement_pics.split(',');
              }
              k.children.push(v)
            }
          })
        });
        yield Promise.all(list.rows.map(function(item){
          var sql=new StringBuilder();
          sql.AppendFormat("select * from gj_enroll_user_class as uc INNER JOIN gj_enroll_statement as st ON uc.en_cid=st.statement_id INNER JOIN gj_members as m ON m.mid=uc.en_mid INNER JOIN gj_goods as goods ON goods.goodsid=uc.en_goodsid where uc.en_cid={0}",item.statement_id);
          return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
            item.m=data
          });
        }))
        return response.onSuccess(res, {
          list:list.rows,
          pagecount: Math.ceil(list.count / options.pagesize)
        })
      }catch (err){
        console.log(err)
      }
    })
  },
  import:function(req,res){
  co(function* () {
    var pos=req.pos;
    var filename=req.body.filename || '';
    var obj = xlsx.parse(path.join("./admin/public",filename));
    var result={};
    result.list=[];
    if(obj.length>0){
      result.total= obj[0].data.length-1;//总数,-1去掉标题
      if(!result.total){
        return response.onError(res, "没有数据");
      }else{
        for(var i=1,len=obj[0].data.length;i<len;i++){
          var node=obj[0].data[i];
          var ab=false;
          //去除首尾空格
          node.forEach(function(x,y){
            node[y]=(node[y]+'').replace(/^\s+|\s+$/g,"")
          });
          //得到一条信息重构
          var ecp={}
          for(var j=0,len2=pos.length;j<len2;j++){
            ecp=pos[j]
            if(node[3]==ecp.ecp_posid){
              ab=ecp;
              break;
            }
          }
          var pushdata={number:node[7]};
          if(ab){
              var body={
                a:node[0] || "",//清算日期
                b:moment(new Date(1900, 0, node[1]-1)).format('YYYY-MM-DD').toString() || "",//交易日期
                c:moment(new Date(1900, 0, node[2]-1,0,0,parseFloat('0.'+node[2].toString().split('.')[1])*24*3600)).format('YYYY-MM-DD HH:mm:ss').toString() || "",//交易时间
                d:node[3] || "",//终端号
                e:node[4] || "",//交易金额
                f:node[5] || "",//清算金额
                g:node[6] || "",//手续费
                h:node[7] || "",//参考号
                u:node[8] || "",//卡号
                j:node[9] || "",//流水号
                k:node[10] || "",//交易类型
                l:node[11] || "",//卡类别
                m:node[12] || "",//发卡行
                n:ecp.classroom || "",//分院id
                o:ecp.classroom_name || "",//分院姓名
              };
              var enrollstatement=yield models.EnrollStatement.findOne({
                where:{
                  statement_serial_number:body.j,
                  statement_terminal:body.d,
                  statement_reference_number:body.h,
                }
              });
              if(!enrollstatement){
                yield models.EnrollStatement.create({
                  statement_account :body.u,//付款账号
                  statement_money:body.e,//付款金额
                  statement_money_remaining:body.e,//剩余金额
                  statement_closing_money:body.f,//清算金额
                  statement_commission:body.g,    //手续费
                  statement_reference_number:body.h,    //参考号
                  statement_serial_number:body.j,    //流水号
                  statement_type:body.k,    //交易类型
                  statement_card_type:body.l,    //卡类型
                  statement_issuing_bank:body.m,    //发卡行
                  statement_terminal: body.d,    //终端号
                  statement_closing_data:body.a,    //清算日期
                  statement_trade_data:body.b,    //交易日期
                  statement_trade_time:body.c,    //交易时间
                  statement_classroomid:body.n,    //分院id
                  statement_classroomname:body.o,    //分院姓名
                })
                pushdata.code=200;
                pushdata.message='导入成功';
                result.list.push(pushdata);
              }else {
                pushdata.code=500;
                pushdata.message='导入失败 && 存在';
                result.list.push(pushdata);
              }

          }else {
            pushdata.code=500;
            pushdata.message='导入失败 && pos未关联';
            result.list.push(pushdata);
          }

        }
        return response.onDataSuccess(res, {data:result});
      }
    }else{
      return response.onError(res, "没有数据啊");
    }
  }).catch(function(err){
    console.log(err);
    return response.onError(res, "错误");
  })
},
  classroom_pos:function(req,res){
    models.Classroom.findAll({
      raw:true,
      attributes:['classroom','classroom_name']
    }).then(function(item){
      return res.render('declare/classroom_pos', {
        title: '财务',
        item:item
      });
    }).catch(function(err){
      console.log(err)
    })
  },
  classroom_pos_list:function(req,res){
    var body=req.query;
    var sql=new StringBuilder();
    sql.AppendFormat("select crp.ecp_id,crp.ecp_posid,cl.classroom_name,crp.ecp_classroomid from gj_enroll_crpos as crp INNER JOIN gj_classroom as cl ON crp.ecp_classroomid=cl.classroom");
    models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(item){
      return response.onSuccess(res,{list:item})
    }).catch(function(err){
      console.log(err)
      return response.onError(res,'错误')
    })
  },
  classroom_pos_create:function(req,res){
    var body=req.body;
    models.EnrollClassroomPos.upsert(body,{validate:true}).then(function(item){
      if(item){
        return response.onSuccess(res,{message:'添加成功'})
      }else {
        return response.onSuccess(res,{message:'修改成功'})
      }
    }).catch(function(err){
      console.log(err)
      return response.ApiError(res,{message:err.message})
    })
  },
  classroom_pos_update:function(req,res){
    var body=req.body;
    models.EnrollClassroomPos.destroy({where:{ecp_id:body.id}}).then(function(){
      return response.onSuccess(res,{message:'成功'})
    }).catch(function(err){
      console.log(err)
      return response.onError(res,'错误')
    })
  },
  financial_merge:function(req,res){
    var body=req.body;
    var classroom=req.session.user.user_branch;
    if(!classroom){
      return response.onError(res,{message:'总院无权合单'})
    }
    co(function *(){
      try{
        models.sequelize.transaction(function (t) {
          var b=null;
          return models.EnrollUserClass.findOne({
            where:{en_cid:{'$in':body.arr}}
          },{transaction: t}).then(function(item) {
            if (item) {
              throw new Error('存在关联')
            }
            return models.EnrollStatement.all({
              where: {
                statement_id: {'$in': body.arr},
                statement_documents_type: 0
              }, attributes: ['statement_id', 'statement_classroomid', 'statement_classroomname','statement_documents_form'], raw: true
            }, {transaction: t})
          }).then(function(statement){
            if(_.uniq(statement, 'statement_classroomid').length>1){
              throw new Error('多个分院不能合单')
            }
            b=statement[0]
            return models.EnrollStatement.sum('statement_money_remaining',{
                where:{statement_id:{'$in':body.arr},statement_documents_type:0}
              },{transaction: t})
          }).then(function(money){
            return models.EnrollStatement.create({
              statement_money_remaining: money,
              statement_money: money,
              statement_documents_type: 1,
              statement_classroomid:b.statement_classroomid,
              statement_classroomname:b.statement_classroomname,
              statement_documents_form:b.statement_documents_form,
              statement_trade_data:(moment(new Date()).format('YYYY-MM-DD')).toString(),
            }, {transaction: t});
          }).then(function (e) {
            return models.EnrollStatement.update({
              statement_documents_type:2,
              statement_complicated:e.dataValues.statement_id,
            },{
              where:{
                statement_id:{'$in':body.arr}
              }
            }, {transaction: t});
          });

        }).then(function (data) {
          return response.onSuccess(res,{})
        }).catch(function (err) {
          console.log(err.toString())
          return response.onError(res,{message:'合单错误'})
        });
      }catch(err){
        console.log(err.toString())
        return response.onError(res,{message:err.toString()})
      }
    })
  },
  financial_unmerge:function(req,res){
    var body=req.body;
    var classroom=req.session.user.user_branch;
    if(!classroom){
      return response.onError(res,{message:'总院无权拆分'})
    }
    models.sequelize.transaction(function (t) {

      return models.EnrollUserClass.findOne({
        where:{en_cid:body.id}
      },{transaction: t}).then(function(item){
      if(item){
        throw new Error('存在关联')
      }
      //为查看是否关联学员预留
      return models.EnrollStatement.destroy({where:{
          statement_id:body.id,
          statement_documents_type:1}
        },{transaction: t})
      }).then(function () {
        return models.EnrollStatement.update({
          statement_documents_type:0,
          statement_complicated:0,
        },{
          where:{
            statement_complicated:body.id
          }
        }, {transaction: t});
      });

    }).then(function (data) {
      return response.onSuccess(res,{})
    }).catch(function (err) {
      console.log(err)
      return response.onError(res,'错误')
    });
  },
  financial_member:function(req,res){
    return res.render('declare/member', {
      title: '学员列表',
      classroom:req.classroom
    });
  },
  financial_member_ajax:function(req,res){
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    // var where={m_type:0}
    body.classroom=req.session.user.user_branch;
    co(function *(){
      try{
        var sqlMember=new StringBuilder();
        sqlMember.Append("SELECT * FROM gj_members as m " +
            "LEFT JOIN gj_enroll_user_class as uc ON m.mid=uc.en_mid WHERE m_type=0 AND (uc.en_mid is not null OR m_status=0) ")
        var sqlMemberCount=new StringBuilder();
        sqlMemberCount.Append("SELECT count(*) as count FROM (SELECT mid FROM gj_members as m " +
            "LEFT JOIN gj_enroll_user_class as uc ON m.mid=uc.en_mid WHERE m_type=0 AND (uc.en_mid is not null OR m_status=0) ")
        if(body.classroom){
          sqlMember.AppendFormat("AND uc.en_classroomid={0} ",body.classroom);
          sqlMemberCount.AppendFormat("AND uc.en_classroomid={0} ",body.classroom);
        }
        if(body.m_name){
          sqlMember.AppendFormat("AND m.m_name LIKE '%{0}%' ",body.m_name);
          sqlMemberCount.AppendFormat("AND m.m_name LIKE '%{0}%' ",body.m_name);
        }
        if(body.m_phone){
          sqlMember.AppendFormat("AND m.m_phone LIKE '%{0}%' ",body.m_phone);
          sqlMemberCount.AppendFormat("AND m.m_phone LIKE '%{0}%' ",body.m_phone);
        }
        sqlMember.Append("GROUP BY mid ORDER BY m.createdAt DESC ")
        sqlMemberCount.Append("GROUP BY mid) as c")
        sqlMember.AppendFormat("LIMIT {0},{1}",options.offset,options.pagesize);
        var member=yield models.sequelize.query(sqlMember.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        var count=yield models.sequelize.query(sqlMemberCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        member.forEach(function(node,index){
          node.index = options.offset + index + 1;
        })
        return response.onSuccess(res,{
          list:member,
          pagecount: Math.ceil(count[0].count / options.pagesize),
        })
      }catch (err){
        console.log(err)
      }
    })

    // var classWhere={}
    // if(body.classroom){
    //   classWhere.en_classroomid=body.classroom
    // }
    // var arr=[{
    //   model:models.EnrollUserClass,
    //   where:classWhere
    // }]
    // if(body.m_name){
    //   where.m_name={"$like":'%'+body.m_name+'%'}
    // }
    // if(body.m_phone){
    //   where.m_phone=body.m_phone;
    //   arr=[]
    // }
    // models.Members.findAndCountAll({
    //   where:where,
    //   raw:true,
    //   order:[['createdAt','DESC']],
    //   limit:options.pagesize,
    //   offset:options.offset,
    //   include:arr,
    //   group: 'mid'
    // }).then(function(item){
    //   var list=item.rows
    //   var count=item.count
    //   list.forEach(function(node,index){
    //     node.index = options.offset + index + 1;
    //   })
    //   return response.onSuccess(res,{
    //     list:list,
    //     pagecount: Math.ceil(count / options.pagesize),
    //
    //   })
    // }).catch (function(err){
    //   console.log(err)
    //   return response.onError(res,{message:'获取信息错误'})
    // })
  },
  financial_member_class_ajax:function(req,res){
    var options=utils.cms_get_page_options(req);
    var body=req.query;
    body.classroom=req.session.user.user_branch;
    co(function *(){
      try {
        var sqlMember=new StringBuilder();
        sqlMember.Append("SELECT * FROM gj_members as m " +
            "LEFT JOIN gj_enroll_user_class as uc ON m.mid=uc.en_mid WHERE m_type=0 AND (uc.en_mid is not null OR m_status=0) ")
        var sqlMemberCount=new StringBuilder();
        sqlMemberCount.Append("SELECT count(*) as count FROM (SELECT mid FROM gj_members as m " +
            "LEFT JOIN gj_enroll_user_class as uc ON m.mid=uc.en_mid WHERE m_type=0 AND (uc.en_mid is not null OR m_status=0) ")
        if(body.classroom){
          sqlMember.AppendFormat("AND uc.en_classroomid={0} ",body.classroom);
          sqlMemberCount.AppendFormat("AND uc.en_classroomid={0} ",body.classroom);
        }
        if(body.m_name){
          sqlMember.AppendFormat("AND m.m_name LIKE '%{0}%' ",body.m_name);
          sqlMemberCount.AppendFormat("AND m.m_name LIKE '%{0}%' ",body.m_name);
        }
        if(body.m_phone){
          sqlMember.AppendFormat("AND m.m_phone LIKE '%{0}%' ",body.m_phone);
          sqlMemberCount.AppendFormat("AND m.m_phone LIKE '%{0}%' ",body.m_phone);
        }
        sqlMember.Append("GROUP BY mid ORDER BY m.createdAt DESC ")
        sqlMemberCount.Append("GROUP BY mid) as c")
        sqlMember.AppendFormat("LIMIT {0},{1}",options.offset,options.pagesize);
        var member=yield models.sequelize.query(sqlMember.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
        var count=yield models.sequelize.query(sqlMemberCount.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
        yield Promise.all(member.map(function(node,index){
          var sql=new StringBuilder();
          sql.AppendFormat("select room.classroom_name,goods.goods_name,goods.goods_fee,uc.en_type,uc.en_status,uc.en_uid,uc.createdAt,uc.en_cid,uc.en_fee from gj_enroll_user_class as uc " +
              "INNER JOIN gj_classroom as room ON uc.en_classroomid=room.classroom " +
              "INNER JOIN gj_goods as goods ON uc.en_goodsid=goods.goodsid " +
              "where uc.en_form=0 and uc.en_mid={0}",node.mid);
          return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(data){
            node.index = options.offset + index + 1;
            node.classroom = body.classroom;
            data.map(function(n){
              "use strict";
              n.createdAt=Str.getUnixToTime(n.createdAt)
            });
            node.m=data;
            return node
          });
        })).then(function(data){
          return response.onSuccess(res,{
            list:data,
            pagecount: Math.ceil(count[0].count / options.pagesize)
          })
        })

      }catch (err){
          console.log(err)
      }
    })
  },
  financial_member_add:function(req,res){
    return res.render('declare/member_add', {
      title: '添加用户',
      classroom:req.classroom,
      education:req.education,
      lnasset:req.lnasset,
      trade:req.trade,
      aly:config.aly
    });
  },
  financial_member_edit:function(req,res){
    var body=req.query;
    var classroom=req.session.user.user_branch;
    var where={mid:body.mid}
    models.Members.findOne({where:where,raw:true}).then(function(item){
      if(!item){
        return res.send('不存在')
      }
      item.m_birthday=item.m_birthday=='Invalid Date'?'':Str.getUnixToTime(item.m_birthday);
      return res.render('declare/member_edit', {
        title: '修改用户信息',
        classroom:req.classroom,
        education:req.education,
        lnasset:req.lnasset,
        trade:req.trade,
        item:item,
        aly:config.aly
      });
    }).catch(function(err){
      console.log(err)
    })
  },
  financial_member_create:function(req,res){
    var body=req.body;
    body.classroom=req.session.user.user_branch;
    if(!body.m_phone){
      return response.onError(res,{message:'错误操作'})
    }
    models.Members.findOne({
      where:{m_phone:body.m_phone}
    }).then(function (item) {
      if(item){
        throw new Error('学员存在')
      }else {
        if (body.m_name){
          body.m_firstabv=py.makePy(body.m_name);
        }
        return models.Members.create(body)
      }
    }).then(function(data){
      var mid=data.dataValues.mid
      if(body.classroom){
        models.EnrollUserClass.create({
          en_mid:mid,//用户ID
          en_form:0,// 来源 0分院导入 1活动报名 2.....
          en_classroomid:body.classroom ,// 分院id
        })
      }
      hx.reghxuser({username:mid},function(err,result){
        console.log(err)
        console.log(result)
      });
      return response.onSuccess(res,{})
    }).catch(function(err){
      "use strict";
      console.log(err.toString())
      return response.onError(res,{message:err.toString()})
    })
  },
  financial_member_update:function(req,res){
    var body=req.body;
    var mid=body.mid;
    if (body.m_name){
      body.m_firstabv=py.makePy(body.m_name);
    }
    models.Members.update(body,{where:{mid:mid}}).then(function(){
      return response.onSuccess(res,{})
    }).catch(function(err){
      console.log(err)
    })
  },
  financial_associated:function(req,res){
    var body=req.body,
        mid=body.mid,//学员id
        fid=body.financialId,//单号ID确定次单号的余额
        goods=body.goods,//课程班ID确定次课程的需要金额
        classroom=req.session.user.user_branch,
        cost=body.fee,
        validate=false;
    if(!classroom){
      return response.onError(res,{message:'总院无权限分配'})
    }
    models.sequelize.transaction(function (t) {
      return models.EnrollUserClass.findOne({
        where:{en_mid:mid,en_goodsid:goods,en_cid:{"$ne":0}},raw:true
      },{transaction: t}).then(function (data) {
        if(data){
          throw new Error('该学员已关联')
        }
        return models.EnrollUserClass.findOne({
          where:{en_mid:mid,en_goodsid:goods},raw:true
        },{transaction: t})
      }).then(function (data) {
        if(data){
          validate=true
        }
        return models.Goods.findOne({where:{
          goodsid:goods
        },attributes:['goods_fee'],raw:true} ,{transaction: t})
      }).then(function(goods){
        return models.EnrollStatement.findOne({where:{
          statement_id:fid
        },attributes:['statement_money_remaining','statement_id','statement_documents_form']},{transaction: t})
      }).then(function(statement){
        if(!cost){
          throw new Error('课程金额错误');
        }
        var balance=statement.dataValues.statement_money_remaining-cost;
        if(balance<0){
          throw new Error('余额不足');
        }
        return statement.decrement({
          'statement_money_remaining':cost
        }, {transaction: t});
      }).then(function (nowstatement) {
        if(validate){
          return models.EnrollUserClass.update({
            en_cid:fid,//账单ID
            en_form:0,// 来源 0分院导入 1活动报名 2.....
            en_classroomid:classroom ,// 分院id
            en_type:nowstatement.dataValues.statement_documents_form,
            en_fee:cost
          },{where:{
            en_mid:mid,//用户ID
            en_goodsid:goods,//课程ID
          }}, {transaction: t});
        }else {
          return models.EnrollUserClass.create({
            en_mid:mid,//用户ID
            en_cid:fid,//账单ID
            en_goodsid:goods,//课程ID
            en_form:0,// 来源 0分院导入 1活动报名 2.....
            en_classroomid:classroom ,// 分院id
            en_type:nowstatement.dataValues.statement_documents_form,
            en_fee:cost
          }, {transaction: t});
        }
      })

    }).then(function (data) {
      return response.onSuccess(res,{})
    }).catch(function (err) {
      console.log(err)
      return response.onError(res,{message:err.message || err.toString()})
    });
  },
  financial_unassociated:function(req,res){
    var body=req.body;
    var enroll=null;
    var cost=0;
    var classroom=req.session.user.user_branch;
    if(!classroom){
      return response.onError(res,{message:'总院无权拆分'})
    }
    models.sequelize.transaction(function (t) {
      return models.EnrollUserClass.findOne({where:{
        en_uid:body.id,
        en_status:{'$in':[0,2]}
      },raw:true} ,{transaction: t}).then(function(enrollClass){
        if (!enrollClass){
          throw new Error('已通过')
        }
        enroll=enrollClass;
        cost=enroll.en_fee;
        return models.EnrollStatement.findOne({where:{
          statement_id:enroll.en_cid
        }},{transaction: t})
      }).then(function(statement){
        return statement.increment({
          'statement_money_remaining':cost
        }, {transaction: t});
      }).then(function () {//解除账单的关联和费用的冗余
        return models.EnrollUserClass.update({en_cid:0,en_fee:0},{where:{en_uid:body.id}}, {transaction: t});
      })

    }).then(function (data) {
      return response.onSuccess(res,{})
    }).catch(function (err) {
      console.log(err)
      return response.onError(res,{message:err.message || err.toString()})
    });
  },
  user_class_update:function(req,res){//TODO
    var body=req.body;
    var classroom=req.session.user.user_branch
    if(classroom>0){
      return res.send('非法操作')
    }
    if(body.status==2){//代表拒绝
      models.EnrollUserClass.findOne({where:{en_uid:body.id}}).then(function(item){
        if(!item){
          throw new Error('不存在了')
        }
        return item.update({en_status:body.status})
      }).then(function(item){
        return models.EnrollFeedback.create({feedback_feky:body.id,feedback_content:body.content})
      }).then(function(){

        return response.onSuccess(res,{})
      }).catch(function(err){
        console.log(err)
        return response.onError(res,{})
      })
    }
    if(body.status==1){//代表成功
      co(function *(){
        try{
          var sql=new StringBuilder();
          sql.AppendFormat("SELECT * FROM gj_enroll_user_class as uc " +
              "INNER JOIN gj_classroom as city ON uc.en_classroomid=city.classroom " +
              "INNER JOIN gj_members as member ON uc.en_mid=member.mid " +
              "INNER JOIN gj_goods as goods ON goods.goodsid=uc.en_goodsid " +
              "WHERE uc.en_uid={0}",body.id);
          var classInfo=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
          if(!classInfo[0]){
            return response.onError(res,{message:'不存在'})
          }
          var baseInfo=classInfo[0];
          //学员导入到正式库 学员报名 群设置
          var m={
            m_name:baseInfo.n_name,
            m_company:baseInfo.m_company,
            m_position:baseInfo.m_position,
            m_phone:baseInfo.m_phone,
            m_sex:baseInfo.m_sex,
            m_email:baseInfo.m_email,
            m_pics:baseInfo.m_pics,
            m_status:1
          };
          if(m.m_name){
            m.m_firstabv=py.makePy(m.m_name);
          }
          var userclass=yield models.Userclass.findOne({where:{uc_userphone:baseInfo.en_telephone,uc_goodsid:baseInfo.en_goodsid}});
          if(userclass){
            return response.onError(res,{message:'学员已经报名'})
          }
          var member=yield models.Members.findOrCreate({where:{m_phone: baseInfo.en_telephone},defaults:m})
          var mid=member[0].dataValues.mid;
          //全国通讯录
          var goodsgroup=yield models.Group.findOne({where:{group_goodid:baseInfo.en_goodsid,group_areaid:0,group_classroomid:0,group_type:1},raw:true,attributes:["groupid","group_hxid"]});
          //本院通讯录
          var classroomgroup=yield models.Group.findOne({where:{group_goodid:baseInfo.en_goodsid,group_areaid:baseInfo.classroom_areaid,group_classroomid:baseInfo.en_classroomid},raw:true,attributes:["groupid","group_hxid"]});
          if (!classroomgroup){//不存在全国通讯录
            yield new Promise(function(resolve,reject){
              hx.createhxgroup({groupname:baseInfo.classroom_name,desc:baseInfo.goods_subtitle,maxusers:2000,owner:config.hx_admin},function(err,result){
                if(!err){
                  resolve(result)
                }else {
                  reject(err)
                }
              })
            }).then(function(data){
              var result=(typeof result)=="string"?JSON.parse(result):result;
              var groupid=result.data.groupid;
              return models.Group.create({
                groupid:parseInt(Math.random()*10)+moment().format("YYMMDDHHmmssSS").toString()+parseInt(Math.random()*10),
                group_owner:config.hx_admin,//群主
                group_name:baseInfo.classroom_name,//群名称
                group_imgurl:config.hx_group_img,//群图片
                group_maxnums:2000,//群最大成员
                group_desc:baseInfo.goods_subtitle,//群描述
                group_goodid:baseInfo.en_goodsid,//产品id
                group_areaid:baseInfo.classroom_areaid,//地区id
                group_classroomid:baseInfo.en_classroomid,//学区id
                group_type:3,//聊天室
                group_hxid:groupid
              },{raw:false})
            }).then(function(data){
              classroomgroup=data.dataValues
            }).catch(function(err){
              console.log(err)
            })
          }
          yield new Promise(function (resolve,reject) {
            hx.reghxuser({username:mid},function(err,result){
              resolve(result)
            })
          }).then(function(data){
            return new Promise(function(resolve,reject){
              hx.addhxgroupuser({username:mid,groupid:classroomgroup.group_hxid+''},function(err,result){
                if(!err){
                  resolve(result)
                }else {
                  reject(err)
                }
              })
            })
          }).then(function(data){
            if(data){
              models.EnrollUserClass.findOne({where:{en_uid:body.id}}).then(function(item){
                if(!item){
                  throw new Error('不存在了')
                }
                return item.update({en_status:body.status})
              }).then(function(item){
                return models.EnrollFeedback.create({feedback_feky:body.id,feedback_content:body.content})
              })
              models.Groupuser.create({
                groupuser_user:mid,
                groupuser_group:goodsgroup.groupid
              });
              models.Groupuser.create({
                groupuser_user:mid,
                groupuser_group:classroomgroup.groupid
              })
              models.Userclass.create({
                uc_userphone:baseInfo.en_telephone,
                uc_calssroomid:baseInfo.en_classroomid,
                uc_areaid:baseInfo.classroom_areaid,
                uc_status:1,
                uc_calssroomname:baseInfo.classroom_name,
                uc_areaname:baseInfo.classroom_area_city,
                uc_goodsid:baseInfo.en_goodsid,
                uc_userid:mid
              })
            }
          }).then(function (data) {
            return response.onSuccess(res,{})
          }).catch(function(err){
            console.log(err)
            return response.onError(res,{})
          })
        }catch (err){
          console.log(err)
          return response.onError(res,{})
        }
      })
    }

  },
  statement_update:function(req,res){
    var body=req.body;
    var classroom=req.session.user.user_branch;
    if(classroom>0){
      return response.onError(res,{message:'权限错误'})
    }
    models.EnrollStatement.update({statement_status:body.status},{where:{statement_id:body.id}}).then(function(item){
      return models.EnrollFeedback.create({feedback_feky:body.id,feedback_content:body.content,feedback_type:1})
    }).then(function(){
      return response.onSuccess(res,{})
    }).catch(function(err){
      console.log(err)
      return response.onError(res,{})
    })
  },
  record_create:function(req,res){
    var body=req.body;
    models.EnrollFeedback.create(body).then(function(){
      return response.onSuccess(res,{})
    }).catch(function(err){
      console.log(err)
      return response.onError(res,{})
    })

  },
  record_list:function(req,res){
    var body=req.query;
    models.EnrollFeedback.findAll({
      where:{feedback_feky:body.id,feedback_type:body.type},
      raw:true
    }).then(function(item){
      item.map(function(node){
        node.createdAt=Str.getUnixToTime(node.createdAt)
      })
      return response.onSuccess(res,{list:item})
    }).catch(function (err) {
      console.log(err)
      return response.onError(res,{})
    })
  },
  payment_list:function(req,res){
    var body=req.query;
    var sql=new StringBuilder();
    sql.AppendFormat("select * from gj_enroll_user_class as uc" +
        " INNER JOIN gj_enroll_statement as st ON uc.en_cid=st.statement_id" +
        " WHERE uc.en_uid={0}",body.id);
    co(function *(){
      "use strict";
      try{
        var item=yield models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
        yield Promise.all(item.map(function(node){
          node.statement_payment_data=Str.getUnixToTime(node.statement_payment_data)
          if(node.statement_pics){
            node.statement_pics=node.statement_pics.split(',');
          }
          if(node.statement_documents_type==1){
            return models.EnrollStatement.findAll({
              where:{
                statement_documents_type:{'$in':[2]},
                statement_complicated:node.statement_id
              },
              raw:true
            }).then(function (data) {
              data.forEach(function (v,j) {
                if(v.statement_pics){
                  v.statement_pics=v.statement_pics.split(',');
                }
                v.statement_payment_data=Str.getUnixToTime(v.statement_payment_data)
              })
              node.children=data
            })
          }else {
            node.children=[]
          }
        }))
        return response.onSuccess(res,{list:item})
      }catch (err){
        console.log(err)
        return response.onError(res,{})
      }
    })

  },
  banch_member:function(req,res){
    var body=req.body;
    models.EnrollUserClass.findOrCreate({where:{
      en_mid:body.mid,//用户ID
      en_form:0,// 来源 0分院导入 1活动报名 2.....
      en_classroomid:body.id ,// 分院id
    },defaults:{
      en_mid:body.mid,//用户ID
      en_form:0,// 来源 0分院导入 1活动报名 2.....
      en_classroomid:body.id ,// 分院id
    }}).then(function(){
      return response.onSuccess(res,{})
    }).catch(function (err) {
      console.log(err)
      return response.onError(res,{})
    })
  },
  member_by_mid:function(req,res){
    "use strict";
    var body=req.query;
    var sqlMember=new StringBuilder();
    sqlMember.AppendFormat("SELECT m.mid,uc.en_classroomid,c.classroom_name FROM gj_members as m " +
        "INNER JOIN gj_enroll_user_class as uc ON m.mid=uc.en_mid " +
        "INNER JOIN gj_classroom as c ON c.classroom=uc.en_classroomid " +
        "WHERE mid={0} group by en_classroomid",body.mid);
    models.sequelize.query(sqlMember.ToString(),{ type: models.sequelize.QueryTypes.SELECT }).then(function(list){
      "use strict";
      return response.onSuccess(res,{list:list})
    }).catch(function(err){
      console.log(err)
      return response.onError(res,{message:err.toString()})
    })
  },
  banch_member_break:function(req,res){
    var body=req.body
    models.EnrollUserClass.findOne({
      where:{en_mid:body.id,en_classroomid:body.classroomid,en_goodsid:{'$ne':0}},raw:true
    }).then(function(item){
      if(item){
        return false
      }else {
        return models.EnrollUserClass.destroy({
          where:{en_mid:body.id,en_classroomid:body.classroomid,en_goodsid:0}
        })
      }
    }).then(function(data){
      if(data){
        return response.onSuccess(res,{})
      }else {
        return response.onError(res,{message:'存在关联'})
      }
    }).catch(function(err){
      "use strict";
      console.log(err)
      return response.onError(res,{message:err.toString()})
    })
  }
};
module.exports=declare;