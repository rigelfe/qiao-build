/**
 * @file 构建功能的命令行执行
 * @author errorrik[errorrik@gmail.com]
 *         treelite[c.xinle@gmail.com]
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
cli.command = 'build';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '构建目录或项目';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm build [--output=outputDir]'
    + ' [--exclude=excludeString(file1,file2,file3)]'
    + ' [processors-conf=confFile]';

/**
 * 命令选项信息
 *
 * @type {Array}
 */
cli.options = [
    'output:',
    'exclude:',
    // add include
    'include:',
    'config:',
    'retention:',
    'force'
];

/**
 * 默认构建配置文件
 * 
 * @inner
 * @const
 * @type {string}
 */
var DEFAULT_BUILD_CONF = 'edp-build-config.js';

var path = require( 'path' );
var fs = require( 'fs' );

var PLATFORM = require('os').platform();

/**
 * 创建配置文件名
 * 
 * @param {Object} projectInfo 项目信息
 */
exports.createConfigFile = function (projectInfo) {
    var content = require('../scaffold').getTpl(
            DEFAULT_BUILD_CONF.replace(/\.js$/, '')
        );

    var file = path.resolve(
            projectInfo.dir,
            DEFAULT_BUILD_CONF
        );

    fs.writeFileSync(file, content, 'UTF-8');
};

/**
 * 加载配置文件
 * 
 * @inner
 * @param {string=} confFile 配置文件路径
 * @param {string=} baseDir 自动查找配置文件的基础路径
 * @return {Object}
 */
function loadConf( confFile, baseDir ) {
    var cwd = process.cwd();

    if ( confFile ) {
        confFile = path.resolve( cwd, confFile );
        if ( fs.existsSync( confFile ) ) {
            return require( confFile );
        }

        return null;
    }
    
    var dir;
    var parentDir = baseDir || cwd;
    do {
        dir = parentDir;
        confFile = path.resolve( dir, DEFAULT_BUILD_CONF );
        if ( fs.existsSync( confFile ) ) {
            return require( confFile );
        }

        parentDir = path.resolve( dir, '..' );
    } while ( parentDir != dir );

    return require( 'edp-build' ).getDefaultConfig();
}

/**
 * 处理路径通配符
 * 暂时只支持*
 *
 * @inner
 * @param {string} src 路径
 * @param {number} index 当前处理的层级序号 默认为空
 * @return {Array.<string>} 匹配的所有路径
 */
function processPaths(src, index) {
    var splitStr = PLATFORM == 'win32' ? '\\' : '/';

    src = src.split(splitStr);
    index = index || 1;

    // 结果
    var res = [];
    // 当前处理的层级路径
    var curPaths = [];

    // 查找当前层级是否有通配符*
    // 如有通配符则找出所有符合通配符的路径
    if (src[index].indexOf('*') >= 0) {
        var base = src.slice(0, index).join(splitStr);
        var items = fs.readdirSync(base);
        // 找到*将其替换成.*进行正则检查
        var name = new RegExp(src[index].replace(new RegExp('\\*', 'g'), '.*'));

        items.forEach(function (item) {
            if (name.test(item)) {
                curPaths.push(path.resolve(base, item));
            }
        });
    }
    else {
        curPaths = [src.slice(0, index + 1).join(splitStr)];
    }

    curPaths.forEach(function (item) {
        if (fs.existsSync(item)) {
            // 如果已经匹配到最有层级
            // 则表示已经找到对应的路径
            if (index == src.length - 1) {
                res.push(item);
            }
            else if (fs.statSync(item).isDirectory()) {
                // 继续向下一层级进发
                res = res.concat(
                    processPaths(
                        path.resolve(
                            item, 
                            src.slice(index + 1).join(splitStr)
                        ),
                        index + 1
                    )
                );
            }
        }
    });

    return res;
}

/**
 * 模块命令行运行入口
 * 
 * @param {Array} args 命令运行参数
 * @param {Object} opts 命令运行选项
 */
cli.main = function ( args, opts ) {
    var inputDir = args[ 0 ];
    var outputDir = opts.output;

    // 装载构建配置模块
    var conf = loadConf( opts.config, inputDir );
    if ( !conf ) {
        console.error( 'Build Config cannot found!' );
        process.exit( 0 );
    }

    // 处理构建的输入和输出目录
    if ( inputDir ) {
        conf.input = path.resolve( process.cwd(), inputDir );
        conf.output = path.resolve( inputDir, 'output' );
    }
    outputDir && (conf.output = path.resolve( process.cwd(), outputDir ));
    outputDir = conf.output;
    inputDir = conf.input;

    // 当输出目录存在时：
    // 1. 默认直接抛出异常，防止项目构建输出影响和覆盖原有文件
    // 2. 如果设置了force参数，强制删除当前存在的目录
    if ( fs.existsSync( outputDir ) ) {
        if ( opts.force ) {
            require( '../util' ).rmdir( outputDir );
        }
        else {
            console.error( outputDir + ' directory already exists!' );
            return;
        }
    }
    
    // 解析exclude参数
    var exclude = conf.exclude || [];
    if ( opts.exclude ) {
        exclude = conf.exclude = opts.exclude
            .replace( /(^\s+|\s+$)/g, '' )
            .split( /\s*,\s*/ );
    }

    // 如果output目录处于baseDir下，自动将output目录添加到exclude
    var outputRelative = path.relative( inputDir, outputDir );
    if ( !/^\.\./.test( outputRelative ) ) {
        exclude.push( outputRelative );
    }

    // 保留文件
    var retention = conf.retention || [];
    if (opts.retention) {
        retention = opts.retention
            .replace(/(^\s+|\s+$)/g, '')
            .replace(/\s*,\s*/);
    }
    // 将保留文件加入exclude中
    retention.forEach(function (item) {
        exclude.push(item);
    });
    
    // 将保留文件拷贝到输出目录
    var util = require('../util');
    var proDir = require('edp-project').getInfo().dir;
    var items = [];
    retention.forEach(function (item) {
        if (item.charAt(0) == '/') {
            item = item.substring(1);
        }

        items = items.concat(processPaths(path.resolve(proDir, item)));
        items.forEach(function (o) {
            item = path.relative(proDir, o);
            util.copy(o, path.resolve(outputDir, item));
        });
    });
    
    var customBuilder = require('../build');
    var moduleEntries = conf.moduleEntries 
        ? conf.moduleEntries.split(',')
        : ['vm', 'html'];

    // 预先注入处理器
    conf.injectProcessor({
        createProcessor: customBuilder.createProcessor
    });

    // 自动寻找入口模块，更新combine配置
    // TODO: 考虑适当的日志输出
    // console.log('[edpx-crm build] refresh combine config');
    // customBuilder.refreshCombine(
    //     path.resolve(proDir, conf.entryDir || ''),
    //     moduleEntries 
    // );
    // 更改入口为数组结构，支持多个路径入口
    console.log('[edpx-crm build] refresh combine config');
    var entryDirs = conf.entryDir || [];
    entryDirs.forEach(function (entry) {
        customBuilder.refreshCombine(
            path.resolve(proDir, entry || ''),
            moduleEntries 
        );
    });
    

    function callback() {
        // 更新combine文件版本
        // TODO: 考虑适当的日志输出
        console.log('[edpx-crm build] refresh combine version');
        customBuilder.refreshCombineVersion(
            path.resolve(proDir, conf.output, conf.distDir)
        );

        // 更新入口模块的urlArgs
        // TODO: 考虑适当的日志输出
        // console.log('[edpx-crm build] update combine urlArgs');
        // customBuilder.updateModuleVersion(
        //     path.resolve(proDir, conf.output, conf.entryDir || ''),
        //     moduleEntries 
        // );
        
        // 刷新时，也更改为刷新多个入口
        console.log('[edpx-crm build] update combine urlArgs');
        entryDirs.forEach(function (entry) {
            customBuilder.updateModuleVersion(
                path.resolve(proDir, conf.output, entry || ''),
                moduleEntries 
            );
        });
        
    }

    require('edp-build')(conf, callback);
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;
