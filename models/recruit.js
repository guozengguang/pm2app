"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Recruit", {
    recruitid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    recruit_area: { type: DataTypes.STRING, defaultValue:''},    //所属区域id
    recruit_itemarea: { type: DataTypes.STRING, defaultValue:''},    //子区域id
    recruit_members: { type: DataTypes.INTEGER, defaultValue:0},    //人员id
    recruit_remark: { type: DataTypes.STRING, defaultValue:''},    //备注
    recruit_status: { type: DataTypes.INTEGER, defaultValue:1},    //状态
  }, {
    classMethods: {
      associate: function(models) {
        models.Recruit.belongsTo(models.Members,{foreignKey: 'recruit_members'});
      },getAllClerk (option){
        var sql=new StringBuilder();
        //sql.AppendFormat("select area_city,areaid,area_name from gj_area where 1=1 and area_name IN ('北京') GROUP BY area_city ORDER BY area_city DESC");
        sql.AppendFormat("select recruit_area,m_name,mid from gj_recruit INNER JOIN gj_members ON gj_recruit.recruit_members=gj_members.mid where 1=1");
        if(option.recruit_area){
          sql.AppendFormat(" and recruit_area IN ({0})",option.recruit_area);
        }
        sql.AppendFormat(" ORDER BY recruit_area DESC");
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_recruit',
    timestamps: true
  });
};
