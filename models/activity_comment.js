"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("ActivityComment", {
    id:{type : DataTypes.UUID, defaultValue: DataTypes.UUIDV4,primaryKey : true, unique : true},
    pics:{type:DataTypes.STRING(5000),defaultValue:""},//图片
    key:{type:DataTypes.STRING,defaultValue:""},//外键
    content:{type:DataTypes.STRING,defaultValue:""},//内容
    source:{type:DataTypes.INTEGER,defaultValue:0},//源人员
    root:{type:DataTypes.INTEGER,defaultValue:0},//根人员
    parent:{type:DataTypes.STRING,defaultValue:''},//父级id
    assist:{type:DataTypes.INTEGER,defaultValue:0},//点赞数
    status:{type:DataTypes.INTEGER,defaultValue:1},//状态 1=正常 0=下架
    audit_status:{type:DataTypes.INTEGER,defaultValue:0},//审核状态 1=审核通过 2=审核未通过 0=未审核
    reply_status:{type:DataTypes.INTEGER,defaultValue:0},//回复状态 1=已回复  0=未回复
  }, {
    classMethods: {
      associate: function(models) {
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_activity_comment',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};