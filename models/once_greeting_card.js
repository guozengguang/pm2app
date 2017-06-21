/**
 * Created by Administrator on 2017/1/11 0011.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Once_GreetingCard", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        template: {
            type: DataTypes.INTEGER(2).UNSIGNED,
            allowNull: false,
            comment: '模板ID'
        },      //用户ID
        congratulations: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '贺词'
        },      //微信单应用用户唯一标识
        name: {
            type: DataTypes.CHAR(4),
            allowNull: false,
            comment: '姓名'
        },      //微信公众平台多应用唯一标识
        job: {
            type: DataTypes.CHAR(20),
            allowNull: false,
            comment: '职位'
        },      //昵称
        corporation: {
            type: DataTypes.CHAR(20),
            allowNull: false,
            comment: '公司'
        },      //性别
        picture: {
            type: DataTypes.STRING(2048),
            allowNull: false,
            comment: '头像'
        }
    }, {
        classMethods: {
            associate: function (models) {
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'once_greeting_card',
        timestamps: true,
        underscored: true,
        paranoid: false
    });
};