"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Activity", {
    activity_id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    activity_title:{type:DataTypes.STRING(50),defaultValue:""},//标题
    activity_img:{type:DataTypes.STRING,defaultValue:""},//图片
    activity_sponsor:{type:DataTypes.STRING,defaultValue:""},//主办单位
    activity_address:{type:DataTypes.STRING,defaultValue:""},//活动地点
    activity_official:{type:DataTypes.INTEGER,defaultValue:1},//官方 1是 0否
    activity_link:{type:DataTypes.STRING,defaultValue:""},//外链
    activity_sort:{type:DataTypes.INTEGER,defaultValue:0},//排序
    activity_count:{type:DataTypes.INTEGER,defaultValue:0},//观看量
    activity_stime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//开始时间  备用
    activity_etime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//结束时间 备用
    activity_status:{type:DataTypes.INTEGER,defaultValue:0},//状态 0=正常 1=下架
    activity_content:{type:DataTypes.TEXT,defaultValue:''},//内容  备用
  }, {
    classMethods: {
      associate: function(models) {
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_activity',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};