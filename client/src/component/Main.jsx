import {useState} from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import Footer from "./Footer";
import HorseData from "../data/HorseData";
import Horse from "./Horse";

function Main() {
    const [horses, setHorses] = useState([{
        name: '1ML',
        odds: '0.5',
        id: 1,
        amount: 0 },
        {
            name: 'Fiatjaf',
            odds: '0.25',
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



    return (
        <div className='container'>
            <h1>Place your Bets Now</h1>
            <div className='bet-container'>
                {horses.map((horse, index) => (
                    <Horse key={horse.id} horse={horse}  onBetChange={onBetChange}/>
                ))}
            </div>
            <Footer horses={horses} />
        </div>
    );


}

export default Main
