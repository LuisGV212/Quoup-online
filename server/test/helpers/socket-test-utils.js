const assert = require('node:assert/strict');
const ioClient = require('socket.io-client');
const { createQuoupServer } = require('../../index');

async function startTestServer() {
    const quoupServer = createQuoupServer();
    await new Promise(resolve => quoupServer.listen(0, resolve));
    const { port } = quoupServer.server.address();
    return {
        ...quoupServer,
        baseUrl: `http://localhost:${port}`,
        close: () => new Promise(resolve => quoupServer.close(resolve))
    };
}

async function createNamespace(baseUrl) {
    const res = await fetch(`${baseUrl}/createNamespace`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.match(body.namespace, /^[A-Z0-9]{6}$/);
    return body.namespace;
}

async function namespaceExists(baseUrl, namespace) {
    const res = await fetch(`${baseUrl}/exists/${namespace}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    return body.exists;
}

function connectSocket(baseUrl, namespace) {
    return ioClient(`${baseUrl}/${namespace}`, {
        forceNew: true,
        reconnection: false,
        transports: ['websocket', 'polling']
    });
}

function waitFor(socket, event, timeoutMs = 1000) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off(event, onEvent);
            reject(new Error(`Timed out waiting for ${event}`));
        }, timeoutMs);

        function onEvent(...args) {
            clearTimeout(timeout);
            resolve(args.length > 1 ? args : args[0]);
        }

        socket.once(event, onEvent);
    });
}

function waitForAll(sockets, event, timeoutMs = 1000) {
    return Promise.all(sockets.map(socket => waitFor(socket, event, timeoutMs)));
}

function assertNoEvent(socket, event, timeoutMs = 100) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            socket.off(event, onEvent);
            resolve();
        }, timeoutMs);

        function onEvent(...args) {
            clearTimeout(timeout);
            reject(new Error(`Expected no ${event}, received ${JSON.stringify(args)}`));
        }

        socket.once(event, onEvent);
    });
}

function recordEvents(socket, event) {
    const values = [];
    socket.on(event, value => values.push(value));

    return {
        values,
        waitFor: (predicate, timeoutMs = 1000) => new Promise((resolve, reject) => {
            const existingIndex = values.findIndex(predicate);
            if(existingIndex !== -1) {
                resolve(values[existingIndex]);
                return;
            }

            const timeout = setTimeout(() => {
                socket.off(event, onEvent);
                reject(new Error(`Timed out waiting for recorded ${event}`));
            }, timeoutMs);

            function onEvent(value) {
                if(predicate(value)) {
                    clearTimeout(timeout);
                    socket.off(event, onEvent);
                    resolve(value);
                }
            }

            socket.on(event, onEvent);
        })
    };
}

async function joinPlayer(baseUrl, namespace, name) {
    const socket = connectSocket(baseUrl, namespace);
    await waitFor(socket, 'connect');
    socket.emit('setName', name);
    await waitFor(socket, 'joinSuccess');
    return socket;
}

function disconnectAll(sockets) {
    sockets.forEach(socket => {
        if(socket && socket.connected) {
            socket.disconnect();
        }
    });
}

module.exports = {
    assertNoEvent,
    connectSocket,
    createNamespace,
    disconnectAll,
    joinPlayer,
    namespaceExists,
    recordEvents,
    startTestServer,
    waitFor,
    waitForAll
};
