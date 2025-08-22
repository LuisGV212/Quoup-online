import React, { Component } from 'react'

export default class BlockDecision extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
            isDecisionMade: false,
            decision: '',
            isPickingClaim: false,
            targetAction: ''
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

    block = (block, claim = null) => {
        this.props.closeOtherVotes('block')
        let resClaim
        if(claim != null) {
            resClaim = claim;
        } else if(block === 'block_guest_access') {
            resClaim = 'admin'
        } else if(block === 'block_deactivate') {
            resClaim = 'root_user'
        } else {
            console.error('unknown claim, line 40')
        }

        const res = {
            prevAction: this.props.action,
            counterAction: {
                counterAction: block,
                claim: resClaim,
                source: this.props.name
            },
            blockee: this.props.action.source,
            blocker: this.props.name,
            isBlocking: true
        }
        console.log(res)
        this.props.socket.emit('g-blockDecision', res)
        this.props.doneBlockVote();
    }

    pass = () => {
        const res = {
            action: this.props.action,
            isBlocking: false
        }
        console.log(res)
        this.props.socket.emit('g-blockDecision', res)
        this.props.doneBlockVote();
    }

    pickClaim = (block) => {
        this.props.closeOtherVotes('block')
        this.setState({ decision: block })
        this.setState({ isPickingClaim: true })
    }

    render() {
        let control = null
        let pickClaim = null
        if(!this.state.isPickingClaim) {
            if(this.props.action.action === 'guest_access') {
                control = <>
                <p><b>{this.props.action.source}</b> is trying to use Guest Access</p>
                <button onClick={() => this.block('block_guest_access')}>Block Guest Access</button>
                </>
            } else if(this.props.action.action === 'transfer_tokens') {
                control = <button onClick={() => this.pickClaim('block_transfer')}>Block Transfer</button>
            } else if(this.props.action.action === 'deactivate_user') {
                control = <button onClick={() => this.block('block_deactivate')}>Block Deactivation</button>
            }
        } else {
            pickClaim = <>
                <p>To block transfer, do you claim Contractor or PM?</p>
                <button onClick={() => this.block(this.state.decision, 'contractor')}>Contractor</button>
                <button onClick={() => this.block(this.state.decision, 'pm')}>PM</button>
            </>
        }
        
        return (
            <>
               {control}
               {pickClaim}
               {/* <button onClick={() => this.pass()}>Pass</button> */}
            </>
        )
    }
}
