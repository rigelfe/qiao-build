/**
 * @file 文件合并
 * @author treelite(c.xinle@gmail.com)
 */

function combineFile(file, processContext, modules, codes) {
    var moduleDeps = file.get('module-dependencies');

    console.log('file: ' + file.path + ' ,deps: ' + moduleDeps);
    if (moduleDeps) {
        var moduleId = require('./util/get-module-id')(
                file.path, 
                file.get('module-config-path')
            );

        if (!modules[moduleId]) {
            modules[moduleId] = true;

            // 优先以`source-data`为主
            var data = file.get('source-data');
            codes.push(data || file.data);
            
            var item;
            moduleDeps.forEach(function (moduleId) {
                if (!modules[moduleId]) {
                    item = require('./util/get-module-file')(
                        moduleId, 
                        file.get('module-config-path')
                    );
                    item = require('path').relative(
                        processContext.baseDir,
                        item
                    );
                    item = processContext.getFileByPath(item);
                    combineFile(item, processContext, modules, codes);
                }
            });
        }
    }
    else {
            codes.push(file.data);
    }
}

exports.name = 'FileCombine';

exports.process = function (file, processContext, callback) {
    var path = require('path');

    if (!this.config) {
        var configFile = path.resolve(processContext.baseDir, this.configFile);
        this.config = require('./util/read-json-file')(configFile);
    }
    var files = this.config[file.path];

    if (!files) {
        callback();
        return;
    }

    var codes = [];
    // 已合并的module
    // 默认排除内置模块
    var modules = {
            require: true,
            exports: true,
            module: true
        };

    combineFile(file, processContext, modules, codes);

    if (Array.isArray(files)) {
        files.forEach(function (filePath) {
            var fileInfo = processContext.getFileByPath(filePath);
            combineFile(fileInfo, processContext, modules, codes);
        });
    }

    codes.reverse();

    file.set('source-data', file.data);
    file.setData(codes.join('\n\n'));

    callback();
};
