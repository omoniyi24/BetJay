import Counter from "./Counter";
import PropTypes from "prop-types";


function Horse({horse, onBetChange}){

    return (
        <div className='horse'>
            <div className='name'>{horse.name}</div>
            <div className='odds'>{horse.odds}</div>
            <Counter horse={horse} onBetChange={onBetChange}/>
        </div>

    );
}

export default Horse

// Horse.propTypes = {
//     name: PropTypes.string.isRequired,
//     color: PropTypes.string.isRequired,
//     odds: PropTypes.string.isRequired,
//     amount: PropTypes.number.isRequired,
// };
