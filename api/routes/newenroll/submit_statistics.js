var express = require('express');
var router = express.Router();
var cwd = process.cwd();
var response = require(cwd + '/utils/response');
var models = require(cwd + '/models/index');
var utils = require(cwd + '/middlerware/utils');
var _ =  require('lodash');
var co = require('co');
var Puid = require('puid');
var StringBuilder = require(process.cwd() + '/utils/StringBuilder');
var moment = require('moment');


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

router.post('/', function (req, res) {
    co(function *() {
        try {
            var vote = req.body.vote;
            var student_phone = "";
            var phone_code = "";
            var code_index = "";
            var check;
            vote.forEach(function (node,index) {
                if(node.flag == "1"){
                    student_phone = node.value;
                }
                if(node.flag == "2"){
                    phone_code = node.value;
                    code_index = index;
                }
            })
            if(student_phone != ""){
                check = yield checkSms({phone:student_phone,type:8})
            }

            console.log(vote,'vote')
            if(phone_code != "" && check && check.length==1 && check[0].code != phone_code){
                console.log(phone_code,check[0].code,'param----value')
                return response.ApiError(res,{code:402,message:'验证码错误'})
            }else {
                //验证成功
                var puid = new Puid().generate();
                if(vote && _.isArray(vote)){//template_typename
                    var newenroll = yield models.NewEnroll.findOne({raw:true,where:{newenroll_id:vote[0].newenroll_id}});
                    console.log(newenroll,'newenroll')
                    vote.forEach(function (node,index) {
                        node.template=newenroll.template_typename;
                        // console.log(puid.generate());
                        node.rowID=puid;
                    })

                    // vote.splice(code_index,1);
                    console.log(vote,'vote')
                    models.ApplyTemplateStatistics.bulkCreate(vote).then(function (result) {
                        return response.ApiSuccess(res, {}, '提交成功');
                    }, function (err) {
                        return response.ApiError(res, err);
                    });
                }else {
                    return response.ApiError(res, {}, '参数错误');
                }
            }
        }catch(err){
            console.log(err);
        }
    })
});

module.exports = router;