/**
 * Created by Administrator on 2017/3/30 0030.
 */
var express = require('express');
var _ = require('lodash');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var response = require(process.cwd() + '/utils/response');
var models = require(process.cwd() + '/models/index');

router.get('/', Filter.authorize, function (req, res) {
    var phone = req.query.phone;
    if(!/^1[356789]\d{9}$/.test(phone)){
        return response.ApiError(res, {} , '参数错误');
    }
    Promise.all([
        models.Members.findOne({
            attributes: [
                ['mid', 'id'],
                ['m_name', 'name'],
                ['m_sex', 'sex'],
                ['m_card', 'card'],
                ['m_phone', 'phone'],
                ['m_company', 'company'],
                ['m_position', 'position']
            ],
            where: {
                m_phone: phone
            },
            raw: true
        }),
        models.HotelHuman.findOne({
            attributes: ['id', 'name', 'sex', 'card', 'phone', 'company', 'position'],
            where: {
                phone: phone
            },
            raw: true
        })
    ]).then(function (result) {
        result = _.assign(result[0], result[1]);
        if(result.sex){
            result.sex = Boolean(result.sex).toString()
        }
        return response.ApiSuccess(res, result, '获取成功');
    }, function (err) {
        return response.ApiError(res, err);
    })
});
module.exports = router;