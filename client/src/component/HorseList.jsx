import React from 'react'



function HorseList({horse}) {
    if(!horse || horse.length === 0){
        return <p>No Horse Yet</p>
    }
    return (
            <div className='feedback-list'>
                {horse.map((item) => (
                    <p>hello {item.name}</p>
                    // <Horse key={horse.id} item={horse}/>
                ))}
            </div>
    );


}

HorseList.propTypes = {
    name: React.PropTypes.string.isRequired,
    color: React.PropTypes.string.isRequired,
    odds: React.PropTypes.string.isRequired,
    amount: React.PropTypes.number.isRequired
};




export default HorseList
