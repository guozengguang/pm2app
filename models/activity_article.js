"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("ActivityArticle", {
    id:{type : DataTypes.UUID, defaultValue: DataTypes.UUIDV4,primaryKey : true, unique : true},
    pics:{type:DataTypes.STRING,defaultValue:""},//图片
    video:{type:DataTypes.STRING,defaultValue:""},//视频
    key:{type:DataTypes.STRING,defaultValue:""},//外键
    content:{type:DataTypes.TEXT,defaultValue:""},//内容
    title:{type:DataTypes.STRING,defaultValue:""},//标题
    status:{type:DataTypes.INTEGER,defaultValue:1},//状态 1=正常 0=下架
    assist:{type:DataTypes.INTEGER,defaultValue:0},//点赞数
  }, {
    classMethods: {
      associate: function(models) {
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_activity_article',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};