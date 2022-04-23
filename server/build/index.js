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
const express_1 = __importDefault(require("express"));
const env_1 = __importDefault(require("./env"));
const node_1 = require("./node");
const node_db_1 = __importDefault(require("./node-db"));
const node_manager_1 = __importDefault(require("./node-manager"));
// Configure server
const app = express_1.default();
// Routes
app.get('/api/info', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const info = yield node_1.node.getInfo();
        const { balance } = yield node_1.node.channelBalance();
        res.send({ info, balance });
        next();
    }
    catch (err) {
        next(err);
    }
}));
app.get('/api/node/:publicKey', (req, res) => {
    let nodeByPubkey = node_db_1.default.getNodeByPubkey(req.params.publicKey);
    res.json({ data: nodeByPubkey });
});
app.post('/api/nodes', (req, res) => {
    const { host, cert, macaroon } = req.body;
    if (!host || !cert || !macaroon) {
        throw new Error('Fields host, cert and macaroon are required to make a employee');
    }
    res.json({ "host": host, "cert": cert, "macaroon": macaroon });
});
app.post('/api/node', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { host, cert, macaroon } = req.body;
        if (!host || !cert || !macaroon) {
            throw new Error('Fields host, cert and macaroon are required to register a node');
        }
        const { token, publicKey, balance } = yield node_manager_1.default.connect(host, cert, macaroon);
        const lndNode = {
            token: token,
            host: host,
            cert: cert,
            macaroon: macaroon,
            pubkey: publicKey,
            channelBalance: balance
        };
        node_db_1.default.addNode(lndNode);
        res.json({
            data: {
                lndNode
            },
        });
    }
    catch (err) {
        // next(err);
        res.status(500).json({ error: err.stack });
    }
}));
// Initialize node & server
console.log('Initializing Lightning node...');
node_1.initNode().then(() => {
    console.log('Lightning node initialized!');
    console.log('Starting server...');
    app.listen(env_1.default.PORT, () => {
        console.log(`Server started at http://localhost:${env_1.default.PORT}!`);
    });
});
