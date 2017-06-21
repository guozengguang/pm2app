"use strict";
/**
 * 论坛管理表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Forum", {
        forum_id:{type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
        forum_name:{type:DataTypes.STRING,defaultValue:""},//名称
        forum_status : {type : DataTypes.INTEGER, defaultValue:0},//状态：论坛状态：0：关闭；1：开启
        forum_type : {type : DataTypes.INTEGER, defaultValue:0},//方式：0：先发后审；1：先审后发
        key:{type:DataTypes.STRING,defaultValue:""},//外键
        forum_publish_authority : {type : DataTypes.STRING, defaultValue:""},//发表权限，多个用，隔开
        forum_reply_authority : {type : DataTypes.STRING, defaultValue:""},//回复权限，多个用，隔开
        forum_sensitive_filter : {type : DataTypes.INTEGER, defaultValue:0},//敏感词过滤开关：0：不开启；1：开启
        uid : {type : DataTypes.INTEGER, defaultValue:0},//创建人
        update_uid : {type : DataTypes.INTEGER, defaultValue:0}//修改人
    }, {
        classMethods: {
            associate: function(models) {

            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_forum',
        timestamps: true,//时间戳
        underscored:true,//下划线
        paranoid: true//逻辑删除
    });
};