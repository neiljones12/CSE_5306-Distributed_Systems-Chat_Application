'use strict';

class Routes {

    //Defining the constructor for the server
    constructor(app, socket) {
        this.app = app;
        this.io = socket;
        this.name = "";
        this.users = [];
        this.connection = [];
    }

    appRoutes() {
        //App route to render the root directory
        this.app.get('/', (request, response) => {
            response.render('index');
        });

        //The app route to hange the /login request.
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/login', (request, response) => {
            response.status(200); 
            response.send('Logged In');
        });

        //The app route to hange the /logout request.
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/logout', (request, response) => {
            response.status(200);
            response.send('Logged Out');
        });

        //The app route to hange the POST /message request to send messages to another users
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/message', (request, response) => {
            response.status(200);
            response.send('Message sent');
        });

        //The app route to hange the POST /ConnectionInitiate request to send messages to another users
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/ConnectionInitiate', (request, response) => {
            response.status(200);
            response.send('Connection Initiated');
        });

        //The app route to hange the POST /ConnectionAccept request to send messages to another users
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/ConnectionAccept', (request, response) => {
            response.status(200);
            response.send('Connection Accepted');
        });

        //The app route to hange the POST /ConnectionDecline request to send messages to another users
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/ConnectionDecline', (request, response) => {
            response.status(200);
            response.send('Connection Declined');
        });

        //The app route to hange the POST /ConnectionClose request to send messages to another users
        //This checks if the connection to the server is valid. If its valid the corresponding socket methods are called from the controller
        this.app.post('/ConnectionClose', (request, response) => {
            response.status(200);
            response.send('Connection Closed');
        });
    }

    socketEvents() {
        //checks for the connection event which would be triggered when the client is connected to the server
        this.io.on('connection', (socket) => {

            //Triggered on the logout event sent out by the socket
            socket.on('logout', (username) => {
                var repeat = false;
                for (var i = 0; i < this.users.length; i++) {
                    if (this.users[i].name == username) {
                        this.users[i].online = false;
                    }
                }

                console.log("\n User: " + username + " has logged off \n");

                let len = this.users.length;
                len--;
                this.io.emit('userList', this.users, this.users[len].id);
            });

            //Triggered on the login event sent out by the socket
            socket.on('login', (data) => { 
                var found = false;
                for (var i = 0; i < this.users.length; i++) {

                    if (this.users[i].name == data.username) {
                        found = true;
                        this.users[i].online = true;
                        this.users[i].visible = data.visible;
                    }
                }

                if (!found)
                {
                    this.users.push({
                        id: socket.id,
                        name: data.username,
                        visible: data.visible,
                        online: true})
                }

                console.log("\n User: " + data.username + " has logged in \n");

                var data = {
                    users: this.users,
                    connectionList: this.connection
                };
                
                //console.log(this.users);

                this.io.emit('login', data);

            });

            //Triggered on the ConnectionInitiate event sent out by the socket
            socket.on('ConnectionInitiate', (data) => {

                var connection = {
                    id: this.connection.length + 1,
                    User1: data.User1,
                    User2: data.User2,
                    Accepted: false,
                    Declined: false,
                    closed: false
                };
                this.connection.push(connection);
                console.log("\n " + data.User1 + " has initiated a chat request with " + data.User2 + " \n");

                //Sends out an communicationList event over the socket
                this.io.emit('communicationList', this.connection);
            });

            //Triggered on the ConnectionAccept event sent out by the socket
            socket.on('ConnectionAccept', (data) => {
                for (var i = 0; i < this.connection.length; i++) {
                    if (data.User1 == this.connection[i].User1 && data.User2 == this.connection[i].User2) {
                        this.connection[i].Accepted = true;
                    }
                }
                console.log("\n Chat initiated between " + data.User1 + " and " + data.User2 + " \n");

                //Sends out an communicationList event over the socket
                this.io.emit('communicationList', this.connection);
            });

            //Triggered on the ConnectionDecline event sent out by the socket
            socket.on('ConnectionDecline', (data) => {
                for (var i = 0; i < this.connection.length; i++) {
                    if (data.User1 == this.connection[i].User1 && data.User2 == this.connection[i].User2) {
                        this.connection[i].Declined = true;
                    }
                }

                console.log("\n Chat declined between " + data.User1 + " and " + data.User2 + " \n");

                //Sends out an communicationList event over the socket
                this.io.emit('communicationList', this.connection);
            }); 

            //Triggered on the ConnectionCloseOnLogout event sent out by the socket
            socket.on('ConnectionCloseOnLogout', (user) => {
                var user1 = "";
                var user2 = "";

                for (var i = 0; i < this.connection.length; i++) {
                    if (user == this.connection[i].User1 || user == this.connection[i].User2) {
                        this.connection[i].closed = true;
                        user1 = this.connection[i].User1;
                        user2 = this.connection[i].User2;
                    }
                }

                if(user1 != "" && user2!= "")
                {
                    console.log("\n Chat closed between " + user1 + " and " + user2 + " \n");
                }
                
                //Sends out an communicationList event over the socket
                this.io.emit('communicationList', this.connection);
            });

            //Triggered on the ConnectionClose event sent out by the socket
            socket.on('ConnectionClose', (user) => {
                var user1 = "";
                var user2 = "";

                for (var i = 0; i < this.connection.length; i++) {
                    if (user == this.connection[i].User1 || user == this.connection[i].User2) {
                        this.connection[i].closed = true;
                        user1 = this.connection[i].User1;
                        user2 = this.connection[i].User2;
                    }
                }

                if (user1 != "" && user2 != "") {
                    console.log("\n Chat closed between " + user1 + " and " + user2 + " \n");
                }

                //Sends out an communicationList event over the socket
                this.io.emit('communicationList', this.connection);
            });

            //Triggered on the getMsg event sent out by the socket
            socket.on('getMsg', (data) => {
                socket.broadcast.to(data.toid).emit('sendMsg', {
                    msg: data.msg,
                    name: data.name
                });
            });

            //Triggered on the logout event sent out by the socket
            socket.on('logout', (socket) => {

                for (let i = 0; i < this.users.length; i++) {

                    if (this.users[i].id === socket.id) {
                        //this.users.splice(i, 1);
                        this.users[i].online = false;
                    }
                }

                //Sends out an exit event over the socket
                this.io.emit('exit', this.users);
            });

            //Triggered on the disconnect event sent out by the socket
            socket.on('disconnect', () => {
                
                for (let i = 0; i < this.users.length; i++) {

                    if (this.users[i].id === socket.id) {
                        //this.users.splice(i, 1);
                        this.users[i].online = false;
                    }
                }

                //Sends out an exit event over the socket
                this.io.emit('exit', this.users);
            });

        });

    }

    routesConfig() {
        this.appRoutes();
        this.socketEvents();
    }
}
module.exports = Routes;