import {useEffect, useState} from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import Footer from "./Footer";
import HorseData from "../data/HorseData";
import Horse from "./Horse";
import QRCode from "react-qr-code";
import axios from "axios";
import io from "socket.io-client";
import Button from "./shared/Button";

const socket = io("http://localhost:4000", {secure: true})



// socket.emit("howdy", "stranger")



function Main() {
    const [btnDisabled, setBtnDisabled] = useState(true)
    const [ listening, setListening ] = useState(false);
    const [withdrawalInvoiceText, setWithdrawalInvoiceText] = useState('')
    const [isBetPlaced, setIsBetPlaced] = useState(true);
    const [showAmountField, setShowAmountField] = useState(true);
    const [display, setDisplay] =  useState("Place your Bets Now")
    const [walletAmount, setWalletAmount] =  useState(0)
    const [winningBalance, setWinningBalance] =  useState(0)
    const [paid, setPaid] =  useState(true)
    const [horses, setHorses] = useState([{
        name: '1ML',
        odds: '1.1',
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

    function handleWalletBalance(amount) {
        setWalletAmount(amount < 0 ? 0: amount );
    }

    function handleWinningBalance(amount) {
        setWinningBalance(amount < 0 ? 0: amount );
    }

    function handleIsBetPlaced(betPlaced) {
        setIsBetPlaced(betPlaced)
    }

    function handleWithdrawWallet() {
            console.log("Withdraw Clicked")

    }

    socket.on("data", (args => {
        let obj = JSON.parse(args);
        console.log("=====1", obj)
        if(obj.paid){
            setPaid(true);
            setDisplay("Paid!!!")
            handleEvent(obj.amount, paid)
        }
    }))


    const handleEvent = (amount, paid) => {
        axios.get('http://localhost:3001/api/wallet-funding/1', {
        }).then(paymentresponse => {
            setPaid(paymentresponse.data.data.isPaid);
            let amountToWin = paymentresponse.data.data.amountToWin;
            if(paid){
                if(horses[2].amount >= 10 || horses[0].amount >= 10){
                    const newWinningBal = winningBalance + amountToWin;
                    handleWinningBalance(newWinningBal)
                    axios.put('http://localhost:3001/api/wager', {
                        id: 1,
                        walletBalance: newWinningBal
                    }).then(paymentresponse => {
                        console.log("[+]", paymentresponse.data);
                    }).catch((err) => {
                        console.log(err)
                    });
                    handleDisplay( "Bet Won!!!")
                    setWinningBalance(newWinningBal)
                    handleIsBetPlaced(true)
                } else {
                    // let walletAmount = amount;
                    // handleWalletBalance(walletAmount)
                    // axios.put('http://localhost:3001/api/wager', {
                    //     id: 1,
                    //     walletBalance: walletAmount
                    // }).then(paymentresponse => {
                    //     console.log("[+]", paymentresponse.data);
                    // }).catch((err) => {
                    //     console.log(err)
                    // });
                    handleDisplay( "Bet Lose!!!")
                    handleIsBetPlaced(true)
                }
            }
        }).catch((err) => {
            console.log(err)
        });
    }

    const handleGetWinningBalance = () => {
        axios.get('http://localhost:3001/api/wager/1', {
        }).then(paymentresponse => {
            console.log(paymentresponse.data.data)
            const  balance = paymentresponse.data.data.walletBalance
            setWinningBalance(balance > 0 ? balance : 0 )
        }).catch((err) => {
            console.log(err)
        });
    };

    useEffect(() => {
        handleGetWinningBalance();
        parsedInvoiceForAmount('lnbcrt2u1p3x2pm8pp53e6j3sn34zsyfh3s957gmkmhaf9x8jmcj5rsny0j4rksvy3t4lfsdqqcqzpgsp5qgfu8m3npkpqc5v9cj5m4sfjjgqm6r5mxw6gtghzqhh83l9052xs9qyyssqczqqfyzjsx9tcj0s9wah9r6jfuf955a5tjc847crd0mq7dh2vye3pkwtysmljt883llynl0yt8k69eueqgswwtxvtc2pawel6swaa0sq5czlpc')
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault()
        if(withdrawalInvoiceText.trim().length > 10){
            console.log("Withdraw")
            setWithdrawalInvoiceText('')
            setWinningBalance(0)
            axios.put('http://localhost:3001/api/wager', {
                id: 1,
                walletBalance: 0
            }).then(paymentresponse => {
                console.log("[+]", paymentresponse.data);
            }).catch((err) => {
                console.log(err)
            });
        }
    }

    const handleTextChange = (e) => {
        if(withdrawalInvoiceText === ''){
            setBtnDisabled(true)
        } else if(withdrawalInvoiceText !== '' && withdrawalInvoiceText.trim().length <= 10) {
            setBtnDisabled(true)
        } else{
            setBtnDisabled(false)
        }

        // if(withdrawalInvoiceText !== '' && winningBalance > 0){
            console.log("?????", e.target.value)
            setWithdrawalInvoiceText(e.target.value)
        // }
    }

    const parsedInvoiceForAmount = (invoice) => {
        const regexp = /[0-9]+./;
        let match = invoice.match(regexp)[0];
        let amountUnit = match.slice(-1);

        const amtRegexp = /[0-9]+/;
        let amount = invoice.match(amtRegexp)[0];
        console.log(amount);
        console.log(amountUnit);
    }



    return (
        <div className='container'>

            <h1>{display.length > 30 ? <QRCode
                fgColor="#053140"
                bgColor="#f3f4f6"
                value={display}
            /> : display }</h1>
            <div className='wallet-balance'>Winning Balance: {winningBalance} sats</div>
            {/*<button className='fund-wallet' onClick={handleWithdrawWallet} > Withdraw </button>*/}
            <div className='input-group'>
                <form onSubmit={handleSubmit}>
                    <input className='input-group' onChange={handleTextChange} type='text' placeholder='Paste withdrawal invoice' value={withdrawalInvoiceText}/><br/><br/>
                    <Button className='fund-wallet' type='submit' isDisabled={btnDisabled}>Send</Button>
                </form>
            </div>


            <div className='bet-container'>
                {horses.map((horse, index) => (
                    <Horse key={horse.id} horse={horse}  onBetChange={onBetChange} handleDisplay={handleDisplay} handleIsBetPlaced={handleIsBetPlaced} />
                ))}
            </div>
            <Footer horses={horses}  handleDisplay={handleDisplay}  handleWinningBalance={handleWinningBalance} winningBalance={winningBalance} handleIsBetPlaced={handleIsBetPlaced} handleEvent={handleEvent}/>
        </div>
    );


}

export default Main
