module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  "apps": [
    {
      //基本
      "name": "pm2app", //应用程序的名称 应用名称
      "cwd": "/home/yishi/www/production/pm2app", //应用程序所在的目录
      "script": "./bin/www", //应用程序的脚本路径 实际启动脚本
      "args": "export NODE_ENV=production",//参数
      "interpreter": "/mnt/nodejs/node-package/node-v7.10.0/bin/node",//node所在目录
      "interpreter_args": "--harmony",//node执行参数
      //先进
      //"instances": 1,//实例数量
      "exec_mode": "fork", //应用程序启动模式，这里设置的是cluster_mode（集群），默认是fork
      "watch": true, // 监控变化的目录，一旦变化，自动重启 或者 是否启用监控模式
      "ignore_watch": [ // 从监控目录中排除
        "node_modules",
        "logs",
        "public"
      ],
      "max_memory_restart": "500M",//超过指定内存后重启
      "env": {
        "NODE_ENV": "production"//, "ID": "89"
      },//环境变量
      "source_map_support": true,//源文件异常映射
      //日志
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "error_file": "/home/yishi/www/log/pm2app-err.log", //自定义应用程序的错误日志文件
      "out_file": "/home/yishi/www/log/pm2app-out.log", //自定义应用程序日志文件
      "pid_file": "/home/yishi/www/log/pm2app.pid", //自定义应用程序的pid文件
      //控制
      "min_uptime": "20s", //最小运行时间
      "listen_timeout": 8000,//如果没有监听ms后自动重启
      "max_restarts": 10, //设置应用程序异常退出重启的次数，默认15次（从0开始计数）
      "restart_delay": 100,//重启延迟
      "post_update": ["npm install","echo launching the app"],
    }
  ],
  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  "deploy": {
    "production": {
      "user": "root",//登录账号
      "host": "59.110.225.153",//服务器地址
      "ref": "origin/master",//git 分支
      "repo": "git@github.com:guozengguang/pm2app.git",
      "path": "/home/yishi/www/production/pm2app",//服务器项目目录
      "post-deploy": "pm2 restart /home/yishi/www/production/pm2app/ecosystem.config.js --env production",//代码部署完之后执行的命令
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}