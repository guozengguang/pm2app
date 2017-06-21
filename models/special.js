"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Special", {
    special_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    special_title: { type: DataTypes.STRING(24), defaultValue:"" },     //专辑标题
    special_subtitle: { type: DataTypes.STRING, defaultValue:'' },     //副标题
    special_img: { type: DataTypes.STRING, defaultValue:"" },     //专辑封面照
    special_summary: { type: DataTypes.STRING, defaultValue:"" },     //描述
    special_content: { type: DataTypes.TEXT, defaultValue:"" },     //主题内容
    special_count: { type: DataTypes.INTEGER, defaultValue:0 },     //浏览数
    special_parent: { type: DataTypes.INTEGER, defaultValue:0 },     //父级
    special_type: { type: DataTypes.INTEGER, defaultValue:2 },     //类型
    special_link: { type: DataTypes.STRING, defaultValue:'' },     //外链
    special_status: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 0有效 1无效
    special_attr: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 1置顶 0默认
    special_create: { type: DataTypes.STRING(16), defaultValue:"" }     //创建者
  }, {
    classMethods: {
      associate: function(models) {

      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_special',
    timestamps: true
  });
};
