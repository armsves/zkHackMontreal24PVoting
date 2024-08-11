import { config } from 'dotenv';
import {
    SmartContract,
    method,
    state,
    PublicKey,
    UInt64,
    Experimental,
    Mina,
    PrivateKey,
    AccountUpdate,
    Provable,
    Bool,
    Field
  } from 'o1js';

  const { OffchainState } = Experimental;
  
  const offchainState = OffchainState(
    {
      candidates: OffchainState.Map(PublicKey, UInt64),
      voters: OffchainState.Map(PublicKey, PublicKey),
    },
    { logTotalCapacity: 10, maxActionsPerProof: 5 }
  );
  
  class StateProof extends offchainState.Proof {}
  
  // example contract that interacts with offchain state
  
  export class Pvoting extends SmartContract {
    @state(OffchainState.Commitments) offchainState = offchainState.commitments();
  
    @method
    async register(candidate: PublicKey) {
      // setting `from` to `undefined` means that the account must not exist yet
      offchainState.fields.candidates.update(candidate, {
        from: undefined,
        to: UInt64.from(0),
      });
     //this.offchainState.getAndRequireEquals();
    }
  
    @method
    async vote(candidate: PublicKey, voter: PublicKey) {
      let fromOption = await offchainState.fields.candidates.get(candidate);
      //let fromBalance = fromOption.assertSome('sender account exists');
      let fromBalance = fromOption.orElse(0n);

      offchainState.fields.candidates.update(candidate, {
        from: fromOption,
        to: fromBalance.add(1),
      });
    }

  
    @method
    async settle(proof: StateProof) {
      await offchainState.settle(proof);
    }
  }
  
  // connect contract to offchain state
  offchainState.setContractClass(Pvoting);
  
  // test code below
  
  const Devnet = Mina.Network({
    mina: 'https://api.minascan.io/node/devnet/v1/graphql',
    archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
  });
  Mina.setActiveInstance(Devnet);
  config();
  let senderKey = PrivateKey.fromBase58(process.env.PRIVATE_KEY || '') //PrivateKey.random();
  let sender = senderKey.toPublicKey();
  let transactionFee = UInt64.from(100_000_000);

  let contractKey = PrivateKey.random();
  let contractAddress = contractKey.toPublicKey();

  let contract = new Pvoting(contractAddress);
offchainState.setContractInstance(contract);

console.log("Compiling")
// compile Offchain state program
await offchainState.compile();
// compile smart contract
await Pvoting.compile();
console.log("Compiled")

// zkApp deployment
console.log(`Deploying zkApp to ${contractAddress.toBase58()}`);
let transaction = await Mina.transaction(
  { sender, fee: transactionFee },
  async () => {
    AccountUpdate.fundNewAccount(sender);
    await contract.deploy();
  }
);
transaction.sign([senderKey, contractKey]);
console.log('Sending the transaction.');
let pendingTx = await transaction.send();
if (pendingTx.status === 'pending') {
  console.log(`Success! Deploy transaction sent.
Your smart contract will be deployed
as soon as the transaction is included in a block.
Txn hash: ${pendingTx.hash}`);
}
console.log('Waiting for transaction inclusion in a block.');
await pendingTx.wait({ maxAttempts: 190 });
console.log('');

let candidateKey = PrivateKey.random();
let candidate = candidateKey.toPublicKey();

// register
console.log(`Register candidate ${candidate.toBase58()}`);
 transaction = await Mina.transaction(
  { sender, fee: transactionFee },
  async () => {
    //AccountUpdate.fundNewAccount(sender);
    await contract.register(candidate);
  }
);
console.log('Candidate Registered');

transaction.sign([senderKey, contractKey]);
console.log('Sending the transaction.');

await transaction.prove();
pendingTx = await transaction.send();
if (pendingTx.status === 'pending') {

  console.log(`Success! Deploy transaction sent.
Your smart contract will be deployed
as soon as the transaction is included in a block.
Txn hash: ${pendingTx.hash}`);
}
console.log('Waiting for transaction inclusion in a block.');
await pendingTx.wait({ maxAttempts: 190 });

console.log('candidate initial votes', (await offchainState.fields.candidates.get(candidate)).value.toString());

let voterKey = PrivateKey.random();
let voter = voterKey.toPublicKey();

// voting
console.log(`Vote for candidate ${candidate.toBase58()}`);
 transaction = await Mina.transaction(
  { sender, fee: transactionFee },
  async () => {
    //AccountUpdate.fundNewAccount(sender);
    await contract.vote(candidate, voter);
  }
);
console.log('Vote Registered');

transaction.sign([senderKey, contractKey]);
console.log('Sending the transaction.');

await transaction.prove();
pendingTx = await transaction.send();
if (pendingTx.status === 'pending') {

  console.log(`Success! Deploy transaction sent.
Your smart contract will be deployed
as soon as the transaction is included in a block.
Txn hash: ${pendingTx.hash}`);
}
console.log('Waiting for transaction inclusion in a block.');
await pendingTx.wait({ maxAttempts: 190 });
console.log('pendingTx',pendingTx.status);
console.log('candidate current votes', (await offchainState.fields.candidates.get(candidate)).value.toString());

console.time('settlement proof 1');
let proof = await offchainState.createSettlementProof();
console.timeEnd('settlement proof 1');

console.time('settle 1');
await Mina.transaction({ sender, fee: transactionFee }, () => contract.settle(proof))
  .sign([senderKey])
  .prove()
  .send();
console.timeEnd('settle 1');

console.log('candidate current votes', (await offchainState.fields.candidates.get(candidate)).value.toString());
