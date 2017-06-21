/**
 * Created by Geju on 2017/4/18.
 * 课程班
 */

var StringBuilder = require(process.cwd() + '/lib/base/StringBuilder');
var models = require(process.cwd() + '/models/index');
var co = require('co');
var _ = require('lodash');
var method={};
module.exports = method;

/**
 * @desc 缓存的基本key（暂定使用表名+key）
 */
Object.defineProperty(method,"key",{
    value:'gj_goods',
    writable:false,
});

/**
 * @function find
 * @desc 查询多条记录，返回多条
 * @param {object} condition 查询参数
 * @param {object} condition.where 查询条件
 * @returns {*|Promise.<T>}
 */
method.find = (condition)=>{
    "use strict";
    //传递参数的验证，缓存等处理
    return models.Goods.findAll({
        where:condition.where,
        raw:true,
    })
}
/**
 * @function create
 * @desc 新增记录
 * @param {object} condition 新增参数
 * @param {object} condition.body 新增实例
 * @returns {*|Promise.<T>}
 */
method.create = (condition)=>{
    "use strict";
    return models.Goods.create(condition.body)
}

/**
 * @function update
 * @desc 更新记录
 * @param {object} condition 更新参数
 * @param {object} condition.where 更新条件
 * @param {object} condition.body 更新的内容
 * @returns {*|Promise.<T>}
 */
method.update = (condition)=>{
    "use strict";
    return models.Goods.update({where:condition.where},condition.body)
}

/**
 * @function delte
 * @desc 删除记录（物理删除，逻辑删除请使用update）
 * @param {object} condition 删除参数
 * @param {object} condition.where 删除条件
 * @returns {*|Promise.<T>}
 */
method.delete = (condition)=>{
    "use strict";
    return models.Goods.destroy({where:condition.where})
}
/**
 * @desc 通过id获取课程信息
 * @param {number} id 课程id
 * @returns {*|Promise.<T>}
 */
method.getGoodsDetailById = (arr,format) =>{
    "use strict";
    return method.find({where:{goodsid:{"$in":[arr]}}}).then(function (data) {
        var obj={};
        arr.forEach(function (node,i) {
            for(var j=0,len=data.length;j<len;j++){
                var item=data[j]
                if(item.goodsid==node){
                    arr[i]=item
                    obj[node]=item
                    break;
                }else {
                    arr[i]={}
                    obj[node]={}
                }
            }
        })
        return format?obj:arr
    }).catch(function (err) {
        return err
    })
};




