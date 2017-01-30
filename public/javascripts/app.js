const app = angular.module('app', ['ngStorage']);

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
        $scope.writeMessage = false;
        $localStorage["users"] = null;
        $scope.socketId = null;
        $scope.selectedUser = null;
        $scope.messages = [];
        $scope.msgData = null;
        $scope.userList = [];
        $scope.status = "Visible";
        $scope.login = true;
        $localStorage["currentUser"] = null;
        $scope.username = "";
        if ($localStorage.users == null) {
            $localStorage["users"] = "[]";
        }
    };

    $scope.visibleLogin = function () {
        $scope.status = "Visible";
        if ($scope.username != "")
        {
            $scope.check($scope.username, true)
            var user = { id: $localStorage["users"].length + 1, name: $scope.username, visible: true , online: true};
            $scope.register(user);
        } 
    };

    $scope.invisibleLogin = function () {
        $scope.status = "In Visible";
        $scope.check($scope.username, false)
        var user = { id: $localStorage["users"].length + 1, name: $scope.username, visible: false, online: true };
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
        //console.log(user.name);
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
        socket.emit('username', $localStorage["currentUser"]);
    };

    $scope.seletedUser = (selectedUser) => {
        $scope.writeMessage = true;
        selectedUser === $scope.socketId ? alert("Can't message to yourself.") : $scope.selectedUser = selectedUser;
    };


    $scope.sendMsg = ($event) => {
        const keyCode = $event.which || $event.keyCode;

        if (keyCode === 13 && $scope.message !== null) {
            socket.emit('getMsg', {
                toid: $scope.selectedUser,
                msg: $scope.message,
                name: $scope.username
            });
            $scope.message = null;
        }
    };


    //socket.emit('username', $scope.username);

    socket.on('userList', (userList, socketId) => {
        if ($scope.socketId === null) {
            $scope.socketId = socketId;
        }
        $scope.userList = userList;
    });


    socket.on('exit', (userList) => {
        $scope.userList = userList;
    });

    socket.on('sendMsg', (data) => {
        $scope.messages.push(data);
    });
});
