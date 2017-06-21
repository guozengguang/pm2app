/**
 * Created by Administrator on 2017/1/11 0011.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Once_Education", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '姓名'
        },
        phone: {
            type: DataTypes.BIGINT(11).UNSIGNED,
            allowNull: false,
            comment: '手机号'
        },
        sex: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            comment: '性别' // 1男 2女
        },
        age: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            comment: '年龄' // 1幼儿 2小学 3中学 4高中
        },
        province: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '省份'
        },
        city: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '城市'
        },
        branch: {
            type: DataTypes.CHAR(50),
            comment: '分院名称'
        },
        problem: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            comment: '问题' //0其他 1 拖延 2马虎 3积极性差 4上课走神
        },
        other: {
            type: DataTypes.STRING(255),
            allowNull: false,
            comment: '其他'
        }
    }, {
        classMethods: {
            associate: function (models) {
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'once_education',
        timestamps: true,
        underscored: true,
        paranoid: false
    });
};