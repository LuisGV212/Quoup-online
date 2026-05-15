import React from 'react'
import './PlayerBoardStyles.css'

export default function PlayerBoard(props) {
    let boardItems = null
    if(props.players.length > 1) {
        boardItems = props.players.map((player, index) =>
            <span className="PlayerBoardItem" style={{ backgroundColor: `${player.color}` }} key={index}>
                <h2>{player.name}</h2>
                <p>Tokens: {player.money}</p>
                <p>Privileges: {player.influences.length}</p>
                {/* <p>{player.influences.join(', ')}</p> */}
            </span>
        );
    }
    return (
        <div className="PlayerBoardContainer" style={{textAlign: "center"}}>
            {boardItems}
        </div>
    )
  }


