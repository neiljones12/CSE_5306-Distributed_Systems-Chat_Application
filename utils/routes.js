'use strict';

class Routes {

    constructor(app, socket) {
        this.app = app;
        this.io = socket;
        this.userName = "";
        /* 
			Array to store the list of users along with there respective socket id.
		*/
        this.users = [];
        this.connection = [];
    }

    appRoutes() {

        this.app.get('/', (request, response) => {
            response.render('index');
        });

    }

    socketEvents() {

        this.io.on('connection', (socket) => {
            socket.on('username', (user) => {
                var repeat = false;
                for (var i = 0; i < this.users.length; i++) {
                    if (this.users[i].userName == user.name) {
                        repeat = true;
                    }
                }

                if (!repeat) {
                    this.users.push({
                        id: socket.id,
                        userName: user.name,
                        visible: user.visible,
                        online: user.online
                    });

                    console.log("User: " + user.name + " has logged in");

                    let len = this.users.length;
                    len--;
                    this.io.emit('userList', this.users, this.users[len].id);
                }
            });

            socket.on('logout', (username) => {
                var repeat = false;
                for (var i = 0; i < this.users.length; i++) {
                    if (this.users[i].userName == username) {
                        this.users[i].online = false;
                    }
                }

                console.log("User: " + username + " has logged off");

                let len = this.users.length;
                len--;
                this.io.emit('userList', this.users, this.users[len].id);

            });

            socket.on('login', (username, visible) => {
                var repeat = false;
                for (var i = 0; i < this.users.length; i++) {
                    if (this.users[i].userName == username) {
                        this.users[i].online = true;
                        this.users[i].visible = visible;
                    }
                }

                console.log("User: " + username + " has logged in");

                let len = this.users.length;
                len--;
                this.io.emit('userList', this.users, this.users[len].id);

            });

            socket.on('ConnectionInitiate', (data) => {
                
                var connection = {
                    id: this.connection.length+1,
                    User1: data.User1,
                    User2: data.User2,
                    Accepted: false
                };
                this.connection.push(connection);
                console.log(data.User1 + " has initiated a chat request with " + data.User2);
                this.io.emit('communicationList', this.connection);
            });

            socket.on('ConnectionAccept', (data) => {
                for (var i = 0; i < this.connection.length; i++) {
                    if (data.User1 == this.connection[i].User1 && data.User2 == this.connection[i].User2) {
                        this.connection[i].Accepted = true;
                    }
                } 
                console.log("Chat initiated between " + data.User1 + " and " + data.User2);
                this.io.emit('communicationList', this.connection);
            });

            socket.on('ConnectionDecline', (data) => {
                for (var i = 0; i < this.connection.length; i++) {
                    if (data.User1 == this.connection[i].User1 && data.User2 == this.connection[i].User2) {
                        this.connection[i].Accepted = false;
                    }
                }

                console.log("Chat declined between " + data.User1 + " and " + data.User2);
                this.io.emit('communicationList', this.connection);
            });

            socket.on('getMsg', (data) => {
                socket.broadcast.to(data.toid).emit('sendMsg', {
                    msg: data.msg,
                    name: data.name
                });
            });

            socket.on('logout', (socket) => {

                for (let i = 0; i < this.users.length; i++) {

                    if (this.users[i].id === socket.id) {
                        //this.users.splice(i, 1);
                        this.users[i].online = false;
                    }
                }
                this.io.emit('exit', this.users);
            });

            socket.on('disconnect', () => {

                for (let i = 0; i < this.users.length; i++) {

                    if (this.users[i].id === socket.id) {
                        //this.users.splice(i, 1);
                        this.users[i].online = false;
                    }
                }
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