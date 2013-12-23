/**
 * @file 文件合并
 * @author treelite(c.xinle@gmail.com)
 */

function cannotfind(path) {
    console.log('[ERROR] can not find ' + path);
}

/**
 * 合并文件
 *
 * @inner
 * @param {FileInfo} file 待合并文件信息
 * @param {Array} exclude 排除文件
 * @param {Object} processContext 处理上下文
 * @param {Object} modules 已合并的module集合
 * @param {Array} codes 合并后源码
 */
function combineFile(file, exclude, processContext, modules, codes) {
    var moduleDeps = file.get('module-dependencies');

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
            
            var path;
            var fileInfo;
            moduleDeps.forEach(function (moduleId) {
                if (!modules[moduleId]) {
                    path = require('./util/get-module-file')(
                        moduleId, 
                        file.get('module-config-path')
                    );
                    path = require('./util/path').relative(
                        processContext.baseDir,
                        path
                    );

                    if (exclude.indexOf(path) >= 0) {
                        return;
                    }

                    fileInfo = processContext.getFileByPath(path);
                    if (!fileInfo) {
                        cannotfind(path);
                    }
                    else {
                        combineFile(
                            fileInfo, 
                            exclude, 
                            processContext, 
                            modules, 
                            codes
                        );
                    }
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

    var conf = this.config.combine[file.path];

    if (!conf) {
        callback();
        return;
    }
    else if (Array.isArray(conf)) {
        conf = {
            include: conf
        };
    }

    var codes = [];
    // 已合并的module
    // 默认排除内置模块
    var modules = {
            require: true,
            exports: true,
            module: true
        };

    // 设置exclude
    var exclude = this.config.exclude || [];
    exclude = exclude.concat(conf.exclude || []);

    // 设置include
    var include = this.config.include || [];
    include = include.concat(conf.include || []);

    function combine(fileInfo) {
        var source = [];
        combineFile(fileInfo, exclude, processContext, modules, source);
        source.reverse();
        codes.push(source);
    }

    include.forEach(function (filePath) {
        var fileInfo = processContext.getFileByPath(filePath);
        if (!fileInfo) {
            cannotfind(filePath);
        }
        else {
            combine(fileInfo);
        }
    });

    combine(file);

    for (var i = 0, item; item = codes[i]; i++) {
        if (Array.isArray(item)) {
            if (item.length > 0) {
                codes.splice(i, 0, item.shift());
            }
            else {
                codes.splice(i, 1);
                i--;
            }
        }
    }
    

    file.set('source-data', file.data);
    file.setData(codes.join('\n\n'));

    callback();
};
