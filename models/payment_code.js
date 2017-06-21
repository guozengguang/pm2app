"use strict";
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("PaymentCode", {
    id:{type : DataTypes.UUID, defaultValue: DataTypes.UUIDV4,primaryKey : true, unique : true},
    tel:{type:DataTypes.STRING(11),defaultValue:""},//手机
    name:{type:DataTypes.STRING,defaultValue:""},//姓名
    company:{type:DataTypes.STRING,defaultValue:""},//公司
    position:{type:DataTypes.STRING,defaultValue:""},//职位
    body:{type:DataTypes.STRING,defaultValue:""},//描述
    goods:{type:DataTypes.INTEGER,defaultValue:0},//课程id
    fee:{type:DataTypes.DECIMAL(18,2),defaultValue:0.00},//金额
    calssroom:{type:DataTypes.INTEGER,defaultValue:0},//分院id
    status:{type:DataTypes.INTEGER,defaultValue:0},//状态 0预订单 1付款
    type:{type:DataTypes.INTEGER,defaultValue:1},//类型 1微信 2 支付宝
    out_trade_no:{type:DataTypes.STRING,defaultValue:''},//商户订单号
    openid:{type:DataTypes.STRING,defaultValue:''},//微信的openid
    buyer:{type:DataTypes.STRING,defaultValue:''},//支付宝的付款账号
    transaction_id:{type:DataTypes.STRING,defaultValue:''},//平台订单号
    total_fee:{type:DataTypes.DECIMAL(18,2),defaultValue:0.00},//实际付款金额
  }, {
    classMethods: {
      associate: function(models) {
      }

    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_payment_code',
    timestamps: 'true',
    updatedAt:"updateat",
    createdAt:"createdat"
  });
};