/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Remark", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//说明ID
        type: { type: DataTypes.INTEGER,defaultValue: 0},//类型 1订单的备注 2报备备注 3申请备注
        status: { type: DataTypes.INTEGER,defaultValue: 0},//状态
        key: { type: DataTypes.INTEGER,defaultValue: 0},//外键id
        content: { type: DataTypes.STRING(256),defaultValue: ''},//说明内容
        create: { type: DataTypes.STRING,defaultValue: ''},//创建者
        ip: { type: DataTypes.STRING,defaultValue: ''},//ip地址
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_remark',
        timestamps: true
    });
};