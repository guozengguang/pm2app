/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Diagram", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//说明ID
        status: { type: DataTypes.INTEGER,defaultValue: 1},//状态 1正常 0 删除
        stime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//开始时间
        etime:{type:DataTypes.DATE, defaultValue:DataTypes.NOW},//结束时间
        pics: { type: DataTypes.STRING(256),defaultValue: ''},//图片
        create: { type: DataTypes.STRING,defaultValue: ''},//创建者
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_diagram',
        timestamps: true
    });
};