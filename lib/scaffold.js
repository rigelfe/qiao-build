/**
 * @file 脚手架文件管理
 * @author treelite(c.xinle@gmail.com)
 */

var fs = require('fs');
var path = require('path');

var DIR_TPL = 'scaffold';

/**
 * 获取脚手架文件
 *
 * @public
 * @param {string} name 文件名
 * @return {string} 文件路径
 */
exports.getFile = function (name) {
    var file = path.resolve(__dirname + '/' + DIR_TPL, name);
    
    if (!fs.existsSync(file)) {
        throw new Error('can not find scaffold file: ' + name);
    }

    return file;
};

/**
 * 获取脚手架文件模板
 *
 * @public
 * @param {string} name 文件名
 * @return {string}
 */
exports.getTpl = function (name) {
    var file = exports.getFile(name + '.tpl');

    return fs.readFileSync(file, 'UTF-8');
};
