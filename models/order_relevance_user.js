"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("OrderRelevanceUser", {
    id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    oid:{type:DataTypes.INTEGER,defaultValue:0},//订单id
    uid:{type:DataTypes.INTEGER,defaultValue:0},//报备id
    desc:{type:DataTypes.STRING(50),defaultValue:''},//描述
    create:{type:DataTypes.STRING(50),defaultValue:''},//创建信息
  }, {
    classMethods: {

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_order_relevance_user',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};