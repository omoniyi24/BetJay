import express from 'express';
import env from './env';
import { node, initNode } from './node';
import nodeService, {LndNode} from './node-service';
import nodeManager from "./node-manager";
import wagerService, {Wager} from "./wager-service";
import bodyParser from 'body-parser';
import {SendRequest} from "@radar/lnrpc/types/lnrpc";



// Configure server
const app = express();
app.use(bodyParser.json());




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
      const wager = <Wager> {
        name: name,
        email: email
      }
      wagerService.addWager(wager);
    res.sendStatus(201);
  } catch(err) {
    next(err);
  }
});


app.get('/api/node/:wagerId', (req, res) => {
    const wagerIdInt = parseInt(req.params.wagerId)
    let nodeByPubkey = nodeService.getNodeByWager(wagerIdInt);
    res.json({ data: nodeByPubkey });
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


app.get('/api/wager/:wagerId/invoice', async (req, res, next) => {
    try{
        const wagerId = parseInt(req.params.wagerId)
        // find the Wager
        const wager = wagerService.getWagerById(wagerId);
        if (!wager) throw new Error('Wager not found');
        if (wager) {

            // find the node that made this Wager
            const node = nodeService.getNodeByWager(wager.id);
            if (!node) throw new Error('Node not found for this Wager');

            // create an invoice on the Wager's node
            const rpc = nodeManager.getRpc(node.token);
            const amount = 5;
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


// Initialize node & server
console.log('Initializing Lightning node...');
initNode().then(() => {
  console.log('Lightning node initialized!');
  console.log('Starting server...');
  app.listen(env.PORT, () => {
    console.log(`Server started at http://localhost:${env.PORT}!`);
  });
});