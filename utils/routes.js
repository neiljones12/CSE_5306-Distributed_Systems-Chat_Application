'use strict';

class Routes {

    constructor(app, socket) {
        this.app = app;
        this.io = socket;

        /* 
			Array to store the list of users along with there respective socket id.
		*/
        this.users = [];
    }


    appRoutes() {

        this.app.get('/', (request, response) => {
            response.render('index');
        });

    }

    socketEvents() { 
        this.io.on('connection', (socket) => { 
           
        }); 
    }

    routesConfig() {
        this.appRoutes();
        this.socketEvents();
    }
}
module.exports = Routes;