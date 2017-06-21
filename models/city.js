/**
 * Created by Administrator on 2016/10/26 0026.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("UntilCity", {
        city_id : {type : DataTypes.STRING, primaryKey : true},//序号
        city_name: { type: DataTypes.STRING, defaultValue:"",allowNull: false}, //名称
        city_parent_code: { type: DataTypes.STRING, defaultValue:"0" ,allowNull: false}//网址
    }, {
        classMethods: {},
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'until_city',
        timestamps: false
    });
};