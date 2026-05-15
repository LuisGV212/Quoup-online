const test = require('node:test');
const assert = require('node:assert/strict');
const {
    connectSocket,
    createNamespace,
    disconnectAll,
    joinPlayer,
    namespaceExists,
    recordEvents,
    startTestServer,
    waitFor
} = require('./helpers/socket-test-utils');

test('room lifecycle syncs joins, readiness, duplicate names, and leader disconnect', async () => {
    const server = await startTestServer();
    const sockets = [];

    try {
        const namespace = await createNamespace(server.baseUrl);
        assert.equal(await namespaceExists(server.baseUrl, namespace), true);

        const leader = connectSocket(server.baseUrl, namespace);
        sockets.push(leader);
        const leaderPartyUpdates = recordEvents(leader, 'partyUpdate');
        await waitFor(leader, 'connect');
        const leaderReady = waitFor(leader, 'leader');
        const leaderJoined = waitFor(leader, 'joinSuccess');
        leader.emit('setName', 'Luis');
        assert.equal(await leaderReady, undefined);
        await leaderJoined;

        let party = await leaderPartyUpdates.waitFor(players => players.length === 1);
        assert.deepEqual(party.map(player => ({
            name: player.name,
            isReady: player.isReady
        })), [
            { name: 'Luis', isReady: true }
        ]);

        const second = await joinPlayer(server.baseUrl, namespace, 'Alex');
        sockets.push(second);

        party = await leaderPartyUpdates.waitFor(players => players.length === 2);
        assert.deepEqual(party.map(player => ({
            name: player.name,
            isReady: player.isReady
        })), [
            { name: 'Luis', isReady: true },
            { name: 'Alex', isReady: false }
        ]);

        second.emit('setReady', true);
        await waitFor(second, 'readyConfirm');
        party = await leaderPartyUpdates.waitFor(players => (
            players.length === 2 && players.every(player => player.isReady)
        ));
        assert.deepEqual(party.map(player => player.isReady), [true, true]);

        const duplicate = connectSocket(server.baseUrl, namespace);
        sockets.push(duplicate);
        await waitFor(duplicate, 'connect');
        duplicate.emit('setName', 'Alex');
        assert.equal(await waitFor(duplicate, 'joinFailed'), 'name_taken');

        const leaderDisconnect = waitFor(second, 'leaderDisconnect');
        leader.disconnect();
        assert.equal(await leaderDisconnect, 'leader_disconnected');
        assert.equal(await namespaceExists(server.baseUrl, namespace), false);
    } finally {
        disconnectAll(sockets);
        await server.close();
    }
});
