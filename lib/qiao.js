/**
 * @file vm项目管理
 * @author treelite(c.xinle@gmail.com)
 */

/**
 * 元数据文件名
 *
 * @const
 * @inner
 * @type {string}
 */
var PROJECT_META =  'crmmetadata';


/**
 * jsDoc 配置文件
 * @const
 * @type {String}
 */
var DEFAULT_JSDOC_FILE = 'jsDoc.conf';

/**
 * 获取meta文件路径
 */
function getMetaDataFile() {
    var project = require('edp-project');
    var proInfoDir = project.getInfo().infoDir;
    return require('path').resolve(proInfoDir, PROJECT_META);
}

/**
 * 获取项目元数据
 *
 * @return {Object}
 */
exports.getMetaData = function () {
    var metaFile = getMetaDataFile();

    return require('./util').readJson(metaFile);
};

/**
 * 设置项目元数据
 *
 * @param {Object} data
 */
exports.setMetaData = function (data) {
    var util = require('./util');
    var metaData = exports.getMetaData();

    metaData = util.extend(metaData, data);

    var metaFile = getMetaDataFile();

    util.writeJson(metaFile, metaData);
};

/**
 * 创建jsDoc配置文件
 *
 * @param {Object} projectInfo 项目信息
 */
exports.createJSDocConfFile = function (projectInfo) {
    var tpl = require('./scaffold').getTpl(
            DEFAULT_JSDOC_FILE.replace(/\.conf$/, '')
        );

    var file = require('path').resolve(
            projectInfo.dir,
            DEFAULT_JSDOC_FILE
        );

    require('edp-codegen').text(tpl, {}, file);
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
cli.command = 'crm';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = 'CRM项目管理';

/**
 * 模块命令行运行入口
 *
 */
cli.main = function () {
    var path = require('path');
    var info = require('./util').readJson(path.resolve(__dirname, '../package.json'));
    console.log('Hello RigelFE');
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
