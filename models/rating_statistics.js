/**
 * Created by Administrator on 2016/12/13 0013.
 */
"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("RatingStatistics", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        rating: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull : false
        },//调查表关联ID
        value: {
            type: DataTypes.STRING,
            allowNull : false
        },//提示
        parent: {
            type: DataTypes.STRING,
            allowNull : false
        },
        status: {
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        }//状态 预留字段
    }, {
        classMethods: {
            // associate: function (models) {
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_rating_statistics',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};

