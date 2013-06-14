var app = angular.module('myApp',[]);

app.directive('person', function(){
  return {
    transclude : true,
    template: '<h1>A Person</h1><div ng-transclude></div>',
    link : function($scope, $element, $attr){
      // some code
    }
  }
});
