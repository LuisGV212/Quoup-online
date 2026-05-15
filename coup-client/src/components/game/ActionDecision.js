import React, { Component } from 'react'

export default class ActionDecision extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
            isDecisionMade: false,
            decision: '',
            isPickingTarget: false,
            targetAction: '',
            actionError: ''
        }
    }

    chooseAction = (action, target = null) => {
        const res = {
            action: {
                action: action,
                target: target,
                source: this.props.name
            }
        }
        
        this.props.socket.emit('g-actionDecision', res)
        this.props.doneAction();
    }

    deductCoins = (action) => {
        if(action === 'deactivate_user') {
            if(this.props.money >= 3) {
                this.props.deductCoins(3);
                this.pickingTarget('deactivate_user');
            } else {
                this.setState({ actionError: 'Not enough tokens to deactivate user!'})
            }
        } else if(action === 'delete_user') {
            if(this.props.money >= 7) {
                this.props.deductCoins(7);
                this.pickingTarget('delete_user');
            } else {
                this.setState({ actionError: 'Not enough tokens to delete user!'})
            }
        }
    }

    pickingTarget = (action) => {
        this.setState({
            isPickingTarget: true,
            targetAction: action,
            actionError: ''
        });
        this.setState({targetAction: action});
    }

    pickTarget = (target) => {
        this.chooseAction(this.state.targetAction, target);
    }

    actionMeta = {
        basic_access: { title: 'Basic Access', icon: '+1', caption: 'Gain 1 token' },
        guest_access: { title: 'Guest Access', icon: '+2', caption: 'Gain 2, blockable' },
        delete_user: { title: 'Delete User', icon: '7', caption: 'Target loses a privilege' },
        transfer_tokens: { title: 'Transfer Tokens', icon: 'P', caption: 'Take up to 2 tokens' },
        deactivate_user: { title: 'Deactivate User', icon: 'S', caption: 'Pay 3, target loses privilege' },
        collect_tokens: { title: 'Collect Tokens', icon: 'A', caption: 'Gain 3 tokens' },
        exchange_roles: { title: 'Exchange Roles', icon: 'C', caption: 'Draw 2, keep 2' }
    }

    renderActionButton = (action, onClick) => {
        const meta = this.actionMeta[action];
        return (
            <button className="ActionCardButton" id={action} onClick={onClick}>
                <span className="ActionIcon">{meta.icon}</span>
                <span>
                    <b>{meta.title}</b>
                    <small>{meta.caption}</small>
                </span>
            </button>
        )
    }

    render() {
        let controls = null
        if(this.state.isPickingTarget) {
            controls = this.props.players.filter(x => !x.isDead).filter(x => x.name !== this.props.name).map((x, index) => {
                return <button className="TargetButton" style={{ '--player-color': x.color}} key={index} onClick={() => this.pickTarget(x.name)}>{x.name}</button>
            })
        } else if(this.props.money < 10) {
           controls = ( 
           <>   
                {this.renderActionButton('basic_access', () => this.chooseAction('basic_access'))}
                {this.renderActionButton('guest_access', () => this.chooseAction('guest_access'))}
                {this.renderActionButton('collect_tokens', () => this.chooseAction('collect_tokens'))}
                {this.renderActionButton('transfer_tokens', () => this.pickingTarget('transfer_tokens'))}
                {this.renderActionButton('deactivate_user', () => this.deductCoins('deactivate_user'))}
                {this.renderActionButton('exchange_roles', () => this.chooseAction('exchange_roles'))}
                {this.renderActionButton('delete_user', () => this.deductCoins('delete_user'))}
           </> 
           )
        } else { //money over 10, has to delete user
            controls = this.renderActionButton('delete_user', () => this.deductCoins('delete_user'))
        }
        return (<>
            <p className="DecisionTitle">Choose an action</p>
            <div className="DecisionButtonsContainer">
               {controls}
               <p>{this.state.actionError}</p>
            </div>
            </>
        )
    }
}
