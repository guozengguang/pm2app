"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Class", {
    classid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    class_goodsid: { type: DataTypes.INTEGER, defaultValue:0},    //商品id
    class_teacherid: { type: DataTypes.INTEGER, defaultValue:0},    //讲师id
    class_teacher: { type: DataTypes.STRING, defaultValue:''},    //讲师id
    class_order: { type: DataTypes.INTEGER, defaultValue:0},    //序号
    class_teacherphone: { type: DataTypes.STRING(16), defaultValue:'' },   //讲师手机
    class_teachername: { type: DataTypes.STRING(16), defaultValue:''},    //讲师名称
    class_name: { type: DataTypes.STRING(24), defaultValue:"" },     //课程名称
    class_img: { type: DataTypes.STRING, defaultValue:"" },     //课程封面照
    class_back_pics: { type: DataTypes.STRING, defaultValue:"" },     //课程回顾封面照
    class_summary: { type: DataTypes.STRING, defaultValue:"" },     //课程介绍
    class_content: { type: DataTypes.TEXT, defaultValue:"" },     //课程内容
    class_back: { type: DataTypes.TEXT, defaultValue:"" },     //课程内容
    class_start: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //课程开始时间
    class_end: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //课程结束时间
    class_qustart: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //提问开始时间
    class_quend: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //提问结束时间
    class_asstart: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //投票开始时间
    class_asend: { type: DataTypes.DATE, defaultValue:DataTypes.NOW },     //投票结束时间
    class_status: { type: DataTypes.INTEGER, defaultValue:1 },     //状态 1有效 0无效
    class_rewardstatus: { type: DataTypes.INTEGER, defaultValue:0 },     //打赏状态 1有效 0无效
    class_qustatus: { type: DataTypes.INTEGER, defaultValue:0 },     //问题状态 0不许  1可以进入列表 2可以提问
    class_value_link: { type: DataTypes.STRING(128), defaultValue:'' },     //评价链接
    class_create: { type: DataTypes.STRING(16), defaultValue:"" },    //创建者
    class_note: { type: DataTypes.INTEGER, defaultValue:0 }     //短信通知状态
  }, {
    classMethods: {
      associate: function(models) {
        models.Class.belongsTo(models.Goods,{foreignKey: 'class_goodsid'});
        models.Class.belongsTo(models.Members,{foreignKey: 'class_teacherid'});
      },findclassmediaattach:function(condition){
        var sql=new StringBuilder();
   
        sql.AppendFormat(" select a.attachid,a.attach_duration,pa.prd_auther,pa.prd_title,a.attach_path,pa.prd_pics as attach_pics from gj_prdattach as pa LEFT  JOIN gj_attach as a on pa.attachid=a.attachid where a.attach_type=1 and pa.prdid ={0}  and pa.prd_type=10 LIMIT 1 ",condition.where.classid);
          
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_class',
    timestamps: true
  });
};
