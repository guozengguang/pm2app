/**
 * Created by Administrator on 2017/1/11 0030.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Templatevote", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主键'
        },
        templateid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '点赞模板id'
        },
        tophone: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '点赞对象手机'
        },
        fromid: {
            type: DataTypes.STRING,
            defaultValue:'',
            comment: '点赞人唯一标示'
        },
        vote: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            comment: '投票数'
        }
    }, {
        classMethods: {
            // associate: function (models) {
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_template_vote',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};
