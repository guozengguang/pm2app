/**
 * Created by Administrator on 2016/10/11 0011.
 */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define("Enterprise", {
        id : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},//申请id
        logo: { type: DataTypes.STRING,defaultValue: ''},//logo
        pics: { type: DataTypes.STRING,defaultValue: ''},//照片
        name: { type: DataTypes.STRING,defaultValue: ''},//名称
        province: { type: DataTypes.STRING,defaultValue: ''},//省
        city: { type: DataTypes.STRING,defaultValue: ''},//城市
        address: { type: DataTypes.STRING,defaultValue: ''},//地址
        phone: { type: DataTypes.STRING,defaultValue: ''},//电话
        trade: { type: DataTypes.STRING,defaultValue: ''},//行业
        website: { type: DataTypes.STRING,defaultValue: ''},//网站
        scale: { type: DataTypes.STRING,defaultValue: ''},//规模
        turnover: { type: DataTypes.STRING,defaultValue: ''},//营业额
        desc: { type: DataTypes.STRING(1500),defaultValue: ''},//介绍
        productDesc: { type: DataTypes.STRING,defaultValue: ''},//产品介绍
        productPics: { type: DataTypes.STRING,defaultValue: ''},//产品图片
        create: { type: DataTypes.STRING,defaultValue: ''},//创建者
        subscription: { type: DataTypes.STRING,defaultValue: ''},//订阅号
        status: { type: DataTypes.INTEGER,defaultValue: 0},//0 正常 1上墙 -1删除
        attributable: { type: DataTypes.INTEGER,defaultValue: 0},//归属者
    }, {
        classMethods: {
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'gj_enterprise',
        timestamps: true
    });
};