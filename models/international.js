"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("International", {
    international_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    international_title: { type: DataTypes.STRING(24), defaultValue:"" },     //专辑标题
    international_subtitle: { type: DataTypes.STRING, defaultValue:'' },     //副标题
    international_img: { type: DataTypes.STRING, defaultValue:"" },     //专辑封面照
    international_summary: { type: DataTypes.STRING, defaultValue:"" },     //描述
    international_content: { type: DataTypes.TEXT, defaultValue:"" },     //主题内容
    international_count: { type: DataTypes.INTEGER, defaultValue:0 },     //浏览数
    international_parent: { type: DataTypes.INTEGER, defaultValue:0 },     //父级
    international_type: { type: DataTypes.INTEGER, defaultValue:2 },     //类型
    international_status: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 0有效 1无效
    international_attr: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 1置顶 0默认
    international_create: { type: DataTypes.STRING(16), defaultValue:"" }     //创建者
  },{
    classMethods: {
      associate: function(models) {

      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_international',
    timestamps: true
  });
};
