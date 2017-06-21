"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("paymentOrder", {
    id:{type : DataTypes.INTEGER, autoIncrement : true,primaryKey : true, unique : true},
    type:{type:DataTypes.INTEGER,defaultValue:0},//类别
    method:{type:DataTypes.STRING(50),defaultValue:''},//缴费方式
    order:{type:DataTypes.STRING,defaultValue:''},//流水号
    fee:{type:DataTypes.INTEGER,defaultValue:0},//金额
    stime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//缴费时间
    etime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//确认时间
    status:{type:DataTypes.INTEGER,defaultValue:0},//状态 0=未审核 1审核失败 2审核成功 3重新审核提交 -1删除
    pics: { type: DataTypes.TEXT, defaultValue:''},//订单图片
    desc:{type:DataTypes.STRING(256),defaultValue:""},//描述
    branch:{type:DataTypes.INTEGER,defaultValue:0},//所属分院
  }, {
    classMethods: {
      associate: function(models) {
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_payment_order',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};