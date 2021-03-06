/**
 * @file build processor
 * @author treelite(c.xinle@gmail.com)
 *         imshiner(doctype@126.com)
 */

/**
 * 根据moduleId获取module
 * 简单查找，不进行packages匹配
 * 拿来做entry module的查找应该够用了
 *
 * @param {string} moduleId
 * @param {string}  baseUrl
 * @param {Object}  moduleInfo
 * @return {string}
 */
function getModuleById(moduleId, baseUrl, moduleInfo) {
    var pathPrefix = '';
    var paths = moduleInfo.paths || {};
    Object.keys(paths).forEach(function (key) {
        if (moduleId.indexOf(key) === 0 && key.length > pathPrefix.length) {
            pathPrefix = key;
        }
    });

    if (pathPrefix) {
        var path = paths[pathPrefix];
        // module.conf中的paths如果包含baseUrl
        // 需要先去掉原始的baseUrl
        if (path.indexOf(moduleInfo.baseUrl) === 0) {
            path = path.replace(moduleInfo.baseUrl, '');
            if (path.charAt(0) == '/') {
                path = path.substring(1);
            }
        }
        moduleId = moduleId.replace(pathPrefix, path);
    }

    var fs = require('fs');
    var file = require('path').resolve(baseUrl, moduleId);
    file += '.js';

    var res = null;
    if (fs.existsSync(file)) {
        res = fs.readFileSync(file, 'utf-8');
    }

    return res;
}

/**
 * 更新文件中的require.config配置信息
 *
 * @inner
 * @param {string} file 文件路径
 * @param {Object} options 配置信息
 */
function updateRequireConfig(file, options) {
    var extend = require('./util').extend;
    var content = require('fs').readFileSync(file, 'utf-8');
    var scriptTags = [];
    // 寻找并保存所有的<script>标签
    content.replace(/<\/?script[^>]*>/g, function ($0) {
        scriptTags.push($0);
    });
    // 以<script>标签切割代码
    content = content.split(/<\/?script[^>]*>/);

    // 如果没有<script>标签，则将内容填充一个空的首元素
    // 便于之后的数组操作
    if (scriptTags.length <= 0) {
        content.unshift('');
    }

    function replacer($0, $1, $2) {
        var data = (new Function ('return (' + $2 + ');'))();
        data = extend(data, options);

        // 寻找起始的缩进数
        var indent = 0;
        var i = $0.indexOf('r') - 1;
        while (i >= 0 && $0.charAt(i--) == ' ') {
            indent++;
        }

        data = JSON.stringify(data, null, 4);
        data = data.replace(/\r?\n/g, function ($0) {
            // 附加每行缩进
            return $0 + (new Array(indent + 1)).join(' ');
        });

        return $0.substring(0, $0.indexOf('r'))
            + 'require.config('
            + data 
            + ')';
    }

    var reg = new RegExp(
        '(^|\\s+|\\t+)require\\.config\\(([^)]*)\\)', 
        'g'
    );
    // 偶数递进处理<script>中的script代码
    for (var i = 1, len = content.length, script; i < len ; i += 2) {
        script = content[i];
        if (reg.test(script)) {
            content[i] = script.replace(reg, replacer);
            break;
        }
    }

    // 回填<script>标签
    for (var i = 0, item; item = scriptTags[i]; i++) {
        content.splice(i * 2 + 1, 0, item);
    }

    require('fs').writeFileSync(file, content.join(''), 'utf-8');
}

/**
 * 更新入口模块配置信息
 * 更新module.conf中的combine配置项
 *
 * @public
 * @param {string} dir 查找目录
 * @param {string|Array.<string>} extnames 搜索文件的后缀名
 */
exports.refreshCombine = function (dir, extnames) {
    var entris = require('./module').getEntries(dir, extnames);

    var moduleInfo = require('./module').getConfig();
    var combine = moduleInfo.combine || {};
    entris.forEach(function (item) {
        combine[item] = combine[item] || {};
    });

    /* 暂时不合并packages
    var packages = moduleInfo.packages || [];
    packages.forEach(function (item) {
        if (item.name && !combine[item.name]) {
            combine[item.name] = true;
        }
    });
    */

    moduleInfo.combine = combine;
    require('./module').setConfig(moduleInfo);
};

/**
 * 根据output中的入口模块更新module的版本信息
 * 更新module.conf文件中的combine的version字段
 *
 * @public
 * @param {string} baseurl module的baseUrl
 */
exports.refreshCombineVersion = function (baseUrl) {
    var util = require('./util');
    var moduleInfo = require('./module').getConfig();
    var combine = moduleInfo.combine;

    var item;
    var hash;
    var data;
    for (var moduleId in combine) {
        if (combine.hasOwnProperty(moduleId)) {
            item = combine[moduleId];
            if (typeof item != 'object') {
                continue;
            }
            item.version = item.version || 0;
            data = getModuleById(moduleId, baseUrl, moduleInfo);
            if (data) {
                hash = util.hash(data);
                if (hash && hash != item.hash) {
                    item.version++; 
                }
                item.hash = hash;
            }
        }
    }

    require('./module').setConfig(moduleInfo);
};

/**
 * 更新指定目录下的入口模块加载版本配置项
 * 根据module.conf中combine的version更新对应文件中require.config中的urlArgs参数
 *
 * @public
 * @param {string} dir 搜索目录
 * @param {string|Array.<string>} 搜索文件的后缀名
 */
exports.updateModuleVersion = function (dir, extnames) {
    var getEntryModules = require('./module').getEntryModules;
    var moduleInfo = require('./module').getConfig();
    var files = require('./util').findFiles(dir, extnames);
    var combine = moduleInfo.combine || {};

    var urlArgs;
    var modules;
    files.forEach(function (file) {
        modules = getEntryModules(file);
        urlArgs = {};

        modules.forEach(function (moduleId) {
            if (combine[moduleId] 
                && combine[moduleId].version !== undefined
            ) {
                urlArgs[moduleId] = 'v=' + combine[moduleId].version;
            }
        });

        updateRequireConfig(file, {
            urlArgs: urlArgs
        });
    });
};
