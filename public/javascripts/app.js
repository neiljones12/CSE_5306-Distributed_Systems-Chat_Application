//----------------------------------------------------------------
//------------------------- CONTROLLER ---------------------------
//------------------------- NEIL JONES ---------------------------
//------------------------- 1001317689 ---------------------------
//----------------------------------------------------------------

const app = angular.module('app', []);
//Factory definition to integrate socket.io in order to use sockets with node.js
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

//Controller definition 
app.controller('Controller', function ($scope, $http, $location, socket) {

    //The init() method is called when the page is initialized. Its main function is to initialize all the variables.
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

    //This method is called when the user agrees to login in visibly. 
    //The visible flag is set to true and the applicationLogin() method is called
    $scope.visibleLogin = function () {
        $scope.visible = true;
        if ($scope.username != "") {
            $scope.applicationLogin();
        }
    };

    //This method is called when the user agrees to login in in-visibly
    //The visible flag is set to false and the applicationLogin() method is called
    $scope.invisibleLogin = function () {
        $scope.visible = false;
        if ($scope.username != "") {
            $scope.applicationLogin();
        }
    };

    //This method is used to Login into the application.
    //The username and visiblity is posted to the server
    //On success the user is logged into the system
    $scope.applicationLogin = function () {
        $scope.login = false;

        $http({
            url: "/login",
            method: "POST",
            params: { username: $scope.username, visible: $scope.visible }
        }).then(function successCallback(response) {
            var data = {
                username: $scope.username,
                visible: $scope.visible
            };
            socket.emit('login', data);
        }, function errorCallback(response) {
            console.log(response);
        });
    };

    //This method is used to Logout of the application.
    //The username is posted to the server
    //On success the user is logged out of the system
    $scope.logout = function (username) {
        $scope.login = true;
        $scope.messages = [];

        $http({
            url: "/logout",
            method: "POST",
            params: { username: $scope.username }
        }).then(function successCallback(response) {
            socket.emit('logout', username);
            socket.emit('ConnectionCloseOnLogout', username);
        }, function errorCallback(response) {
            console.log(response);
        });
    };

    //This message is triggered when the user hits ENTER to send a message
    //The message is posted to the server
    $scope.sendMsg = ($event) => {
        //Detect ENTER key press
        if ($event.key == "Enter") {
            //Post to database
            $http({
                url: "/message",
                method: "POST",
                params: { to: $scope.selectedUser, message: $scope.message, name: $scope.username }
            }).then(function successCallback(response) {

                const keyCode = $event.which || $event.keyCode;

                if (keyCode === 13 && $scope.message !== null) {

                    //Create an object with the message and username
                    var data = {
                        msg: $scope.message,
                        name: $scope.username
                    };

                    //Add the message to the message history
                    $scope.messages.push(data);

                    //Post the message to the socket so that it is sent to the other client
                    socket.emit('getMsg', {
                        toid: $scope.selectedUser,
                        msg: $scope.message,
                        name: $scope.username
                    });

                    //Clear the text box after sending the data
                    $scope.message = null;
                }

            }, function errorCallback(response) {
                //Log any errors
                console.log(response);
            });
        }
    };

    //Method called when the user enters a username of the user to initiate a chat. Using this method a chat can be initiated with either
    //a user with visibility set on or off.
    $scope.search = function () {
        var found = false;
        for (var i = 0; i < $scope.userList.length; i++) {
            if ($scope.userList[i].name == $scope.searchUsername) {
                found = true;
            }
        }

        if (found) {
            $scope.chatInitialte($scope.username, $scope.searchUsername);
        }
        else {
            alert($scope.searchUsername + " NOT FOUND");
        }
    };

    //This method is called when the socket emits Login
    socket.on('login', (userList) => {
        $scope.userList = userList;
        //Userlist is returned and is added to the scope
        for (var i = 0; i < $scope.userList.length; i++) {
            if ($scope.userList[i].name == $scope.username) {
                $scope.socketId = $scope.userList[i].id;
            }
        }
        //Calculate the number of users based on the user list
        $scope.userListCount = $scope.userList.length;
    });

    //This method is called when the socket emits exit
    //exit is emmited when the client closes the window
    socket.on('exit', (data) => {
        //Userlist is returned and is added to the scope
        $scope.userList = data;
        //Calculate the number of users based on the user list
        $scope.userListCount = data.length;        
    });

    //This method is called when a user is select to chat with
    $scope.seletedUser = (selectedUser) => {
        //Write message flag is set
        $scope.writeMessage = true;

        //Selected user is set
        selectedUser === $scope.socketId ? alert("Can't message yourself.") : $scope.selectedUser = selectedUser;
    };


    //The communicationList object is watched for changes. if there is any change, appropriate action needs to be taken
    $scope.$watch('communicationList', function () {
        //The message object is initialized
        $scope.messages = [];

        //Iterating through the communication list object
        for (var i = 0; i < $scope.communicationList.length; i++) {

            //Operations for user2
            if ($scope.communicationList[i].User2 == $scope.username) {

                //Checking to see if the chat is closed
                if ($scope.communicationList[i].closed) {

                    //setting the chatAccept flag to false
                    $scope.chatAccept = false;
                }
                else {
                    //Checking to see if the chat request is accepted
                    if ($scope.communicationList[i].Accepted) {

                        //setting the chatAccept flag to true and chatRequest flag to false
                        $scope.chatAccept = true;
                        $scope.chatRequest = false;

                        //Iterating through the userList object
                        for (var j = 0; j < $scope.userList.length; j++) {
                            if ($scope.userList[j].name == $scope.communicationList[i].User1) {

                                //Assigning the chattingWith object 
                                $scope.chattingWith = $scope.userList[j].name;
                                //Setting the selectedUser by passing the user id to the selectedUser method
                                $scope.seletedUser($scope.userList[j].id);
                            }
                        }
                    }

                        //Checking to see if the chat request is declined
                    else if ($scope.communicationList[i].Declined) {

                        //If the chat request is declined setting the chatDeclined, chatRequest and chatInvite flags.
                        $scope.chatDeclined = true;
                        $scope.chatRequest = false;
                        $scope.chatInvite = false;

                        //Setting the chatDeclinedMessage that would be displayed
                        $scope.chatDeclinedMessage = "Chat request declined from " + $scope.communicationList[i].User1;
                    }
                    else {
                        //Setting the chatRequest flag to true
                        $scope.chatRequest = true;

                        //Setting the chatRequestMessage
                        $scope.chatRequestMessage = $scope.communicationList[i].User1 + " wants to chat";

                        //Updating the communicationObject
                        $scope.communicationObject = $scope.communicationList[i];
                    }
                }
            }

            //Operations for user1
            if ($scope.communicationList[i].User1 == $scope.username)

                //Checking to see if the chat is closed
                if ($scope.communicationList[i].closed) {
                    //setting the chatAccept flag to false
                    $scope.chatAccept = false;
                }
                else {

                    //Checking to see if the chat request is accepted
                    if ($scope.communicationList[i].Accepted) {

                        //setting the chatAccept flag to true and chatRequest flag to false
                        $scope.chatAccept = true;
                        $scope.chatInvite = false;

                        //Iterating through the userList object
                        for (var j = 0; j < $scope.userList.length; j++) {
                            if ($scope.userList[j].name == $scope.communicationList[i].User2) {

                                //Assigning the chattingWith object 
                                $scope.chattingWith = $scope.userList[j].name;
                                //Setting the selectedUser by passing the user id to the selectedUser method
                                $scope.seletedUser($scope.userList[j].id);
                            }
                        }
                    }

                        //Checking to see if the chat request is declined
                    else if ($scope.communicationList[i].Declined) {

                        //If the chat request is declined setting the chatDeclined, chatRequest and chatInvite flags.
                        $scope.chatDeclined = true;
                        $scope.chatRequest = false;
                        $scope.chatInvite = false;

                        //Setting the chatDeclinedMessage that would be displayed
                        $scope.chatDeclinedMessage = "Chat request declined from " + $scope.communicationList[i].User2;
                    }
                    else {
                        //Setting the chatInvite flag to true
                        $scope.chatInvite = true;

                        //Setting the messageInvite message
                        $scope.messageInvite = "Invitation sent to " + $scope.communicationList[i].User2;

                        //Updating the communicationObject
                        $scope.communicationObject = $scope.communicationList[i];
                    }
                }
        }
    }, true);

    //The function acceptChat is called when the user decides to accept chat
    $scope.acceptChat = function (data) {

        //ConnectionAccept is emmited over the socket
        $http({
            url: "/ConnectionAccept",
            method: "POST",
            params: { data: data }
        }).then(function successCallback(response) {
            socket.emit('ConnectionAccept', data);
        }, function errorCallback(response) {
            console.log(response);
        });
        
    };

    //The function declineChat is called when the user decides to decline the chat
    $scope.declineChat = function (data) {

        //ConnectionDecline is emmited over the socket
        $http({
            url: "/ConnectionDecline",
            method: "POST",
            params: { data: data }
        }).then(function successCallback(response) {
            socket.emit('ConnectionDecline', data);
        }, function errorCallback(response) {
            console.log(response);
        });
    };

    //The function closeChat is called when the user closes chat
    $scope.closeChat = function (user) {
        
        //ConnectionClose is emmited over the socket
        $http({
            url: "/ConnectionClose",
            method: "POST",
            params: { user: user }
        }).then(function successCallback(response) {
            socket.emit('ConnectionClose', user);
        }, function errorCallback(response) {
            console.log(response);
        }); 
    };

    //The function chatInitialte is used to initiate chat between users
    $scope.chatInitialte = function (User1, User2) {

        //Setting the initiate flag to true
        var initiate = true;
        for (var i = 0; i < $scope.communicationList.length; i++) {
            if ($scope.communicationList[i].User1 == User2 || $scope.communicationList[i].User2 == User2) {

                //If two users are currently chatting, a new chat is not initiated
                if (!$scope.communicationList[i].closed) {
                    alert("BUSY");

                    //The initiate flag is set to false
                    initiate = false;
                }
            }
        }

        //If the initiate flag is true, ConnectionInitiate is emmited over the socket
        if (initiate) {
            var data = {
                User1: User1,
                User2: User2
            }; 

            $http({
                url: "/ConnectionInitiate",
                method: "POST",
                params: { data: data }
            }).then(function successCallback(response) {
                socket.emit('ConnectionInitiate', data);
            }, function errorCallback(response) {
                console.log(response);
            }); 
        }
    };

    //checking for communicationList on the socket, when it does occur, the object communicationList is updated
    socket.on('communicationList', (data) => {
        $scope.communicationList = data;
    });

    //checking for sendMsg on the socket, when it does occur, the messages object is updated 
    socket.on('sendMsg', (data) => {
        $scope.messages.push(data);
    });
});
