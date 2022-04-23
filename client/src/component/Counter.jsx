import React from 'react'
import PropTypes from 'prop-types'

function Counter({horse, onBetChange, handleDisplay, handleIsBetPlaced}) {

    return (

        <section className='betting'>
            <div className='choice'>
                <button className="up" onClick={() => {handleDisplay("Place your Bets Now"); onBetChange(horse.id, 5)}} >+</button>
                <button  className="down" onClick={() => {if (horse.amount >= 5) {handleDisplay("Place your Bets Now"); onBetChange(horse.id, -5);}} }>-</button>
            </div>
            <div className="amount">{horse.amount}sats</div>
        </section>
    );
}

export default Counter

// Counter.propTypes = {
//     onChange: React.PropTypes.func.isRequired };