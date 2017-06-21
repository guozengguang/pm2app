/**
 * Created by Administrator on 2016/12/5 0005.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("Questionnaire_Content", {
        id: {type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, unique: true},//主键
        name: {type: DataTypes.STRING, defaultValue: ''},                //姓名
        describe: {type: DataTypes.STRING, defaultValue: ''},            //描述
        vote_count: {type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0},         //投票数
        state: {type: DataTypes.INTEGER(2).UNSIGNED, defaultValue: 0},            //状态  0不通过 1通过
        parent_id: {type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0},         //父级ID
        from: {type: DataTypes.INTEGER(2).UNSIGNED, defaultValue: 0}       //来源  0前台 1后台
    }, {
        classMethods: {},
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_questionnaire_content',
        timestamps: true, //ms
        paranoid: true//删除状态
    });
};
