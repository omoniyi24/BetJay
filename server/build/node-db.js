"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeEvents = void 0;
const events_1 = require("events");
const fs_1 = require("fs");
const DB_FILE = '../db.json';
/**
 * The list of events emitted by the EmployeeDb
 */
exports.NodeEvents = {
    updated: 'node-updated',
};
/**
 * A very simple file-based DB to store the Node
 */
class LNDNode extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        // in-memory database
        this._data = {
            nodes: [],
        };
    }
    getAllNodes() {
        return this._data.nodes;
    }
    getNodeByPubkey(pubkey) {
        return this.getAllNodes().find(node => node.pubkey === pubkey);
    }
    getNodeByToken(token) {
        return this.getAllNodes().find(node => node.token === token);
    }
    addNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            this._data.nodes = [
                // add new node
                node,
                // exclude existing nodes with the same server
                ...this._data.nodes.filter(n => n.host !== node.host),
            ];
            yield this.persist();
        });
    }
    //
    // HACK! Persist data to a JSON file to keep it when the server restarts.
    // Do not do this in a production app. This is just for convenience when
    // developing this sample app locally.
    //
    persist() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs_1.promises.writeFile(DB_FILE, JSON.stringify(this._data, null, 2));
        });
    }
    restore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs_1.existsSync(DB_FILE))
                return;
            const contents = yield fs_1.promises.readFile(DB_FILE);
            if (contents) {
                this._data = JSON.parse(contents.toString());
                if (!this._data.nodes)
                    this._data.nodes = [];
                console.log(`Loaded ${this._data.nodes.length} nodes`);
            }
        });
    }
}
// let nodeDb = new LNDNode();
exports.default = new LNDNode();
