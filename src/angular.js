var module = angular.module('ng', []);

module.directive('xxx', function() {
	console.log("hahaha")
});

module.directive({
	haha: ABC,
	bb: function() {}
})