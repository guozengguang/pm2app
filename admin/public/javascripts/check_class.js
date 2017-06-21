/**
 * Created by Administrator on 2017/3/25 0025.
 */
function Checked(list) {
    this.list = list;
    this.checked_list = [];
}

Checked.prototype.transform_arguments = function (data) {
    if (_.isArray(data)) {
        return data;
    } else if (_.isNumber(data)) {
        return [data];
    } else {
        throw new Error('参数错误');
    }
};
Checked.prototype.include = function (data) {
    var len = this.list.length;
    if (len === 0) {
        return false
    } else {
        var i = 0;
        for (; i < len; i++) {
            if (this.list[i] == id) {
                return true
            }
        }
        return false;
    }
};
Checked.prototype.append = function (data) {
    data = this.transform_arguments(data);
    this.checked_list = _.union(this.checked_list, data);
    return this.list.length === this.checked_list.length;
};
Checked.prototype.remove = function (data) {
    data = this.transform_arguments(data);
    _.forEach(data, function (v) {
        _.pull(this.checked_list, v)
    });
    return false;
};
Checked.prototype.get_state = function () {
    return this.list.length === this.checked_list.length;
};
