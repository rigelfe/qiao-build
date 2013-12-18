/**
 * @file 生成jsDoc
 * @author Wanglei(wuji0223@gmailcom)
 */

/**
 * 解析路径
 * @param  {string} path 路径
 */
function resolvePath(path){
    var arr = path.split('..');
    var regMatchList = path.match(/\.\.\//g);
    var ret = '';
    var i, item;
    for(i = 0; item = regMatchList[i]; i++){
        ret += item;
    }

    return require('fs').realpathSync(ret) + arr[arr.length - 1];
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
cli.command = 'doc';

/**
 * 命令描述信息
 *
 * @type {string}
 */
cli.description = '创建jsDoc';

/**
 * 命令用法信息
 *
 * @type {string}
 */
cli.usage = 'edp crm doc';

/**
 * 命令选项
 *
 * @param {string} src 要生成jsDoc的源代码目录，默认项目根目录下src目录
 * @param {string} out 生成jsDoc的目标目录，默认项目根目录下doc目录
 */
cli.options = [
    'src:',
    'out:'
];

/**
 * 模块命令行运行入口
 *
 * @param {Array} args 命令运行参数
 * @param {Object} options 命令运行选项
 */
cli.main = function(args, options) {


    var proj = require('edp-project');

    var projPath = proj.getInfo().dir; // 项目根路径

    var src, out;

    if(!options.src){
        // 如果没有src参数，则src目录是项目根目录下的src目录
        src = projPath + '/src';
    }else{
        if(/^\.\./.test(options.src)){
            // src = require('fs').realpathSync('..') + options.src.split('..')[1];
            src = resolvePath(options.src);
        }else if(/^\//.test(options.src)){
            src = require('fs').realpathSync('/') + options.src.split('/')[1];
        }else if(/^\./.test(options.src)){
            src = require('fs').realpathSync('.') + options.src.split('.')[1];
        }else{
            src = require('fs').realpathSync('.') + '/' +options.src;
        }
    }

    if(!options.out){
        // 如果没有out参数，则out目录是项目根目录下的out目录
        out = projPath + '/doc';
    }else{
        if(/^\.\./.test(options.out)){
            // out = require('fs').realpathSync('..') + options.out.split('..')[1];
            out = resolvePath(options.out);
        }else if(/^\//.test(options.out)){
            out = require('fs').realpathSync('/') + options.out.split('/')[1];
        }else if(/^\./.test(options.out)){
            out = require('fs').realpathSync('.') + options.out.split('.')[1];
        }else{
            out = require('fs').realpathSync('.') + '/' +options.out;
        }
    }

    var exec = require('child_process').exec;

    var execStr = [
        'jsdoc',
        src,
        '-c',
        projPath + '/jsDoc.conf',
        '-d',
        out
    ].join(' ');


    var runJsDoc = exec(execStr);

    runJsDoc.stderr.on('data', function (data) {
        console.log('stderr: \n' + data + '\n');
    });
};

/**
 * 命令行配置项
 *
 * @type {Object}
 */
exports.cli = cli;