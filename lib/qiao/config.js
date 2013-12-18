/**
 * @file 商桥项目初始化build.config及module.conf
 * @author imshiner(doctype@126.com)
 */

var DEPENDENCS = ['esl', 'tangram', 'ecui', 'rf-css'];

var PACKAGE = ['rf'];

var DIR = {
    MACRO: 'tcom',
    ENTRY: 'entry'
};

var path = require( 'path' );
var fs = require( 'fs' );

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
 * 获取edp-build-config配置参数
 *
 * @param {Function} callback 回调方法
 */
function getBuildConfigData(callback) {
    var readline = require('readline');
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    var res = {};

    // rl.question('input:', function (answer) {
    //     res.input = answer || '__dirname';
    //     rl.question('output:', function (answer) {
    //         res.output = answer || 'output';
            rl.question('srcDir:', function (answer) {
                res.srcDir = answer || 'src';
                rl.question('distDir:', function (answer) {
                    res.distDir = answer || 'asset';
                    rl.question('entryDir:', function (answer) {
                        res.entryDir = answer || 'entry';
                        rl.question('include:', function (answer) {
                            res.include = answer || '';
                            rl.question('exclude:', function (answer) {
                                res.exclude = answer || '';
                                rl.close();
                                callback && callback(res);
                            });
                        });
                    });
                });
            });
    //     });
    // });
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

function formatPath(src) {
    return src.split(path.sep).join('/');
}

function handleConfig(config) {
    var entryDir = config.entryDir;
    var entries = entryDir.split(',');
    var res = {};
    var util = require('../util');
    util.extend(res, config);
    
    res.entryDir = JSON.stringify(entries);

    var exclude = config.exclude.split(',');
    if (config.include !== '') {
        var files = fs.readdirSync(process.cwd());
        var include = config.include.split(',');
        var includeArr = []
        include.forEach(function (item) {
            includeArr.push(item.split('/'));
        });
        for (var i = 0, item; item = files[i]; i++) {
            var flag = true;
            includeArr.forEach(function (arr) {
                if (arr[0] == item) {
                    flag = false;
                }
            });

            flag && exclude.push(item);
        }

        console.log(exclude);
    }

    // var exclude = config.exclude.split(',');
    // if (config.include !== '') {
    //     var include = config.include.split(',');
    //     var root = process.cwd();
    //     util.walker(root, function (item) {
    //         item = formatPath(item);
    //         include.forEach(function (includeFile) {
    //             includeFile = formatPath(path.resolve(root, includeFile));
    //             var reg = new RegExp('^' + includeFile);
    //             var regEx = new RegExp('^' + item)
    //             if (!reg.test(item)) {
    //                 var flag = true;
    //                 exclude.forEach(function (excludeFile) {
    //                     if (regEx.test(formatPath(path.resolve(root, excludeFile)))) {
    //                         flag = false;
    //                     }
    //                 });
    //                 flag && exclude.push(formatPath(path.relative(root, item)));
    //             }
    //         });
    //     });
    // }

    //res.exclude = JSON.stringify(exclude);
    return res;
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
cli.command = 'config';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '初始化项目build配置';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm config';

/**
 * 模块命令行运行入口
 */
cli.main = function () {
    getBuildConfigData(function (res) {

        var content = require('../scaffold').getTpl(
            'edp-build-config-qiao'
        );

        var file = path.resolve(
                process.cwd(),
                'edp-build-config.js'
            );

        res = handleConfig(res);

        content = content.replace(/#{(.*)}/g, function (match, str) {
            return res[str];
        });

        fs.writeFileSync(file, content, 'UTF-8');
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
