/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("BranchEnroll", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//报名ID
        name: { type: DataTypes.STRING, defaultValue:"",allowNull: false},//姓名
        phone: { type: DataTypes.STRING(11), defaultValue:"" ,allowNull: false},//手机
        enterprise: { type: DataTypes.STRING, defaultValue:"" },//企业
        position: { type: DataTypes.STRING, defaultValue:"" },//职位
        province: { type: DataTypes.STRING, defaultValue:"" },//省份
        city: { type: DataTypes.STRING, defaultValue:''},   //市
        reference: { type: DataTypes.STRING(11), defaultValue:"" }//推荐人
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_branch_enroll',
        timestamps: true
    });
};