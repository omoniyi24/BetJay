import { EventEmitter } from 'events';
import { existsSync, promises as fs } from 'fs';
import {node} from "./node";
import nodeManager from "./node-manager";

const DB_FILE = '../db.json';

export interface LndNode {
    id: number;
    token: string;
    host: string;
    cert: string;
    macaroon: string;
    pubkey: string;
    channelBalance: string;
    wagerId: number;
}

export interface DbData {
    nodes: LndNode[];
}

/**
 * The list of events emitted by the EmployeeDb
 */
export const NodeEvents = {
    updated: 'node-updated',
};

/**
 * A very simple file-based DB to store the Node
 */
class LNDNode extends EventEmitter {

    // in-memory database
    private _data: DbData = {
        nodes: [],
    };


    getAllNodes() {
        return this._data.nodes;
    }

    getNodeByPubkey(pubkey: string) {
        return this.getAllNodes().find(node => node.pubkey === pubkey);
    }

    getNodeByWager(wagerId: number) {
        return this.getAllNodes().find(node => node.wagerId === wagerId);
    }

    getNodeByToken(token: string) {
        return this.getAllNodes().find(node => node.token === token);
    }

    async addNode(node: LndNode) {
        const maxId = Math.max(0, ...this._data.nodes.map(p => p.id));
        node.id = maxId + 1;
        this._data.nodes = [
            // add new node
            node,
            // exclude existing nodes with the same server
            ...this._data.nodes.filter(n => n.host !== node.host),
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
            if (!this._data.nodes) this._data.nodes = [];
            console.log(`Loaded ${this._data.nodes.length} nodes`);
        }
    }

}

// let nodeDb = new LNDNode();
export default new LNDNode();