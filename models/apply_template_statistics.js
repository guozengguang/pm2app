"use strict";

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("ApplyTemplateStatistics", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true
        },
        template: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull : false
        },//调查表关联ID
        value: {
            type: DataTypes.STRING,
            allowNull : false
        },//提示
        newenroll_id: {//新简章id
            type: DataTypes.STRING,
            allowNull : false,
            defaultValue: ''
        },
        rowID: {//行id
            type: DataTypes.STRING,
            allowNull : false,
            defaultValue: ''
        },
        parent: {
            type: DataTypes.STRING,
            allowNull : false
        },
        status: {//状态:待审核:0,审核通过:1,审核不通过:0,已删除:2;
            type: DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        }
    }, {
        classMethods: {
            // associate: function (models) {
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_apply_template_statistics',//表名
        timestamps: true,//时间戳
        paranoid: true//逻辑删除
    });
};