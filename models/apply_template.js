"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Apply_Template",{
        id:{
            type:DataTypes.INTEGER.UNSIGNED,
            autoIncrement:true,
            primaryKey:true,
            unique:true
        },
        name:{
            type:DataTypes.STRING,
            allowNull:false
        },//模板名称
        key:{
            type:DataTypes.STRING,
            allowNull:false,
            defaultValue:''
        },//模板key
        other_key:{
            type:DataTypes.STRING,
            allowNull:false,
            defaultValue:''
        },//模板key-其他值
        level:{
            type:DataTypes.INTEGER.UNSIGNED,
            allowNull:true
        },//层级
        parent :{
            type: DataTypes.STRING,
            allowNull : false
        },//父级
        property:{
            type:DataTypes.STRING,
            defaultValue:''
        },//属性
        method:{
            type:DataTypes.STRING,
            defaultValue:''
        },//方式
        sort: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue : 0
        },//排序
        score: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue : 5
        },//分值
        type: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0,
        },//类型 预留字段
        status: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },//状态
        imgcount:{
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        },//图片数量
        operator:{
            type: DataTypes.STRING,
            allowNull : false
        }//操作人
    },{
        classMethods:{

        },
        freezeTableName:true,//默认false  false是修改表明 true为不修改表明 与数据库表名同步
        tableName:'gj_apply_template',//表名
        timestamps:true,//时间戳
        paranoid:true//逻辑删除
    })
};