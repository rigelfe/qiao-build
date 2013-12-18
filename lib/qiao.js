/**
 * @file qiao edp插件
 * @author treelite(c.xinle@gmail.com)
 */

/**
 * 命令行配置项
 *
 * @inner
 * @type {Object}
 */
var cli = {};

/**
 * 命令名称
 *
 * @type {string}
 */
cli.command = 'qiao';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = 'qiao项目管理';

/**
 * 模块命令行运行入口
 *
 */
cli.main = function () {
    var path = require('path');
    var info = require('./util').readJson(path.resolve(__dirname, '../package.json'));
    console.log('Qiao');
    console.log('------');
    console.log(info.name);
    console.log('Version: ' + info.version);
    console.log(info.description);
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
