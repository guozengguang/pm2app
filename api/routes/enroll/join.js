/**
 * Created by Administrator on 2016/10/11 0011.
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var co = require('co');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
function find_or_create_user_id(res,target,data,cb) {//查询或者创建用户 并 返回id
    models.Members.findOrCreate({
        plain: true,
        raw: true,
        where: {
            m_phone: target
        },
        defaults: data
    }).then(function (user) {
        var mid;
        if(user[1]){//新数据
            mid = user[0].getDataValue('mid');
        }else {//旧数据
            mid = user[0].mid;
        }
        return cb(mid);
    },function (err) {
        return response.ApiError(res,{},err.message);
    });
}
function find_institute_id(res,cb) {//查询总院ID
    models.Classroom.findOne({
        where: {
            classroom_name: {
                $like: '%总院%'
            }
        },
        plain: true,
        raw: true,
        attributes: ['classroom']
    }).then((result)=>{
        return cb(result.classroom);
    },(err)=>{
        return response.ApiError(res,{},err.message);
    });
}
function save_enroll_info(res,data) {//保存报名信息
    models.EnrollUserClass.create(data).then(function(){
        return response.ApiSuccess(res,{},'报名成功');
    }, function(err){
        return response.ApiError(res,{},err.message);
    });
}
var getgoods = (lesson) => {
    var sql=new StringBuilder();
    //1检测是否存在该课程的报名
    sql.AppendFormat("select goodsid from gj_enroll_lesson as el inner JOIN gj_goods as goods ON goods.goodsid=el.lesson_name  where   el.type=0  and el.lesson_id ={0}" ,lesson);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
var checkjoin = (phone,lesson) => {
    var sql=new StringBuilder();
    //1检测是否存在该课程的报名
    sql.AppendFormat("select uc.en_mid from gj_enroll_user_class as uc INNER JOIN gj_members as m ON m.mid=uc.en_mid where m.m_phone={0} and (uc.en_goodsid in (select el.lesson_name from  gj_enroll_lesson as el WHERE el.lesson_id = {1} and el.type=0 ) or en_key_name = {1})" ,phone,lesson);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
var getclerkandentime = (phone) => {
    var sql=new StringBuilder();
    //1检测是否存在该课程的报名
    sql.AppendFormat("select m.mid,uc.en_clerkid, case when uc.en_goodsid=0 then  goods.goodsid else uc.en_goodsid end,en_time,el.lesson_id from gj_enroll_user_class as uc INNER JOIN gj_members as m ON m.mid=uc.en_mid AND m.m_phone={0} left JOIN gj_enroll_lesson as el on el.lesson_id = uc.en_key_name and el.type=0 left JOIN gj_goods as goods ON goods.goodsid=el.lesson_name  LIMIT 1" ,phone);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}
router.post('/', function (req, res) {
    var body = req.body;
    if( (!body.name || !body.phone || !body.province || !body.city || !body.lesson ) ){
        return response.ApiError(res, {} ,'参数有误');
    }
    var data = {
        en_mid: 0,//用户ID
        en_key_name: body.lesson,//课程索引
        en_classroomid:body.branch,//分院id
        en_form: 1//来源活动报名
    };
    var user_info = {
        m_name:body.name,//姓名
        m_phone:body.phone,//电话
        m_company:body.enterprise || '',//企业
        m_position:body.position || '',//职位
        m_area:body.province,//省
        m_city:body.city,//市
        m_reference_phone:body.touserid || "",//推荐人手机号
        m_trade:body.trade
    };
    co(function *() {
      try{
            var goods=yield getgoods(body.lesson);
            if(goods.length>0){
                 var hasjoin = yield checkjoin(body.phone,body.lesson);
                 if(hasjoin.length>0)
                 {
                    return response.ApiError(res,{message:'请勿重复报名！'})
                 }else{
                    var clerkandentime = yield getclerkandentime(body.phone);
                    if(clerkandentime.length>0)
                    {
                        data.en_clerkid = clerkandentime[0].en_clerkid;
                        data.en_time = clerkandentime[0].en_time;
                    }
                 }
                 
            }
            find_or_create_user_id(res,body.phone,user_info,function (mid) {
                data.en_mid = mid;
                if(!body.branch){
                    data.en_classroomid = 0;
                }
                save_enroll_info(res,data);
            })
        }catch (err){
            return response.ApiError(res,{message:'报名失败'})
        }
    })
});
module.exports = router;
