"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Goodsrelated", {
    relatedid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    related_title: { type: DataTypes.STRING, defaultValue:''},    //标题
    related_subtitle: { type: DataTypes.STRING, defaultValue:''}, //字标题
    related_imgurl: { type: DataTypes.STRING, defaultValue:''},   //图片
    related_content: { type: DataTypes.TEXT, defaultValue:''},  //正文
    related_goodid: { type: DataTypes.INTEGER, defaultValue:0},   //课程外键
    related_fkey: { type: DataTypes.INTEGER, defaultValue:0},     //其他外键
    related_type: { type: DataTypes.INTEGER, defaultValue:10000},     //类型
    related_parent: { type: DataTypes.INTEGER, defaultValue:0},   //父id
    related_stauts: { type: DataTypes.INTEGER, defaultValue:0},    //状态
    related_order: { type: DataTypes.INTEGER, defaultValue:0}    //状态
  }, {
    classMethods: {
      associate: function(models) {
      },findgoodsdetail:function(condition){
        var sql=new StringBuilder();
   
        sql.AppendFormat("  select gs.relatedid,gs.related_parent,gs.related_fkey,case when  gspt.related_type = 6 then gc.classroom_name when gspt.related_type = 2  then mb.m_name else gs.related_title end as related_title,gs.related_subtitle,case when  gspt.related_type = 6  then gc.classroom_pics when gspt.related_type = 2  then mb.m_pics else gs.related_imgurl end as related_imgurl,case when  gspt.related_type = 6  then gc.classroom_remark when gspt.related_type = 2 then mb.m_desc  else gs.related_content  end as related_content,gs.related_type,gs.related_order,gd.goods_img,gd.goods_name from gj_goodsrelated as gs INNER JOIN gj_goods as gd on gs.related_goodid = gd.goodsid LEFT JOIN gj_goodsrelated as gspt on gspt.relatedid = gs.related_parent LEFT JOIN gj_classroom as gc on gc.classroom=gs.related_fkey LEFT JOIN gj_members as mb  on  mb.mid=gs.related_fkey and mb.m_type=1 where gd.goodsid = {0} ORDER BY case when gs.related_type =10000 then 10000 else 0 end,gs.related_order   ",condition.where.goodsid);
        
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_goodsrelated',
    timestamps: true
  });
};
