"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Topic", {
    topic_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    topic_classid: { type: DataTypes.INTEGER, defaultValue:0 },     //专辑标题
    topic_title: { type: DataTypes.STRING, defaultValue:'' },     //副标题
    topic_img: { type: DataTypes.STRING, defaultValue:"" },     //专辑封面照
    topic_content: { type: DataTypes.TEXT, defaultValue:"" },     //主题内容
    topic_type: { type: DataTypes.INTEGER, defaultValue:2 },     //类型
    topic_status: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 0有效 1无效
    topic_create: { type: DataTypes.STRING(16), defaultValue:"" }     //创建者
  }, {
    classMethods: {
      associate: function(models) {

      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_topic',
    timestamps: true
  });
};
