var jsdom = require('jsdom'),
	path = require('path'),
	fs = require('fs'),
	filePath = path.resolve(__dirname, '../index.html');

jsdom.env(fs.readFileSync(filePath, 'utf-8'), [], function(errors, window) {
	travelDOM(window.document);
});

function travelDOM(element) {
	printNode(element);
	var i = 0,
		len = element.childNodes.length;
	for(; i < len; i++) {
		travelDOM(element.childNodes[i]);
	}
}

function printNode(node) {
	switch (node.nodeType) {
	case 1:
		console.log('element: ' + node.nodeName);
		break;
	case 3:
		console.log('text: ' + node.nodeValue);
		break;
	case 9:
		console.log('#root#');
		break;
	default:
		break;
	}
}