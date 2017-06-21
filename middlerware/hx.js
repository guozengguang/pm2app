/**
 * Created by Administrator on 2017/1/13 0013.
 */
var request = require('request');
var config = require(process.cwd() + '/config/config');
var https = require('https');
var moment = require('moment');
var cache = require(process.cwd() + '/utils/cache');
var Hx= {
    request: function (option) {
        return new Promise(function (resolve, reject) {
            "use strict";
            var req = https.request(option.body, function (res) {
                var body = "";
                res.setEncoding('utf8');
                res.on('data', function (data) {
                    body += data;
                    if (res.statusCode == 200) {
                        return resolve({code: res.statusCode, data: data});
                    } else {
                        return reject({code: res.statusCode, data: data});
                    }
                })
            });
            req.on('error', function (e) {
                return reject(e);
            });
            if(option.headers){
                req.write(option.headers + "\n");
            }
            req.end()
        })
    },
    requestToken: function () {
        return new Promise(function (resolev,reject) {
            cache.get("web_hx_token",function (err,data) {
                if(err){
                    reject(err)
                }else {
                    resolev(data)
                }
            })
        }).then(function (data) {
            if(data){
                console.log('缓存')
                return data
            }else {
                console.log('读取')
                var headers = {
                    grant_type: 'client_credentials',
                    client_id: config.hxchat_web.Client_Id,
                    client_secret: config.hxchat_web.Client_Secret
                };
                headers = JSON.stringify(headers);
                var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/token';
                var opt = {
                    method: "POST",
                    host: config.hxchat_web.host,
                    path: path,
                    headers: {
                        "Content-Type": 'application/json'
                    }
                };
                return new Promise(function (resolve, reject) {
                    "use strict";
                    var req = https.request(opt, function (res) {
                        var body = "";
                        res.setEncoding('utf8');
                        res.on('data', function (data) {
                            body += data;
                            if (res.statusCode == 200) {
                                cache.set('web_hx_token',data,3600*24*7);
                                return resolve(data);
                            } else {
                                return reject({code: res.statusCode, data: data});
                            }
                        })
                    });
                    req.on('error', function (e) {
                        return reject(e);
                    });
                    req.write(headers + "\n");
                    req.end()
                })
            }
        }).then(function (data) {
            data=(typeof data === 'string')?JSON.parse(data):data
            return data.access_token
        }).catch(function (err) {
            console.log(err)
        })
    }
}
module.exports = {
    //获取token
    gethxtoken: function (option, callback) {  //获取token
        var data = {
            grant_type: 'client_credentials',
            client_id: config.hxchat_web.Client_Id,
            client_secret: config.hxchat_web.Client_Secret
        };
        data = JSON.stringify(data);
        var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/token';
        var opt = {
            method: "POST",
            host: config.hxchat_web.host,
            path: path,
            headers: {
                "Content-Type": 'application/json'
            }
        };
        Hx.request({body: opt, headers: data}).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            callback.log(err)
        })
    },
    //注册用户
    reghxuser: function (option, callback) {
        var data = {
            username: option.username,
            password: config.hxchat_web.password,
            nickname: option.nickname || ''
        };
        data = JSON.stringify(data);
        var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/users';

        var opt = {
            method: "POST",
            host: config.hxchat_web.host,
            path: path,
            headers: {
                "Content-Type": 'application/json'
            }
        };
        Hx.request({body: opt, headers: data}).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            callback(err)
        })
    },
    //删除用户
    deletehxuser: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = {
                username: option.username,
            };
            data = JSON.stringify(data);
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/users/' + option.username;

            var opt = {
                method: "DELETE",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };
            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //创建群组
    createhxgroup: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = {
                groupname: option.groupname,
                desc: option.desc,
                public: true,
                maxusers: option.maxusers,
                approval: true,
                owner: option.owner
            };
            data = JSON.stringify(data);
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatgroups';

            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data.data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //删除群组
    deletehxgroup: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = '';
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatgroups/' + option.groupid;

            var opt = {
                method: "DELETE",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //获取群组详情
    gethxgroupinfo: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = '';
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatgroups/' + option.groupid;

            var opt = {
                method: "GET",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //添加群组成员
    addhxgroupuser: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = '';
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatgroups/' + option.groupid + '/users/' + option.username;

            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //删除群组成员
    deletehxgroupuser: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = '';
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatgroups/' + option.groupid + '/users/' + option.username;

            var opt = {
                method: "DELETE",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //发送消息
    sendmessages: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/messages';
            var data = {
                target_type: 'users',
                target: option.users,//["u1", "u2", "u3"]
                msg: {type: 'txt', msg: option.msg},
                from: option.fromuser,
                ext: {   //扩展属性，由APP自己定义。可以没有这个字段，但是如果有，值不能是"ext:null"这种形式，否则出错
                    // 消息的扩展内容，可以增加字段，扩展消息主要解析不分。
                    nickName: option.nickName,
                    avatarURLPath: option.avatarURLPath
                }
            };
            data = JSON.stringify(data);
            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //创建聊天室
    createhxchatrooms: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = {
                name: option.name,//聊天室名称，此属性为必须的
                description: option.description,
                maxusers: option.maxusers,
                owner: option.owner
            };
            data = JSON.stringify(data);
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatrooms';

            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data.data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //发送消息到聊天室
    chatroomsmessages: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/messages';
            var data = {
                target_type: 'chatrooms',
                target: option.chatrooms,//["u1", "u2", "u3"]
                msg: {type: 'txt', msg: option.msg},
                from: option.fromuser,
                ext: {   //扩展属性，由APP自己定义。可以没有这个字段，但是如果有，值不能是"ext:null"这种形式，否则出错
                    // 消息的扩展内容，可以增加字段，扩展消息主要解析不分。
                    nickName: option.nickName,
                    avatarURLPath: option.avatarURLPath || '',
                    messageType: 'notepad',
                    timestamp: moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
                }
            };

            data = JSON.stringify(data);
            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //发送消息到聊天室--透视消息
    chatroomsmessagescmd: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/messages';
            var data = {
                target_type: 'chatrooms',
                target: option.chatrooms,//["u1", "u2", "u3"]
                msg: {type: 'cmd', msg: option.msg},
                from: option.fromuser,
                ext: {   //扩展属性，由APP自己定义。可以没有这个字段，但是如果有，值不能是"ext:null"这种形式，否则出错
                    // 消息的扩展内容，可以增加字段，扩展消息主要解析不分。
                    nickName: option.nickName,
                    avatarURLPath: option.avatarURLPath,
                    messageType: 'exceptionalNotice',
                    messageMoney: option.messageMoney,
                    notifics: option.notifics || 'no',
                    timestamp: moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
                }
            };

            data = JSON.stringify(data);
            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //设置黑名单
    setbacklist: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = {
                usernames: option.usernames,//黑名单中的用户名[“5cxhactgdj”, “mh2kbjyop1”]
            };
            data = JSON.stringify(data);
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/users/' + option.mid + '/blocks/users';

            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //删除黑名单
    deletebacklist: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = ''
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/users/' + option.mid + '/blocks/users/' + option.username;

            var opt = {
                method: "DELETE",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //批量添加成员
    addhxgroupuserbatch: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var data = {
                usernames: option.username
            };
            data = JSON.stringify(data);
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/chatgroups/' + option.groupid + '/users/';
            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
    //发送通知消息
    sendExtMessages: function (option, callback) {
        Hx.requestToken().then(function (token) {
            var path = '/' + config.hxchat_web.org_name + '/' + config.hxchat_web.app_name + '/messages';
            var data = {
                target_type: 'users',
                target: option.users,//["u1", "u2", "u3"]
                msg: {type: 'txt', msg: option.msg},
                from: option.fromuser,
                ext: option.ext
            };
            data = JSON.stringify(data);
            var opt = {
                method: "POST",
                host: config.hxchat_web.host,
                path: path,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            };

            return Hx.request({body: opt, headers: data})
        }).then(function (data) {
            callback(null, data)
        }).catch(function (err) {
            if(err.code==401){
                cache.set('web_hx_token',{},1);
            }
            callback(err)
        })
    },
}

