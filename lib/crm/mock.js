/**
 * @file 添加模拟数据
 * @author treelite(c.xinle@gmail.com)
 */

// mock数据构造器
var maker = {};

/**
 * 创建vm模板mock
 *
 * @param {Object} rl
 * @param {string} url 模拟请求URL
 * @param {Function} callback
 */
maker['1'] = function (rl, url, callback) {
    var proDir = require('edp-project').getInfo().dir;
    var path = require('path');
    var res = {type: 'vm'};

    rl.question('vm file: ', function (answer) {
        if (answer) {
            res.file = path.relative(
                proDir, 
                path.resolve(process.cwd(), answer)
            );
        }
        callback(res);
    });
};

/**
 * 创建json数据mock
 *
 * @param {Object} rl
 * @param {string} url 模拟请求URL
 * @param {Function} callback
 */
maker['2'] = function (rl, url, callback) {
    var res = {type: 'json'};
    res.data = '';

    callback(res);
};

/**
 * 创建反向代理mock
 *
 * @param {Object} rl
 * @param {string} url 模拟请求URL
 * @param {Function} callback
 */
maker['3'] = function (rl, url, callback) {
    var res = {type: 'remote'};

    rl.question('path: ', function (answer) {
        if (answer) {
            res.path = answer;
        }
        callback(res);
    });
};

/**
 * 创建验证器mock
 *
 * @param {Object} rl
 * @param {string} url 模拟请求URL
 * @param {Function} callback
 */
maker['4'] = function (rl, url, callback) {
    var res = {type: 'validator'};

    url = url.replace(/\.action$/, 'Validator.js');
    callback(res, url);
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
cli.command = 'mock';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '设置模拟数据';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm mock <url>';

/**
 * 模块命令行运行入口
 * 
 * @param {Array} args 命令运行参数
 */
cli.main = function (args) { 
    var url = args[0];

    if (!url) {
        console.log('Please input mock url');
        return;
    }

    var readline = require('readline');
    var rl = readline.createInterface(
            {
                input: process.stdin,
                output: process.stdout
            }
        );

    rl.question(
        'mock file type (1 - vm, 2 - json, 3 - remote, 4 - validator): ', 
        function (answer) {
            var hanlder = maker[answer];

            if (!hanlder) {
                rl.close();
                console.log('unknow type');
            }
            else {
                hanlder(
                    rl, url, 
                    function (info, fixUrl) {
                        rl.close();
                        require('../mock').add(fixUrl || url, info);
                    }
                );
            }
        }
    );
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
