/**
 * @file 添加文件
 * @author treelite(c.xinle@gmail.com)
 */

/**
 * 文件创建器
 */
var creator = {};

/**
 * 获取loader配置信息
 *
 * @inner
 * @param {string} file 文件路径
 */
function getLoaderInfo(file) {
    var data = {};
    var loaderData = require( 'edp-project' ).loader.getConfig( file );
    if (loaderData && loaderData.url) {
        var packages = loaderData.packages;
        if (packages.length > 0) {
            packages[packages.length - 1].last = true;
        }
        data.loader = true;
        data.loaderConfig = true;
        data.loaderUrl = loaderData.url;
        data.loaderBaseUrl = 'src';
        data.loaderPaths = loaderData.paths;
        data.loaderPackages = packages;
    }
    return data;
}

/**
 * vm文件创建器
 *
 * @param {string} file 文件路径
 * @param {Object=} options
 */
creator.vm = function (file, options) {
    var crmMeta = require('../crm').getMetaData();
    var data = getLoaderInfo(file);

    options = options || {};
    data.project = {
        name: crmMeta.name
    };
    data = require('../util').extend(data, options);

    require('edp-codegen').text(
        require('../scaffold').getTpl('vm'), 
        data, 
        file
    );
};

/**
 * html文件创建器
 *
 * @param {string} file 文件路径
 * @param {Object=} options
 */
creator.html = function (file, options) {
    var crmMeta = require('../crm').getMetaData();
    var data = getLoaderInfo(file);

    options = options || {};
    data.project = {
        name: crmMeta.name
    };
    data = require('../util').extend(data, options);

    require('edp-codegen').text(
        require('../scaffold').getTpl('html'), 
        data, 
        file
    );
};

/**
 * js文件创建器
 *
 * @param {string} file 文件路径
 * @param {Object=} options
 */
creator.js = function (file, options) {
    var config = require('edp-config');
    var info = {
        author: config.get('user.name'),
        email: config.get('user.email')
    };
    var tpl = require('../scaffold').getTpl('js');

    options = options || {}; 
    info = require('../util').extend(info, options);

    require('edp-codegen').text(tpl, info, file);
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
cli.command = 'add';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '添加文件';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm add <file> [--type=TYPE]';

/**
 * 命令选项
 *
 * @type {Array.<string>}
 */
cli.options = ['type:'];

/**
 * 模块命令行运行入口
 * 
 * @param {Array} args 命令运行参数
 * @param {Object} options 命令运行选项
 */
cli.main = function (args, options) {
    var file = args[0];

    if (!file) {
        console.log('Please input the file name');
        return;
    }

    var extname = file.split('.')[1];

    var type = options.type || extname;

    if (!type) {
        console.log('Please input the file type');
        return;
    }

    var handler = creator[type];
    if (!handler) {
        require('fs').writeFileSync(file, '', 'UTF-8');
    }
    else {
        handler(file);
    }
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;


/**
 * 文件创建器
 */
exports.creator = creator;
