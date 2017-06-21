/**
 * Created by Administrator on 2017/3/17 0017.
 */
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelRoom", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        name: {
            type: DataTypes.CHAR(50),
            defaultValue: '',
            comment: '房间名称'
        },
        type: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            defaultValue: 0,
            comment: '类型' //0 不可拼 1可拼房
        },
        bed: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            comment: '床'
        },
        price: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            comment: '单间价格'
        },
        meals: {
            type: DataTypes.INTEGER(5).UNSIGNED,
            comment: '餐费'
        },
        link: {
            type: DataTypes.STRING(1024),
            defaultValue: '',
            comment: '房间链接'
        },
        hotel: {
            type: DataTypes.INTEGER.UNSIGNED,
            comment: '酒店ID'
        }
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelRoom.belongsTo(models.HotelDetail , { foreignKey: 'hotel', onDelete: 'SET NULL', as: 'Rooms' });
                models.HotelRoom.hasMany(models.HotelReservation ,{ foreignKey: 'room' });
                models.HotelRoom.hasMany(models.HotelActivityRelation ,{ foreignKey: 'room', as: 'Rooms' });
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_room',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};