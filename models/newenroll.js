
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("NewEnroll", {
        newenroll_id : {type : DataTypes.STRING,defaultValue:"",primaryKey : true, unique : true},//序号
        adimg_url: { type: DataTypes.STRING, defaultValue:""}, //宣传图地址
        course_name: { type: DataTypes.STRING, defaultValue:""}, //课程活动名称
        template_typename: { type: DataTypes.STRING, defaultValue:"" }, //模板类型
        is_reuse_template: {type : DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },//是否复用该模板
        isshow_in_applypage: {type : DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },//是否在报名页面显示
        apply_begin_time: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },//报名开始时间
        apply_end_time:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},//报名结束时间
        course_begin_time:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},//课程/活动开始时间
        course_end_time:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},//课程/活动结束时间
        apply_count:{type:DataTypes.INTEGER,defaultValue:0},//报名人数
        apply_identity:{type:DataTypes.STRING,defaultValue:""},//身份限制(可以为组合字符串)
        course_identity:{type:DataTypes.STRING,defaultValue:""},//课程限制(当身份限制选了学员的时候才有课程的限制)
        course_charge:{type:DataTypes.DECIMAL(10,6),defaultValue:0.00},//费用(如果为已存在的课程或活动，费用直接反显出来；如果为系统中未存在的课程或活动，手动填写费用)
        discount_charge:{type:DataTypes.DECIMAL(10,6),defaultValue:0.00},//折扣费用
        takepartin_branch:{type:DataTypes.STRING,defaultValue:""},//参与分院
        apply_remark:{type:DataTypes.STRING,defaultValue:""},//报名说明
        success_hint:{type:DataTypes.STRING,defaultValue:""},//提示说明
        success_branch:{type:DataTypes.STRING,defaultValue:""},//非分院或者分院活动地址
        success_longitude:{type:DataTypes.STRING,defaultValue:""},//经度
        success_latitude:{type:DataTypes.STRING,defaultValue:""},//纬度
        success_stay:{type:DataTypes.STRING,defaultValue:""},//住宿预订
        success_other:{type:DataTypes.STRING,defaultValue:""},//其他内容
        create_date:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},//生成日期
        enroll_status:{type:DataTypes.INTEGER,defaultValue:0},//状态 1上架 0下架
        jz_name:{type:DataTypes.STRING,defaultValue:""},//简章名称
        bm_hint:{type:DataTypes.STRING,defaultValue:""},//报名备注
        success_dx_content:{type:DataTypes.STRING,defaultValue:""},//报名成功短信内容
        success_isshowbranchmap:{type:DataTypes.INTEGER,defaultValue:0},//报名成功页是否显示分院地图
        success_notbranchaddress:{type:DataTypes.STRING,defaultValue:""},//报名成功页非分院地址
        update_date:{type:DataTypes.DATE,defaultValue:DataTypes.NOW},//更新时间
        qt_jz_name:{type:DataTypes.STRING,defaultValue:""},//其他简章名
        hotel_activity_id:{type:DataTypes.INTEGER,defaultValue:0},//活动id
        project_type:{type:DataTypes.INTEGER,defaultValue:0},//项目类型:0:课程;1:活动;2:其他;
        code_url:{type:DataTypes.STRING,defaultValue:""},//二维码URL;
        creater:{type:DataTypes.INTEGER,defaultValue:0},//创建人
        updater:{type:DataTypes.INTEGER,defaultValue:0}//修改人
    }, {
        classMethods: {},
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_new_enroll',
        timestamps: false
    });
};