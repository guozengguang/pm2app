/**
 * Created by Administrator on 2017/3/17 0017.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelDetail", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        name: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '酒店名称'
        },
        phone: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '酒店电话'
        },
        introduce: {
            type: DataTypes.STRING(1000),
            allowNull: false,
            comment: '酒店介绍'
        },
        cover_photo: {
            type: DataTypes.STRING(1024),
            allowNull: false,
            comment: '封面图'
        },
        meals: {
            type: DataTypes.INTEGER(5).UNSIGNED,
            allowNull: false,
            comment: '餐费' // 1幼儿 2小学 3中学 4高中
        },
        province: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '省/市'
        },
        city: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '市/县'
        },
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelDetail.hasMany(models.HotelRoom ,{
                    foreignKey: 'hotel',
                    onDelete: 'SET NULL',
                    as : 'Rooms'
                });
                models.HotelDetail.hasMany(models.HotelReservation ,{ foreignKey: 'hotel' });
                models.HotelDetail.hasMany(models.HotelActivityRelation ,{ foreignKey: 'hotel' });
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_detail',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};