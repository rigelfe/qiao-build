/**
 * @file 添加第三方依赖
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
cli.command = 'import';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '添加第三方依赖';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm import <file>';

/**
 * 模块命令行运行入口
 */
cli.main = function (args) {
    var src = args[0];

    require('../dep').add(src);
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
