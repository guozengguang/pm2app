/**
 * Created by Administrator on 2016/11/1 0001.
 */
var co = require('co');
var ding_talk_config = require(process.cwd() + '/config/config');
var DingTalk = require('node-dingtalk');
var dingtalk = new DingTalk({
    corpid: 'dinge321dfb0cd88e41c',
    corpsecret: 'FjDZ4RiyA62sWZVJFupbpF16PeFLmLRrjwTXdF5BjNaOK5GMfKh-kw3pQN0lBJF_'
});
/**
 * @public
 * @function create_user 短信发送 默认为config模板
 * @description 发送短信
 * @param {object} item
 * @param {number} item.mid  - 用户ID
 * @param {string} item.m_name  - 姓名
 * @param {number} item.m_level  - 内部权限等级
 * @param {string} item.m_phone  - 电话
 * @param {string} item.m_city  - 办公地点
 * @param {string} item.m_email  - email地址
 * @param {string} item.m_ishidephone  - 号码是否隐藏
 * @param {string} item.m_sex  - 性别
 * @param {create_user~Callback} callback - The callback that handles the response.
 **/
exports.create_user = function (item, callback) {
    /**
     * @callback create_user~Callback(error_code,result)
     * @param {number} error_code
     * @param {object} result
     **/
    /* 创建钉钉用户 开始 */
    var result;
    result = co(function *() {
        yield dingtalk.client.getAccessToken();//获取token
        yield dingtalk.client.getJSApiTicket();//获取ticket
        console.log( yield dingtalk.department.list() );
        var position = [undefined, "格局高管", "教学中心",
            "品牌宣传", "综合办公室", "新媒体中心", "财务",
            "工程", "视觉传达中心", "分院管理部", "深圳办公室"];
        try {
            result = yield dingtalk.user.create({
                "userid": item.mid,
                "name": item.m_name,
                "department": [1],//所属部门ID列表
                "position": position[item.m_level],//职务描述
                "mobile": item.m_phone,
                "tel": " ",//座机
                "workPlace": item.m_city,
                "remark": " ",//备注
                "email": item.m_email,
                "jobnumber": item.mid,
                "isHide": !!item.m_ishidephone,
                "isSenior": item.m_level == 1,
                "extattr": {//扩展属性
                    "性别": item.m_sex
                }
            });
        }catch (e){
            result = e.data;
        }
        if (result.errcode === 0) {
            callback(null, result);
        } else {
            callback(result.errmsg + ':' +  result.errcode, result);
        }
    });
    return result;
    /* 创建钉钉用户 结束 */
};
/**
 * @public
 * @function delete_user 短信发送 默认为config模板
 * @description 发送短信
 * @param {number} mid - 用户ID
 * @param {create~Callback} cb - The callback that handles the response.
 **/
exports.delete_user = function (mid, cb) {
    /**
     * @callback create~Callback(error_code,result)
     * @param {number} error_code
     * @param {object} result
     **/
    if(!mid){ callback('mid参数不允许为空') }
    var result;
    result = co(function *() {
        yield dingtalk.client.getAccessToken();//获取token
        yield dingtalk.client.getJSApiTicket();//获取ticket
        try {
            result = yield dingtalk.user.delete(mid);
        }catch (e){
            result = e.data;
        }
        if (result.errcode === 0) {
            cb(null,result);
        } else {
            cb('删除失败');
        }
        return result;
    });
    return result;
};