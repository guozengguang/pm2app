//api文件执行
var _ = require('lodash');
var fs = require('fs');
var watch = require('watch');
var sourcePath=process.cwd() + '/json/source';
var srcPath=process.cwd() + '/json/src';
watch.watchTree(sourcePath, function (f, curr, prev) {
  console.log('api文件监听启动')
  fs.readdirSync(sourcePath)
      .filter(function(file) {
        return (file.indexOf(".") == -1);
      }).forEach(function(file) {
    var filePaths=[];
    var target=srcPath+'/'+file+'/app.json';
    if(!fs.existsSync(srcPath+'/'+file)){
      fs.mkdirSync(srcPath+'/'+file)
    }
    fs.readdirSync(sourcePath+'/'+file)
        .filter(function(f) {
          return (f.indexOf(".") !== -1);
        }).forEach(function(f) {
      filePaths.push(sourcePath+'/'+file+'/'+f)
    });
    readStream(filePaths,target)
  });
});

function readStream(paths,target){
  var fileArr=[]
  paths.forEach(function(node,index){
    fileArr.push(JSON.parse(fs.readFileSync(node)))
  })
  fs.writeFileSync(target,JSON.stringify(_.merge.apply(null,fileArr)));
}