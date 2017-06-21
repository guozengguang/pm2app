/**
 * Created by Administrator on 2016/10/13 0013.
 */
var express = require('express');
var router = express.Router();
var Filter = require(process.cwd() + '/utils/filter');
var umeng = require(process.cwd() + '/middlerware/umeng');
var response = require(process.cwd() + '/utils/response');
var sequelize = require(process.cwd() + '/models/index').sequelize;
/* 公用回调函数 */
function callback(result) {
    response.onDataSuccess(this,{ data : result});
}
/* 路由开始 */
router.all(Filter.authorize);
router.get('/',function (req, res) {
    res.render('um/um', {
        title: '友盟推送'
    });
});
router.post('/',function (req, res) {
    var body = req.body,
        title = body.um_title,
        desc = body.um_desc,
        content = body.um_content,
        students = body.students,
        time = body.time,
        cid = body.cid;
    if(time){
        time = time.replace(/\//g,'-');
        if(time.length === 16){
            time += ':00'
        }
    }
    if(typeof students === 'string'){
        students = [students];
    }
    var message = {
        title: title,
        desc: desc,
        content: content,
        time: time
    };
    if(!title || !desc || !content){
        response.onError(res, {message: '参数错误'});
    }
    console.log(body.options, body.students);
    switch (+body.options){
        case 0: //全部
            return console.log({
                payload: {
                    display_type: 'notification',
                    body: {
                        "ticker": content,     // 必填 通知栏提示文字
                        "title": title,      // 必填 通知标题
                        "text": desc,       // 必填 通知文字描述
                    }
                }
            });
            umeng.send_all(message ,callback.bind(res));//推送全部
            break;
        case 1: //单独
            return console.log(message);

            if(students && students.length){
                umeng.send_double(students, message ,callback.bind(res));
            }else {
                response.onError(res, {message: '参数错误'});
            }

            break;
        case 2: //群组
            return console.log(message);

            if(!body.group){
                response.onError(res, {message: '参数错误'});
            }else {
                sequelize.query('SELECT m_phone FROM gj_members INNER JOIN gj_groupuser ON groupuser_user = mid WHERE groupuser_group = '+ body.group +';',
                    { type: sequelize.QueryTypes.SELECT }
                ).then(function (result) {
                    umeng.send_double(result, message ,callback.bind(res));
                },function (err) {
                    response.ApiSuccess(res, {} , '发送失败');
                });
            }
            break;
        case 3: //课程
            return console.log(message);
            if(!cid){
                response.onError(res, {message: '参数错误'});
            }else {
                sequelize.query('SELECT uc_userphone FROM gj_userclass WHERE uc_goodsid = '+ cid +';',
                    { type: sequelize.QueryTypes.SELECT })
                    .then(function (result) {
                        umeng.send_double(result, message ,callback.bind(res));
                    },function (err) {
                        response.ApiSuccess(res, {} , '发送失败');
                    });
            }

            break;
        default:
    }
});
module.exports = router;