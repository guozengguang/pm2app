/**
 * Created by Administrator on 2017/1/11 0030.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Wuxivote", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主键'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '名称'
        },
        vote: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            comment: '投票数'
        },
        status: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            defaultValue: 0,
            comment: '状态 0下架 1上架'
        }
    }, {
        classMethods: {
            // associate: function (models) {
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_wuxivote',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};
