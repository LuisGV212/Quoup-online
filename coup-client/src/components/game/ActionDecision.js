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
        console.log(res)
        
        this.props.socket.emit('g-actionDecision', res)
        this.props.doneAction();
    }

    deductCoins = (action) => {
        console.log(this.props.money, action)
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

    render() {
        let controls = null
        if(this.state.isPickingTarget) {
            controls = this.props.players.filter(x => !x.isDead).filter(x => x.name !== this.props.name).map((x, index) => {
                return <button style={{ backgroundColor: x.color}} key={index} onClick={() => this.pickTarget(x.name)}>{x.name}</button>
            })
        } else if(this.props.money < 10) {
           controls = ( 
           <>   
                <button onClick={() => this.chooseAction('basic_access')}>Basic Access</button>
                <button onClick={() => this.deductCoins('delete_user')}>Delete User</button>
                <button onClick={() => this.chooseAction('guest_access')}>Guest Access</button>
                <button id="pm" onClick={() => this.pickingTarget('transfer_tokens')}>Transfer Tokens</button>
                <button id="system_admin" onClick={() => this.deductCoins('deactivate_user')}>Deactivate User</button>
                <button id="admin" onClick={() => this.chooseAction('collect_tokens')}>Collect Tokens</button>
                <button id="contractor" onClick={() => this.chooseAction('exchange_roles')}>Exchange Roles</button>
           </> 
           )
        } else { //money over 10, has to delete user
            controls = <button onClick={() => this.deductCoins('delete_user')}>Delete User</button>
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
