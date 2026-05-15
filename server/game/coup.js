const gameUtils = require('./utils')
const constants = require("../utilities/constants");

class CoupGame{

    constructor(players, gameSocket) {
        this.nameSocketMap = gameUtils.buildNameSocketMap(players);
        this.nameIndexMap = gameUtils.buildNameIndexMap(players);
        this.players = gameUtils.buildPlayers(players);
        this.gameSocket = gameSocket;
        this.currentPlayer = 0;
        this.deck = gameUtils.buildDeck();
        this.winner = '';
        this.actions = constants.Actions;
        this.counterActions = constants.CounterActions;
        this.isChallengeBlockOpen = false; // if listening for challeng or block votes
        this.isRevealOpen = false; // if listening for what influence player will reveal
        this.isChooseInfluenceOpen = false; // if listening for what privilege to lose
        this.isExchangeOpen = false; // if listening for result of contractor exchange;
        this.votes = 0;
    }

    resetGame(startingPlayer = 0) {
        this.currentPlayer = startingPlayer;
        this.isChallengeBlockOpen = false;
        this.isRevealOpen = false;
        this.isChooseInfluenceOpen = false;
        this.isExchangeOpen = false;
        this.aliveCount = this.players.length;
        this.votes = 0;
        this.deck = gameUtils.buildDeck();
        for(let i = 0; i < this.players.length; i++) {
            this.players[i].money = 2;
            this.players[i].influences = [this.deck.pop(), this.deck.pop()];
            this.players[i].isDead = false;
        }
    }

    listen() {

        this.players.map(x => {
            const socket = this.gameSocket.sockets[x.socketID];
            let bind = this
            socket.on('g-playAgain', () => {
                if(bind.isPlayAgainOpen){
                    bind.isPlayAgainOpen = false;
                    this.resetGame(Math.floor(Math.random() * (this.players.length)));
                    this.updatePlayers();
                    this.playTurn() 
                }
            })
            socket.on('g-deductCoins', (res) => {
                //res.amount res.source
                const sourceIndex = bind.nameIndexMap[res.source];
                bind.players[sourceIndex].money -= res.amount;
                bind.updatePlayers();

            })
            socket.on('g-actionDecision', (res) => {
                // res.action.target, res.action.action, res.action.source
                if(!bind.actions[res.action.action]) {
                    return;
                }
                if(bind.actions[res.action.action].isChallengeable) {
                    bind.openChallenge(res.action, (bind.actions[res.action.action].blockableBy.length > 0))
                } else if(res.action.action == 'guest_access') {
                    bind.isChallengeBlockOpen = true;
                    bind.gameSocket.emit("g-openBlock", res.action);
                } else {
                    bind.applyAction(res.action)
                }
            })
            socket.on('g-challengeDecision', (res) => {
                // res.action.action, res.action.target, res.action.source, res.challengee, res.challenger, res.isChallenging
                if(bind.isChallengeBlockOpen) {
                    if(res.isChallenging) {
                        bind.closeChallenge();
                        //TODO reveal
                        // reveal(action, counterAction, challengee, challenger, isBlock)
                        bind.gameSocket.emit("g-addLog", `${res.challenger} challenged ${res.challengee}`)
                        bind.reveal(res.action, null, res.challengee, res.challenger, false);
                    } else if(bind.votes+1 == bind.aliveCount-1) {
                        //then it is a pass
                        bind.closeChallenge();
                        bind.applyAction(res.action);
                    } else {
                        bind.votes += 1;
                    }
                }
            });
            socket.on('g-blockChallengeDecision', (res) => {
                // res.counterAction, res.prevAction, res.challengee, res.challenger, res.isChallenging
                if(bind.isChallengeBlockOpen) {
                    if(res.isChallenging) {
                        bind.closeChallenge();
                        bind.gameSocket.emit("g-addLog", `${res.challenger} challenged ${res.challengee}'s block`)
                        bind.reveal(res.prevAction, res.counterAction, res.challengee, res.challenger, true);
                    } else if(bind.votes+1 == bind.aliveCount-1) {
                        //then it is a pass
                        bind.closeChallenge();
                        bind.nextTurn();
                    } else {
                        bind.votes += 1;
                    }
                }
            });
            socket.on('g-blockDecision', (res) => {
                // res.prevAction.action, res.prevAction.target, res.prevAction.source, res.counterAction, res.blockee, res.blocker, res.isBlocking
                if(bind.isChallengeBlockOpen) {
                    if(res.isBlocking) {
                        bind.closeChallenge();
                        bind.gameSocket.emit("g-addLog", `${res.blocker} blocked ${res.blockee}`)
                        bind.openBlockChallenge(res.counterAction, res.blockee, res.prevAction);
                    } else if(bind.votes+1 == bind.aliveCount-1) {
                        //then it is a pass
                        bind.closeChallenge();
                        bind.applyAction(res.action);
                    } else {
                        bind.votes += 1;
                    }
                }
            });
            socket.on('g-revealDecision', (res) => {
                //if isBlock, prevaction should contain the prev action
                //if isBlock is false, prevaction is action
                // res.revealedCard, prevaction, counterAction, challengee, challenger, isBlock
                const challengeeIndex = bind.nameIndexMap[res.challengee];
                const challengerIndex = bind.nameIndexMap[res.challenger];
                if(bind.isRevealOpen) {
                    bind.isRevealOpen = false;
                    if(res.isBlock) {
                        if(res.revealedCard == res.counterAction.claim || (res.counterAction.counterAction == 'block_transfer' && (res.revealedCard == 'contractor' || res.revealedCard =='pm'))) { //challenge failed
                            bind.gameSocket.emit("g-addLog", `${res.challenger}'s challenge on ${res.challengee}'s block failed`)
                            for(let i = 0; i < bind.players[challengeeIndex].influences.length; i++) { //revealed card needs to be replaced
                                if(bind.players[challengeeIndex].influences[i] == res.revealedCard) {
                                    bind.deck.push(bind.players[challengeeIndex].influences[i]);
                                    bind.deck = gameUtils.shuffleArray(bind.deck);
                                    bind.players[challengeeIndex].influences.splice(i,1);
                                    bind.players[challengeeIndex].influences.push(bind.deck.pop());
                                    break;
                                }
                            }
                            bind.updatePlayers();
                            bind.isChooseInfluenceOpen = true;
                            bind.emitToPlayer(res.challenger, 'g-chooseInfluence');
                            bind.nextTurn();
                        } else { //challenge succeeded
                            bind.gameSocket.emit("g-addLog", `${res.challenger}'s challenge on ${res.challengee}'s block succeeded`)
                            bind.gameSocket.emit("g-addLog", `${res.challengee} lost their ${res.revealedCard}`)
                            for(let i = 0; i < bind.players[challengeeIndex].influences.length; i++) {
                                if(bind.players[challengeeIndex].influences[i] == res.revealedCard) {
                                    bind.deck.push(bind.players[challengeeIndex].influences[i]);
                                    bind.deck = gameUtils.shuffleArray(bind.deck);
                                    bind.players[challengeeIndex].influences.splice(i,1);
                                    break;
                                }
                            }
                            bind.applyAction(res.prevAction);
                        }
                    } else { //normal challenge
                        if(res.revealedCard == bind.actions[res.prevAction.action].influence) { // challenge failed
                            bind.gameSocket.emit("g-addLog", `${res.challenger}'s challenge on ${res.challengee} failed`)
                            for(let i = 0; i < bind.players[challengeeIndex].influences.length; i++) { //revealed card needs to be replaced
                                if(bind.players[challengeeIndex].influences[i] == res.revealedCard) {
                                    bind.deck.push(bind.players[challengeeIndex].influences[i]);
                                    bind.deck = gameUtils.shuffleArray(bind.deck);
                                    bind.players[challengeeIndex].influences.splice(i,1);
                                    bind.players[challengeeIndex].influences.push(bind.deck.pop());
                                    break;
                                }
                            }

                            if (res.revealedCard == 'system_admin' && res.prevAction.target == res.challenger 
                                && bind.players[challengerIndex].influences.length == 2) {
                                bind.deck.push(bind.players[challengeeIndex].influences[0]);
                                bind.deck = gameUtils.shuffleArray(bind.deck);
                                bind.players[challengerIndex].influences.splice(0, 1);
                            }
                            bind.updatePlayers();
                            bind.isChooseInfluenceOpen = true;
                            bind.emitToPlayer(res.challenger, 'g-chooseInfluence');
                            bind.applyAction(res.prevAction);
                        } else { // challenge succeeded
                            bind.gameSocket.emit("g-addLog", `${res.challenger}'s challenge on ${res.challengee} succeeded`)
                            bind.gameSocket.emit("g-addLog", `${res.challengee} lost their ${res.revealedCard}`)
                            for(let i = 0; i < bind.players[challengeeIndex].influences.length; i++) { // 
                                if(bind.players[challengeeIndex].influences[i] == res.revealedCard) {
                                    bind.deck.push(bind.players[challengeeIndex].influences[i]);
                                    bind.deck = gameUtils.shuffleArray(bind.deck);
                                    bind.players[challengeeIndex].influences.splice(i,1);
                                    break;
                                }
                            }
                            bind.nextTurn();
                        }
                    }
                }
            });
            socket.on('g-chooseInfluenceDecision', (res) => {
                // res.influence, res.playerName
                const playerIndex = bind.nameIndexMap[res.playerName];
                if(bind.isChooseInfluenceOpen) {
                    bind.gameSocket.emit("g-addLog", `${res.playerName} lost their ${res.influence}`)
                    for(let i = 0; i < bind.players[playerIndex].influences.length; i++) {
                        if(bind.players[playerIndex].influences[i] == res.influence) {
                            bind.deck.push(bind.players[playerIndex].influences[i]);
                            bind.deck = gameUtils.shuffleArray(bind.deck);
                            bind.players[playerIndex].influences.splice(i,1);
                            break;
                        }
                    }
                    bind.isChooseInfluenceOpen = false;
                    bind.nextTurn();
                }
            })
            socket.on('g-chooseExchangeDecision', (res) => {
                // res.playerName, res.kept, res.putBack = ["influence","influence"]
                const playerIndex = bind.nameIndexMap[res.playerName];
                if(bind.isExchangeOpen) {
                    bind.players[playerIndex].influences = res.kept;
                    bind.deck.push(res.putBack[0]);
                    bind.deck.push(res.putBack[1]);
                    bind.deck = gameUtils.shuffleArray(bind.deck);
                    bind.isExchangeOpen = false;
                    bind.nextTurn();
                }
            })
        })
    }

    updatePlayers() {// when players die
        this.gameSocket.emit('g-updatePlayers', gameUtils.exportPlayers(JSON.parse(JSON.stringify(this.players))));
    }

    emitToSocket(socketID, event, payload) {
        const bareSocketID = socketID && socketID.includes('#') ? socketID.split('#')[1] : socketID;
        const socket = this.gameSocket.sockets[socketID]
            || this.gameSocket.connected[socketID]
            || this.gameSocket.sockets[bareSocketID]
            || this.gameSocket.connected[bareSocketID];
        if(socket) {
            if(payload === undefined) {
                socket.emit(event);
            } else {
                socket.emit(event, payload);
            }
        }
    }

    emitToPlayer(playerName, event, payload) {
        this.emitToSocket(this.nameSocketMap[playerName], event, payload);
    }

    reveal(action, counterAction, challengee, challenger, isBlock) {
        //if isBlock, action should contain the prev action
        //if isBlock is false, counterAction is null and action is the action being challenged
        const res = {
            action: action,
            counterAction: counterAction,
            challengee: challengee,
            challenger: challenger,
            isBlock: isBlock
        }
        this.isRevealOpen = true;
        this.emitToPlayer(res.challengee, "g-chooseReveal", res);
    }

    closeChallenge() {
        this.isChallengeBlockOpen = false;
        this.votes = 0;
        this.gameSocket.emit("g-closeChallenge");
        this.gameSocket.emit("g-closeBlock");
        this.gameSocket.emit("g-closeBlockChallenge");
    }

    openChallenge(action, isBlockable) {
        this.isChallengeBlockOpen = true;
        if(isBlockable && action.target != null) {
            let targetIndex = 0;
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == action.target) {
                    targetIndex = i;
                    break;
                }
            }
            this.emitToSocket(this.players[targetIndex].socketID, "g-openBlock", action);
        }
        this.gameSocket.emit("g-openChallenge", action);
    }

    openBlockChallenge(counterAction, blockee, prevAction) {
        //blockClaim is the character that the blockee claims to be blocking with
        this.isChallengeBlockOpen = true;
        this.gameSocket.emit("g-openBlockChallenge", {
            counterAction: counterAction,
            prevAction: prevAction
        });
    }

    applyAction(action) {
        let logTarget = '';

        if(action.target) {
            logTarget = ` on ${action.target}`;
        }
        this.gameSocket.emit("g-addLog", `${action.source} used ${action.action}${logTarget}`)
        const execute = action.action;
        const target = action.target;
        const source = action.source;
        if(execute == 'basic_access') {
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == source) {
                    this.players[i].money+=1;
                    break;
                }
            }
            this.nextTurn();
        }else if(execute == 'guest_access') {
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == source) {
                    this.players[i].money+=2;
                    break;
                }
            }
            this.nextTurn();
        }else if(execute == 'delete_user') {
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == target) {
                    this.isChooseInfluenceOpen = true;
                    this.emitToPlayer(target, 'g-chooseInfluence');
                    break;
                }
            }
            // no nextTurn() because it is called in "on chooseInfleunceDecision"
        }else if(execute == 'collect_tokens') {
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == source) {
                    this.players[i].money+=3;
                    break;
                }
            }
            this.nextTurn();
        }else if(execute == 'deactivate_user') {
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == target) {
                    this.isChooseInfluenceOpen = true;
                    this.emitToPlayer(target, 'g-chooseInfluence');
                    break;
                }
            }
            // no nextTurn() because it is called in "on chooseInfleunceDecision"
        }else if(execute == 'exchange_roles') {
            const drawTwo = [this.deck.pop(), this.deck.pop()]
            this.isExchangeOpen = true;
            this.emitToPlayer(source, 'g-openExchange', drawTwo);
             // no nextTurn() because it is called in "on chooseExchangeDecision"
        }else if(execute == 'transfer_tokens') {
            let stolen = 0;
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == target) {
                    if(this.players[i].money >= 2) {
                        this.players[i].money-=2;
                        stolen = 2;
                    }else if(this.players[i].money == 1) {
                        this.players[i].money-=1;
                        stolen = 1;
                    }else{//no money stolen

                    }
                    break;
                }
            }
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].name == source) {
                    this.players[i].money+= stolen;
                    break;
                }
            }
            this.nextTurn();
        }else {
        }
        
    }

    nextTurn() {
        if(!this.isChallengeBlockOpen && !this.isChooseInfluenceOpen && !this.isExchangeOpen && !this.isRevealOpen){
        this.players.forEach(x => {
            if(x.influences.length == 0 && !x.isDead) {// player is dead
                this.gameSocket.emit("g-addLog", `${x.name} is out!`)
                this.aliveCount-=1;
                x.isDead = true;
                x.money = 0;
            }
        });
        this.updatePlayers();
        if(this.aliveCount == 1) {
            let winner = null
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].influences.length > 0) {
                    winner = this.players[i].name; 
                }
            }
            this.isPlayAgainOpen = true;
            this.gameSocket.emit('g-gameOver', winner);
            //GAME END
        } else {
            do {
                this.currentPlayer+=1;
                this.currentPlayer%=this.players.length;
            } while(this.players[this.currentPlayer].isDead == true);
            this.playTurn();
        }
      }
    }

    playTurn() {
        this.gameSocket.emit("g-updateCurrentPlayer", this.players[this.currentPlayer].name);
        this.emitToSocket(this.players[this.currentPlayer].socketID, 'g-chooseAction');
    }

    onChooseAction(action) {
    }

    start() {
        this.resetGame();
        this.listen();
        this.updatePlayers();
        this.playTurn()
        //deal cards to each player
    }
    
}

module.exports = CoupGame;
