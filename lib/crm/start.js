/**
 * @file 启动ws 注入velocity解析，CRM模拟数据拦截等逻辑
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
cli.command = 'start';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '启动调试服务器';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm start [--port=PORT]'
    + ' [--document-root=DOCUMENT_ROOT]';

/**
 * 命令选项信息
 *
 * @type {Array}
 */
cli.options = [
    'port:',
    'document-root:'
];

/**
 * 模块命令行运行入口
 * 
 * @param {Array} args 命令运行参数
 * @param {Object} options 命令运行选项
 */
cli.main = function (args, options) {
    var root = options['document-root'];

    if (root) {
        root = require('path').resolve(process.cwd(), root);
    }
    else {
        root = require('edp-project').getInfo().dir;
    }

    require('../ws').start({
        port: options.port,
        documentRoot: root
    });
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
