import React from 'react'
import PropTypes from 'prop-types'

function Counter({horse, onBetChange}) {


    // console.log(">>>1", horse);
    // console.log(">>>2", onBetChange(horse.id+1, -5));
    return (

        <section className='betting'>
            <div className='choice'>
                <button onClick={() => onBetChange(horse.id, 5)} className="up">+</button>
                <button onClick={() => {if (horse.amount >= 5) {onBetChange(horse.id, -5);}} } className="down">-</button>
            </div>
            <div className='amount'>
                {horse.amount}
            </div>

        </section>
    );
}

export default Counter

// Counter.prototype = {
//     onChange: React.PropTypes.func.isRequired };