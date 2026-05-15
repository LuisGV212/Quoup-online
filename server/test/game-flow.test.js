const test = require('node:test');
const assert = require('node:assert/strict');
const {
    assertNoEvent,
    createNamespace,
    disconnectAll,
    joinPlayer,
    recordEvents,
    startTestServer,
    waitFor,
    waitForAll
} = require('./helpers/socket-test-utils');

async function startTwoPlayerGame(server) {
    const namespace = await createNamespace(server.baseUrl);
    const leader = await joinPlayer(server.baseUrl, namespace, 'Luis');
    const leaderPartyUpdates = recordEvents(leader, 'partyUpdate');
    const second = await joinPlayer(server.baseUrl, namespace, 'Alex');

    await leaderPartyUpdates.waitFor(players => players.length === 2);
    second.emit('setReady', true);
    await waitFor(second, 'readyConfirm');
    const party = await leaderPartyUpdates.waitFor(players => (
        players.length === 2 && players.every(player => player.isReady)
    ));

    const events = {
        leaderChooseAction: recordEvents(leader, 'g-chooseAction'),
        leaderPlayers: recordEvents(leader, 'g-updatePlayers'),
        secondPlayers: recordEvents(second, 'g-updatePlayers'),
        secondChooseAction: recordEvents(second, 'g-chooseAction'),
        leaderCurrentPlayer: recordEvents(leader, 'g-updateCurrentPlayer'),
        secondCurrentPlayer: recordEvents(second, 'g-updateCurrentPlayer')
    };

    const startEvents = waitForAll([leader, second], 'startGame');
    leader.emit('startGameSignal', party);
    await startEvents;

    return { events, leader, namespace, second };
}

test('basic access updates all players and advances turn to the next player', async () => {
    const server = await startTestServer();
    const sockets = [];

    try {
        const { events, leader, second } = await startTwoPlayerGame(server);
        sockets.push(leader, second);

        const initialUpdates = await Promise.all([
            events.leaderPlayers.waitFor(players => players.length === 2),
            events.secondPlayers.waitFor(players => players.length === 2)
        ]);
        initialUpdates.forEach(players => {
            assert.equal(players.length, 2);
            assert.deepEqual(players.map(player => player.money), [2, 2]);
            assert.deepEqual(players.map(player => player.influences.length), [2, 2]);
            assert.equal(players[0].socketID, undefined);
            assert.equal(players[1].socketID, undefined);
        });

        assert.equal(await events.leaderCurrentPlayer.waitFor(player => player === 'Luis'), 'Luis');
        assert.equal(await events.secondCurrentPlayer.waitFor(player => player === 'Luis'), 'Luis');

        await events.leaderChooseAction.waitFor(() => true);
        assert.equal(events.secondChooseAction.values.length, 0);

        const updatedPlayers = Promise.all([
            events.leaderPlayers.waitFor(players => players[0].money === 3),
            events.secondPlayers.waitFor(players => players[0].money === 3)
        ]);
        const nextTurns = Promise.all([
            events.leaderCurrentPlayer.waitFor(player => player === 'Alex'),
            events.secondCurrentPlayer.waitFor(player => player === 'Alex')
        ]);

        leader.emit('g-actionDecision', {
            action: {
                action: 'basic_access',
                target: null,
                source: 'Luis'
            }
        });

        const [leaderPlayers, secondPlayers] = await updatedPlayers;
        assert.deepEqual(leaderPlayers.map(player => player.money), [3, 2]);
        assert.deepEqual(secondPlayers.map(player => player.money), [3, 2]);
        assert.deepEqual(await nextTurns, ['Alex', 'Alex']);
        await events.secondChooseAction.waitFor(() => true);
    } finally {
        disconnectAll(sockets);
        await server.close();
    }
});

test('blockable action opens block only for the target and challenge for other players', async () => {
    const server = await startTestServer();
    const sockets = [];

    try {
        const { events, leader, second } = await startTwoPlayerGame(server);
        sockets.push(leader, second);

        await Promise.all([
            events.leaderPlayers.waitFor(players => players.length === 2),
            events.secondPlayers.waitFor(players => players.length === 2),
            events.leaderCurrentPlayer.waitFor(player => player === 'Luis'),
            events.secondCurrentPlayer.waitFor(player => player === 'Luis')
        ]);
        await events.leaderChooseAction.waitFor(() => true);

        const leaderChallenge = waitFor(leader, 'g-openChallenge');
        const secondChallenge = waitFor(second, 'g-openChallenge');
        const targetBlock = waitFor(second, 'g-openBlock');

        leader.emit('g-actionDecision', {
            action: {
                action: 'transfer_tokens',
                target: 'Alex',
                source: 'Luis'
            }
        });

        assert.equal((await leaderChallenge).action, 'transfer_tokens');
        assert.equal((await secondChallenge).action, 'transfer_tokens');
        assert.equal((await targetBlock).target, 'Alex');
        await assertNoEvent(leader, 'g-openBlock');
    } finally {
        disconnectAll(sockets);
        await server.close();
    }
});
