"use strict";

module.exports = function(sequelize, DataTypes) {//对账单
  return sequelize.define("EnrollStatement", {
    statement_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    statement_pics: { type: DataTypes.TEXT, defaultValue:''},    //凭证图片
    statement_name: { type: DataTypes.STRING(25), defaultValue:''},    //付款单位
    statement_payment_data: { type: DataTypes.DATE, defaultValue:DataTypes.NOW},    //付款日期
    statement_account : { type: DataTypes.STRING(50), defaultValue:''},    //付款账号
    statement_money: { type: DataTypes.DECIMAL(18,2), defaultValue:0.00},    //付款金额
    statement_money_remaining: { type: DataTypes.DECIMAL(18,2), defaultValue:0.00},    //剩余金额
    statement_closing_money: { type: DataTypes.DECIMAL(18,2), defaultValue:0.00},    //清算金额
    statement_commission: { type: DataTypes.DECIMAL(18,2), defaultValue:0.00},    //手续费
    statement_reference_number: { type: DataTypes.STRING(50), defaultValue:''},    //参考号
    statement_serial_number: { type: DataTypes.STRING(50), defaultValue:''},    //流水号
    statement_type: { type: DataTypes.STRING(50), defaultValue:''},    //交易类型
    statement_card_type: { type: DataTypes.STRING(50), defaultValue:''},    //卡类型
    statement_issuing_bank: { type: DataTypes.STRING(50), defaultValue:''},    //发卡行
    statement_eid: { type: DataTypes.INTEGER, defaultValue:0},    //说明id
    statement_status: { type: DataTypes.INTEGER, defaultValue:0},    //状态 0正常 1未审核 2不通过
    statement_desc: { type: DataTypes.STRING, defaultValue:''},    //付款说明
    statement_terminal: { type: DataTypes.STRING, defaultValue:''},    //终端号
    statement_closing_data: { type: DataTypes.STRING, defaultValue:''},    //清算日期
    statement_trade_data: { type: DataTypes.STRING, defaultValue:''},    //交易日期
    statement_trade_time: { type: DataTypes.STRING, defaultValue:''},    //交易时间
    statement_complicated: { type: DataTypes.STRING, defaultValue:''},    //订单合并id
    statement_classroomname: { type: DataTypes.STRING, defaultValue:''},    //分院名称
    statement_classroomid: { type: DataTypes.STRING, defaultValue:''},    //分院id
    statement_documents_type: { type: DataTypes.INTEGER, defaultValue:0},    //单据类型 0单条记录 1合并单据 2合并子单
    statement_documents_form: { type: DataTypes.INTEGER, defaultValue:0},    //单据来源 0pos 1银行转账
  }, {
    classMethods: {
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_enroll_statement',
    timestamps: true
  });
};
