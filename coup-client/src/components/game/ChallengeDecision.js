import React, { Component } from 'react'

export default class ChallengeDecision extends Component {

    // constructor(props) {
    //     super(props)
    // }

    vote = (isChallenging) => {
        this.props.closeOtherVotes('challenge')

        const res = {
            action: this.props.action,
            isChallenging,
            challengee: this.props.action.source,
            challenger: this.props.name
        }
        console.log(res)
        this.props.socket.emit('g-challengeDecision', res);
        this.props.doneChallengeVote();
    }

    challengeText = (action, source, target) => {
        if(action === 'transfer_tokens') {
            return <p><b>{source}</b> is trying to Transfer Tokens from <b>{target}</b></p>
        }else if(action === 'collect_tokens') {
            return <p><b>{source}</b> is trying to Collect Tokens (3 tokens)</p>
        }else if(action === 'deactivate_user') {
            return <p><b>{source}</b> is trying to Deactivate User <b>{target}</b></p>
        }else if(action === 'exchange_roles') {
            return <p><b>{source}</b> is trying to Exchange Roles</p>
        }
    }

    render() {
        return (
            <>
                {this.challengeText(this.props.action.action, this.props.action.source, this.props.action.target)}
                <button onClick={() => this.vote(true)}>Challenge</button>
                {/* <button onClick={() => this.vote(false)}>Pass</button> */}
            </>
        )
    }
}
