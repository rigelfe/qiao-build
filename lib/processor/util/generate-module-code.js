

var SYNTAX = require( 'estraverse' ).Syntax;
var LITERAL_DEFINE = 'define';

/**
 * 生成模块代码
 * 
 * @param {Object} moduleInfo 模块信息，通常是analyseModule的返回结果
 * @return {string}
 */
module.exports = exports = function ( moduleInfo ) {
    var dependenciesExpr;
    if ( moduleInfo.dependencies instanceof Array ) {
        dependenciesExpr = {
            type: SYNTAX.ArrayExpression,
            elements: []
        };

        moduleInfo.dependencies.forEach( function ( dependency ) {
            dependenciesExpr.elements.push( {
                type: SYNTAX.Literal,
                value: dependency,
                raw: "'" + dependency + "'"
            });
        } );
    }

    var defineArgs = [ moduleInfo.factoryAst ];
    dependenciesExpr && defineArgs.unshift( dependenciesExpr );
    var id = moduleInfo.id;
    if ( id ) {
        defineArgs.unshift( {
            type: SYNTAX.Literal,
            value: moduleInfo.id,
            raw: "'" + moduleInfo.id + "'"
        } );
    }
    
    // 生成define语句
    var defineLiteral = moduleInfo.defineLiteral.split('.');
    var token = defineLiteral.pop();
    var callee = {type: SYNTAX.Identifier, name: token};
    var item;
    while (defineLiteral.length > 0) {
        token = defineLiteral.pop();
        item = {
            type: SYNTAX.MemberExpression,
            computed: false,
            object:  {type: SYNTAX.Identifier, name: token}
        };

        if (callee.type == SYNTAX.MemberExpression) {
            item.prototype = callee.object;
            callee.object = item;
        }
        else {
            item.property = callee;
            callee = item;
        }
    }
    
    var ast = {
        type: 'Program',
        body: [
            {
                type: SYNTAX.ExpressionStatement,
                expression: {
                    type: SYNTAX.CallExpression,
                    callee: callee,
                    arguments: defineArgs
                }
            }
        ]
    };
    
    return require( 'escodegen' ).generate( ast );
}
