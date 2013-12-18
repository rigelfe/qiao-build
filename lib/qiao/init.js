/**
 * @file 项目初始化
 * @author treelite(c.xinle@gmail.com)
 */

var DEPENDENCS = ['esl', 'tangram', 'ecui', 'rf-css'];

var PACKAGE = ['rf'];

var DIR = {
    MACRO: 'tcom',
    ENTRY: 'entry'
};

/**
 * 初始化edp项目
 *
 * @inner
 * @param {Object} metaData 项目信息
 */
function initProject(metaData) {
    var project = require('edp-project');
    var projectInfo = project.init(process.cwd());

    project.dir.init(projectInfo);
    require('../crm').setMetaData(metaData);
    require('./build').createConfigFile(projectInfo);
    require('../ws').createConfigFile(projectInfo);
    require('../crm').createJSDocConfFile(projectInfo);
}

/**
 * 收集项目元数据信息
 *
 * @inner
 * @param {Function} callback
 */
function getMetaData(callback) {
    var readline = require('readline');
    var rl = readline.createInterface(
            {
                input: process.stdin,
                output: process.stdout
            }
        );

    var res = {};

    rl.question('Project Code: ', function (answer) {
        res.code = answer || 'test';
        rl.question('Project Name: ', function (answer) {
            res.name = answer || 'test';
            rl.question('Project Code (for mock): ', function (answer) {
                res.code4mock = answer;
                rl.close();

                if (callback) {
                    callback(res);
                }
            });
        });
    });
}

/**
 * 初始化项目文件夹
 *
 * @inner
 */
function initDir() {
    var fs = require('fs');

    fs.mkdirSync(DIR.MACRO);
    fs.mkdirSync(DIR.ENTRY);
}

/**
 * 初始导入项目默认依赖（非AMD）
 *
 * @inner
 */
function initDependence(callback) {
    var scaffold = require('../scaffold');
    var dep = require('../dep');

    function addDep(i, callback) {
        if (i >= DEPENDENCS.length) {
            if (callback) {
                callback.call(null);
            }
            return;
        }

        var file = DEPENDENCS[i] + '.zip';
        dep.add(scaffold.getFile(file)).then(function () {
            addDep(++i, callback);
        });
    }

    addDep(0, callback);
}

/**
 * 初始化导入依赖的package
 * TODO: 暂时使用文件导入 待更改为Registry导入
 *
 * @inner
 * @param {Function} callback
 */
function initPackage(callback) {
    var loader = require('edp-package');
    var scaffold = require('../scaffold');

    function addPackage(i, callback) {
        if (i >= PACKAGE.length) {
            if (callback) {
                callback.call(null);
            }
            return;
        }

        var file = PACKAGE[i] + '.zip';
        loader.importFromFile(scaffold.getFile(file), './dep', function () {
            addPackage(++i, callback);
        });
    }

    addPackage(0, callback);
}

/**
 * 初始化项目默认文件
 *
 * @inner
 */
function initFile(metaData) {
    var tpl = require('../scaffold').getTpl('utils.macro');
    var info = {
        project: metaData,
        scripts: [],
        styles: []
    };

    function addDep(item) {
        var mainFiles = item.main || [];
        if (typeof mainFiles == 'string') {
            mainFiles = [mainFiles];
        }

        var deps;
        var type;
        for (var i = 0, file; file = mainFiles[i]; i++) {
            deps = [];
            type = file.split('.')[1];
            if (type == 'js') {
                deps = info.scripts;
            }
            else if (type == 'css') {
                deps = info.styles;
            }
            deps.push(item.dir + '/' + file);
        }
    }

    var deps = require('../dep').get();
    DEPENDENCS.forEach(function (item) {
        item = deps[item].last;
        addDep(item);
    });

    require('edp-codegen').text(tpl, info, 'tcom/utils.macro.vm');
}

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
cli.command = 'init';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '初始化当前目录为项目目录';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm init';

/**
 * 模块命令行运行入口
 */
cli.main = function () {
    getMetaData(function (metaData) {
        initProject(metaData);
        initDir();

        initDependence(function () {
            initPackage(function () {
                initFile(metaData);
            });
        });
    });
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;

/**
 * 目录配置
 *
 * @return {Object}
 */
exports.getDir = function () {
    return {
        macro: DIR.MACRO,
        entry: DIR.ENTRY
    }
};
