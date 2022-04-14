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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeEvents = void 0;
const lnrpc_1 = __importDefault(require("@radar/lnrpc"));
const events_1 = require("events");
const uuid_1 = require("uuid");
exports.NodeEvents = {
    invoicePaid: 'invoice-paid',
};
class NodeManager extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        /**
         * a mapping of token to gRPC connection. This is an optimization to
         * avoid calling `createLnRpc` on every request. Instead, the object is kept
         * in memory for the lifetime of the server.
         */
        this._lndNodes = {};
    }
    /**
     * Retrieves the in-memory connection to an LND node
     */
    getRpc(token) {
        if (!this._lndNodes[token]) {
            throw new Error('Not Authorized. You must login first!');
        }
        return this._lndNodes[token];
    }
    /**
     * Tests the LND node connection by validating that we can get the node's info
     */
    connect(host, cert, macaroon, prevToken) {
        return __awaiter(this, void 0, void 0, function* () {
            // generate a random token, without
            const token = prevToken || uuid_1.v4().replace(/-/g, '');
            try {
                // add the connection to the cache
                const rpc = yield lnrpc_1.default({
                    server: host,
                    cert: Buffer.from(cert, 'hex').toString('utf-8'),
                    macaroon,
                });
                // verify we have permission get node info
                const { identityPubkey: publicKey } = yield rpc.getInfo();
                // verify we have permission to get channel balances
                const { balance: balance } = yield rpc.channelBalance();
                // verify we can sign a message
                const msg = Buffer.from('authorization test').toString('base64');
                const { signature } = yield rpc.signMessage({ msg });
                // verify we have permission to verify a message
                yield rpc.verifyMessage({ msg, signature });
                // verify we have permissions to create a 1sat invoice
                const { rHash } = yield rpc.addInvoice({ value: '1', memo: 'Test invoice creation', expiry: '15' });
                // verify we have permission to lookup invoices
                yield rpc.lookupInvoice({ rHash });
                // listen for payments from LND
                this.listenForPayments(rpc, publicKey);
                // store this rpc connection in the in-memory list
                this._lndNodes[token] = rpc;
                // return this node's token for future requests
                return { token, publicKey, balance };
            }
            catch (err) {
                // remove the connection from the cache since it is not valid
                if (this._lndNodes[token]) {
                    delete this._lndNodes[token];
                }
                throw err;
            }
        });
    }
    /**
     * Reconnect to all persisted nodes to to cache the `LnRpc` objects
     * @param nodes the list of nodes
     */
    reconnectNodes(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const node of nodes) {
                const { host, cert, macaroon, token } = node;
                try {
                    console.log(`Reconnecting to LND node ${host} for token ${token}`);
                    yield this.connect(host, cert, macaroon, token);
                }
                catch (error) {
                    // the token will not be cached
                    console.error(`Failed to reconnect to LND node ${host} with token: ${token}`);
                }
            }
        });
    }
    /**
     * listen for payments made to the node. When a payment is settled, emit
     * the `invoicePaid` event to notify listeners of the NodeManager
     */
    listenForPayments(rpc, pubkey) {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = yield rpc.subscribeInvoices();
            stream.on('data', invoice => {
                if (invoice.settled) {
                    const hash = invoice.rHash.toString('base64');
                    const amount = invoice.amtPaidSat;
                    // employeeDb.queryInvoice(hash)
                    this.emit(exports.NodeEvents.invoicePaid, { hash, amount, pubkey });
                }
            });
        });
    }
}
exports.default = new NodeManager();
