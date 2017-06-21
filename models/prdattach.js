"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Prdattach", {
    prdattachid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    prdid: { type: DataTypes.INTEGER, defaultValue:0},    //外键id
    attachid: { type: DataTypes.INTEGER, defaultValue:0},    //附件id
    prd_type: { type: DataTypes.INTEGER, defaultValue:0},    //类型0 goods 10 class 20精彩锦集 30special 40课后回顾
    prd_auther: { type: DataTypes.STRING, defaultValue:''},    //作者
    prd_desc: { type: DataTypes.STRING, defaultValue:''},   //排序
    prd_title: { type: DataTypes.STRING, defaultValue:''},   //标题
    prd_pics: { type: DataTypes.STRING, defaultValue:''},   //图片
    prd_content: { type: DataTypes.TEXT, defaultValue:''},   //内容
  }, {
    classMethods: {
        getPrdidAndType(option){
          var sql=new StringBuilder();
          sql.Append("select * from gj_prdattach");
          sql.Append(" INNER JOIN gj_attach on gj_attach.attachid=gj_prdattach.attachid");
          if(option.type==1){
            sql.AppendFormat(" INNER JOIN gj_goods on gj_goods.goodsid=gj_prdattach.prdid where gj_prdattach.prd_type=1 and gj_prdattach.prdid={0}",option.id);
          }
          if(option.type==10){
            sql.AppendFormat(" INNER JOIN gj_class on gj_class.classid=gj_prdattach.prdid where gj_prdattach.prd_type=10 and gj_prdattach.prdid={0}",option.id);
          }
          if(option.type==20){
            sql.AppendFormat(" where gj_prdattach.prd_type=20");
          }
          if(option.type==30){
            sql.AppendFormat(" INNER JOIN gj_special on gj_special.special_id=gj_prdattach.prdid where gj_prdattach.prd_type=30 and gj_prdattach.prdid={0}",option.id);
          }
          if(option.type==40){
            sql.AppendFormat(" INNER JOIN gj_topic on gj_topic.topic_id=gj_prdattach.prdid where gj_prdattach.prd_type=40 and gj_prdattach.prdid={0}",option.id);
          }
          sql.AppendFormat(" ORDER BY gj_prdattach.prd_desc*1 desc");

          return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
        },getPrdidAndTypeApp(option){
        var sql=new StringBuilder();
          sql.Append("select at.attachid,at.attach_path,prd.prd_auther,at.attach_count,prd.prd_pics,at.attach_duration from gj_prdattach as prd");
          sql.Append(" INNER JOIN gj_attach as at on at.attachid=prd.attachid");
          sql.AppendFormat(" where prd.prd_type=20");
          sql.AppendFormat(" ORDER BY prd.prd_desc desc limit {1},{0}",option.limit,option.offset);

          return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
        }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_prdattach',
    timestamps: true
  });
};
