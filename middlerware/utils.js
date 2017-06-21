var _ = require('lodash');
/**
 * Created by Administrator on 2016/11/22 0022.
 */
/**
 * @function
 * @name random_string
 * @param {Number} length - 返回字符串长度
 * @returns {String} random string - 返回随机字符串
 */
exports.random_string = function (length) {
    var base_str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        base_str_length = 62;
    var result = '';
    while (length--) {
        result += base_str[(Math.random() * (base_str_length - 1)) | 0]
    }
    return result;
};
/**
 * @function appendChild 格式化父子级数据
 * @param {object[]} result 源数据
 * @param {string} source_prop 源父子关系参照属性名称1
 * @param {string} parent_prop 目标父子关系参照属性名称2
 * @param {string} filter 删除数据的依据属性名称 deletedAt
 * @param {string} filter_value 删除数据的依据属性值 deletedAt
 * */
exports.appendChild = function (result, source_prop, parent_prop, filter, filter_value) {
    result.forEach(function (item, i) {
        var parent_id = item[parent_prop];
        result.every(function (v) {
            if (v[source_prop] == parent_id) {
                if (v.children) {
                    v.children.push(item);
                } else {
                    v.children = [item];
                }
                return false;
            }
            return true;
        })
    });
    return _.filter(result, function (item) {
        return item[filter] === filter_value;
    });
};
exports.appendPath = function (result, source_prop, parent_prop, filter, filter_value) {
    result.forEach(function (item, i) {
        var path = item[parent_prop].split(',');
        var parent_id = +path[path.length-1];
        result.every(function (v) {
            if (v[source_prop] == parent_id) {
                if (v.children) {
                    v.children.push(item);
                } else {
                    v.children = [item];
                }
                return false;
            }
            return true;
        })
    });
    return _.filter(result, function (item) {
        return item[filter] === filter_value;
    });
};
function recursive(list, prop, fn) {
    list.forEach(function (v) {
        fn(v);
        if(v[prop] && v[prop].length){
            recursive(v[prop], prop, fn);
        }
    })
}
exports.recursive = recursive;