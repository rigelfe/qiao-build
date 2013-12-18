/**
 * @file 添加文件
 * @author treelite[c.xinle@gmail.com]
 */

/**
 * 寻找入口模块，更新build combine配置
 * 
 * @public
 */
exports.refresh = function () {
    var util = require('../util');
    var edpPro = require('edp-project');
    var proInfo = edpPro.getInfo();
    var moduleConf = edpPro.module.getConfigFile(proInfo);
    var moduleInfo = util.readJson(moduleConf);
    var entris = require('../module').getEntries(proInfo.dir);

    var combine = {};
    entris.forEach(function (item) {
        combine[item] = true;
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
    util.writeJson(moduleConf, moduleInfo);
};

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
cli.command = 'refresh';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '刷新模块配置信息';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm refresh';

/**
 * 模块命令行运行入口
 * 
 * @param {Array} args 命令运行参数
 * @param {Object} options 命令运行选项
 */
cli.main = function (args, options) {
    exports.refresh();
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;

