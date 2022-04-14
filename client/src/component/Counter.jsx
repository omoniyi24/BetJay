import React from 'react'
import PropTypes from 'prop-types'

function Counter({horse, onBetChange}) {

    return (

        <section className='betting'>
            <div className='choice'>
                <button className="up" onClick={() => onBetChange(horse.id, 5)} >+</button>
                <button  className="down" onClick={() => {if (horse.amount >= 5) {onBetChange(horse.id, -5);}} }>-</button>
            </div>
            <div className="amount">#{horse.amount}</div>
        </section>
    );
}

export default Counter

// Counter.propTypes = {
//     onChange: React.PropTypes.func.isRequired };