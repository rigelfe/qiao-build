

/**
 * 生成package主模块的代理模块代码
 * 
 * @inner
 * @param {Object} packageInfo package信息对象
 * @return {string} 
 */
function getPackageMainCode( packageInfo ) {
    var id = packageInfo.name;
    var mod = packageInfo.module;
    return 'define(\'' + id + '\', [\'' + mod 
        + '\'], function ( main ) { return main; });';
}

/**
 * 编译模块
 * 
 * @param {string} code 模块代码
 * @param {string} moduleId 模块id
 * @param {string} moduleConfigFile 模块配置文件
 * @param {boolean|Object=} combine 合并依赖编译选项
 * @param {Object=} excludeModules 如果合并依赖，需要一个对象指定不需要合并的模块
 * @return {string} 
 */
function compileModule(file, moduleConfigFile) {
    var moduleId = require('./get-module-id')(file.path, moduleConfigFile);

    var moduleConfig = require('./read-json-file')(moduleConfigFile);
    var code = file.data;

    // 根据语法树分析模块
    var ast;
    try {
        ast = require( 'esprima' ).parse( code );
    }
    catch ( ex ) {
        return false;
    }

    var moduleInfo = require( './analyse-module' )( ast, moduleConfig.defineLiteral);
    if ( !moduleInfo || moduleInfo instanceof Array ) {
        return false;
    }

    // 附加模块id
    var pkgInfo;
    if ( !moduleInfo.id ) {
        moduleInfo.id = moduleId;
        pkgInfo = require( './get-package-info' )( moduleId, moduleConfigFile );
    }
    moduleId = moduleInfo.id;


    // 模块代码数组容器
    var codes = [];


    // 当模块是一个package时，需要生成代理模块代码，原模块代码自动附加的id带有`main`
    // 否则，具名模块内部使用相对路径的require可能出错
    if ( pkgInfo ) {
        codes.push( getPackageMainCode( pkgInfo ) );
        moduleId = moduleInfo.id = pkgInfo.module;
    }
    codes.push( require( './generate-module-code' )( moduleInfo ) );

    // 处理依赖 
    var dependencies = moduleInfo.actualDependencies || [];
    var resolveModuleId = require('./resolve-module-id');
    dependencies.forEach(function (depId, index) {
        // 修正依赖的moduleId
        // 并修正对资源的依赖为对资源加载器的依赖
        dependencies[index] = resolveModuleId(depId.split('!')[0], moduleId);
    });

    var res = {};
    res.code = codes.join('\n\n');
    res.dependencies = dependencies;

    return res;
}

module.exports = exports = compileModule;
