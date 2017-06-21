/**
 * Created by Administrator on 2016/11/29 0029.
 */
var response = require(process.cwd() + '/utils/response');

exports.error = function (res, err) {
    var message = '';
    err.errors.forEach(function (item) {
        message +=  item.message + '  ';
    });
    return response.ApiError(res, {
        code: err.parent.sqlState || err.original.sqlState || 500,
        message: message
    }, message);
}