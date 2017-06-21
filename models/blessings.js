/**
 * Created by Administrator on 2016/12/19 0019.
 */
"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Blessings", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        video: {
            type: DataTypes.STRING(2048),
            allowNull : false
        },//视频地址
        image: {
            type: DataTypes.STRING(2048),
            defaultValue: '',
        },//图片地址
        video_status: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            defaultValue: 0
        },//视频状态
        name: {
            type: DataTypes.STRING,
            allowNull : false
        },//姓名
        branch: {
            type: DataTypes.STRING
        },//分院信息
        company: {
            type: DataTypes.STRING,
            defaultValue: 0
        },//公司名称
        vote: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },//投票数
        type: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            defaultValue: 0
        },//类型 0 未分类 1分院类型 2学员类型
        status: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            defaultValue: 0
        }//状态 0 未通过 1通过
    }, {
        classMethods: {
            // associate: function (models) {
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_blessings',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};