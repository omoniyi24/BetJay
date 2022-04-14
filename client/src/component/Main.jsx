import {useState} from 'react'
import React from 'react'
import PropTypes from 'prop-types'
import Footer from "./Footer";
import HorseData from "../data/HorseData";
import Horse from "./Horse";

function Main() {
    const [horses, setHorses] = useState([{
        name: 'Red Room',
        odds: '1/5',
        id: 1,
        amount: 50 },
        {
            name: 'TeaBiscuit',
            odds: '2/1',
            id: 2,
            amount: 10 },
        {
            name: 'Black Betty',
            odds: '5/2',
            id: 3,
            amount: 30 },
        {
            name: 'Sher-Khan',
            odds: '6/1',
            id: 4,
            amount: 40 },
        {
            name: "L'il Sebastian",
            odds: '50/1',
            id: 5,
            amount: 0 }])

    function onBetChange(index, change) {
        console.log(">>>>", horses[index-1])
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
                <Footer horses={horses} />

            </div>
        </div>
    );


}

export default Main
