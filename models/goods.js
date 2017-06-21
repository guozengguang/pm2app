"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Goods", {
    goodsid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    goods_name: { type: DataTypes.STRING(24), defaultValue:"" },     //商品名称
    goods_img: { type: DataTypes.STRING, defaultValue:"" },     //商品封面照
    goods_titleimg: { type: DataTypes.STRING, defaultValue:"" },     //商品标题图
    goods_img_small: { type: DataTypes.STRING, defaultValue:"" },     //小图片
    goods_summary: { type: DataTypes.STRING, defaultValue:"" },     //商品介绍
    goods_teacher: { type: DataTypes.STRING, defaultValue:"" },     //主讲老师
    goods_content: { type: DataTypes.TEXT, defaultValue:"" },     //商品内容内容
    goods_fee: { type: DataTypes.DECIMAL(18,2),defaultValue:0.00 },     //商品费用
    goods_time : { type: DataTypes.STRING, defaultValue:"" },     //上课时间
    goods_ismore: { type: DataTypes.INTEGER, defaultValue:1 },     //是否有更多
    goods_class : { type: DataTypes.STRING, defaultValue:"" },     //课次数
    goods_start: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //商品开始时间
    goods_end: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //商品结束时间
    goods_type: { type: DataTypes.INTEGER, defaultValue:2 },     //商品类型 0定制课 1公益课 2公开课
    goods_status: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 1有效 0无效
    goods_report_status: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 1非报备 0报备
    goods_attr: { type: DataTypes.INTEGER, defaultValue:0 },     //状态 1置顶 0默认
    goods_subtitle: { type: DataTypes.STRING, defaultValue:'' },     //描述
    goods_desc: { type: DataTypes.STRING, defaultValue:'' },     //招生描述
    goods_branch: { type: DataTypes.STRING, defaultValue:'' },     //开课区域
    goods_create: { type: DataTypes.STRING(16), defaultValue:"" }     //创建者
  }, {
    classMethods: {
      associate: function(models) {
        models.Goods.hasMany(models.Class,{foreignKey: 'class_goodsid'});
        models.Goods.hasOne(models.Userclass,{foreignKey: 'uc_goodsid'});
      },findgoodsmediaattach:function(condition){
        var sql=new StringBuilder();
   
        sql.AppendFormat(" select pa.prd_auther,pa.prd_title as attach_title,pa.prd_pics,a.attach_duration,a.attach_path,a.createdAt,a.attach_count,a.attachid from gj_prdattach as pa LEFT  JOIN gj_attach as a on pa.attachid=a.attachid INNER JOIN gj_class as c on (c.classid = pa.prdid and pa.prd_type=10) or (c.class_goodsid = pa.prdid and pa.prd_type=1) where a.attach_type=1 and c.class_goodsid ={0} group by pa.prd_auther,a.attach_title,a.attach_path,a.createdAt,a.attach_count,a.attachid order by  pa.prd_type,pa.prd_desc ",condition.where.goodsid);
          
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_goods',
    timestamps: true
  });
};
