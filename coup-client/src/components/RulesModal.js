import React, { Component } from 'react';
import ReactModal from 'react-modal';

export default class RulesModal extends Component {

    constructor(props) {
        super(props)
    
        this.state = {
            showRulesModal: false,
        }
    }

    handleOpenRulesModal = () => {
        this.setState({ showRulesModal: true });
    }

    handleCloseRulesModal = () => {
        this.setState({ showRulesModal: false });
    }
    
    render() {
        let modal = <ReactModal 
        isOpen={this.state.showRulesModal}
        contentLabel="Minimal Modal Example"
        onRequestClose={this.handleCloseRulesModal}
        shouldCloseOnOverlayClick={true}
    >
    <div className="CloseModalButtonContainer">
        <button className="CloseModalButton" onClick={this.handleCloseRulesModal}>
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
                <g id="more_info" data-name="more info" transform="translate(-39 -377)">
                    <g id="Ellipse_1" data-name="Ellipse 1" class="cls-5" transform="translate(39 377)">
                    <circle class="cls-7" cx="10.5" cy="10.5" r="10.5"/>
                    <circle class="cls-8" cx="10.5" cy="10.5" r="10"/>
                    </g>
                    <text id="x" class="cls-6" transform="translate(46 391)"><tspan x="0" y="0">x</tspan></text>
                </g>
            </svg>
        </button>
    </div>
   
    <div className="RulesContainer">
        <div className="RulesContent">
            <h2>Rules</h2>
            <p>2-6 players</p>
            <p>On your turn, you may choose an action to play. The action you choose may or may not correspond to the privileges that you possess. 
                For the action that you choose, other players may potentially block or challenge it. </p>
            <p><b>Challenge</b>: When a player declares an action they are declaring to the rest of the players that they have a certain privilege, 
                and any other player can challenge it. When a player is challenged, the challenged player must reveal the correct privilege 
                associated with their action. If they reveal the correct privilege, the challenger player will lose a privilege. However, 
                if they fail to reveal the correct privilege the challenged player will lose their incorrectly revealed privilege.</p>
            <p><b>Block</b>: When any of the actions "Guest Access", "Transfer Tokens", and "Deactivate User" are used, they can be blocked. Once again, 
                any player can claim to have the correct privilege to block. However, blocks can also be challenged by any player. If a block 
                fails, the original action will take place.
            </p>
            <p>
                If a player loses all their privileges, they are out of the game. The last player standing wins!
            </p>
            <p>
                At this time, if a player disconnects, the game must be recreated.
            </p>
            <h2>Privileges</h2>
            <h3>PM</h3>
            <p><b id="pm-color">TRANSFER TOKENS</b>: Transfer 2 tokens from a target. Blockable by <hl id="pm-color">PM</hl> or <hl id="contractor-color">Contractor</hl>. Can block <hl id="pm-color">TRANSFER TOKENS</hl></p>
            <h3>System Admin</h3>
            <p><b id="system_admin-color">DEACTIVATE USER</b>: Pay 3 tokens to choose a target to deactivate (target loses a privilege). Blockable by <hl id="root_user-color">Root User</hl>.</p>
            <h3>Admin</h3>
            <p><b id="admin-color">COLLECT TOKENS</b>: Collect 3 tokens from the treasury. Not blockable. Can block Guest Access.</p>
            <h3>Contractor</h3>
            <p><b id="contractor-color">EXCHANGE ROLES</b>: Draw 2 privileges into your hand and pick any 2 privileges to put back. Not blockable. Can block <hl id="pm-color">TRANSFER TOKENS</hl></p>
            <h3>Root User</h3>
            <p><b id="root_user-color">BLOCK DEACTIVATION</b>: Can block <b id="system_admin-color">deactivations</b>. Not blockable.</p>
            <h3>Other Actions</h3>
            <p><b>BASIC ACCESS</b>: Collect 1 token from the treasury.</p>
            <p><b>GUEST ACCESS</b>: Collect 2 tokens from the treasury. Blockable by <hl id="admin-color">Admin</hl>.</p>
            <p><b>DELETE USER</b>: Pay 7 tokens and choose a target to lose a privilege. If a player starts their turn with 10 or more tokens, they must Delete User. Not Blockable.</p>
        </div>
    </div>
    </ReactModal>
        if(this.props.home) {
            return(
                <>
                    <div className="HomeRules" onClick={this.handleOpenRulesModal}>
                        <p>Rules </p>  
                        <svg className="InfoIcon"xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 21 22">
                            <g id="more_info" data-name="more info" transform="translate(-39 -377)">
                                <g id="Ellipse_1" data-name="Ellipse 1" className="cls-1" transform="translate(39 377)">
                                <circle className="cls-3" cx="10.5" cy="10.5" r="10.5"/>
                                <circle className="cls-4" cx="10.5" cy="10.5" r="10"/>
                                </g>
                                <text id="i" className="cls-2" transform="translate(48 393)"><tspan x="0" y="0">i</tspan></text>
                            </g>
                        </svg>
                    </div>
                    {modal}
                </>
            )
        }
        return (
            <>
            <div className="Rules" onClick={this.handleOpenRulesModal}>
                <p>Rules </p>  
                <svg className="InfoIcon"xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 21 22">
                    <g id="more_info" data-name="more info" transform="translate(-39 -377)">
                        <g id="Ellipse_1" data-name="Ellipse 1" className="cls-1" transform="translate(39 377)">
                        <circle className="cls-3" cx="10.5" cy="10.5" r="10.5"/>
                        <circle className="cls-4" cx="10.5" cy="10.5" r="10"/>
                        </g>
                        <text id="i" className="cls-2" transform="translate(48 393)"><tspan x="0" y="0">i</tspan></text>
                    </g>
                </svg>
            </div>
            {modal}
            </>
        )
    }
}
