const crypto = require('crypto');

class Block {
    constructor(index,data,prevHash){
        this.index = index;
        this.data = data;
        this.prevHash = prevHash;
        this.timeStamp = Date.now();
        this.hash = this.createHash();
        this.nonce = Math.round(Math.random() * 99999999);
    }
    createHash(){
        const str = JSON.stringify(this);
        const hash = crypto.createHash("SHA256");
        hash.update(str).end();
        return hash.digest("hex");
    }
}

class Transaction {
    constructor(sender,receiver,amount){
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
    }
    toString(){
        return JSON.stringify(this);
    }
}

class Chain {
    constructor(){
        this.blockChain = [this.genesisBlock()];
    }
    genesisBlock(){
        return new Block(1,new Transaction("From the chain","To the world",0),0);
    }

    latestBlock(){
        return this.blockChain[this.blockChain.length - 1];
    }

    mine(nonce){
        let solution = 1;
        console.log("Mining ...");

        while(true){
         const hash = crypto.createHash("MD5");
         hash.update((nonce + solution).toString()).end();

         const attempt = hash.digest("hex");
         if(attempt.substr(0,4) === "0000"){
             console.log(`Solved: ${solution}`);
             return solution;
         }
         solution += 1;
        }
    }

    addBlock(transaction,senderPublicKey,signature){
        const verify = crypto.createVerify("SHA256");
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey,signature);

        if(isValid){
            const newBlock = new Block(this.blockChain.length + 1,transaction,this.latestBlock().hash);
            this.mine(newBlock.nonce);
            this.blockChain.push(newBlock);
        }
    }
}

class Wallet {
    constructor(){
        const keyPair = crypto.generateKeyPairSync('rsa',{
            modulusLength: 2048,
            publicKeyEncoding: {type: 'spki', format: 'pem'},
            privateKeyEncoding: {type: 'pkcs8', format: 'pem'}
        });
        this.privateKey = keyPair.privateKey;
        this.publicKey = {key: keyPair.publicKey, balance: 0}
    }
    sendMoney(amount,receiverPublicKey,senderPrivateKey){
        if(this.publicKey.balance < amount){
            console.log("Insuficient balance!");
        }else{
        const transaction = new Transaction(this.publicKey.key,receiverPublicKey,amount);

        const sign = crypto.createSign("SHA256");
        sign.update(transaction.toString()).end();

        const signature = sign.sign(this.privateKey);
        cryptoCurrency.addBlock(transaction,this.publicKey.key,signature);
        receiverPublicKey.balance += amount;
        if(senderPrivateKey === this.privateKey && receiverPublicKey.key !== this.publicKey.key){
            this.publicKey.balance -= amount;
        }
    }
}
}

const cryptoCurrency = new Chain();

const satoshi = new Wallet();
const bob = new Wallet();
const alice = new Wallet();

satoshi.publicKey.balance = 500;

satoshi.sendMoney(500,bob.publicKey,satoshi.privateKey);
bob.sendMoney(200,alice.publicKey,bob.privateKey);
alice.sendMoney(150,satoshi.publicKey,alice.privateKey);

console.log(cryptoCurrency);
console.log("Satoshi's balance: " + satoshi.publicKey.balance);
console.log("Bob's balance: " + bob.publicKey.balance);
console.log("Alice's balance: " + alice.publicKey.balance);