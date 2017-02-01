'use strict';

class Routes {

    constructor(app, socket) {
        this.app = app;
        this.io = socket;
        this.name = "";
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

            socket.on('logout', (username) => {
                var repeat = false;
                for (var i = 0; i < this.users.length; i++) {
                    if (this.users[i].name == username) {
                        this.users[i].online = false;
                    }
                }

                console.log("\n User: " + username + " has logged off");

                let len = this.users.length;
                len--;
                this.io.emit('userList', this.users, this.users[len].id);

            });

            socket.on('login', (username, visible) => {
                var found = false;
                for (var i = 0; i < this.users.length; i++) {

                    if (this.users[i].name == username) {
                        found = true;
                        this.users[i].online = true;
                        this.users[i].visible = visible;
                    }
                }

                if (!found)
                {
                    this.users.push({
                        id: socket.id,
                        name: username,
                        visible: visible,
                        online: true})
                }

                console.log("\n User: " + username + " has logged in");

                let len = this.users.length;
                len--;
                this.io.emit('login', this.users, this.users[len].id);

            });

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
                console.log("\n"+data.User1 + " has initiated a chat request with " + data.User2);
                this.io.emit('communicationList', this.connection);
            });

            socket.on('ConnectionAccept', (data) => {
                for (var i = 0; i < this.connection.length; i++) {
                    if (data.User1 == this.connection[i].User1 && data.User2 == this.connection[i].User2) {
                        this.connection[i].Accepted = true;
                    }
                }
                console.log("\n Chat initiated between " + data.User1 + " and " + data.User2);
                this.io.emit('communicationList', this.connection);
            });

            socket.on('ConnectionDecline', (data) => {
                for (var i = 0; i < this.connection.length; i++) {
                    if (data.User1 == this.connection[i].User1 && data.User2 == this.connection[i].User2) {
                        this.connection[i].Declined = true;
                    }
                }

                console.log("\n -- Chat declined between " + data.User1 + " and " + data.User2);
                this.io.emit('communicationList', this.connection);
            });

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

                console.log("\n Chat closed between " + user1 + " and " + user2);
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