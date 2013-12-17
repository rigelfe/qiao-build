/**
 * @file build processor
 * @author treelite(c.xinle@gmail.com)
 */

var packages = {};

packages.js = {
    name: 'JsCompressor',

    process: function (file, processContext, callback) {
        if (file.extname != 'js') {
            callback();
            return;
        }

        var uglifyJS = require('uglify-js');
        var ast = uglifyJS.parse(file.data);

        ast.figure_out_scope();
        ast = ast.transform(uglifyJS.Compressor());

        ast.figure_out_scope();
        ast.compute_char_frequency();
        ast.mangle_names({ 
            except: ['$', 'require', 'exports', 'module']
                        .concat(this.except || [])
        });

        file.setData(ast.print_to_string());

        callback();
    }
};

exports.create = function (Super, type, options) {
    options = options || {};
    options.name = 'JsCompressor';
    var processor = new Super(options);
        
    var items = packages[type];
    if (items) {
        processor = require('./util').extend(processor, items);
    }
    
    return processor;
};
