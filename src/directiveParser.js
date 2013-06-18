var fs = require('fs'),
	Ast = require('./ast'),
	astParser = require("uglify-js").parser;

var getAst = exports.getAst = function(inputFile, charset) {
		if (typeof inputFile !== 'string') {
			return inputFile;
		}

		if (!fs.existsSync(inputFile)) {
			return astParser.parse(inputFile);
		}

		return astParser.parse(fs.readFileSync(inputFile, charset || 'utf8'));
	}

exports.parse = function(inputFile, charset) {
	var ast = getAst(inputFile, charset),
		result = {};

	Ast.walk(ast, 'call', function(stat) {
		//console.log(stat.toString());
		if (/^call,dot,.*,directive,.*$/.test(stat.toString())) {

			if (stat[2][0][0] == 'string') {
				result[stat[2][0][1]] = stat[2][1];

				/*console.log(Ast.gen_code(stat[2][1], {
					beautify: true
				}));*/
			} else if (stat[2][0][0] == 'object') {
				(stat[2][0][1] || []).forEach(function(item) {
					result[item[0]] = item[1];
				});

				//console.log(stat[2][0][1]);
			}
			//console.log(stat[2][0]);
		}

		// if (stat.toString().indexOf('call,name,require,') !== 0) {
		// 	return stat;
		// }
		// // stat:
		// // [ 'call', [ 'name', 'require' ], [ [ 'string', 'a' ] ] ]
		// var argsAst = stat[2];
		// argsAst.forEach(function(item) {
		// 	if (item[0] === 'string') {
		// 		var depModName = item[1];
		// 		if (moduleHelp.isRelative(depModName)) {
		// 			depModName = moduleHelp.getBaseModule(depModName) + debug;
		// 		} else {
		// 			depModName = project.getGlobalModuleId(depModName) + debug;
		// 		}
		// 		item[1] = depModName;
		// 	}
		// });
		return stat;
	});
	return result;
}