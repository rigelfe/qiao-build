/**
 * @file 管理入口模块版本
 * @author cxl(treelite@gmail.com)
 */

/**
 * 获取入口模块id
 *
 * @inner
 */
function getEntryModule(code, token) {
    // 不再使用JS语法分析改用正则寻找
    // 因为在入口页面的JS环境下可能有模板语法进行的数据组装操作
    // 此情况下JS语法检查都过不了...
    // 还可以考虑先进行模板解析再进行JS语法分析，但相应模拟数据的选择是个问题...
    var res = [];
    token = token.replace(/\./g, '\\.');
    var reg = new RegExp('(^|\\s+|\\t+)' + token + '\\(([^()]+)', 'g');

    code.replace(reg, function ($0 ,$1, $2) {
        $2 = $2.split(/\s*,\s*/);
        if ($2.length >= 2) {
            $2.pop();
            $2 = $2.join(',');
        }
        else {
            $2 = $2[0];
        }

        var moduleList = [];
        // 先按数组解析
        // 不成功再按字符串解析
        try {
            // 将'替换成"，便于JSON解析
            // PS: 将'作为moduleId算你狠...
            moduleList = JSON.parse($2.replace(/'/g, '"'));
        }
        catch (e) {}

        if (Array.isArray(moduleList)) {
            res = res.concat(moduleList);
        }
    });

    return res;
}

/**
 * html片段中查询script标签的innerText
 * 
 * @inner
 * @param {string} content html片段内容
 * @return {string}
 */
function findScriptInHTML(content) {
    var segs = content.split(/<script[^>]*>/);
    var texts = [];
    for (var i = 1; i < segs.length; i++) {
        texts.push(segs[i].split(/<\/script>/)[0]);
    }

    return texts.join('\n\n');
}

/**
 * 更新模块version
 *
 * @inner
 */
function updateModuleVersion(modules, versionConfig, processContext, moduleConfig) {
    var getModuleFile = require('./util/get-module-file');
    var hash = require('../util').hash;
    var path = require('./util/path');
    modules.forEach(function (moduleId) {
        var filePath = path.relative(
                processContext.baseDir, 
                getModuleFile(moduleId, moduleConfig)
            );
        var file = processContext.getFileByPath(filePath);

        if (file) {
            var info = versionConfig[moduleId];
            if (!info) {
                info = versionConfig[moduleId] = {};
            }
            var md5sum = hash(file.data);
            info.version = info.version || 0;
            if (info.md5 != md5sum) {
                info.md5 = md5sum;
                info.version++;
            }
        }
    });

    return versionConfig;
}

// 模块版本信息文件
var VERSION_CONFIG = 'module-version.conf';

/**
 * 获取版本信息
 *
 * @inner
 */
function getVersionConfig() {
    var fs = require('fs');
    var dir = require('edp-project').getInfo().infoDir;
    var file = require('path').resolve(dir, VERSION_CONFIG);
   
    var res = {};
    if (fs.existsSync(file)) {
        res = require('./util/read-json-file')(file);
    }

    return res;
}

/**
 * 保存版本信息
 *
 * @inner
 */
function saveVersionConfig(config) {
    var dir = require('edp-project').getInfo().infoDir;
    var file = require('path').resolve(dir, VERSION_CONFIG);

    require('./util/write-json-file')(file, config);
}

exports.name = 'ModuleVersion';

exports.process = function (file, processContext, callback) {
    var extnames = this.extnames.split(/\s*,\s*/);

    if (extnames.indexOf(file.extname) < 0) {
        callback();
        return;
    }

    var moduleConfig = require('path').resolve(
            processContext.baseDir, this.moduleConfig
        );
    var versionConfig = getVersionConfig();

    var code = findScriptInHTML(file.data);
    var tokens = (this.GlobalRequireToken || 'require').split(/\s*,\s*/);

    var modules = [];
    tokens.forEach(function (token) {
        modules = modules.concat(getEntryModule(code, token));
    });

    versionConfig = updateModuleVersion(
        modules, versionConfig, 
        processContext, moduleConfig
    );

    var urlArgs = {};
    modules.forEach(function (moduleId) {
        var info = versionConfig[moduleId];
        if (info) {
            urlArgs[moduleId] = info.version;
        }
    });

    tokens = (this.GlobalConfigToken || 'require.config').split(/\s*,\s*/);
    var configToken;
    tokens.some(function (token) {
        var reg = new RegExp(token.replace(/\./g, '\\.'));

        if (reg.test(code)) {
            configToken = token;
        }

        return !!configToken;
    });

    if (configToken) {
        file.data = require('./util/update-require-config')(
            file.data, 
            {
                urlArgs: urlArgs
            },
            configToken
        );
    }

    saveVersionConfig(versionConfig);

    callback();
};
