exports.input = __dirname;

var path = require( 'path' );
exports.output = path.resolve( __dirname, 'output' );

exports.srcDir = '#{srcDir}';
exports.distDir = '#{distDir}';
exports.entryDir = #{entryDir};
exports.moduleEntries = 'html,htm,phtml,tpl,vm,js';

var moduleEntries = exports.moduleEntries;
var pageEntries = 'html,htm,phtml,tpl,vm';

exports.getProcessors = function () {
    return [ 
        new LessCompiler( {
            entryExtnames: pageEntries
        } ), 
        new ModuleCompiler( {
            configFile: 'module.conf',
            entryExtnames: moduleEntries
        } ), 
        createProcessor(AbstractProcessor, 'js', {
            except: ['baidu', 'ecui']
        }),
        createProcessor(AbstractProcessor, 'less', {
            extnames: 'tpl,html'
        }),
        new PathMapper( {
            replacements: [
                { type: 'html', tag: 'link', attribute: 'href', extnames: pageEntries },
                { type: 'html', tag: 'img', attribute: 'src', extnames: pageEntries },
                { type: 'html', tag: 'script', attribute: 'src', extnames: pageEntries },
                { extnames: moduleEntries, replacer: 'module-config' }
            ],
            from: exports.srcDir,
            to: exports.distDir
        } ) 
    ];
};

exports.exclude = #{exclude};

exports.retention = [
    '/WEB-INF',
    '/dep/*/*/dist'
];

exports.injectProcessor = function ( processors ) {
    for ( var key in processors ) {
        global[ key ] = processors[ key ];
    }
};

