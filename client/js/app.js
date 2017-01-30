// App
var app = angular.module('app', ['ngRoute','ngStorage']);
 
// App controller
app.controller('appController', ['$scope', '$localStorage', '$location', function ($scope, $localStorage, $location) {
	$scope.register = true;
	$scope.init = function () {
		if ($localStorage["user"] != null) {
			$scope.register = false;
		}
	}; 
}]);
 

app.config(function($routeProvider) {
    $routeProvider
    .when("/", {
        templateUrl : "./index.html"
    })
});