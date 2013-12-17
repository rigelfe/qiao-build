/**
 * @file 工具库
 * @author treelite(c.xinle@gmail.com)
 */

var fs = require('fs');
var path = require('path');

/**
 * 文件夹遍历(广度搜索)
 *
 * @param {string} dir 文件夹
 * @param {Function} callback 回调函数
 */
var walker = exports.walker = function (dir, callback) {
    var items = fs.readdirSync(dir);
    var stat;
    var dirs = [];

    for (var i = 0, item; item = items[i]; i++) {
        item = path.resolve(dir, item);
        stat = fs.statSync(item);
        callback(item, stat);
        if (stat.isDirectory()) {
            dirs.push(item);
        }
    }

    dirs.forEach(function (item) {
        walker(item, callback);
    });
};

// 动态加载的模块列表
var customModules = {};

/**
 * 动态加载模块
 *
 * 更换成md5计算，mtime不靠谱（难度是精度不够?）
 * TODO: 这速度不咋地...
 *
 * @param {string} file 文件名
 * @return {Object}
 */
exports.loadModule = function (file) {
    var md5 = require('MD5')(fs.readFileSync(file));

    if (customModules[file] && customModules[file] != md5) {
        delete require.cache[file];
    }

    customModules[file] = md5;

    return require(file.replace(/\.js$/, ''));
};

/**
 * 读取JSON文件
 *
 * @param {string} file 文件路径
 * @return {Object}
 */
exports.readJson = function (file) {
    var res;
    if (!fs.existsSync(file)) {
        res = {};
    }
    else {
        file = fs.readFileSync(file, 'UTF-8');
        res = JSON.parse(file);
    }
    
    return res;
};

/**
 * 写入JSON文件
 *
 * @param {string} file 文件路径
 * @param {Object} data JSON数据
 */
exports.writeJson = function (file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 4));
};

/**
 * 对象扩展
 *
 * @param {Object} target
 * @param {Object} source
 * @return {Object}
 */
exports.extend = function (target, source) {
    for (var key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }

    return target;
};

/**
 * 删除目录
 * 
 * @param {string} path 目录路径
 */
exports.rmdir = function ( path ) {
    if ( fs.existsSync( path ) && fs.statSync( path ).isDirectory() ) {
        fs.readdirSync( path ).forEach(
            function ( file ) {
                var fullPath = require( 'path' ).join( path, file );
                if ( fs.statSync( fullPath ).isDirectory() ) {
                    exports.rmdir( fullPath );
                }
                else {
                    fs.unlinkSync( fullPath );
                }
            }
        );

        fs.rmdirSync( path );
    }
};

/**
 * 拷贝文件(夹)
 *
 * @param {string} source 源文件(夹)
 * @param {string} target 目标文件(夹)
 */
exports.copy = function (source, target) {
    var mkdirp = require('mkdirp');

    if (!fs.existsSync(source)) {
        return;
    }

    var stat = fs.statSync(source);
    var files = [];
    var dirs = [];

    if (stat.isDirectory()) {
        dirs.push(source);
        // 找到所有的文件
        walker(source, function (file, stat) {
            if (!stat.isDirectory()) {
                files.push(file);
            }
            else {
                dirs.push(file);
            }
        });
    }
    else {
        files.push(source);
    }
    
    // 复制到文件夹
    if (target.charAt(target.length - 1) == '/') {
        target += path.basename(source);
    }

    dirs.forEach(function (dir) {
        dir = path.resolve(target, path.relative(source, dir));
        if (!fs.existsSync(dir)) {
            mkdirp.sync(dir);
        }
    });

    files.forEach(function (item) {
        var content = fs.readFileSync(item);
        var file = target;
        if (stat.isDirectory()) {
            file = path.resolve(file, path.relative(source, item));
        }
        var dir = path.dirname(file);
        if (!fs.existsSync(dir)) {
            mkdirp.sync(dir);
        }
        fs.writeFileSync(file, content);
    });
};

/**
 * 计算hash
 *
 * @param {string|Buffer} 
 * @return {string}
 */
exports.hash = function (data) {
    return require('MD5')(data);
};

/**
 * 找到所有符合后缀名的文件
 *
 * @public
 * @param {string} dir 搜索目录
 * @param {string|Array.<string>} extnames后缀名
 */
exports.findFiles = function (dir, extnames) {
    if (typeof extnames == 'string') {
        extnames = [extnames];
    }

    var res = [];
    extnames = ',' + extnames.join(',') + ',';
    walker(
        dir, 
        function (file, stat) {
            if (!stat.isFile()) {
                return;
            }

            var extname = require('path').extname(file);
            extname = extname.length > 0 
                ? extname.substring(1)
                : extname;

            if (extnames.indexOf(',' + extname + ',') >= 0) {
                res.push(file);
            }
        }
    ); 
    return res;
};
