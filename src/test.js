var parser = require('./directiveParser'),
	path = require('path');

var result = parser.parse(path.join(__dirname, 'angular.js'));

//console.info(JSON.stringify(ast, null, "	"));
console.log(result);