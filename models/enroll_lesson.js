/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollLesson", {
        lesson_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//序号
        lesson_name: { type: DataTypes.STRING, defaultValue:"",allowNull: false}, //名称  不为空 goodsid
        lesson_alias: { type: DataTypes.STRING, defaultValue:"" ,allowNull: false}, //网址
        enroll_use: { type: DataTypes.STRING, defaultValue:"" }, //用途
        type: {type : DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },//类型 0 学员招生 1学院招生 2硅谷招生
        background_img: { type: DataTypes.STRING, defaultValue:"" }
    }, {
        classMethods: {},
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_lesson',
        timestamps: true
    });
};