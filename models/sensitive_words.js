"use strict";
/**
 * 敏感词管理表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("SensitiveWords", {
        sw_id:{type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
        sw_words:{type:DataTypes.STRING,defaultValue:""},//名称(敏感词)
        uid : {type : DataTypes.INTEGER, defaultValue:0},//录入人id
        update_uid : {type : DataTypes.INTEGER, defaultValue:0}//录入人id
    }, {
        classMethods: {
            associate: function(models) {

            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_sensitive_words',
        timestamps: true,//时间戳
        underscored:true,//下划线
        paranoid: true//逻辑删除
    });
};