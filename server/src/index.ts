import express, {response} from 'express';
import env from './env';
import { node, initNode } from './node';
import nodeService, {LndNode} from './node-service';
import nodeManager from "./node-manager";
import wagerService, {WagerService} from "./wager-service";
import bodyParser from 'body-parser';
import {SendRequest} from "@radar/lnrpc";
import cors from "cors";
import fundingTransaction, {FundingTransaction} from "./funding-transaction-service";
import {TextEncoder} from "util";
import base64 from "base64-js";
import {sha256} from "js-sha256";
import Long from "long";
import axios from "axios";
import * as fs from "fs";
import * as crypto from "crypto";




// Configure server
const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));




// Routes
app.get('/api/info', async (req, res, next) => {
  try {
    const info = await node.getInfo();
    const { balance } = await node.channelBalance();
    res.send({info, balance});
    next();
  } catch(err) {
    next(err);
  }
});

app.get('/api/wager', (req, res) => {
  res.json({ data: wagerService.getAllWagers() });
});

app.get('/api/wager/:id', (req, res) => {
  const wagerById = wagerService.getWagerById(parseInt(req.params.id));
  if (wagerById) {
    res.json({ data: wagerById });
  } else {
    res.status(404).json({ error: `No Wager found with ID ${req.params.id}`});
  }
});

app.post('/api/wager', async (req, res, next) => {
  try {
      const { name, email } = req.body;
      if (!name || !email) {
        throw new Error('Fields name and email are required to make a wager');
      }
      wagerService.createWager(name, email)
    res.sendStatus(201);
  } catch(err) {
    next(err);
  }
});

app.put('/api/wager', async (req, res, next) => {
  try {
      //Todo this method should be replaced with debit and crredit API
      const { id, name, email, walletBalance } = req.body;
      let wager = wagerService.getWagerById(id);
      if(wager){
          let wagerResponse = wagerService.updateWager(wager.id, name, email, walletBalance);
          res.json({ data: wagerResponse });
      }else {
          res.send(404)
      }

  } catch(err) {
    next(err);
  }
});


app.get('/api/node/:wagerId', (req, res) => {
    const wagerIdInt = parseInt(req.params.wagerId)
    let wager = nodeService.getNodeByWager(wagerIdInt);
    res.json({ data: wager });
});


app.post('/api/wage/:wagerId/node', async (req, res, next) => {
  try {
      const wagerId = parseInt(req.params.wagerId)
      const wagerDetail = wagerService.getWagerById(wagerId);
      if(wagerDetail){
          const { host, cert, macaroon } = req.body;

          if (!host || !cert || !macaroon) {
              throw new Error('Fields host, cert and macaroon are required to register a node');
          }

          const { token, publicKey, balance } = await nodeManager.connect(host, cert, macaroon);
          const lndNode = <LndNode> {
              token: token,
              host: host,
              cert: cert,
              macaroon: macaroon,
              pubkey: publicKey,
              channelBalance: balance,
              wagerId: wagerId
          }
          nodeService.addNode(lndNode)
          res.json({
              data: {
                  lndNode
              },
          });
      } else {
          res.status(404).json({ error: `No Wager found with ID ${req.params.id}`});
      }

  } catch(err) {
    // next(err);
    res.status(500).json({ error: err.stack});
  }
});


app.get('/api/wager/:wagerId/invoice/:amount', async (req, res, next) => {
    try{
        const wagerId = parseInt(req.params.wagerId)
        const amount = parseInt(req.params.amount)
        // find the Wager
        const wager = wagerService.getWagerById(wagerId);
        if (!wager) throw new Error('Wager not found');
        if (wager) {

            // find the node that made this Wager
            const node = nodeService.getNodeByWager(wager.id);
            if (!node) throw new Error('Node not found for this Wager');

            // create an invoice on the Wager's node
            const rpc = nodeManager.getRpc(node.token);
            const inv = await rpc.addInvoice({ value: amount.toString() });
            res.send({
                payreq: inv.paymentRequest,
                hash: (inv.rHash as Buffer).toString('base64'),
                amount,
            });
        } else {
            res.status(404).json({ error: `No Wager found with ID ${req.params.id}`});
        }
    } catch(err) {
        next(err);
    }
});


app.post("/api/wager/:wagerId/pay-invoice", async function (req, res, next) {
    try{
        const wagerId = parseInt(req.params.wagerId);
        const { payment_request } = req.body;

        // validate that a invoice paymentHash was provided
        if (!payment_request) throw new Error('payment_request is required');
        // find the Wager
        const wagerIdDetail = wagerService.getWagerById(wagerId)
        if (!wagerIdDetail) throw new Error('Wager not found');

        let request = <SendRequest> {
            paymentRequest: payment_request
        }
        node.sendPaymentSync(request);
        res.send(wagerIdDetail);
    } catch(err) {
        next(err);
    }

});


app.post("/api/wager/:wagerId/check-invoice", async function (req, res, next) {
    try{
        const { wagerId } = req.params;
        const { hash } = req.body;

        // validate that a invoice hash was provided
        if (!hash) throw new Error('hash is required');
        // find the Wager
        const wager = wagerService.getWagerById(parseInt(wagerId));
        if (!wager) throw new Error('Wager not found');
        // find the node that made this Wager
        const node = nodeService.getNodeByWager(wager.id);
        if (!node) throw new Error('Node not found for this Wager');

        const rpc = nodeManager.getRpc(node.token);
        const rHash = Buffer.from(hash, 'base64');
        const { settled } = await rpc.lookupInvoice({ rHash });
        if (!settled) {
            throw new Error('The payment has not been paid yet!');
        }
        res.send(settled);
    } catch(err) {
        next(err);
    }

});

app.get('/api/:wagerId/wallet-funding', (req, res) => {
    const wagerId = parseInt(req.params.wagerId)
    let fundingTrans = fundingTransaction.getFundingTransactionByWagerId(wagerId);
    res.json({ data: fundingTrans });
});

app.get('/api/wallet-funding/:transactionId', (req, res) => {
    const transactionId = parseInt(req.params.transactionId)
    let fundingTrans = fundingTransaction.getFundingTransactionById(transactionId);
    res.json({ data: fundingTrans });
});


app.post("/api/wager/:wagerId/fund-wallet", async function (req, res, next) {
    try{
        const  wagerId = parseInt(req.params.wagerId);
        const { amount, amountToWin } = req.body;

        // validate that a invoice hash was provided
        if (!amount) throw new Error('amount is required');
        if (!amountToWin) throw new Error('amountToWin is required');
        let wager = wagerService.getWagerById(wagerId);
        if (!wager) throw new Error('Wager not found');
        const {paymentRequest, rHash} = await node.addInvoice({value: amount, memo: 'BetJay invoice', expiry: '180'});
        const strHash = (rHash as Buffer).toString('base64')
        if(paymentRequest && strHash){
            console.log(">>> ", paymentRequest)
            const fundingTrans = <FundingTransaction> {
                amount: amount,
                amountToWin: amountToWin,
                hash: strHash,
                wagerId: wagerId,
                isPaid: false
            }
            fundingTransaction.addFundingTransaction(fundingTrans)
        }
        res.send({
            payreq: paymentRequest,
            hash: (rHash as Buffer).toString('base64'),
            amount,
        });
    } catch(err) {
        next(err);
    }
});

app.get('/api/fund-wallet/query', async (req, res, next) => {
    try{
        let {hash} = req.body;
        const rHash = Buffer.from(hash, 'base64');
        const {settled} = await node.lookupInvoice({rHash});
        if (!settled) {
            throw new Error('The payment has not been paid yet!');
        }
        res.send({
            ispaid: settled,
        });

    } catch(err) {
        next(err);
    }
});

app.get('/api/keysend', async (req, res, next) => {
    try{
        // let {hash} = req.body;



//KEYSEND WITH REST
        const macaroon = fs.readFileSync('/Users/omoniyiilesanmi/.polar/networks/1/volumes/lnd/dave/data/chain/bitcoin/regtest/admin.macaroon').toString('hex');

        const preImage = crypto.randomBytes(32).toString("hex");

        let preImageB64 =  Buffer.from(preImage, "hex").toString('base64');

        const pubKey = "02a0c076d510f0d22f1aee8c0a01e0eed2f80c5bcf99bcb68c3f2dddcd9b454ba0"
        let pubKeyB64 =  Buffer.from(pubKey, "hex").toString('base64');

        let paymentHashHexDump =  Buffer.from(preImage, "hex");
        var hash = sha256.create();
        hash.update(paymentHashHexDump);
        let paymentHashB64 = Buffer.from(hash.hex(), 'hex').toString('base64')
        console.log(">>>>>3", paymentHashB64)

        await axios.post('https://localhost:8085/v1/channels/transactions',
            {
                dest: pubKeyB64,
                amt: "100",
                payment_hash: paymentHashB64,
                dest_custom_records: {"5482373484": preImageB64}
            }, {
            headers: {
                'Grpc-Metadata-macaroon': macaroon
            }
        }).then(paymentresponse => {
            console.log("????????", paymentresponse)
        }).catch((err) => {
            console.log("-----------", err)
        });

        console.log("=======================================")
        res.send({
            payreq: "hey",
            // hash: (inv.rHash as Buffer).toString('base64'),
        });

    } catch(err) {
        console.log(">>>>>>>>>>>>>>>>>>>3")
        next(err);
    }
});

app.get('/api/funding-transactions', (req, res) => {
    res.json({ data: fundingTransaction.getAllFundingTransactions() });
});


// Initialize node & server
console.log('Initializing Lightning node...');
initNode().then(() => {
  console.log('Lightning node initialized!');
  console.log('Starting server...');
  wagerService.createWager("Ilesanmi Omoniyi", "omoniyi24@gmail.com")
    app.listen(env.PORT, () => {
    console.log(`Server started at http://localhost:${env.PORT}!`);
  });
});
