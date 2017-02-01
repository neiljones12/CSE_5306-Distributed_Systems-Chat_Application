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
        $scope.oldUser = false;
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
        $scope.login = true;
        $scope.status = "Visible";
        $scope.username = "";
        $scope.chatDeclinedMessage = "";
        $scope.chattingWith = "";

        if ($scope.userList == undefined) {
            $scope.userList = [];
        }

        if ($scope.communicationList == undefined) {
            $scope.communicationList = [];
        }
    };


    $scope.visibleLogin = function () {
        $scope.visible = true;
        if ($scope.username != "") {
            $scope.applicationLogin();
        }
    };

    $scope.invisibleLogin = function () {
        $scope.visible = false;
        if ($scope.username != "") {
            $scope.applicationLogin();
        }
    };


    $scope.applicationLogin = function () {
        $scope.login = false;
        socket.emit('login', $scope.username, $scope.visible);
    };


    $scope.logout = function (username) {
        $scope.login = true;
        socket.emit('logout', username);
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

    socket.on('login', (userList) => {
        $scope.userList = userList;
        for (var i = 0; i < $scope.userList.length; i++) {
            if ($scope.userList[i].name == $scope.username) {
                $scope.socketId = $scope.userList[i].id;
            }
        }
        $scope.userListCount = $scope.userList.length;
    });

    socket.on('exit', (userList) => {
        $scope.userList = userList;
        $scope.userListCount = userList.length;
    });

    $scope.seletedUser = (selectedUser) => {
        $scope.writeMessage = true;
        selectedUser === $scope.socketId ? alert("Can't message yourself.") : $scope.selectedUser = selectedUser;
    };


    //Chat 

    $scope.$watch('communicationList', function () {
        for (var i = 0; i < $scope.communicationList.length; i++) {

            if ($scope.communicationList[i].User2 == $scope.username) {
                if ($scope.communicationList[i].closed) {
                    $scope.chatAccept = false;
                }
                else {
                    if ($scope.communicationList[i].Accepted) {
                        $scope.chatAccept = true;
                        $scope.chatRequest = false;
                        for (var j = 0; j < $scope.userList.length; j++) {
                            if ($scope.userList[j].name == $scope.communicationList[i].User1) {
                                $scope.chattingWith = $scope.userList[j].name;
                                $scope.seletedUser($scope.userList[j].id);
                            }
                        }
                    }
                    else if ($scope.communicationList[i].Declined) {
                        $scope.chatDeclined = true;
                        $scope.chatRequest = false;
                        $scope.chatInvite = false;
                        $scope.chatDeclinedMessage = "Chat request declined from " + $scope.communicationList[i].User1;
                    }
                    else {
                        $scope.chatRequest = true;
                        $scope.chatRequestMessage = $scope.communicationList[i].User1 + " wants to chat";
                        $scope.communicationObject = $scope.communicationList[i];
                    }
                }
            }

            if ($scope.communicationList[i].User1 == $scope.username) {
                if ($scope.communicationList[i].closed) {
                    $scope.chatAccept = false;
                }
                else {
                    if ($scope.communicationList[i].Accepted) {
                        $scope.chatAccept = true;
                        $scope.chatInvite = false;
                        for (var j = 0; j < $scope.userList.length; j++) {
                            if ($scope.userList[j].name == $scope.communicationList[i].User2) {
                                $scope.chattingWith = $scope.userList[j].name;
                                $scope.seletedUser($scope.userList[j].id);
                            }
                        }
                    }
                    else if ($scope.communicationList[i].Declined) {
                        $scope.chatDeclined = true;
                        $scope.chatRequest = false;
                        $scope.chatInvite = false;
                        $scope.chatDeclinedMessage = "Chat request declined from " + $scope.communicationList[i].User2;
                    }
                    else {
                        $scope.chatInvite = true;
                        $scope.messageInvite = "Invitation sent to " + $scope.communicationList[i].User2;
                        $scope.communicationObject = $scope.communicationList[i];
                    }
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

    $scope.closeChat = function (user) {
        socket.emit('ConnectionClose', user);
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
