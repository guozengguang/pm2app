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
    group_type: { type: DataTypes.INTEGER, defaultValue:3 }      //群类型 1 全国 2 地区 3校区
  }, {
    classMethods: {
      associate: function(models) {        
      },findByowner:function(condition){
        var sql=new StringBuilder();
        //console.log(condition);
        sql.Append("select gp.groupid,gpus.group_istop,gpus.group_isdisturb,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type,group_goodid,count(gpus.groupuser_user) as group_numbers from gj_group as gp  inner join gj_groupuser as gpu ")
        sql.AppendFormat(" on gp.groupid = gpu.groupuser_group left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where gpu.groupuser_user={0} and gp.group_type=1  group by gp.groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb,group_type,group_goodid ",condition.where.groupuser);
        sql.Append(" order by gp.createdat desc");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },findgroupbyid: function(condition){
        var sql=new StringBuilder();
        //console.log(condition);
        sql.Append("select gp.groupid,group_owner,group_name,group_imgurl,group_maxnums,group_desc,group_type,count(gpus.groupuser_user) as group_numbers from gj_group as gp   ")
        sql.AppendFormat(" left join  gj_groupuser as  gpus on gpus.groupuser_group=gp.groupid where gp.groupid='{0}'  group by gp.groupid,group_owner,group_name,group_imgurl,group_numbers,group_maxnums,group_desc,gpus.group_istop,gpus.group_isdisturb,group_type ",condition.where.groupid);
        sql.Append(" order by gp.createdat desc");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getgroupsbygoods:function(condition){
        var sql=new StringBuilder();
        sql.AppendFormat("select groupid,gc.classroom_pics as group_imgurl,group_name,COUNT(gj_groupuser.groupuserid) as group_numbers from gj_group left JOIN gj_groupuser on gj_groupuser.groupuser_group=gj_group.groupid  LEFT JOIN gj_classroom as gc on gc.classroom = gj_group.group_classroomid where group_goodid ={0} and group_type =3 group by gj_groupuser.groupuser_group ,groupid,group_name,gc.classroom_pics   ",condition.where.goodid);

        if(condition.where.limit){
        sql.AppendFormat(" limit {0},{1}",condition.where.offset,condition.where.limit);
        }
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
     }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_group',
    timestamps: true
  });
};
