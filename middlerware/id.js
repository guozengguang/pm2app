/**
 * Created by Administrator on 2017/4/1 0001.
 */
var PUid = require('puid');
exports.p_uid = (function () {
    var uid = new PUid();
    return function () {
        return uid.generate();
    }
})();