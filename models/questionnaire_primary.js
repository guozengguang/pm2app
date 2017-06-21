/**
 * Created by Administrator on 2016/12/5 0005.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Questionnaire_Primary", {
        id: {type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, unique: true},//栏目ID
        name: {type: DataTypes.STRING, defaultValue: ''},              //名称
        describe: {type: DataTypes.STRING, defaultValue: ''},          //描述
        hierarchy: {type: DataTypes.INTEGER(2).UNSIGNED , defaultValue: 1},        //层级
        parent_id: {type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0},         //父级ID
        state: {type: DataTypes.INTEGER(2).UNSIGNED, defaultValue: 0},         //状态  0下架  1上架
        type: {type: DataTypes.INTEGER(2).UNSIGNED, defaultValue: 0}         //状态  0未分类 1期望课程 2期望教师
    }, {
        classMethods: {
            // associate: function (models) {
            //     //栏目表对应关联表
            //     models.Questionnaire_Primary.hasMany(models.Questionnaire_Content, {
            //         foreignKey: 'id',
            //         targetKey: 'parent_id',
            //         constraints: true
            //     });
            // }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_questionnaire_primary',
        timestamps: true, //ms
        paranoid: true//删除状态
    });
};