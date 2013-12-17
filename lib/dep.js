/**
 * @file 第三方依赖管理
 * @author treelite(c.xinle@gmail.com)
 */

function Deferred() {
    this.status = 0;
    this.callback = [];
}

Deferred.prototype.reslove = function (data) {
    this.data = data;
    this.status = 1;
    for (var i = 0, item; item = this.callback[i]; i++) {
        item.call(null, data);
    }
};

Deferred.prototype.then = function (callback) {
    var df = new Deferred();

    function inner(data) {
        var res = callback.call(null, data);
        df.reslove(res);
    }

    if (this.status) {
        inner.call(null, this.data);
    }
    else {
        this.callback.push(inner);
    }

    return df.promise();
};

Deferred.prototype.promise = function () {
    var me = this;
    return {
        then: function (callback) {
            return me.then(callback);
        },
        add: function (src) {
            return exports.add(src);
        }
    };
};

/**
 * 远程获取文件
 * TODO
 *
 * @param {string} src 文件路径
 * @param {string} target 文件保存路径
 * @param {Function} callback
 */
function fetchFile(src, target, callback) {}

/**
 * 扫描文件夹获取package信息
 *
 * @param {string} dir
 */
function scanDir(dir) {
    var fs = require('fs');
    var path =  require('path');
    var files = fs.readdirSync(dir);

    var folders = [];
    var res = [];
    for (var i = 0, file; file = files[i]; i++) {
        file = path.resolve(dir, file);
        var stat = fs.statSync(file);
        if (stat.isFile() && path.basename(file) == 'package.json') {
            res.push(file);
            break;
        }
        else if (stat.isDirectory()) {
            folders.push(file);
        }
    }
    
    if (res.length <= 0 && folders.length > 0) {
        for (var i = 0, item; item = folders[i]; i++) {
            item = scanDir(item);
            if (item.length > 0) {
                res = res.concat(item);
            }
        }
    }

    return res;
}

/**
 * 版本比较
 *
 * @param {string} v1
 * @param {string} v2
 * @return {number}
 */ 
function compareVersion(v1, v2) {
    v1 = v1.split('.');
    v2 = v2.split('.');
    var len = Math.max(v1.length, v2.length);

    var res = 0;
    for (var i = 0; i < len; i++) {
        res = (v1[i] || 0) - (v2[i] || 0);
        if (res) {
            break;
        }
    }

    return res;
}

/**
 * 得到当前所有的第三方依赖信息
 *
 * @return {Object}
 */
function getAllDeps() {
    var path = require('path');
    var util = require('./util');
    var proDir = require('edp-project').getInfo().dir;
    var depDir = path.resolve(proDir, 'dep');
    var deps = scanDir(depDir);

    var res = {};
    var platform = require('os').platform();
    deps.forEach(function (item) {
        var info = util.readJson(item);
        var data = res[info.name];
        info.dir = path.relative(proDir, path.dirname(item));
        if (platform == 'win32') {
            info.dir = info.dir.replace(/\\/g, '/');
        }
        if (!data) {
            data = res[info.name] = {};
        }
        data[info.version] = info;

        if (data.last) {
            if (compareVersion(info.version, data.last.version) > 0) {
                data.last = info;
            }
        }
        else {
            data.last = info;
        }
    });

    return res;
}

/**
 * 获取依赖信息
 *
 * @public
 * @param {string} name 模块名称，如果忽略该参数则获取所有的信息
 * @return {Object}
 */
exports.get = function (name) {
    var deps = getAllDeps();

    if (name) {
        return deps[name];
    }
    else {
        return deps;
    }
};

/**
 * 增加第三方依赖（非amd结构）
 * 添加到dep目录中，并按照版本号存放
 *
 * @param {string} src 文件路径
 */
exports.add = function (src) {
    var path = require('path');
    var fs = require('fs');
    var baseDir = path.resolve(require('edp-project').getInfo().dir, 'dep');
    var tmpDir = path.resolve(baseDir, 'tmp' + (new Date().getTime()));
    var util = require('./util');
    var extract = require('edp-package/lib/util/extract');

    fs.mkdirSync(tmpDir);

    var deferred = new Deferred();

    function fileHandler(file) {
        var extname = path.extname(file).substring(1);

        var extractMethod;
        switch(extname) {
            case 'gz':
            case 'tgz':
                extractMethod = 'tgz';
                break;
            case 'zip':
                extractMethod = 'zip';
                break;
        }

        var dir = path.resolve(tmpDir, 'tmp' + (new Date().getTime()));
        extract[extractMethod](file, dir, function () {
            var meta = util.readJson(path.resolve(dir, 'package.json')); 

            var targetDir = path.resolve(baseDir, meta.name);
            fs.mkdirSync(targetDir);
            fs.renameSync(dir, path.resolve(targetDir, meta.version));

            fs.rmdirSync(tmpDir);
            
            deferred.reslove();
        });
    }

    if (src.indexOf('http') >= 0) {
        fetchFile(src, tmpDir, fileHandler);
    }
    else {
        fileHandler(src);
    }

    return deferred.promise();
};
