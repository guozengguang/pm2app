/**
 * Created by Administrator on 2017/1/9 0009.
 */
var index = [
    {
        id: 1000,
        name: '新课预告',
        url: 'http://dev.geju.com/api-v1.5/class-prophet'
    },
    {
        id: 1001,
        name: '课程回顾',
        url: 'http://dev.geju.com/api-v1.5/class-back'
    },
    {
        id: 2,
        name: '活动',
        url: 'http://dev.geju.com/api-v1.5/home-module?type=2'
    },
    {
        id: 3,
        name: '专辑',
        url: 'http://dev.geju.com/api-v1.5/home-module?type=3'
    },
    {
        id: 4,
        name: '讲师',
        url: 'http://dev.geju.com/api-v1.5/home-module?type=4'
    },
    {
        id: 5,
        name: '分院',
        url: 'http://dev.geju.com/api-v1.5/branch-list?order=createAt'
    },
];
module.exports = {
    domain: 'http://dev.geju.com',
    index: index,
    index_map: (function () {
        var obj = {};
        index.forEach(function (v) {
            obj[v.id] = v.url;
        });
        return obj;
    })()
};