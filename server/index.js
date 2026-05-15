const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const CoupGame = require('./game/coup');
const utilities = require('./utilities/utilities');

const defaultPort = 8000;

function createQuoupServer() {
    const app = express();
    app.use(cors());

    const server = http.createServer(app);
    const io = socketIo(server);
    const namespaces = {};
    const namespaceIntervals = new Set();

    app.get('/createNamespace', function (req, res) {
        let newNamespace = '';
        while(newNamespace === '' || (newNamespace in namespaces)) {
            newNamespace = utilities.generateNamespace();
        }
        const newSocket = io.of(`/${newNamespace}`);
        openSocket(newSocket, `/${newNamespace}`, io, namespaces, namespaceIntervals);
        namespaces[newNamespace] = null;
        res.json({namespace: newNamespace});
    })

    app.get('/exists/:namespace', function (req, res) {
        const namespace = req.params.namespace;
        res.json({exists: (namespace in namespaces)});
    })

    return {
        app,
        server,
        io,
        namespaces,
        listen: (...args) => server.listen(...args),
        close: (callback) => {
            namespaceIntervals.forEach(interval => clearInterval(interval));
            namespaceIntervals.clear();
            Object.keys(namespaces).forEach(namespace => delete namespaces[namespace]);
            Object.keys(io.nsps).forEach(namespace => {
                if(namespace !== '/') {
                    delete io.nsps[namespace];
                }
            });
            io.close(() => {
                if(server.listening) {
                    server.close(callback);
                } else if(callback) {
                    callback();
                }
            });
        }
    };
}

// game namespace: oneRoom
const openSocket = (gameSocket, namespace, io, namespaces, namespaceIntervals) => {
    let players = []; // includes deleted for index purposes
    let partyMembers = []; // actual members
    let partyLeader = ''
    let started = false;

    gameSocket.on('connection', (socket) => {
        players.push({
            "player": '',
            "socket_id": `${socket.id}`,
            "isReady": false
        })
        socket.join(socket.id);
        const index = players.length-1;

        const updatePartyList = () => {
            partyMembers = players.map(x => {
                return {name: x.player, socketID: x.socket_id, isReady: x.isReady}
            }).filter(x => x.name != '')
            gameSocket.emit('partyUpdate', partyMembers) ;
        }

        socket.on('setName', (name) => {
            if(started) {
                gameSocket.to(players[index].socket_id).emit("joinFailed", 'game_already_started');
                return
            }
            if(!players.map(x => x.player).includes(name)){
                if(partyMembers.length >= 6) {
                    gameSocket.to(players[index].socket_id).emit("joinFailed", 'party_full');
                } else {
                    if(partyMembers.length == 0) {
                        partyLeader = players[index].socket_id;
                        players[index].isReady = true;
                        gameSocket.to(players[index].socket_id).emit("leader");
                    }
                    players[index].player = name;
                    updatePartyList();
                    gameSocket.to(players[index].socket_id).emit("joinSuccess", players[index].socket_id);
                }
            } else {
                gameSocket.to(players[index].socket_id).emit("joinFailed", 'name_taken');
            }
        })
        socket.on('setReady', (isReady) => {
            players[index].isReady = isReady;
            updatePartyList();
            gameSocket.to(players[index].socket_id).emit("readyConfirm");
        })

        socket.on('startGameSignal', (players) => {
            started = true;
            gameSocket.emit('startGame');
            startGame(players, gameSocket, namespace, namespaces);
        })

        socket.on('disconnect', () => {
            players.map((x,index) => {
                if(x.socket_id == socket.id) {
                    gameSocket.emit('g-addLog', `${JSON.stringify(players[index].player)} has disconnected`);
                    gameSocket.emit('g-addLog', 'Please recreate the game.');
                    gameSocket.emit('g-addLog', 'Sorry for the inconvenience (シ_ _)シ');
                    players[index].player ='';
                    if(socket.id === partyLeader) {
                        gameSocket.emit('leaderDisconnect', 'leader_disconnected');
                        socket.removeAllListeners();
                        delete io.nsps[namespace];
                        delete namespaces[namespace.substring(1)]
                        players = [];
                        partyMembers = []
                    }
                }
            })
            updatePartyList();
        })
    });
    let checkEmptyInterval = setInterval(() => {
        if(Object.keys(gameSocket['sockets']).length == 0) {
            delete io.nsps[namespace];
            if(namespaces[namespace] != null) {
                delete namespaces[namespace.substring(1)]
            }
            clearInterval(checkEmptyInterval)
            namespaceIntervals.delete(checkEmptyInterval);
        }
    }, 10000)
    namespaceIntervals.add(checkEmptyInterval);
}

const startGame = (players, gameSocket, namespace, namespaces) => {
    namespaces[namespace.substring(1)] = new CoupGame(players, gameSocket);
    namespaces[namespace.substring(1)].start();
}

if (require.main === module) {
    const quoupServer = createQuoupServer();
    quoupServer.listen(process.env.PORT || defaultPort, function(){
        console.log(`listening on ${process.env.PORT || defaultPort}`);
    });
}

module.exports = {
    createQuoupServer
};
