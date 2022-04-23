import { EventEmitter } from 'events';
import { existsSync, promises as fs } from 'fs';
import {LnRpc} from "@radar/lnrpc";
import {NodeEvents} from "./node-manager";
import {node} from "./node";
import {response} from "express";
const cron = require('node-cron');
import wagerService, {WagerService} from "./wager-service";



const DB_FILE = '../db.json';

export interface FundingTransaction {
    id: number;
    amount: number;
    hash: string;
    wagerId: number;
    isPaid: boolean;
}

export interface DbData {
    fundingTransactions: FundingTransaction[];
}

/**
 * The list of events emitted by the fundingTransactionDB
 */
export const FundingTransactionEvents = {
    updated: 'fundingTransaction-updated',
};

/**
 * A very simple file-based DB to store the fundingTransaction
 */
export class FundingTransaction extends EventEmitter {

    // in-memory database
    private _data: DbData = {
        fundingTransactions: [],
    };


    getAllFundingTransactions() {
        return this._data.fundingTransactions;
    }

    getFundingTransactionById(fundingTransactionId: number) {
        return this.getAllFundingTransactions().find(fundingTransaction => fundingTransaction.id === fundingTransactionId);
    }

    getFundingTransactionByHash(hash: string) {
        return this.getAllFundingTransactions().find(fundingTransaction => fundingTransaction.hash === hash);
    }

    getFundingTransactionByWagerId(wagerId: number) {
        return this.getAllFundingTransactions().find(fundingTransaction => fundingTransaction.wagerId === wagerId);
    }

    getFundingTransactionByNotPaid() {
        return this.getAllFundingTransactions().filter(fundingTransaction => !fundingTransaction.isPaid);
    }


    async addFundingTransaction(fundingTransaction: FundingTransaction) {
        const maxId = Math.max(0, ...this._data.fundingTransactions.map(p => p.id));
        fundingTransaction.id = maxId + 1;
        this._data.fundingTransactions = [
            // add new fundingTransaction
            fundingTransaction,
            // exclude existing fundingTransactions with the same server
            ...this._data.fundingTransactions.filter(n => n.id !== fundingTransaction.id),
        ];
        await this.persist();
    }

    async updateFundingTransaction(transaction: FundingTransaction) {
        const wager = this._data.fundingTransactions.find(p => p.wagerId === transaction.wagerId);
        if (!wager) {
            throw new Error('Wager not found');
        }
        await this.persist();
        this.emit(FundingTransactionEvents.updated, transaction);
    }

    async queryInvoice(hash: string){
        try{
            // find the node that made this Employee
            let transactionByHash = this.getFundingTransactionByHash(hash);
            if (!transactionByHash) throw new Error('Transaction with hash is not found');
            transactionByHash.isPaid = true;
            this.updateFundingTransaction(transactionByHash)
        } catch(err) {
            console.log(err)
            console.log("Error Updating Invoice");
        }
    }

    async autoQueryInvoice(){
        try{
            let allTransaction = this.getFundingTransactionByNotPaid();
            for (let i = 0; i < allTransaction.length; i++) {
                let fundingTrans = allTransaction[i];
                const rHash = Buffer.from(fundingTrans.hash, 'base64');
                const {settled} = await node.lookupInvoice({rHash});
                if (settled) {
                    fundingTrans.isPaid = true
                    this.updateFundingTransaction(fundingTrans)
                    const wager = wagerService.getWagerById(fundingTrans.wagerId);
                    if(wager){
                        const balance = wager.walletBalance + fundingTrans.amount
                        wagerService.updateWager(wager.id, wager.name, wager.email, balance)
                    }
                }

            }
        } catch(err) {
            console.log(err)
            console.log("Error Updating Invoice");
        }
    }

    //
    // HACK! Persist data to a JSON file to keep it when the server restarts.
    // Do not do this in a production app. This is just for convenience when
    // developing this sample app locally.
    //

    async persist() {
        await fs.writeFile(DB_FILE, JSON.stringify(this._data, null, 2));
    }

    async restore() {
        if (!existsSync(DB_FILE)) return;

        const contents = await fs.readFile(DB_FILE);
        if (contents) {
            this._data = JSON.parse(contents.toString());
            if (!this._data.fundingTransactions) this._data.fundingTransactions = [];
            console.log(`Loaded ${this._data.fundingTransactions.length} fundingTransactions`);
        }
    }

}

let fundingTransaction = new FundingTransaction();
export default fundingTransaction;
// cron.schedule("1 * * * * *", () => {
//     console.log("Minute Cron Job Start");
//     fundingTransaction.autoQueryInvoice()
// });