import React from 'react'
import './PlayerBoardStyles.css'

export default function PlayerBoard(props) {
    let boardItems = null
    if(props.players.length > 1) {
        boardItems = props.players.map((player, index) => {
            const isCurrent = player.name === props.currentPlayer;
            return <span className={`PlayerBoardItem ${isCurrent ? 'isCurrent' : ''}`} style={{ '--player-color': player.color }} key={index}>
                <span className="PlayerColorRail"></span>
                <h2>{player.name}</h2>
                <p>Tokens: {player.money}</p>
                <p>Privileges: {player.influences.length}</p>
                {/* <p>{player.influences.join(', ')}</p> */}
            </span>
        });
    }
    return (
        <div className="PlayerBoardContainer" style={{textAlign: "center"}}>
            {boardItems}
        </div>
    )
  }

