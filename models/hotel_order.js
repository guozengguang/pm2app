/**
 * Created by Administrator on 2017/3/17 0017.
 */
var p_uid = require(process.cwd() + '/middlerware/id').p_uid;
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelOrder", {
        id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            comment: '订单ID',
            defaultValue: p_uid
        },
        activity: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '活动ID'
        },
        state: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            defaultValue: 0,
            comment: '订单 状态' //0未  1拒绝 2通过
        },
        operator: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '操作人ID'
        },
        human_count: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '活动报名人数'
        },
        room_count: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '房型以及人数'
        },
        room_bed: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '房型以及床位数'
        },
        price: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '预算价格'
        },
        reasons: {
            type: DataTypes.CHAR(200),
            defaultValue: '',
            comment: '原因'
        }
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelOrder.hasMany(models.HotelReservation ,{
                    foreignKey: 'order'
                });
                models.HotelOrder.belongsTo(models.HotelActivity,{foreignKey: 'activity'});
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_order',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};