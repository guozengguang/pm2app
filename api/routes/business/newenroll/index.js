/**
 * 通过报名保存数据接口
 */
var express = require('express');
var router = express.Router();
var models = require(process.cwd() + '/models/index');
var response = require(process.cwd() + '/utils/response');
var token = require(process.cwd() + '/utils/token');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var hx = require(process.cwd() + '/utils/hxchat');
var page = require(process.cwd() + '/utils/page');
var str = require(process.cwd() + '/utils/str');
var co = require('co');
var moment = require('moment');
var sms = require(process.cwd() + '/utils/sms');

var informConfig={//验证码短信配置
    appId: '8a216da855826478015591039ace073c',//应用id
    templateId: '97740',//短信模板id
    accountSid: '8a48b55153eae51101540dc38ef1365c',//主账户id
    authtoken: 'db6ea888164c485fb64fb6c0122a938d',//token
    lostdata: '30',//短信失效时间
    host: "app.cloopen.com",  //主域名
    port: 8883  //端口
}

/**
 * 通过手机号获取我的mid
 * @param phone
 * @returns {*}
 */
var getMemberId = (phone) => {
    "use strict";
    return models.Members.findOne({
        where:{m_phone:phone},
        raw:true,
        attributes:['mid']
    })
}

/**
 * 新增报备
 * @param body
 * @returns {body}
 */
var setClassRoom = (body) => {
    "use strict";
    return models.EnrollUserClass.create(body)
}

/**
 * 新增学员
 * @param body
 * @returns {body}
 */
var setMember = (body) => {
    "use strict";
    return models.Members.create(body)
}

/**
 * 根据mid查询是否存在报名或者报备
 * @param phone
 * @returns {*}
 */
var checkEnrollAndReport = (mid) => {
    "use strict";
    return models.EnrollUserClass.findOne({
        where:{en_mid:mid},
        raw:true
    })

}


/**
 * 新增验证码记录
 * @param body
 * @returns {body}
 */
var setSms = (body) => {
    return models.Smscode.create(body);
};

/**
 * 验证有效性
 * @param option
 * @returns {*}
 */
var checkSms = (option) => {
    "use strict";
    var time=option.time || 30;//默认三十分钟
    var sql=new StringBuilder();
    sql.AppendFormat("select sms.smscode as code " +
        "from gj_smscode as sms " +
        "where phoneno={0} AND type={1} AND createdAt <= '{2}' " +
        "ORDER BY createdAt DESC " +
        "LIMIT 1",option.phone,option.type,moment().add(time,'minute').format());
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
};

/**
 * 查询是否存在报名记录
 * @param mid
 * @param goodsid
 * @returns {*}
 */
var checkClassRoomMidGoodsid = (mid,goodsid,classroom) => {
    "use strict";
    var sql=new StringBuilder();
    sql.AppendFormat("select en_uid,en_mid,en_clerkid from gj_enroll_user_class as uc " +
        "INNER JOIN gj_enroll_lesson as en ON en.lesson_id=uc.en_key_name AND en.lesson_name={1} AND en.type=0 " +
        "WHERE en_form=1 AND en_mid={0} " +
        "UNION ALL " +
        "select en_uid,en_mid,en_clerkid from gj_enroll_user_class as uc " +
        "WHERE en_form=0 AND en_goodsid={1} AND en_mid={0} and en_classroomid={2} limit 1 ",mid,goodsid,classroom);
    return models.sequelize.query(sql.ToString(),{ type: models.sequelize.QueryTypes.SELECT });
}

var checkClassRoomMid = (mid) => {
    "use strict";
    return models.EnrollUserClass.findOne({
        where:{en_mid:mid},
        raw:true,
        attributes:['en_time','en_clerkid','en_status'],
        order:[['en_status','DESC']]
    })
}

/**
 * 报名提交入口(非招生简章或者报备)---如:小程序
 */
router.post('/submit-enroll',function (req,res) {
    var body=req.body;
    if(!body.phone || !body.name || !body.goodsid || !body.classroom || !body.code){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            var check=yield checkSms({phone:body.phone,type:9})
            if(check.length==1 && check[0].code==body.code){
                //检查手机用户是否存在不存在创建 存在手机号码的直接拿出id
                var en_mid=yield getMemberId(body.phone);
                if(!en_mid){
                    var addMember=yield setMember({
                        m_phone: body.phone,
                        m_name: body.name,
                        m_company: body.company,
                        m_position: body.position,
                    })
                    en_mid={mid:addMember.dataValues.mid}
                    //去环信注册
                    hx.reghxuser({username:en_mid.mid},function(err,result){
                        console.log(err,'err')
                        console.log(result,'result')
                    });
                }
                //存在mid，检查是否存在en_uid
                var en_uid = yield checkEnrollAndReport(en_mid.mid);
                if(!en_uid){
                    //报名报备表中保存数据
                    yield setClassRoom({
                        en_mid:en_mid.mid,
                        en_goodsid:body.goodsid,
                        en_classroomid:body.classroom,
                        en_time:new Date(),
                        en_form:0
                    })
                    return response.ApiSuccess(res,{message:'报名成功'})
                }

                if(en_uid && !en_uid.en_clerkid){
                    var checkRoom=yield checkClassRoomMidGoodsid(en_mid.mid,body.goodsid,body.classroom);
                    if(checkRoom && checkRoom.length>0){
                        return response.ApiError(res,{code:401,message:'已存在报名'})
                    }else{
                        yield setClassRoom({
                            en_mid:en_mid.mid,
                            en_goodsid:body.goodsid,
                            en_classroomid:body.classroom,
                            en_time:new Date(),
                            en_form:0
                        })
                        return response.ApiSuccess(res,{message:'报名成功'})
                    }
                }else{
                    //检测这个用户这个课程是否报名过
                    var checkClassRoom=yield checkClassRoomMidGoodsid(en_mid.mid,body.goodsid,body.classroom);
                    if(checkClassRoom && checkClassRoom.length>0){
                        checkClassRoom=checkClassRoom[0]
                        // { en_uid: 533, en_mid: 3943, en_clerkid: 3937 }
                        return response.ApiError(res,{code:403,message:'请勿重复报名或者报备'})
                    }else {
                        yield setClassRoom({
                            en_clerkid:en_uid.en_clerkid,
                            en_mid:en_mid.mid,
                            en_goodsid:body.goodsid,
                            en_classroomid:body.classroom,
                            en_time:en_uid.en_time,
                            en_status:en_uid.en_status,
                            en_follow_status:en_uid.en_follow_status
                        })
                        return response.ApiSuccess(res,{message:'报名成功'})
                    }
                }
            }else {
                return response.ApiError(res,{code:402,message:'验证码错误'})
            }
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:'报名失败'})
        }
    })
})
/**
 * 发送验证码(微信小程序验证使用)
 */
router.post('/get-code-wx-program', function (req, res) {
    var body=req.body;
    if(str.parameterControl(['phone'],body)){
        return response.ApiError(res,{message:'参数缺失'})
    }
    co(function *() {
        try{
            sms.putCode(informConfig,{phone:body.phone}).then(function (data) {

                setSms({
                    phoneno:body.phone,
                    smscode:data.data,
                    type:9,//微信小程序验证使用
                });
                return response.ApiSuccess(res,{message:"短信验证码下发成功"})
            }).catch(function (err) {
                console.log(err)
                return response.ApiError(res,{message:err.toString()})
            })
        }catch (err){
            console.log(err)
            return response.ApiError(res,{message:err.toString()})
        }
    })
});

module.exports = router;