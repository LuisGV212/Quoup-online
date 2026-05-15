import React, { Component } from 'react'
import ActionDecision from './ActionDecision';
import ChallengeDecision from './ChallengeDecision';
import BlockChallengeDecision from './BlockChallengeDecision';
import PlayerBoard from './PlayerBoard';
import RevealDecision from './RevealDecision';
import BlockDecision from './BlockDecision';
import ChooseInfluence from './ChooseInfluence';
import ExchangeInfluences from './ExchangeInfluences';
import './CoupStyles.css';
import EventLog from './EventLog';
import CheatSheetModal from '../CheatSheetModal';
import RulesModal from '../RulesModal';

export default class Coup extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
             action: null,
             blockChallengeRes: null,
             players: [],
             playerIndex: null,
             currentPlayer: '',
             isChooseAction: false,
             revealingRes: null,
             blockingAction: null,
             isChoosingInfluence: false,
             exchangeInfluence: null,
             error: '',
             winner: '',
             playAgain: null,
             logs: [],
             isDead: false,
             waiting: true,
             disconnected: false
        }
        const bind = this;

        this.playAgainButton = <>
        <br></br>
        <button className="startGameButton" onClick={() => {
            this.props.socket.emit('g-playAgain');
        }}>Play Again</button>
        </>

        this.props.socket.on('disconnect', reason => {
            this.setState({ disconnected: true });
        })

        this.props.socket.on('g-gameOver', (winner) => {
            bind.setState({winner: `${winner} Wins!`})
            bind.setState({playAgain: bind.playAgainButton})
        })
        this.props.socket.on('g-updatePlayers', (players) => {
            bind.setState({playAgain: null})
            bind.setState({winner: null})
            players = players.filter(x => !x.isDead);
            let playerIndex = null;
            for(let i = 0; i < players.length; i++) {
                if(players[i].name === this.props.name) {
                    playerIndex = i;
                    break;
                }
            }
            if(playerIndex == null) {
                this.setState({ isDead: true })
            }else {
                this.setState({ isDead: false})
            }
            bind.setState({playerIndex, players});
            
        });
        this.props.socket.on('g-updateCurrentPlayer', (currentPlayer) => {
            bind.setState({ currentPlayer });
        });
        this.props.socket.on('g-addLog', (log) => {
            let splitLog=  log.split(' ');
            let coloredLog = [];
            coloredLog = splitLog.map((item, index) => {
                let found = null
                bind.state.players.forEach(player => {
                    if(item === player.name){
                        found = <b style={{color: player.color}}>{player.name} </b>;
                    }
                })
                if(found){
                    return found;
                }
                return <>{item+' '}</>
            })
            bind.state.logs = [...bind.state.logs, coloredLog]
            bind.setState({logs :bind.state.logs})
        })
        this.props.socket.on('g-chooseAction', () => {        
            bind.setState({ isChooseAction: true})
        });
        this.props.socket.on('g-openExchange', (drawTwo) => {
            let influences = [...bind.state.players[bind.state.playerIndex].influences, ...drawTwo];
            bind.setState({ exchangeInfluence: influences });
        })
        this.props.socket.on('g-openChallenge', (action) => {
            if(this.state.isDead) {
                return
            }
            if(action.source !== bind.props.name) {
               bind.setState({ action }) 
            } else {
                bind.setState({ action: null }) 
            }
        });
        this.props.socket.on('g-openBlockChallenge', (blockChallengeRes) => {
            if(this.state.isDead) {
                return
            }
            if(blockChallengeRes.counterAction.source !== bind.props.name) {
               bind.setState({ blockChallengeRes }) 
            } else {
                bind.setState({ blockChallengeRes: null }) 
            }
        });
        this.props.socket.on('g-openBlock', (action) => {
            if(this.state.isDead) {
                return
            }
            if(action.source !== bind.props.name) {
                bind.setState({ blockingAction: action })
             } else {
                 bind.setState({ blockingAction: null }) 
             }
        });
        this.props.socket.on('g-chooseReveal', (res) => {
            bind.setState({ revealingRes: res});
        });
        this.props.socket.on('g-chooseInfluence', () => {
            bind.setState({ isChoosingInfluence: true });
        });
        this.props.socket.on('g-closeChallenge', () => {
            bind.setState({ action: null });
        });
        this.props.socket.on('g-closeBlock', () => {
            bind.setState({ blockingAction: null });
        });
        this.props.socket.on('g-closeBlockChallenge', () => {
            bind.setState({ blockChallengeRes: null });
        });
    }

    deductCoins = (amount) => {
        let res = {
            source: this.props.name,
            amount: amount
        }
        this.props.socket.emit('g-deductCoins', res);
    }

    doneAction = () => {
        this.setState({ 
            isChooseAction: false
        })
    }
    doneChallengeBlockingVote = () => {
        this.setState({ action: null }); //challemge
        this.setState({ blockChallengeRes: null}); //challenge a block
        this.setState({ blockingAction: null }); //block
    }
    closeOtherVotes = (voteType) => {
        if(voteType === 'challenge') {
            this.setState({ blockChallengeRes: null}); //challenge a block
            this.setState({ blockingAction: null }); //block
        }else if(voteType === 'block') {
            this.setState({ action: null }); //challemge
            this.setState({ blockChallengeRes: null}); //challenge a block
        }else if(voteType === 'challenge-block') {
            this.setState({ action: null }); //challemge
            this.setState({ blockingAction: null }); //block
        }
    }
    doneReveal = () => {
        this.setState({ revealingRes: null });
    }
    doneChooseInfluence = () => {
        this.setState({ isChoosingInfluence: false })
    }
    doneExchangeInfluence = () => {
        this.setState({ exchangeInfluence: null })
    }
    pass = () => {
        if(this.state.action != null) { //challengeDecision
            let res = {
                isChallenging: false,
                action: this.state.action
            }
            this.props.socket.emit('g-challengeDecision', res);
        }else if(this.state.blockChallengeRes != null) { //BlockChallengeDecision
            let res = {
                isChallenging: false
            }
            this.props.socket.emit('g-blockChallengeDecision', res);
        }else if(this.state.blockingAction !== null) { //BlockDecision
            const res = {
                action: this.state.blockingAction,
                isBlocking: false
            }
            this.props.socket.emit('g-blockDecision', res)
        }
        this.doneChallengeBlockingVote();
    }

    influenceColorMap = {
        admin: '#FFC425',
        pm: '#009DDF',
        system_admin: '#00030B',
        root_user: '#D13E80',
        contractor: '#00A77E'
    }

    roleMeta = {
        admin: { label: 'Admin', icon: 'A', ability: 'Collect Tokens' },
        pm: { label: 'PM', icon: 'P', ability: 'Transfer Tokens' },
        system_admin: { label: 'System Admin', icon: 'S', ability: 'Deactivate User' },
        root_user: { label: 'Root User', icon: 'R', ability: 'Block Deactivation' },
        contractor: { label: 'Contractor', icon: 'C', ability: 'Exchange Roles' }
    }
    
    render() {
        let actionDecision = null
        let currentPlayer = null
        let revealDecision = null
        let challengeDecision = null
        let blockChallengeDecision = null
        let chooseInfluenceDecision = null
        let blockDecision = null
        let influences = null
        let pass = null
        let coins = null
        let exchangeInfluences = null
        let playAgain = null
        let isWaiting = true
        let waiting = null
        if(this.state.isChooseAction && this.state.playerIndex != null) {
            isWaiting = false;
            actionDecision = <ActionDecision doneAction={this.doneAction} deductCoins={this.deductCoins} name={this.props.name} socket={this.props.socket} money={this.state.players[this.state.playerIndex].money} players={this.state.players}></ActionDecision>
        }
        if(this.state.currentPlayer) {
            currentPlayer = <p><span>Current Turn</span><b>{this.state.currentPlayer}</b></p>
        }
        if(this.state.revealingRes) {
            isWaiting = false;
            revealDecision = <RevealDecision doneReveal={this.doneReveal} name ={this.props.name} socket={this.props.socket} res={this.state.revealingRes} influences={this.state.players.filter(x => x.name === this.props.name)[0].influences}></RevealDecision>
        }
        if(this.state.isChoosingInfluence) {
            isWaiting = false;
            chooseInfluenceDecision = <ChooseInfluence doneChooseInfluence={this.doneChooseInfluence} name ={this.props.name} socket={this.props.socket} influences={this.state.players.filter(x => x.name === this.props.name)[0].influences}></ChooseInfluence>
        }
        if(this.state.action != null || this.state.blockChallengeRes != null || this.state.blockingAction !== null){
            pass = <button onClick={() => this.pass()}>Pass</button>
        }
        if(this.state.action != null) {
            isWaiting = false;
            challengeDecision = <ChallengeDecision closeOtherVotes={this.closeOtherVotes} doneChallengeVote={this.doneChallengeBlockingVote} name={this.props.name} action={this.state.action} socket={this.props.socket} ></ChallengeDecision>
        }
        if(this.state.exchangeInfluence) {
            isWaiting = false;
            exchangeInfluences = <ExchangeInfluences doneExchangeInfluence={this.doneExchangeInfluence} name={this.props.name} influences={this.state.exchangeInfluence} socket={this.props.socket}></ExchangeInfluences>
        }
        if(this.state.blockChallengeRes != null) {
            isWaiting = false;
            blockChallengeDecision = <BlockChallengeDecision closeOtherVotes={this.closeOtherVotes} doneBlockChallengeVote={this.doneChallengeBlockingVote} name={this.props.name} prevAction={this.state.blockChallengeRes.prevAction} counterAction={this.state.blockChallengeRes.counterAction} socket={this.props.socket} ></BlockChallengeDecision>
        }
        if(this.state.blockingAction !== null) {
            isWaiting = false;
            blockDecision = <BlockDecision closeOtherVotes={this.closeOtherVotes} doneBlockVote={this.doneChallengeBlockingVote} name={this.props.name} action={this.state.blockingAction} socket={this.props.socket} ></BlockDecision>
        }
        if(this.state.playerIndex != null && !this.state.isDead) {
            influences = <>
            <p className="SectionLabel">Your Privileges</p>
                {this.state.players[this.state.playerIndex].influences.map((influence, index) => {
                    const role = this.roleMeta[influence] || { label: influence, icon: '?', ability: 'Unknown' };
                    const color = this.influenceColorMap[influence] || '#707070';
                    return  <div key={index} className="InfluenceUnitContainer" style={{borderColor: color}}>
                                <span className="RoleIcon" style={{backgroundColor: color}}>{role.icon}</span>
                                <div>
                                    <h3>{role.label}</h3>
                                    <p>{role.ability}</p>
                                </div>
                            </div>
                    })
                }
            </>
            
            coins = <p><span>Tokens</span><b>{this.state.players[this.state.playerIndex].money}</b></p>
        }
        if(isWaiting && !this.state.isDead) {
            waiting = <p className="WaitingCopy">Waiting for other players...</p>
        }
        if(this.state.disconnected) {
            return (
                <div className="GameContainer">
                    <div className="GameHeader">
                        <div className="PlayerInfo">
                            <p>You are: {this.props.name}</p>
                            {coins}
                        </div>
                        <RulesModal/>
                        <CheatSheetModal/>
                    </div>
                    <p>You have been disconnected :c</p>
                    <p>Please recreate the game.</p>
                    <p>Sorry for the inconvenience (シ_ _)シ</p>
                </div>
            )
        }
        return (
            <div className="GameContainer">
                <div className="GameHeader">
                    <div className="GameBrand">
                        <span className="GameBrandSymbol">Q</span>
                        <span>Quoup</span>
                    </div>
                    <div className="PlayerInfo">
                        <p><span>You are</span><b>{this.props.name}</b></p>
                        {coins}
                    </div>
                    <div className="CurrentPlayer">
                        {currentPlayer}
                    </div>
                    <RulesModal/>
                    <CheatSheetModal/>
                    <EventLog logs={this.state.logs}></EventLog>
                </div>
                <div className="GameTable">
                    <section className="TablePanel PlayerPanel">
                        <PlayerBoard players={this.state.players} currentPlayer={this.state.currentPlayer}></PlayerBoard>
                    </section>
                    <main className="TablePanel ActionPanel">
                        <div className="InfluenceSection">
                            {influences}
                        </div>
                        <div className="DecisionsSection">
                            {waiting}
                            {revealDecision}
                            {chooseInfluenceDecision}
                            {actionDecision}
                            {exchangeInfluences}
                            {challengeDecision}
                            {blockChallengeDecision}
                            {blockDecision}
                            {pass}
                            {playAgain}
                        </div>
                        <b className="WinnerCopy">{this.state.winner}</b>
                        {this.state.playAgain}
                    </main>
                </div>
            </div>
        )
    }
}
