/**
 * Created by Administrator on 2016/12/13 0013.
 */
"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Rating", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull : false
        },//名称
        prompt: {
            type: DataTypes.STRING
        },//提示
        goodName: {
            type: DataTypes.STRING
        },
        className: {
            type: DataTypes.STRING
        },//课程名称
        level:{
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull : false
        },//层级
        parent :{
            type: DataTypes.STRING,
            allowNull : false
        },//父级
        property:{
            type: DataTypes.STRING,
            defaultValue: ''
        },//属性
        method: {
            type: DataTypes.STRING,
            defaultValue: ''
        },//方式
        sort: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue : 0
        },//排序
        score: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue : 5
        },//分值
        teacher: {
            type: DataTypes.STRING,
            defaultValue: ''
        },//教师
        count: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue : 0
        },//学员数量
        type: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0,
        },//类型 预留字段
        status: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },//状态
        operator:{
            type: DataTypes.STRING,
            allowNull : false
        }//操作人
    }, {
        classMethods: {
            // associate: function (models) {
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_rating',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};

