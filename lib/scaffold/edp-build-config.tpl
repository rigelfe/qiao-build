exports.input = __dirname;

var path = require( 'path' );
exports.output = path.resolve( __dirname, 'output' );

exports.srcDir = 'src';
exports.distDir = 'asset';
exports.entryDir = 'entry';
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

exports.exclude = [
    '/tool',
    '/doc',
    '/test',
    '/module.conf',
    '/dep/packages.manifest',
    '/dep/*/*/test',
    '/dep/*/*/doc',
    '/dep/*/*/demo',
    '/dep/*/*/tool',
    '/dep/*/*/*.md',
    '/dep/*/*/package.json',
    '/edp-*',
    '/.edpproj',
    'jsDoc.conf',
    '.svn',
    '.git',
    '.gitignore',
    '.idea',
    '.project',
    'Desktop.ini',
    'Thumbs.db',
    '.DS_Store',
    '*.tmp',
    '*.bak',
    '*.swp'
];

exports.retention = [
    '/WEB-INF',
    '/dep/*/*/dist'
];

exports.injectProcessor = function ( processors ) {
    for ( var key in processors ) {
        global[ key ] = processors[ key ];
    }
};

