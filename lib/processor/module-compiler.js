/**
 * @file amd module处理
 * @author treelite(c.xinle@gmail.com)
 */
exports.name = 'ModuleCompile';

exports.process = function (file, processContext, callback) {
    var path = require('path');

    var configFile = path.resolve(processContext.baseDir, this.configFile);
    
    if (file.extname == 'js' && !file.get('module-compile')) {
        var module = require('./util/compile-module')(file, configFile);
        if (module) {
            file.setData(module.code);
            file.set('module-dependencies', module.dependencies || []);
            file.set('module-config-path', configFile);
        }
        file.set('module-compile', true);
    }

    callback();
};
