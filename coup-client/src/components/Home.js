import React, { Component } from 'react'
import { Link } from "react-router-dom";
import RulesModal from './RulesModal';

export default class Home extends Component {
    render() {
        return (
            <>
            <div className="homeContainer">
                <div className="brandMark" aria-label="Quoup">
                    <span className="brandSymbol">Q</span>
                    <span className="brandWord">Quoup</span>
                </div>
                <h1>Team strategy in five roles</h1>
                <p>A Quire-themed game of access, deduction, and deception.</p>
                <div className="input-group-btn">
                    <Link className="home" to="/create" >Create Game</Link>
                </div>
                <div className="input-group-btn">
                    <Link className="home" to="/join" >Join Game</Link>
                </div>
                <div>
                    <div className="homeModalContainer">
                    <RulesModal home={true}/> 
                    </div>
                </div>
                

                
            </div>
            <p className="footer">Built for Quire team play</p>
            <p className="version-number">Quoup beta</p>
            </>
        )
    }
}
