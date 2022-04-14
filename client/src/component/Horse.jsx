import Counter from "./Counter";


function Horse({horse, onBetChange}){
    return (
            <div className='horse'>
                <div className='name'>
                    <div className='odds'>
                        <Counter horse={horse} onBetChange={onBetChange}/>
                    </div>
                </div>
            </div>

    );
}

export default Horse