import { EventEmitter } from 'events';
import { existsSync, promises as fs } from 'fs';

const DB_FILE = '../db.json';

export interface Wager {
    id: number;
    name: string;
    email: string;
    walletBalance: number;
    publicKey: string;
}

export interface DbData {
    wagers: Wager[];
}

/**
 * The list of events emitted by the WagerDB
 */
export const WagerEvents = {
    updated: 'wager-updated',
};

/**
 * A very simple file-based DB to store the Wager
 */
export class WagerService extends EventEmitter {

    // in-memory database
    private _data: DbData = {
        wagers: [],
    };


    getAllWagers() {
        return this._data.wagers;
    }

    getWagerById(wagerId: number) {
        return this.getAllWagers().find(wager => wager.id === wagerId);
    }

    async createWager(name: string, email: string, publicKey: string) {
        const maxId = Math.max(0, ...this._data.wagers.map(p => p.id));

        const wager: Wager = {id: maxId + 1, name: name, email: email, walletBalance: 0, publicKey: publicKey};
        this._data.wagers.push(wager);

        await this.persist();
        this.emit(WagerEvents.updated, wager);
        return wager;
    }

    updateWager(wagerId: number, name: string, email: string, walletBalance: number) {
        const wager = this._data.wagers.find(p => p.id === wagerId);
        if (!wager) {
            throw new Error('Wager not found');
        }
        wager.email = email
        wager.name = name
        wager.walletBalance = walletBalance
        // post.votes++;
        this.persist();
        this.emit(WagerEvents.updated, wager);
        return this.getWagerById(wagerId)
    }



    async addWager(wager: Wager) {
        const maxId = Math.max(0, ...this._data.wagers.map(p => p.id));
        wager.id = maxId + 1;
        this._data.wagers = [
            // add new wage
            wager,
            // exclude existing wagers with the same server
            ...this._data.wagers.filter(n => n.email !== wager.email),
        ];
        await this.persist();
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
            if (!this._data.wagers) this._data.wagers = [];
            console.log(`Loaded ${this._data.wagers.length} wagers`);
        }
    }

}


export default new WagerService();
