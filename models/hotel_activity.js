/**
 * Created by Administrator on 2017/3/17 0017.
 */
var base_url = require(process.cwd() + '/config/config').aly;
var _ = require('lodash');
"use strict";
module.exports = function (sequelize, DataTypes) {
    return sequelize.define("HotelActivity", {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            unique: true,
            comment: '主标识'
        },
        title: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '活动名称'
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
        address: {
            type: DataTypes.CHAR(50),
            allowNull: false,
            comment: '详细地址'
        },
        longitude: {
            type: DataTypes.CHAR(18),
            allowNull: false,
            comment: '经度 小数点后14位'
        },
        latitude: {
            type: DataTypes.CHAR(18),
            allowNull: false,
            comment: '纬度 小数点后14位'
        },
        start_time: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '开始时间',
            validate: {
                isDate: true
            }
        },
        end_time: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '结束时间',
            validate: {
                isDate: true
            }
        },
        enroll_start_time: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '报名开始时间',
            validate: {
                isDate: true
            }
        },
        enroll_end_time: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '报名结束时间',
            validate: {
                isDate: true
            }
        },
        human_upper: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '活动人数上限',
            validate: {
                isLess: function (value) {
                    if(+this.getDataValue('human_lower') > +value){
                        throw new Error('人数下限不能大于人数上限');
                    }
                    if(+value < 0 ){
                        throw new Error('人数上限不能小于0');
                    }
                }
            }
        },
        human_lower: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            comment: '活动人数下限',
            validate: {
                isLess: function (value) {
                    if(+value < 0 ){
                        throw new Error('人数下限不能小于0');
                    }
                }
            }
        },
        enough_human: {
            type: DataTypes.INTEGER.UNSIGNED,
            comment: '人数足够的人数'
        },
        enough_price: {
            type: DataTypes.INTEGER.UNSIGNED,
            comment: '人数足够的价格'
        },
        not_enough_human: {
            type: DataTypes.INTEGER.UNSIGNED,
            comment: '不足人数'
        },
        not_enough_price: {
            type: DataTypes.INTEGER.UNSIGNED,
            comment: '不足价格'
        },
        partake_type: {
            type: DataTypes.INTEGER(1).UNSIGNED,
            allowNull: false,
            comment: '参加类型' // 0 不限 1学员 2非学员 3课程班
        },
        lessons: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '课程班id',
            get: function()  {
                return this.getDataValue('lessons').split(',');
            }
        },
        manager: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '负责人姓名'
        },
        manager_phone: {
            type: DataTypes.BIGINT(11).UNSIGNED,
            allowNull: false,
            comment: '负责人手机号'
        },
        describe: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '描述'
        },
        cover_picture: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '图片',
            get: function()  {
                return base_url + '/' + this.getDataValue('cover_picture');
            }
        },
        picture: {
            type: DataTypes.STRING,
            comment: '图片',
            defaultValue: '',
            get: function()  {
                var title = this.getDataValue('picture');
                if(!title){
                    return [];
                }
                var arr = title.split(',');
                _.forEach(arr, function (v, i) {
                    arr[i] = base_url + '/' + v;
                });
                return arr;
            }
        },
        areas: {
            type: DataTypes.STRING,
            defaultValue: '',
            get: function()  {
                var areas = this.getDataValue('areas');
                return areas ? areas.split(','): [];
            },
            comment: '学区'
        },
        branches: {
            type: DataTypes.STRING,
            get: function()  {
                var branches = this.getDataValue('branches');
                return branches.split(',');
            },
            allowNull: false,
            comment: '分院'
        },
        is_stay: {
            type: DataTypes.BOOLEAN,
            comment: '是否住宿',
            defaultValue: false
        },
        state: {
            type: DataTypes.INTEGER(2),
            allowNull: false,
            comment: '状态'
        },
        branch: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '发起学院'
        },
        cause: {
            type: DataTypes.STRING,
            comment: '拒绝原因'
        },
        newenroll_id: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: '招生简章'
        },
    }, {
        classMethods: {
            associate: function (models) {
                models.HotelActivity.hasMany(models.HotelReservation ,{ foreignKey: 'activity' });
                models.HotelActivity.hasMany(models.HotelOrder ,{ foreignKey: 'activity' });
                models.HotelActivity.belongsTo(models.Classroom,{foreignKey: 'branch'});
            }
        },
        freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
        tableName: 'hotel_activity',
        timestamps: true,
        underscored: true,
        paranoid: true
    });
};