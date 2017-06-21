/**
 * Created by Administrator on 2016/12/30 0030.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Master", {
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
            comment: '姓名'
        },
        branch: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '分院'
        },
        lesson: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '课程'
        },
        company: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '公司'
        },
        video: {
            type: DataTypes.STRING(2048),
            comment: '视频'
        },
        image: {
            type: DataTypes.STRING(2048),
            comment: '图片'
        },
        vote: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            comment: '投票数'
        },
        describe: {
            type: DataTypes.STRING(2048),
            allowNull: false,
            defaultValue: 0,
            comment: '推荐理由'
        },
        type: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '类型 1推荐 2获奖'
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
        tableName: 'gj_master',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};
