import React, { Component } from 'react'

export default class RevealDecision extends Component {

    constructor(props) {
        super(props)

        this.act = this.props.res.isBlock ? this.props.res.counterAction.counterAction : this.props.res.action.action
        this.actionMap = {
            collect_tokens: ["admin"],
            deactivate_user: ["system_admin"],
            exchange_roles: ["contractor"],
            transfer_tokens: ["pm"],
            block_guest_access: ["admin"],
            block_transfer: ["contractor", "pm"],
            block_deactivate: ["root_user"],
        }
    }
    
    selectInfluence = (influence) => {
        // res.revealedCard, prevaction, counterAction, challengee, challenger, isBlock
        const res = {
            revealedCard: influence,
            prevAction: this.props.res.action,
            counterAction: this.props.res.counterAction,
            challengee: this.props.res.challengee,
            challenger: this.props.res.challenger,
            isBlock: this.props.res.isBlock
        }
        console.log(res)
        this.props.socket.emit('g-revealDecision', res);
        this.props.doneReveal();
    }

    render() {
        const influences = this.props.influences.map((x, index) => {
            return <button id={x} key={index} onClick={() => this.selectInfluence(x)}>{x}</button>
        })
        return ( 
            <div>
                <p>Your <b>{this.act}</b> has been challenged! If you don't reveal {this.actionMap[this.act].join(' or ')} you'll lose influence! </p>
                {influences}
            </div>
        )
    }
}
