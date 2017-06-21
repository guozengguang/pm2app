"use strict";
/**
 * 报备检查表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("ReportCheck", {
        rc_id:{type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
        rc_check_time:{type: DataTypes.DATE, defaultValue:DataTypes.NOW},//报备检查时间
        rc_num : {type : DataTypes.INTEGER, defaultValue:0},//报备检查次数
        clerk_phone : {type : DataTypes.STRING, defaultValue:""}//招生老师电话
    }, {
        classMethods: {
            associate: function(models) {

            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_report_check',
        timestamps: true,//时间戳
        underscored:true//下划线
    });
};