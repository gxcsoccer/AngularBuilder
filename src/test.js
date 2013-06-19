var parser = require('./directiveParser'),
	path = require('path');

var result = parser.parse(path.resolve(__dirname, '../lib/angular.js'));

//console.info(JSON.stringify(ast, null, "	"));
console.log(result);