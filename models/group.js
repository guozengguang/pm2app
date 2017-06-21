"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Group", {
    groupid : {type :  DataTypes.STRING(32),primaryKey : true, unique : true},
    group_owner: { type: DataTypes.INTEGER, defaultValue:0 },       //群主
    group_name: {type : DataTypes.STRING(32),defaultValue:''},      //群名称
    group_imgurl: { type: DataTypes.STRING(256), defaultValue:''},  //群图片
    group_numbers: { type: DataTypes.INTEGER, defaultValue:0},      //群成员数
    group_maxnums: { type: DataTypes.INTEGER, defaultValue:0},      //群最大成员
    group_desc: {type : DataTypes.STRING(255),defaultValue:''},      //群描述
    group_istop: { type: DataTypes.INTEGER, defaultValue:0 },       //是否顶置
    group_isdisturb: { type: DataTypes.INTEGER, defaultValue:0 },    //免打扰
    group_goodid: { type: DataTypes.INTEGER, defaultValue:0 },   //产品id
    group_areaid: { type: DataTypes.INTEGER, defaultValue:0 },      //地区id
    group_classroomid: { type: DataTypes.INTEGER, defaultValue:0 },      //学区id
    group_hxid: { type: DataTypes.STRING(32), defaultValue:0 },      //环信id
    group_type: { type: DataTypes.INTEGER, defaultValue:3 }      //群类型 1 同学录 2 取消了 3校区 4聊天室 5院长 6教务 7班主任 8运营 9本院通讯录 10班级助理
  }, {
    classMethods: {
      associate: function(models) {
      },findByowner:function(condition){
        var sql=new StringBuilder();
        if(condition.where.mtype==10)
        {
          if(condition.where.mlevel==1)
          {
              sql.Append("  select groupid,gp.group_istop,gp.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type, group_goodid,count(gpus.groupuser_user) as group_numbers from gj_group as gp  left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where groupid =2160826162845744  group by   groupid,gpus.group_istop,gpus.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type  order by CONVERT(group_name USING gbk) ");
          }else
          {
             sql.Append("  select groupid,gp.group_istop,gp.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type, group_goodid,count(gpus.groupuser_user) as group_numbers from gj_group as gp  left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where group_type not in (2,3,4,9)  group by   groupid,gpus.group_istop,gpus.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type  order by CONVERT(group_name USING gbk) ");            
          }
          
        }else{
            //sql.Append(" select * from ( ");
            if(condition.where.usertype==5||condition.where.usertype==6)
            {
              sql.Append("  select groupid,gp.group_istop,gp.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type, group_goodid,count(gpus.groupuser_user) as group_numbers from gj_group as gp  left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where groupid =2160826162845744  group by   groupid,gpus.group_istop,gpus.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type  union all  ");  
            }
            if(condition.where.usertype!=8)
            {
                sql.AppendFormat(" select gp.groupid as groupid,0 as group_istop,0 as group_isdisturb,0 as group_owner,'本院同学录' as group_name,gjc.classroom_pics  as group_imgurl,0 as group_maxnums,'' as group_desc,100 as group_type,0 as group_goodid,0 as group_numbers from gj_members as mb INNER JOIN  gj_groupuser as gpu on gpu.groupuser_user=mb.mid INNER JOIN gj_group as gp on gpu.groupuser_group=gp.groupid INNER JOIN gj_classroom  as gjc  on gjc.classroom = gpu.group_classroom   where mb.m_type in (4,5,6,8,9) and mid = {0} and gp.group_type=9  union all ",condition.where.groupuser);
            }
            sql.Append(" select gp.groupid,gpus.group_istop,gpus.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type,group_goodid,count(gpus.groupuser_user) as group_numbers from gj_group as gp  inner join gj_groupuser as gpu ")
            sql.AppendFormat(" on gp.groupid = gpu.groupuser_group left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where gpu.groupuser_user={0} and gp.group_type in (1,5,6,7,8,9,10)  group by gp.groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb,group_type,group_goodid ",condition.where.groupuser);
            //sql.Append(" ) as a order by  CONVERT(a.group_name USING gbk) ");
        }

        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findByownerv15:function(condition){
        var sql=new StringBuilder();
        sql.Append(" select * from ( ");
        if(condition.where.mtype==4)
        {
          sql.AppendFormat("    select groupid, group_istop,group_isdisturb,group_owner, group_name, group_imgurl,group_maxnums, group_desc, group_type, group_goodid, goods_name,count(mid) as group_numbers from  (select  CONCAT(bm.classroom,'') as groupid,0 as group_istop,0 as group_isdisturb,0 as group_owner,CONCAT(gcr.classroom_name ,'教学人员') as group_name,gj_goods.goods_img_small  as group_imgurl,0 as group_maxnums,'' as group_desc,9 as group_type,gj_goods.goodsid as group_goodid,count(bms.member) as group_numbers,gj_goods.goods_name as goods_name,bms.member as mid from gj_branch_manage as bm  inner join gj_classroom as gcr on gcr.classroom=bm.classroom  left JOIN gj_goods on gj_goods.goods_status=1 LEFT JOIN gj_branch_manage as bms on bms.classroom = bm.classroom and bms.type <> 1 where bm.member = {0} group by groupid, group_istop,group_isdisturb,group_owner, group_name, group_imgurl,group_maxnums, group_desc, group_type, group_goodid, goods_name,mid,bms.type) as a GROUP BY groupid, group_istop,group_isdisturb,group_owner, group_name, group_imgurl,group_maxnums, group_desc, group_type, group_goodid, goods_name    union all ",condition.where.groupuser);

          sql.AppendFormat("select gp.groupid,gpus.group_istop,gpus.group_isdisturb,group_owner, CONCAT(group_name,'同学')  as group_name,gg.goods_img_small as group_imgurl,group_maxnums,group_desc,group_type,group_goodid,gg.goods_name,count(gpus.groupuser_user) as group_numbers from gj_group as gp  INNER JOIN gj_branch_manage as bm on bm.classroom = gp.group_classroomid and bm.member={0} left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid LEFT JOIN gj_goods as gg on gg.goodsid=gp.group_goodid where  gp.group_type = 3  group by groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,group_istop,group_isdisturb,group_type,group_goodid,goods_name    union all  ",condition.where.groupuser);

          sql.AppendFormat("select gp.groupid,gpus.group_istop,gpus.group_isdisturb,group_owner, '全国同学'  group_name,gg.goods_img_small as group_imgurl,group_maxnums,group_desc,group_type,group_goodid,gg.goods_name,count(gpus.groupuser_user ) as group_numbers from gj_group as gp  left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid LEFT JOIN gj_goods as gg on gg.goodsid=gp.group_goodid where gp.group_type = 1 group by groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,group_istop,group_isdisturb,group_type,group_goodid,goods_name    ",condition.where.groupuser);

        }else if(condition.where.mtype==10)
        {
          sql.AppendFormat("select gp.groupid,gpus.group_istop,gpus.group_isdisturb,group_owner, '全国同学'  group_name,gg.goods_img_small as group_imgurl,group_maxnums,group_desc,group_type,group_goodid,gg.goods_name,count(gpus.groupuser_user ) as group_numbers from gj_group as gp  left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid LEFT JOIN gj_goods as gg on gg.goodsid=gp.group_goodid where gp.group_type = 1 group by groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,group_istop,group_isdisturb,group_type,group_goodid,goods_name    ",condition.where.groupuser);
        }else
        {
          sql.AppendFormat("  select  CONCAT(bm.classroom,'') as groupid,0 as group_istop,0 as group_isdisturb,0 as group_owner,CONCAT(guc.uc_calssroomname ,'教学人员') as group_name,gj_goods.goods_img_small  as group_imgurl,0 as group_maxnums,'' as group_desc,9 as group_type,guc.uc_goodsid as group_goodid,count(mbs.mid) as group_numbers,gj_goods.goods_name as goods_name  from gj_members as mb  INNER JOIN gj_userclass  as guc  on guc.uc_userid = mb.mid INNER JOIN gj_branch_manage as bm on bm.classroom = guc.uc_calssroomid INNER JOIN gj_goods on gj_goods.goodsid=guc.uc_goodsid LEFT JOIN gj_members as mbs on mbs.mid = bm.member and bm.type <>1  where mb.m_type=0 and mb.mid = {0} group by groupid, group_istop,group_isdisturb,group_owner, group_name, group_imgurl,group_maxnums, group_desc, group_type, group_goodid, goods_name   union all ",condition.where.groupuser);

          sql.AppendFormat(" select gp.groupid,gpus.group_istop,gpus.group_isdisturb,group_owner,case when group_type =1 THEN '全国同学' ELSE CONCAT(group_name,'同学') end as group_name,gg.goods_img_small as group_imgurl,group_maxnums,group_desc,group_type,group_goodid,count(gpus.groupuser_user) as group_numbers ,gg.goods_name from gj_group as gp  inner join gj_groupuser as gpu on gp.groupid = gpu.groupuser_group left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid LEFT JOIN gj_goods as gg on gg.goodsid=gp.group_goodid where ((gpu.groupuser_user={0}) or (select mid from gj_members where mid={0} and m_type in (4,9)) is not null) and gp.group_type in (1,3)  group by gp.groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb,group_type,group_goodid,gg.goods_name ",condition.where.groupuser);
        }
        
        sql.Append(" ) as r order by  r.group_goodid,r.group_type desc ");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findmychats:function(condition){
        var sql=new StringBuilder();

          sql.AppendFormat("select groupid,classroom_pics as group_imgurl,group_name,COUNT(gpu.groupuserid) as group_numbers,gj_groupuser.group_istop,gj_groupuser.group_isdisturb,group_hxid from gj_group inner JOIN gj_groupuser on gj_groupuser.groupuser_group=gj_group.groupid left join gj_groupuser as gpu on gpu.groupuser_group=gj_group.groupid LEFT JOIN gj_classroom as gc on gc.classroom=gj_group.group_classroomid  where gj_groupuser.groupuser_user={0} and group_type =3 group by gj_groupuser.groupuser_group,groupid,group_imgurl,group_name order by gj_group.group_istop,CONVERT(group_name USING gbk)     ",condition.where.groupuser);

        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findgroupbyid: function(condition){
        var sql=new StringBuilder();
        //console.log(condition);
        sql.Append("select gp.groupid,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type,count(gpus.groupuser_user) as group_numbers from gj_group as gp   ")
        sql.AppendFormat(" left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where gp.groupid='{0}'  group by gp.groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb,group_type ",condition.where.groupid);
        sql.Append(" order by gp.createdat desc");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findgroupbyuserid: function(condition){
        var sql=new StringBuilder();
        //console.log(condition);
        sql.Append("select gp.groupid,group_owner,group_name,classroom_pics as group_imgurl,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb,count(gpums.groupuser_user) as group_members from gj_group as gp  LEFT JOIN gj_classroom as gc on gc.classroom=gp.group_classroomid left join gj_groupuser as gpums on gpums.groupuser_group=gp.groupid ")
        if(condition.where.groupid)
        {
          sql.AppendFormat(" left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where gp.groupid='{0}' ",condition.where.groupid);
        }
        if(condition.where.hxid)
        {
          sql.AppendFormat(" left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where gp.group_hxid='{0}' ",condition.where.hxid);
        }
        sql.AppendFormat("  and gpus.groupuser_user={0} group by gp.groupid,group_owner,group_name,classroom_pics,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb ",condition.where.userid);
        sql.Append(" order by gp.createdat desc");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getgroupsbygoods:function(condition){
        var sql=new StringBuilder();
        sql.AppendFormat("select groupid,classroom_pics as group_imgurl,group_name,COUNT(gj_groupuser.groupuserid) as group_numbers from gj_group left JOIN gj_groupuser on gj_groupuser.groupuser_group=gj_group.groupid inner JOIN gj_classroom as gc on gc.classroom=gj_group.group_classroomid and  classroom_status=0  where group_goodid ={0} and group_type =3   group by gj_groupuser.groupuser_group ,groupid,group_imgurl,group_name order by CONVERT(group_name USING gbk) ",condition.where.goodid);

        if(condition.where.limit){
        sql.AppendFormat(" limit {0},{1}",condition.where.offset,condition.where.limit);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
     },getgroupsbyusertype:function(condition){
        var sql=new StringBuilder();
        
        sql.Append("select gj_group.groupid, gj_group.group_type,gj_group.group_imgurl,concat(gj_group.group_desc,'本院通讯录')  as group_name,COUNT(gj_groupuser.groupuserid) as group_numbers from gj_group inner join gj_group as gp on gp.group_classroomid=gj_group.group_classroomid ");
        if(condition.where.usertype==7 || condition.where.usertype==10)
        {
          sql.AppendFormat(" inner join gj_group as gp1 on gp1.group_goodid=gj_group.group_goodid and gp1.group_type in (7,10) INNER JOIN gj_groupuser as gpu on gpu.groupuser_group=gp1.groupid and gpu.groupuser_user={0}  ",condition.where.userid);
        }
        sql.AppendFormat(" left JOIN gj_groupuser on gj_groupuser.groupuser_group=gj_group.groupid where gp.groupid ={0} and gj_group.group_type =3 GROUP BY gj_group.groupid,gj_group.group_imgurl,gj_group.group_name order by CONVERT(gj_group.group_desc USING gbk)",condition.where.groupid);
        if(condition.where.limit){
        sql.AppendFormat(" limit {0},{1}",condition.where.offset,condition.where.limit);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
     },findAllGoodsid: function(opt){
        var sql=new StringBuilder();
        //console.log(condition);
        sql.AppendFormat("select groupid,group_name,classroom_pics,group_imgurl,group_type from gj_group LEFT JOIN gj_classroom ON gj_classroom.classroom=gj_group.group_classroomid where group_type IN (1,3) and group_goodid='{0}'",opt.group_goodid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_group',
    timestamps: true
  });
};
