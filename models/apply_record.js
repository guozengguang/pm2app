/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("ApplyRecord", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//申请id
        status: { type: DataTypes.INTEGER,defaultValue: 0},//状态
        key: { type: DataTypes.INTEGER,defaultValue: 0},//外键id apply.id
        name: { type: DataTypes.STRING(256),defaultValue: ''},//字段名称
        new_value: { type: DataTypes.STRING(256),defaultValue: ''},//字段值
        old_value: { type: DataTypes.STRING(256),defaultValue: ''},//字段值
        create: { type: DataTypes.STRING,defaultValue: ''},//创建者
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_apply_record',
        timestamps: true
    });
};