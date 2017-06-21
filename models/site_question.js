"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("SiteQuestion", {
        siteid: {type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, unique: true},
        site_question: {type: DataTypes.INTEGER, defaultValue: 0},        //问题id
        site_classid: {type: DataTypes.INTEGER, defaultValue: 0},        //课程id
        site_name: {type: DataTypes.STRING(50), defaultValue: ''},        //提问者姓名
        site_pics: {type: DataTypes.STRING(5000), defaultValue: ''},        //提问者头像
        site_classroom: {type: DataTypes.STRING(50), defaultValue: ''},        //提问者所在分院
        site_company: {type: DataTypes.STRING(50), defaultValue: ''},        //提问者公司
        site_mid: {type: DataTypes.INTEGER, defaultValue: 0},        //用户mid
        site_title: {type: DataTypes.STRING, defaultValue: ''},        //提问标题
        site_content: {type: DataTypes.TEXT, defaultValue: ''},        //提问内容
        site_type: {type: DataTypes.INTEGER, defaultValue: 0},        //提问类型
        site_status: {type: DataTypes.INTEGER, defaultValue: 0},        //0 正常 1 取消 2已回答
        site_sort: {type: DataTypes.STRING(50), defaultValue:''},        //排序
    }, {
        classMethods: {
            associate: function (models) {
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_site_question',
        timestamps: true
    });
};
