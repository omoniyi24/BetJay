import React from 'react'

 const handlePlaceBet = ({ horses }) => {
     console.log(horses)
 }

function Footer({horses}) {
    let profit = calcProfit(horses);
    let totalBet = calcBet(horses);
    return (
        <div className="submit">
            <div className="logo">
                <p>Bet<span>Jay</span></p>
            </div>
            <div className="options">
                <div>
                    <div>Max Potential Return</div>
                    <div className="max">#{profit}</div>
                </div>
                <div>
                    <div>Total Bet Amount</div>
                    <div className="total">#{totalBet}</div>
                </div>
                <button onClick={() => handlePlaceBet(horses)}> Place Bet </button>
            </div>
        </div>
    );

}

export default Footer

function calcBet(horses) {
    let totalBet = 0;
    horses.forEach(horse => {
        totalBet += horse.amount;
    });
    return totalBet;
}

function calcProfit(horses) {
    let profitArray = [];
    let betArray = [];
    horses.forEach(horse => {
        profitArray.push(eval(horse.odds) * horse.amount + horse.amount);
        betArray.push(horse.amount);
    });
    let highestReturn = Math.max.apply(null, profitArray);
    let highestReturnIndex = profitArray.indexOf(highestReturn);
    let outlay = betArray.reduce(function (total, bet) {
        return total + bet;
    }, 0);
    let profit = highestReturn - outlay + horses[highestReturnIndex].amount;
    return Math.round(profit);
}