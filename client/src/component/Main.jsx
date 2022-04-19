import {useState} from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import Footer from "./Footer";
import HorseData from "../data/HorseData";
import Horse from "./Horse";
import QRCode from "react-qr-code";
import axios from "axios";


function Main() {
    const [showAmountField, setShowAmountField] = useState(true);
    const [display, setDisplay] =  useState("Place your Bets Now")
    const [walletAmount, setWalletAmount] =  useState(0)
    const [horses, setHorses] = useState([{
        name: '1ML',
        odds: '0.5',
        id: 1,
        amount: 0 },
        {
            name: 'Fiatjaf',
            odds: '1.5',
            id: 2,
            amount: 0 },
        {
            name: 'hashXP',
            odds: '2.5',
            id: 3,
            amount: 0 },
        {
            name: 'Amboss Space',
            odds: '6.0',
            id: 4,
            amount: 0 },
        {
            name: "ACINQ",
            odds: '25.0',
            id: 5,
            amount: 0 }])

    function onBetChange(index, change) {
        // horses[index-1].amount += change;
        let arr = [...horses, horses[index-1].amount+= change]
        let anotherArr = arr.pop()
        setHorses(arr);
    }

    function handleDisplay(display) {
        setDisplay(display);
    }

    function handleRefreshWallet() {
        axios.get('http://localhost:3001/api/wager/1', {
        }).then(paymentresponse => {
            console.log(paymentresponse.data.data)
            const  balance = paymentresponse.data.data.walletBalance
            setWalletAmount(balance > 0 ? balance : 0 )
        }).catch((err) => {
            console.log(err)
        });
    }


    const handleFundWallet = (event) => {
        event.preventDefault();
        const amount = parseInt(event.target[1].value);
        if(amount > 0){
            axios.post('http://localhost:3001/api/wager/1/fund-wallet', {
                amount: amount
            }).then(paymentresponse => {
                console.log("[+]", paymentresponse.data);
                setDisplay(paymentresponse.data.payreq)
            }).catch((err) => {
                console.log(err)
            });
            // setWalletAmount(event.target[1].value);
        }
    };



    return (
        <div className='container'>
            <h1>{display.length > 30 ? <QRCode
                fgColor="#053140"
                bgColor="#f3f4f6"
                value={display}
            /> : display }</h1>
            <div className='wallet-balance'>Balance: {walletAmount} sats</div>
            <button className='fund-wallet' onClick={handleRefreshWallet} > Refresh Wallet </button>
            <form onSubmit={handleFundWallet}>
                <button className='fund-wallet' type="submit" > Fund Wallet </button> <br/>
                { showAmountField ? <input type="text" placeholder="Enter Amount In Satoshi" /> : null }
            </form>
            <button className='fund-wallet' onClick={handleRefreshWallet} > Withdraw </button>


            <div className='bet-container'>
                {horses.map((horse, index) => (
                    <Horse key={horse.id} horse={horse}  onBetChange={onBetChange} handleDisplay={handleDisplay} />
                ))}
            </div>
            <Footer horses={horses}  handleDisplay={handleDisplay}  walletAmount={walletAmount}/>
        </div>
    );


}

export default Main


