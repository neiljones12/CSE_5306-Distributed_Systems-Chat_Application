const app = angular.module('app', ['ngRoute', 'ngStorage']); 

app.factory('socket', function ($rootScope) {
    const socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});

app.controller('Controller', function ($scope, $http, $localStorage, $location, socket) {
    $scope.init = function () {
        $scope.login = true;
        $localStorage["currentUser"] = null;
        $scope.username = "";
        if ($localStorage.users == null) {
            $localStorage["users"] = "[]";
        }
    };

    $scope.visibleLogin = function () {
        $scope.check($scope.username, true)
        var user = { id: $localStorage["users"].length + 1, name: $scope.username, visible: true };
        $scope.register(user); 
    };

    $scope.invisibleLogin = function () {
        $scope.check($scope.username, false)
        var user = { id: $localStorage["users"].length + 1, name: $scope.username, visible: false };
        $scope.register(user);
    };

    $scope.check = function (username, status) {
        var users = JSON.parse($localStorage["users"]);
        for (var i = 0; i < users.length; i++) {
            if (users[i].name == username) {
                users[i].visible = status;
                $scope.redirect(username);
            }
        }
    };

    $scope.register = function (user) {
        var users = JSON.parse($localStorage["users"]);
        users.push(user);
        $localStorage["users"] = JSON.stringify(users);
        $scope.redirect(user.name);
    };

    $scope.logout = function () {
        $localStorage["currentUser"] = null;
        $scope.login = true;
    };

    $scope.redirect = function (username) {
        $localStorage["currentUser"] = username;
        $scope.login = false;
        $scope.username = $localStorage["currentUser"];
    };
});
