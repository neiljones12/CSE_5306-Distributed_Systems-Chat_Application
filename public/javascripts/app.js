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
        $scope.chatRequest = false;
        $scope.chatAccept = false;
        $scope.chatDeclined = false;
        $scope.chatInvite = false;
        $scope.messageInvite = "";
        $scope.searchUsername = "";
        $scope.writeMessage = false;
        $scope.socketId = null;
        $scope.selectedUser = null;
        $scope.messages = [];
        $scope.msgData = null;
        $scope.status = "Visible";
        $scope.login = true;
        $scope.username = "";

        if ($scope.userList == undefined) {
            $scope.userList = [];
        }

        if ($scope.communicationList == undefined) {
            $scope.communicationList = [];
        }
    };

    $scope.visibleLogin = function () {
        $scope.status = "Visible";
        if ($scope.username != "") {
            $scope.check($scope.username, true)
            var user = { name: $scope.username, visible: true, online: true };
            $scope.register(user);
        }
    };

    $scope.invisibleLogin = function () {
        $scope.status = "In Visible";
        $scope.check($scope.username, false)
        var user = { name: $scope.username, visible: false, online: true };
        $scope.register(user);
    };

    $scope.check = function (username, status) {
        for (var i = 0; i < $scope.userList.length; i++) {
            if ($scope.userList[i].name == username) {
                $scope.userList[i].visible = status;
                socket.emit('login', username, status);
                $scope.redirect($scope.userList[i]);
            }
        }
    };

    $scope.register = function (user) {
        $scope.userList.push(user);
        $scope.redirect(user);
    };

    $scope.logout = function (username) {
        $scope.login = true;
        socket.emit('logout', username);
    };

    $scope.redirect = function (user) {
        $scope.login = false;
        $scope.username = user.name;;
        //console.log(user);

        socket.emit('username', user);
    };

    $scope.seletedUser = (selectedUser) => {
        $scope.writeMessage = true;
        selectedUser === $scope.socketId ? alert("Can't message yourself.") : $scope.selectedUser = selectedUser;
    };


    $scope.sendMsg = ($event) => {
        const keyCode = $event.which || $event.keyCode;

        if (keyCode === 13 && $scope.message !== null) {

            var data = {
                msg: $scope.message,
                name: $scope.username
            };

            $scope.messages.push(data);

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
        $scope.userListCount = userList.length;
    });


    socket.on('exit', (userList) => {
        $scope.userList = userList;
        $scope.userListCount = userList.length;
    });

    //Chat 

    $scope.$watch('communicationList', function () {
        for (var i = 0; i < $scope.communicationList.length; i++) {
            //console.log($scope.communicationList[i]);
            if ($scope.communicationList[i].User2 == $scope.username) {
                if ($scope.communicationList[i].Accepted) {
                    $scope.chatAccept = true;
                    $scope.chatRequest = false; 
                    console.log($scope.userList);
                    for (var j = 0; j < $scope.userList.length;j++)
                    {
                        if($scope.userList[j].userName == $scope.communicationList[i].User1)
                        {
                            $scope.seletedUser($scope.userList[j].id);
                        }
                    }
                }
                else {
                    $scope.chatRequest = true;
                    $scope.chatRequestMessage = $scope.communicationList[i].User1 + " wants to chat";
                    $scope.communicationObject = $scope.communicationList[i];
                }
            }
            if ($scope.communicationList[i].User1 == $scope.username) {
                if ($scope.communicationList[i].Accepted) {
                    $scope.chatAccept = true;
                    $scope.chatInvite = false;
                    for (var j = 0; j < $scope.userList.length; j++) {
                        if ($scope.userList[j].userName == $scope.communicationList[i].User2) {
                            $scope.seletedUser($scope.userList[j].id);
                        }
                    }
                }
                else {
                    $scope.chatInvite = true;
                    $scope.messageInvite = "Invitation sent to " + $scope.communicationList[i].User2;
                    $scope.communicationObject = $scope.communicationList[i];
                }
            }
        }
    }, true);

    $scope.acceptChat = function (data) {
        socket.emit('ConnectionAccept', data);
    };

    $scope.declineChat = function (data) {
        socket.emit('ConnectionDecline', data);
    };

    $scope.chatInitialte = function (User1, User2) {
        var data = {
            User1: User1,
            User2: User2
        };
        socket.emit('ConnectionInitiate', data);
    };

    socket.on('communicationList', (data) => {
        $scope.communicationList = data;
    });


    socket.on('sendMsg', (data) => {
        $scope.messages.push(data);
    });
});
