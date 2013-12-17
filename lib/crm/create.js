/**
 * @file 创建模块
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
cli.command = 'create';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '创建模块';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm create <moduleId>';

/**
 * 模块命令行运行入口
 * 
 * @param {Array} args 命令运行参数
 * @param {Object} options 命令运行选项
 */
cli.main = function (args, options) {
    var moduleId = args[0];

    var path = require('path');
    var fs = require('fs');
    var proDir = require('edp-project').getInfo().dir;
    var vmFile = path.resolve(
            proDir, 
            require('./init').getDir().entry + '/' + moduleId
        ) 
        + '.vm';
    var jsFile = path.resolve(
            proDir, 
            'src/' + moduleId
        ) 
        + '.js';

    if (fs.existsSync(vmFile) || fs.existsSync(jsFile)) {
        console.log(moduleId + ' has existed');
        return;
    }

    var mkdirp = require('mkdirp');
    if (!fs.existsSync(path.dirname(vmFile))) {
        mkdirp.sync(path.dirname(vmFile));
    }
    if (!fs.existsSync(path.dirname(jsFile))) {
        mkdirp.sync(path.dirname(jsFile));
    }

    var creator = require('./add').creator;     
    // 创建vm文件
    creator.vm(
        vmFile, 
        {
            entryCode: {
                moduleId: moduleId
            }
        }
    );
    
    // 创建JS文件
    creator.js(jsFile);

    // 创建模拟数据
    require('../mock').add(
        moduleId + '.action',
        {
            type: 'vm'
        }
    );
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
