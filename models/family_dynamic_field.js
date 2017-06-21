"use strict";
/**
 * 家庭信息动态字段表
 * @param  {[type]} sequelize [description]
 * @param  {[type]} DataTypes [description]
 * @return {[type]}           [description]
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("FamilyDynamicField", {
        field_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//主键id
        key: { type: DataTypes.STRING, defaultValue:''},   //字段名
        value: { type: DataTypes.STRING, defaultValue:''},    //字段值
        family_id: { type: DataTypes.INTEGER, defaultValue:0},    //Family外键
        creater: { type: DataTypes.INTEGER, defaultValue:0},    //创建人
        updater: { type: DataTypes.INTEGER, defaultValue:0}   //修改人
    }, {
        classMethods: {
            associate: function(models) {
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_family_dynamic_field',
        timestamps: true, //时间戳
        underscored:true, //下划线
        paranoid: true//逻辑删除
    });
};
