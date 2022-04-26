import createLnRpc, { LnRpc } from '@radar/lnrpc';
import env from './env';
import {NodeEvents} from "./node-manager";
import fundingTransaction, {FundingTransaction} from "./funding-transaction-service";
import wagerService, {WagerService} from "./wager-service";
import axios from "axios";
import {Server} from "socket.io";



const io = new Server(4000, {
  cors: {
    origin: '*',
  }
})


export let node: LnRpc;

export async function initNode() {
  node = await createLnRpc({
    server: env.LND_GRPC_URL,
    cert: new Buffer(env.LND_TLS_CERT, 'base64').toString('ascii'),
    macaroon: new Buffer(env.LND_MACAROON, 'base64').toString('hex'),
  });

  let emitSocketEvent: any;

  io.on('connection', (socket:any) => {
    console.log('A user connected');
    emitSocketEvent = socket;
  });

    const stream = node.subscribeInvoices();
    stream.on('data', invoice => {
      if (invoice.settled) {
        const hash = (invoice.rHash as Buffer).toString('base64');
        const amount = invoice.amtPaidSat;
        let fundingTransactionByHash = fundingTransaction.getFundingTransactionByHash(hash);
        if (fundingTransactionByHash && !fundingTransactionByHash.isPaid){
          console.log('Invoice Has Been Paid......');
          fundingTransactionByHash.isPaid = true
          let wagerById = wagerService.getWagerById(fundingTransactionByHash.wagerId);
          if(wagerById){
            const walletBalance = wagerById.walletBalance + parseInt(String(amount))
            wagerService.updateWager(wagerById.id, wagerById.name, wagerById.email, walletBalance)
            fundingTransaction.updateFundingTransactionPaid(wagerById.id)
            if (wagerById){
              let data = {paid: true, amount: amount, fundingTransactionId: fundingTransactionByHash.id, isCompleted: fundingTransactionByHash.isCompleted}
              console.log('Emitting Socket......', data);
              emitSocketEvent.emit("paymentInfo", JSON.stringify(data));
            }
          }
        }
      }
    });


}

