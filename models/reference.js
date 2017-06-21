"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Reference", {
    refid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    ref_classid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    ref_pics: { type: DataTypes.STRING, defaultValue:"" },     //封面
    ref_content:{type : DataTypes.TEXT,defaultValue:''},        //简介
    ref_author:{type: DataTypes.STRING, defaultValue:''},        //作者
    ref_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    ref_title:{type : DataTypes.STRING,defaultValue:''},        //标题
    ref_create:{type : DataTypes.STRING(50),defaultValue:''}      //创建者
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_reference',
    timestamps: true
  });
};
