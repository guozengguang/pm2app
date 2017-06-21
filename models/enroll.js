/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollInfo", {
        enroll_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//报名ID
        enroll_name: { type: DataTypes.STRING, defaultValue:"",allowNull: false}, //姓名
        enroll_phone: { type: DataTypes.STRING(11), defaultValue:"" ,allowNull: false}, //手机
        enroll_enterprise: { type: DataTypes.STRING, defaultValue:"" }, //企业
        enroll_position: { type: DataTypes.STRING, defaultValue:"" }, //职位
        enroll_address: { type: DataTypes.STRING, defaultValue:"" ,allowNull: false}, //所在地
        enroll_area_id: { type: DataTypes.INTEGER, defaultValue:0}, //分院id
        enroll_reference_phone: { type: DataTypes.STRING(11), defaultValue:"" },     //推荐人手机号
        enroll_lesson_id: { type: DataTypes.INTEGER,allowNull: false},//课程ID
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_info',
        timestamps: true
    });
};
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollLesson", {
        lesson_list_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//报名ID
        lesson_name: { type: DataTypes.STRING, defaultValue:"",allowNull: false}, //姓名
        lesson_phone: { type: DataTypes.STRING(11), defaultValue:"" ,allowNull: false}, //手机
        enroll_enterprise: { type: DataTypes.STRING, defaultValue:"" }, //企业
        enroll_position: { type: DataTypes.STRING, defaultValue:"" }, //职位
        enroll_address: { type: DataTypes.STRING, defaultValue:"" ,allowNull: false}, //所在地
        enroll_area_id: { type: DataTypes.INTEGER, defaultValue:0}, //分院id
        enroll_reference_phone: { type: DataTypes.STRING(11), defaultValue:"" },     //推荐人手机号
    }, {
        classMethods: {},
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_lesson',
        timestamps: true
    });
};
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("EnrollUse", {
        use_id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//报名ID
        use_name: { type: DataTypes.STRING, defaultValue:"",allowNull: false}, //姓名
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enroll_use',
        timestamps: true
    });
};