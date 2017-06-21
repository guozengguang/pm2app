"use strict";
var StringBuilder = require('../utils/StringBuilder');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Members", {
    mid : {type : DataTypes.INTEGER, autoIncrement : true, primaryKey : true, unique : true},
    m_type: { type: DataTypes.INTEGER, defaultValue:0},          //身份0=学生 1=老师 2系统用户 3业务人员（招生老师） 4院办 10员工
    m_phone: { type: DataTypes.STRING, defaultValue:"" },     //手机号
    m_code: { type: DataTypes.STRING, defaultValue:"+86" },     //手机区号
    m_password: { type: DataTypes.STRING, defaultValue:"" },     //手机区号
    m_card: { type: DataTypes.STRING, defaultValue:"" },     //身份证
    m_name: { type: DataTypes.STRING, defaultValue:"" },     //昵称
    m_title: { type: DataTypes.STRING, defaultValue:"" },     //头衔
    m_pics:{type : DataTypes.STRING,defaultValue:''},        //头像
    m_email:{type : DataTypes.STRING,defaultValue:''},        //邮箱
    m_url:{type : DataTypes.STRING,defaultValue:''},        //公司网址
    m_place:{type : DataTypes.STRING,defaultValue:''},        //地点
    m_company:{type : DataTypes.STRING,defaultValue:''},        //公司名称
    m_position:{type : DataTypes.STRING,defaultValue:''},        //职务
    m_desc:{type : DataTypes.STRING(500),defaultValue:''},      //签名
    m_status:{type : DataTypes.INTEGER,defaultValue:0},      //状态  0注册 1 会员
    m_firstabv:{type : DataTypes.STRING,defaultValue:'#'},  //  首字母
    m_firstsend:{type : DataTypes.INTEGER,defaultValue:0},  //登陆次数
    m_background:{type : DataTypes.INTEGER,defaultValue:1},  //背景图
    m_home_background:{type : DataTypes.STRING,defaultValue:''},  //背景图(版本新增，之前的废弃)
    m_area:{type : DataTypes.STRING,defaultValue:''},      //地区
    m_city:{type : DataTypes.STRING,defaultValue:''},      //城市
    m_badge:{type : DataTypes.STRING,defaultValue:''},        //标签
    m_sex:{type : DataTypes.STRING,defaultValue:''},       //性别
    m_class:{type : DataTypes.STRING,defaultValue:''},        //我的班级
    m_teacherqrcode:{type : DataTypes.STRING,defaultValue:''},        //打赏二维码
    m_teachertitleimg:{type : DataTypes.STRING,defaultValue:''},        //打赏标题
    m_teacherrightimg:{type : DataTypes.STRING,defaultValue:''},        //打赏头像
    m_department:{type : DataTypes.INTEGER,defaultValue:0},     //部门
    m_ishidephone:{type : DataTypes.INTEGER,defaultValue:1},     //0不显示 1显示是否隐藏手机号
    m_level:{type : DataTypes.INTEGER,defaultValue:0}, //内部等级
    m_order:{type : DataTypes.INTEGER,defaultValue:0},  // 排序

    m_depart:{type : DataTypes.STRING,defaultValue:''},     //部门 员工类型的使用了department最为部门的关联属性 设置depart作为字符串的部门
    m_reference_phone: { type: DataTypes.STRING(11), defaultValue:''},    //推荐人手机号
    m_lnasset: { type: DataTypes.INTEGER, defaultValue:0},    //公司规模
    m_education: { type: DataTypes.STRING, defaultValue:''},    //学历
    m_age: { type: DataTypes.STRING, defaultValue:''},    //年龄
    m_school: { type: DataTypes.STRING, defaultValue:''},    //学校
    m_telephone: { type: DataTypes.STRING, defaultValue:''},    //电话
    m_fax: { type: DataTypes.STRING, defaultValue:''},    //传真
    m_birthday: { type: DataTypes.DATE, defaultValue:DataTypes.NOW},    //生日
    m_trade: { type: DataTypes.STRING, defaultValue:''},    //所属行业
    m_vip: { type: DataTypes.INTEGER, defaultValue:0},    //0不是 1是 梦想发起人
  }, {
    classMethods: {
      associate: function(models) {
        models.Members.hasOne(models.EnrollUserClass,{foreignKey: 'en_mid'});
        models.Members.hasOne(models.Userclass,{foreignKey: 'uc_userid'});
        //models.Members.hasOne(models.Userclass,{foreignKey: 'uc_clerkid',as:'cl'});
        models.Members.hasOne(models.Question,{foreignKey: 'question_fromuser'});
        models.Members.hasOne(models.Classvalue,{foreignKey: 'value_user'});
        models.Members.hasOne(models.Recruit,{foreignKey: 'recruit_members'});
        models.Members.hasOne(models.Class,{foreignKey: 'class_teacherid'});
        models.Members.hasOne(models.Feedback,{foreignKey: 'feedback_fromuser'});
      },getmemberinfo:function(condition){
        var sql=new StringBuilder();
        console.log(condition);
        sql.Append("select mb.m_ishidephone,mb.m_firstabv as m_firstabv,mb.m_name as user_name,mb.m_background as user_background,mb.m_sex as user_sex,mb.m_pics as user_pics,mb.m_position as user_position,mb.m_phone as user_phone,m_url as user_url,m_place as user_place,m_company as user_company,m_desc as company_desc,mb.m_email as user_email,case when mb.m_type in (4,5,6,7,8,9) then '' else ucg.goods_name end as goods_name,ucg.isover,case when mf.myfriend_type = 0 and  (mf1.myfriend_type = 0 or mf1.myfriend_type = 1)  then 1 else 0 end as ismyfriend,mf.myfriend_type,case when mf.myfriend_isdisturb is null then 0 else mf.myfriend_isdisturb end as myfriend_isdisturb,case when mf.myfriend_istop is null then 0 else mf.myfriend_istop end as myfriend_istop,case when mb.m_type in (4,5,6,7,8,9) then gpc.classroom_name else ucg.uc_calssroomname end as uc_calssroomname  ")
        sql.AppendFormat(" from gj_members as mb LEFT join gj_myfriend  as mf on mb.mid=mf.myfriend_user and mf.myfriend_owner={0}  left join gj_myfriend as mf1 on mb.mid=mf1.myfriend_owner and mf1.myfriend_user={0}  ",condition.where.mid);
        sql.AppendFormat(" LEFT JOIN (select uc_userid,g.goods_subtitle  as goods_name,uc_calssroomname,case when g.goods_end is null then 2 when now() > g.goods_end then 1 else 0 end as isover from gj_userclass  as uc  LEFT JOIN gj_goods as g on g.goodsid=uc.uc_goodsid where uc.uc_userid={0} order by g.goods_end   limit 1 ) as ucg on mb.mid=ucg.uc_userid left join (select classroom_name from gj_group as gp INNER  JOIN gj_groupuser as gpu on gpu.groupuser_group=gp.groupid INNER JOIN gj_classroom as cr on cr.classroom=gp.group_classroomid where gpu.groupuser_user={0} and group_type = 9 LIMIT 1 ) as gpc on 1=1 ",condition.where.friendid);
        sql.AppendFormat(" where mb.mid={0} group by user_name,user_pics,user_position, user_phone,user_email,ucg.goods_name,user_url,user_place,user_company,company_desc,myfriend_type,myfriend_isdisturb,myfriend_istop ",condition.where.friendid);
        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      },getmembersbycontent:function(condition){
        var sql=new StringBuilder();
        sql.AppendFormat("select m_pics,m_name,m_type,m_position,m_phone,m_company,mid,m_firstabv,uc.uc_calssroomname,case when mf.myfriendId is null or mf1.myfriendId is null then 1 else 0 end as isadd from gj_members as mb INNER JOIN gj_userclass  as uc on mb.mid = uc.uc_userid LEFT JOIN gj_myfriend as mf on mf.myfriend_owner = {0} and mf.myfriend_user =mb.mid and mf.myfriend_type = 0  LEFT JOIN gj_myfriend as mf1 on  mf1.myfriend_user = {0} and mf1.myfriend_owner =mb.mid and mf1.myfriend_type = 0  where (m_name like '%"+condition.where.qcontent+"%' or m_phone like '%"+condition.where.qcontent+"%' or m_company like '%"+condition.where.qcontent+"%') and m_status=1 and mid <> {0} and uc.uc_calssroomname <> '北京总院'  group by m_pics,m_name,m_type,m_position,m_phone,m_company,mid,m_firstabv,isadd ORDER BY m_firstabv  limit 200 ",condition.where.userid)

        return sequelize.query(sql.ToString(),{ type: sequelize.QueryTypes.SELECT });
      }
    },
    freezeTableName: true, // 默认false修改表名为复数，true不修改表名，与数据库表名同步
    tableName: 'gj_members',
    timestamps: true
  });
};
