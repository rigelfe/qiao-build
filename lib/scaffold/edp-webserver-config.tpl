exports.port = 8848;
exports.directoryIndexes = true;
exports.documentRoot = __dirname;
exports.getLocations = function () {
    return [
        { 
            location: '/', 
            handler: home( 'index.html' )
        },
        { 
            location: /^\/redirect-local/, 
            handler: redirect('redirect-target', false) 
        },
        { 
            location: /^\/redirect-remote/, 
            handler: redirect('http://www.baidu.com', false) 
        },
        { 
            location: /^\/redirect-target/, 
            handler: content('redirectd!') 
        },
        { 
            location: '/empty', 
            handler: empty() 
        },
        { 
            location: /\.css$/, 
            handler: [
                autoless()
            ]
        },
        { 
            location: /\.less$/, 
            handler: [
                file(),
                less()
            ]
        },
        {
            location: /validatorGenFilter\?url=/,
            handler: [
                crmValidator()
            ]
        },
        {
            location: /\.action/,
            handler: [
                crmMock() 
            ]
        },
        { 
            location: /^.*$/, 
            handler: [
                file(),
                proxyNoneExists()
            ]
        }
    ];
};

exports.injectRes = function ( res ) {
    for ( var key in res ) {
        global[ key ] = res[ key ];
    }
};
