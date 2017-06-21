var StringBuilder = require('./StringBuilder');
var models  = require('../models');

module.exports={
    getUserClassById:function (opt) {
        var sequelize=new StringBuilder();
        sequelize.Append("SELECT good.goods_subtitle,members.mid,uc.uc_goodsid,uc.uc_areaid,uc.uc_calssroomid,uc.uc_calssroomname FROM gj_userclass as uc");
        sequelize.Append(" LEFT JOIN gj_goods as good ON uc.uc_goodsid=good.goodsid");
        sequelize.Append(" LEFT JOIN gj_members as members ON members.mid=uc.uc_userid");
        sequelize.AppendFormat(" WHERE uc.ucid={0}",opt.ucid);
        return models.sequelize.query(sequelize.ToString(),{ type: models.sequelize.QueryTypes.SELECT })
    }
}
