/**
 * @file 模拟数据管理
 * @author treelite(c.xinle@gmail.com)
 */

/*global proxy:false */

// 配置信息

// 模拟数据存放地址
var DIR = 'test';

// vm文件存放路径
var VM_DIR = require('./crm/init').getDir().entry;

// 反向代理配置
// 乐高平台
// TODO: 以下配置考虑迁移到crmmeta中
var REMOTE_HOST = 'yf-rd-crm-cdc-db14.yf01.baidu.com';
var REMOTE_PORT = '8080';
var REMOTE_MOCK_PREFIX = '/code-gen/mock';
var REMOTE_VALIDTOR_PREFIX = '/code-gen/valid';

// 模拟数据处理器
var mockHanlder = {};

// 工具箱
var tools = {
    escapeInJ: function (str) {
        return new String(str)
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\\/g, '\\\\')
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n');
            
    },
    escapeInH: function (str) {
        return new String(str)
            .replace(/&/g, '&amp')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39')
            .replace(/"/g, '&quot;');
    }
};

// 内建函数
var buildinRef = {
    utils: {
        /**
         * JS下的模板变量编码
         *
         * @param {string} str
         * @return (string)
         */
        escapeInJ: function (str) {
            return tools.escapeInJ(str);
        },

        /**
         * HTML下的模板变量编码
         *
         * @param {string} str
         * @return {string}
         */
        escapeInH: function (str) {
            return tools.escapeInH(str);
        }
    },

    ejson: {
        /**
         * 进行e-json包裹的JSON序列化
         *
         * @param {*} obj
         * @return {string}
         */
        toJson: function (obj) {
            var data = {status: 0, data: obj};
            return JSON.stringify(data);
        },

        /**
         * 进行普通JSON序列化
         *
         * @param {*} obj
         * @return {string}
         */
        toSimpleJson: function (obj) {
            return JSON.stringify(obj);
        }
    }
};

/**
 * vm处理器
 *
 * @inner
 * @param {Object} context ws上下文
 * @param {Object} info 模拟数据信息
 * @param {Object} info.type 模拟数据类型
 * @param {Object} info.file vm文件路径
 * @param {Object} info.data 模板变量
 */
mockHanlder.vm = function (context, info) {
    var root = context.conf.documentRoot;
    var request = context.request;
    var file = info.file;
    if (!file) {
        file = VM_DIR + '/' 
            + request.pathname.replace(/\.action$/, '.vm').substring(1);
    }

    var data = info.data;
    if (typeof data == 'function') {
        data = data(context.request.url, getRequestData(context.request));
    }

    context.header['Content-Type'] = 'text/html';
    context.content = renderVM(file, data, root);
};

/**
 * JSON处理器
 *
 * @inner
 * @param {Object} context ws上下文
 * @param {Object} info 模拟数据信息
 * @param {Object} info.type 模拟数据类型
 * @param {string} info.data 文本信息
 */
mockHanlder.json = function (context, info) {
    var data = info.data;
    if (typeof data == 'function') {
        data = data(context.request.url, getRequestData(context.request));
    }
    context.header['Content-Type'] = 'application/json';
    context.content = data;
};

/**
 * 反向代理处理器
 *
 * @inner
 * @param {Object} context ws上下文
 * @param {Object} info 模拟数据信息
 * @param {string} info.type 模拟数据类型
 * @param {string} info.host 反向代理Host
 * @param {string} info.port 反向代理Port
 * @param {string} info.path 反向代理路径
 */
mockHanlder.remote = function (context, info) {
    var request = context.request;
    var meta = exports.getInfo();
    
    var remoteHost = info.host || REMOTE_HOST;
    var remotePort = info.port || REMOTE_PORT;
    // 'proxy' come from global
    // inject by ws
    var remote = proxy(remoteHost, remotePort);
    if (info.path) {
        request.url = info.path;
    }
    else {
        request.url = meta.remote.mock + request.url;
    }
    remote(context);
};

/**
 * 进行#parse处理，合并vm文件
 *
 * @inner
 * @param {string} file 文件路径
 * @param {string} root webroot
 * @return {string}
 */
function getVMSource(file, root) {
    var path = require('path');
    var fs = require('fs');

    file = fs.readFileSync(file, 'utf-8');
    file = file.replace(
        /#parse\(['"]([^'"]+)['"]\)/g, 
        function ($0, $1) {
            var url = $1;
            if (url.charAt(0) == '/') {
                url = path.resolve(root, url.substring(1));
            }
            else {
                url = path.resolve(path.dirname(file), url);
            } 
            if (!fs.existsSync(url)) {
                return $0;
            }

            return getVMSource(url, root);
        }
    );
    return file;
}

/**
 * 渲染vm文件
 *
 * @inner
 * @param {string} file 文件路径
 * @param {Object} data 模板变量
 * @param {string} root webroot
 * @return {string}
 */
function renderVM(file, data, root) {
    var res;
    var velocityjs = require('velocityjs');

    file = require('path').resolve(root, file);
    if (!require('fs').existsSync(file)) {
        res = '<h1>Can not find ' + file + '</h1>';
    }
    else {
        file = getVMSource(file, root);
        // 包裹所有模版参数到$data下
        // 与乐高平台统一
        data = {data: data};
        // 合并内建函数
        var context = require('./util').extend(buildinRef, data || {});
        res = velocityjs.render(file, context);
    }
    return res;
}

/**
 * 获取HTTP请求的参数
 * 包括queryString与body
 *
 * @inner
 * @param {Object} request
 * @return {Object}
 */
function getRequestData(request) {
    var data = {};
    data = require('querystring').parse(request.url.split('?')[1]) || data;

    var contentType = request.headers['Content-Type'];
    contentType = contentType ? contentType.toLowerCase() : '';
    if (request.method == 'POST' 
        && contentType.indexOf('multipart/form-data') < 0
    ) {
        var body = request.bodyBuffer.toString();
        data = require('./util').extend(
            data, 
            require('querystring').parse(body)
        );
    }

    return data;
}

/**
 * 获取配置信息
 *
 * @public
 * @return {Object}
 */
exports.getInfo = function () {
    var meta = require('./crm').getMetaData();

    var mockPrefix = REMOTE_MOCK_PREFIX 
        + (meta.code4mock 
            ? '/' + meta.code4mock 
            : '');

    var validatorPrefix = REMOTE_VALIDTOR_PREFIX
        + (meta.code4mock 
            ? '/' + meta.code4mock 
            : '');

    return {
        dir: DIR,
        remote: {
            host: REMOTE_HOST,
            port: REMOTE_PORT,
            mock: mockPrefix,
            validator: validatorPrefix
        }
    };
};


/**
 * 执行验证请求处理
 *
 * @public
 * @param {Object} context ws context
 */
exports.validator = function (context) {
    var info = exports.getInfo();
    var url = context.request.url;
    var fs = require('fs');
    var path = require('path');

    var remoteInfo = {
        host: info.remote.host,
        port: info.remote.port,
        url: info.remote.validator + url
    };

    var urlObj = require('url').parse(url, true);
    if (urlObj.query && urlObj.query.url) {
        var target = decodeURIComponent(urlObj.query.url);
        target = target.replace(/\.action$/, 'Validator.js');
        if (target.charAt(0) == '/') {
            target = target.substring(1);
        }
        var root = context.conf.documentRoot;
        target = path.resolve(root, info.dir, target);

        // 如果本地有验证模拟数据则获取相关信息
        if (fs.existsSync(target)) {
            try {
                target = require('./util').loadModule(
                            path.resolve(__dirname, target) 
                        );
            }
            catch (e) {
                console.log(e + ' ' + path.resolve(__dirname, target));
                context.content = JSON.stringify(
                    {
                        status: 500,
                        statusInfo: 'Mock Data Error, Please check the mock file'
                    }
                );
                return;
            }

            // 如果有本地模拟数据则不再进行反向代理
            if (target.data) {
                context.content = JSON.stringify({
                    status: 0,
                    data: target.data
                });
                return;
            }

            // 从本地模拟数据中获取反向代理配置
            if (target.host) {
                remoteInfo.host = target.host;
            }
            if (target.port) {
                remoteInfo.host = target.port;
            }
            if (target.path) {
                remoteInfo.url = target.path;
            }
        }
    }

    context.request.url = remoteInfo.url;

    var handler = proxy(remoteInfo.host, remoteInfo.port);
    handler(context);
};

/**
 * 执行模拟数据请求
 *
 * @public
 * @param {Object} context ws context
 */
exports.execute = function (context) {
    var path = require('path');
    var request = context.request;
    var root = context.conf.documentRoot;
    var file = path.resolve(
            root, 
            DIR + request.pathname
        ).replace(/\.action$/, '.js');

    if (!require('fs').existsSync(file)) {
        context.content = '<h1>Can not find mock data</h1>';
        return;
    }

    var handler;

    try {
        handler = require('./util').loadModule(file);
    }
    catch (e) {
        console.log(e + ' ' + file);
        context.content = '<h1>Mock Data Error, Please check the mock file</h1>';
        return;
    }
    
    var res = {};

    if (typeof handler == 'function') {
        res = handler(request);
    }
    else {
        res = handler;
    }

    handler = mockHanlder[res.type];

    if (!handler) {
        context.content = '<h1>No data</h1>';
    }
    else {
        handler(context, res);
    }
};

/**
 * 添加模拟action
 *
 * @public
 * @param {string} url
 * @param {Object} options
 */
exports.add = function (url, options) {
    var fs = require('fs');
    var path = require('path');
    var tpl = require('./scaffold').getTpl(options.type + '.mock');
    var proDir = require('edp-project').getInfo().dir;
    var config = require('edp-config');

    options = {
        data : options || {}
    };
    options.url = url;
    options.author = config.get('user.name');
    options.email = config.get('user.email');

    url = url.replace(/\.action$/, '.js');
    var file = path.resolve(proDir, DIR, url);

    if (!fs.existsSync(path.dirname(file))) {
        require('mkdirp').sync(path.dirname(file));
    }

    require('edp-codegen').text(tpl, options, file);
};
