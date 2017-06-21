"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Classroom", {
    classroom : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    classroom_areaid: { type: DataTypes.INTEGER, defaultValue:0},          //学区id
    classroom_status: { type: DataTypes.INTEGER, defaultValue:0},          //状态 0 正常 1停用
    classroom_name: { type: DataTypes.STRING, defaultValue:"" },        //教室名称
    classroom_short: { type: DataTypes.STRING, defaultValue:"" },        //分院简称
    classroom_firstabv: { type: DataTypes.STRING, defaultValue:"#" },        //分院首字母
    classroom_pics: { type: DataTypes.STRING, defaultValue:"" },        //图片
    classroom_banner: { type: DataTypes.STRING, defaultValue:"" },        //banner图片
    classroom_content: { type: DataTypes.TEXT, defaultValue:"" },        //分院简介
    classroom_area_city: { type: DataTypes.STRING(16), defaultValue:"" },     //学区城市
    classroom_address: { type: DataTypes.STRING, defaultValue:"" },     //地址
    classroom_address_work: { type: DataTypes.STRING, defaultValue:"" },     //工作地址
    classroom_coordinates:{type : DataTypes.STRING,defaultValue:''},    //纬度
    classroom_longitude:{type : DataTypes.STRING,defaultValue:''},    //经度
    classroom_head:{type : DataTypes.STRING,defaultValue:''},    //负责人
    classroom_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    classroom_qrcode:{type : DataTypes.STRING,defaultValue:''},        //二维码
    classroom_time:{ type: DataTypes.DATE, defaultValue:DataTypes.NOW },        //创建时间
    classroom_email:{type : DataTypes.STRING(50),defaultValue:''},       //邮箱
    classroom_telephone:{type : DataTypes.STRING(50),defaultValue:''},        //招生电话
    classroom_phone:{type : DataTypes.STRING(50),defaultValue:''},        //电话
    classroom_email_bus:{type : DataTypes.STRING(50),defaultValue:''},       //邮箱
    classroom_telephone_bus:{type : DataTypes.STRING(50),defaultValue:''},        //招生电话
    classroom_phone_bus:{type : DataTypes.STRING(50),defaultValue:''},        //电话
    classroom_email_media:{type : DataTypes.STRING(50),defaultValue:''},       //邮箱
    classroom_telephone_media:{type : DataTypes.STRING(50),defaultValue:''},        //招生电话
    classroom_phone_media:{type : DataTypes.STRING(50),defaultValue:''},        //电话
    classroom_code:{type : DataTypes.STRING(50),defaultValue:''},       //邮编
    classroom_report_time:{type : DataTypes.INTEGER,defaultValue:30},       //报备有效时长 按天计算
    classroom_report_time_min:{type : DataTypes.INTEGER,defaultValue:7},       //报备有效时长区间最小值 按天计算
    classroom_report_time_max:{type : DataTypes.INTEGER,defaultValue:90},       //报备有效时长区间最大值 按天计算
    max_query_num : {type : DataTypes.INTEGER, defaultValue:20},//按分院设置最大查询次数,默认为20.
    classroom_create:{type : DataTypes.STRING(50),defaultValue:''}    //创建者
  }, {
    classMethods: {
      associate: function(models) {  
        models.Classroom.belongsTo(models.Area,{foreignKey: 'classroom_areaid'});
      },CityAll:function(option){
        var sql=new StringBuilder();
        sql.AppendFormat("select classroom,classroom_areaid,classroom_areaid,classroom_name,classroom_area_city from gj_classroom where classroom_area_city='{0}'",option.recruit_itemarea);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_classroom',
    timestamps: true
  });
};
