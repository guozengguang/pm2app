module.exports = {
  onListSuccess:function (res,options) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    // res.setHeader('Access-Control-Allow-Credentials', true);//告诉客户端可以在HTTP请求中带上Cookie
    res.setHeader('X-Powered-By', 'GEJU');
    res.setHeader('Server', 'Server');
    res.setHeader('Content-Type', 'application/json');
    var result={
      code:200,
      list:options.list,
      message:"ok"
    };
    if (typeof (options.count) !='undefined') result.count=options.count;
    if(options.data)result.data=options.data;
    res.jsonp(result);
  },
  onDataSuccess:function(res,options){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('X-Powered-By', 'GEJU');
    res.setHeader('Server', 'Server');
    res.setHeader('Content-Type', 'application/json');
    res.jsonp({
      code:200,
      data:options.data,
      message:"ok"
    });
  },
  onSuccess:function(res, message){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('X-Powered-By', 'GEJU');
    res.setHeader('Server', 'Server');
    res.setHeader('Content-Type', 'application/json');
    var result = {};
    result.code = 200;
    result.message = message || '操作成功';
    res.jsonp(result);
  },
  onError:function(res, err){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('X-Powered-By', 'GEJU');
    res.setHeader('Server', 'Server');
    res.setHeader('Content-Type', 'application/json');
    var result = {};
    var errors = err.errors || [err];
    var keys = Object.keys(errors);
    var message = '';
    if (!keys) {
      message = '操作失败';
    } else {
      var errs = [];
      keys.forEach(function (key) {
        if (errors[key]) {
          errs.push(errors[key].message);
        }
      });
      message = errs.join(', ');
    }
    result.code = err.code || 500;
    result.message = err.message || message;
    res.json(result);
  },
  ApiError:function(res, err ,info ){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('X-Powered-By', 'GEJU');
    res.setHeader('Server', 'Server');
    res.setHeader('Content-Type', 'application/json');
    var result = {};
    var errors = err.errors || [err];
    var keys = Object.keys(errors);
    var message = '';
    if (!keys) {
      message = '操作失败';
    } else {
      var errs = [];
      keys.forEach(function (key) {
        if (errors[key]) {
          errs.push(errors[key].message);
        }
      });

      message = errs.join(', ');
    }
    result.code = err.code || 500;
    result.message = info || err.message || message;
    res.json(result);
  },ApiSuccess:function(res,options, message){
    res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Headers', 'x-requested-with,content-type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('X-Powered-By', 'GEJU');
    res.setHeader('Server', 'Server');
    res.setHeader('Content-Type', 'application/json');
    res.jsonp({
      code:200,
      result:options || {},
      message:message || 'ok'
    });
  }
}