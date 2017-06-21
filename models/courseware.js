"use strict";

module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Courseware", {
    couid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    cou_classid: { type: DataTypes.INTEGER, defaultValue:0 },        //课程id
    cou_pics: { type: DataTypes.STRING, defaultValue:"" },     //封面
    cou_type: { type: DataTypes.INTEGER, defaultValue:0 },     //类型 1 课件 2 笔记
    cou_status: { type: DataTypes.INTEGER, defaultValue:0 },     //类型 0 正常 2 删除
    cou_transcoding: { type: DataTypes.INTEGER, defaultValue:0 },     //类型 0 未转码 1 已转码
    cou_content:{type : DataTypes.TEXT,defaultValue:''},        //简介
    cou_title:{type: DataTypes.STRING, defaultValue:''},        //标题
    cou_path:{type: DataTypes.STRING, defaultValue:''},        //路径 课件
    cou_path_size:{type: DataTypes.STRING, defaultValue:''},        //路径 课件
    cou_note:{type: DataTypes.STRING, defaultValue:''},        //路径 笔记
    cou_note_size:{type: DataTypes.STRING, defaultValue:''},        //路径 笔记
    cou_remark:{type : DataTypes.STRING,defaultValue:''},        //备注
    cou_create:{type : DataTypes.STRING(50),defaultValue:''}      //创建者
  }, {
    classMethods: {
      associate: function(models) {
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_courseware',
    timestamps: true
  });
};
