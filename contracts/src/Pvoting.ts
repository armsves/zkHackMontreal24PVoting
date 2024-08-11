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
import { isNull } from 'underscore';
  //import { expectState, testLocal, transaction } from '../test/test-contract.js';
  
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
      /*
    // retrieve totalScore, returning an Option
    let totalScoreOption = await offchainState.fields.candidates.get(candidate);

    // unwrap the Option and return a default value if the entry if empty
    let totalScore = totalScoreOption.orElse(0n);
*/
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
  
      //let voterOption = await offchainState.fields.voters.get(voter);
      //console.log('voterOption', voterOption);
      /*
      const condition = Bool(true);
      const result = Provable.if(condition, Field(1), Field(2)); // returns Field(1)
*/
      /*
        offchainState.fields.voters.update(voter, {
          from: undefined,
          to: voter,
        });
*/

      /**
       * Update both accounts atomically.
       *  
       * This is safe, because both updates will only be accepted if both previous balances are still correct.
       */
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

/*
console.time('settle 1');
transaction = await Mina.transaction(
  { sender, fee: transactionFee },
  async () => {
    //AccountUpdate.fundNewAccount(sender);
    await contract.settle(proof);
  }
);
transaction.sign([senderKey, contractKey]);
console.log('Sending the settle transaction.');
await transaction.prove();
pendingTx = await transaction.send();
if (pendingTx.status === 'pending') {

  console.log(`Success! Deploy transaction sent.
Your smart contract will be deployed
as soon as the transaction is included in a block.
Txn hash: ${pendingTx.hash}`);
}
console.log('Waiting for settle transaction inclusion in a block.');
await pendingTx.wait({ maxAttempts: 190 });
*/

console.time('settle 1');
await Mina.transaction({ sender, fee: transactionFee }, () => contract.settle(proof))
  .sign([senderKey])
  .prove()
  .send();
console.timeEnd('settle 1');

console.log('candidate current votes', (await offchainState.fields.candidates.get(candidate)).value.toString());


// // this settles the offchain state
// let proof = await offchainState.createSettlementProof();

// await Mina.transaction(sender, async () => {
//   // settle all outstanding state changes
//   contract.settle(proof);
// })
//   .sign([senderKey])
//   .prove()
//   .send();

  // await testLocal(
  //   Pvoting,
  //   { proofsEnabled: true, offchainState },
  //   ({ accounts: { sender, receiver, other }, contract, Local }) => [
  //     // create first account
  //     transaction('create account', async () => {
  //       // first call (should succeed)
  //       await contract.createAccount(sender, UInt64.from(1000));
  
  //       // second call (should fail)
  //       await contract.createAccount(sender, UInt64.from(2000));
  //     }),
  
  //     // settle
  //     async () => {
  //       console.time('settlement proof 1');
  //       let proof = await offchainState.createSettlementProof();
  //       console.timeEnd('settlement proof 1');
  
  //       return transaction('settle 1', () => contract.settle(proof));
  //     },
  
  //     // check balance and supply
  //     expectState(offchainState.fields.totalSupply, 1000n),
  //     expectState(offchainState.fields.accounts, [sender, 1000n]),
  //     expectState(offchainState.fields.accounts, [receiver, undefined]),
  
  //     // transfer (should succeed)
  //     transaction('transfer', () =>
  //       contract.transfer(sender, receiver, UInt64.from(100))
  //     ),
  
  //     // we run some calls without proofs to save time
  //     () => Local.setProofsEnabled(false),
  
  //     // more transfers that should fail
  //     transaction('more transfers', async () => {
  //       // (these are enough to need two proof steps during settlement)
  //       await contract.transfer(sender, receiver, UInt64.from(200));
  //       await contract.transfer(sender, receiver, UInt64.from(300));
  //       await contract.transfer(sender, receiver, UInt64.from(400));
  
  //       // create another account (should succeed)
  //       await contract.createAccount(other, UInt64.from(555));
  
  //       // create existing account again (should fail)
  //       await contract.createAccount(receiver, UInt64.from(333));
  //     }),
  
  //     // settle
  //     async () => {
  //       Local.resetProofsEnabled();
  //       console.time('settlement proof 2');
  //       let proof = await offchainState.createSettlementProof();
  //       console.timeEnd('settlement proof 2');
  
  //       return transaction('settle 2', () => contract.settle(proof));
  //     },
  
  //     // check balance and supply
  //     expectState(offchainState.fields.totalSupply, 1555n),
  //     expectState(offchainState.fields.accounts, [sender, 900n]),
  //     expectState(offchainState.fields.accounts, [receiver, 100n]),
  //   ]
  // );