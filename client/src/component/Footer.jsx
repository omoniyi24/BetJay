import React from 'react'
import axios from 'axios'



 const handlePlaceBet = (horses, handleDisplay, maxReturn, handleWinningBalance, winningBalance, handleIsBetPlaced, totalBet, handleEvent) => {
             axios.post('http://localhost:3001/api/wager/1/fund-wallet', {
                 amount: totalBet,
                 amountToWin: calcProfit(horses)
             }).then(paymentresponse => {
                 console.log("[+]", paymentresponse.data);
                 handleDisplay(paymentresponse.data.payreq)
             }).catch((err) => {
                 console.log(err)
             });

     handleEvent(winningBalance)
 }



function Footer({horses, handleDisplay, handleWinningBalance, winningBalance, handleIsBetPlaced, handleEvent}) {
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
                    <div className="max">{profit} sats</div>
                </div>
                <div>
                    <div>Total Bet Amount</div>
                    <div className="total">{totalBet} sats</div>
                </div>
                <button onClick={() => {if (totalBet >= 5) {handlePlaceBet(horses, handleDisplay, profit, handleWinningBalance, winningBalance, handleIsBetPlaced, totalBet, handleEvent)}}}> Place Bet </button>
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