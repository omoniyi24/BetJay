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

const socket = io("http://localhost:4000")



// socket.emit("howdy", "stranger")



function Main() {
    const [isCompleted, setIsCompleted] = useState(false);
    const [fundingTransactionId, setFundingTransactionId] = useState(0);
    const [isBetPlaced, setIsBetPlaced] = useState(true);
    const [display, setDisplay] =  useState("Place your Bets Now")
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

    function handleFundingTransactionId(fundingTransactionId) {
        setFundingTransactionId(fundingTransactionId);
    }

    function handleIsBetPlaced(betPlaced) {
        setIsBetPlaced(betPlaced)
    }

    useEffect(() => {
        socket.on("paymentInfo", (args => {
            // console.log("HEEEEEEEEEY")
            let obj = JSON.parse(args);
            if(obj.paid && !obj.isCompleted){
                console.log("=====>>", obj.isCompleted)

                setPaid(true);
                setDisplay("Paid!!!")
                handleEvent(obj.amount, paid, obj.fundingTransactionId)
            }
        }))
    }, []);

    // useEffect(() => {
    //     const intervalId = setInterval(() => {
    //         console.log("[+++++++++++++++++++++++++++++]");
    //         console.log("[+]", fundingTransactionId);
    //         handleGetTransactionDetails(fundingTransactionId);
    //     }, 1000);
    //
    //     return () => clearInterval(intervalId);
    // }, []);

    function handleGetTransactionDetails(fundingTransactionId){
        axios.get('http://localhost:3001/api/wallet-funding/'+fundingTransactionId, {
        }).then(paymentresponse => {
            let data = paymentresponse.data;
            console.log("[+]<<<<", paymentresponse);
            if(data.isPaid && !data.isCompleted){
                // console.log("[+]<<<<<<<<<<2", data);
                setFundingTransactionId(data.fundingTransactionId)
                setDisplay("Paid!!!")
                setPaid(true)
                handleEvent(4, true, fundingTransactionId)
            }
        }).catch((err) => {
            console.log(err)
        });
    }


    const handleEvent = (amount, paid, transactionId) => {
        console.log("=====got here =======")
        if(paid){
                setPaid(paid);
                if(horses[2].amount >= 10 || horses[0].amount >= 10){
                    axios.post('http://localhost:3001/api/keysend', {
                        transactionId: transactionId
                    }).then(paymentresponse => {
                        console.log("[+]", paymentresponse.data);
                    }).catch((err) => {
                        console.log(err)
                    });
                    handleDisplay( "Bet Won!!!")
                    handleIsBetPlaced(true)
                } else {
                    handleDisplay( "Bet Lose!!!")
                    handleIsBetPlaced(true)
                }
            }
    }


    return (
        <div className='container'>

            <h1>{display.length > 30 ? <QRCode
                fgColor="#053140"
                bgColor="#f3f4f6"
                value={display}
            /> : display }</h1>


            <div className='bet-container'>
                {horses.map((horse, index) => (
                    <Horse key={horse.id} horse={horse}  onBetChange={onBetChange} handleDisplay={handleDisplay} handleIsBetPlaced={handleIsBetPlaced} />
                ))}
            </div>
            <Footer horses={horses}  handleDisplay={handleDisplay} handleIsBetPlaced={handleIsBetPlaced} handleEvent={handleEvent} handleFundingTransactionId={handleFundingTransactionId}/>
        </div>
    );


}

export default Main
