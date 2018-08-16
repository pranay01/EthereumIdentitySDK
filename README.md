[![Build Status](https://travis-ci.com/EthWorks/EthereumIdentitySDK.svg?branch=master)](https://travis-ci.com/EthWorks/EthereumIdentitySDK)

# Ethereum IdentitySDK

Ethereum Identity SDK is composed of smart contracts and js lib and relayer that help build applications using ERC [#725](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-725.md), [#725](https://github.com/ethereum/EIPs/issues/735), [#1077](https://github.com/ethereum/EIPs/pull/1077) and [#1078](https://github.com/ethereum/EIPs/pull/1078).

This is work in progress. Planned functionality for first release include:
- creating and managing identities
- multi factor authentication via multisignature
- univeral login
- ether less transactions via relayer

## Example usage

To create new identity:
```js
const sdk = new EthereumIdentitySDK();
const (privateKey, identity) = await sdk.create('alex.ethereum.eth');
```

To use existing identity:
```js
const sdk = new EthereumIdentitySDK();
const identity = await sdk.at('alex.ethereum.eth');
```

To add a key to identity:
```js
await identity.addKey(newKey, privateKey);
```

To execute transaction:
```js
const transaction = {
  to: "0x88a5C2c290d9919e46F883EB62F7b8Dd9d0CC45b",
  data: "0x",
  value: ethers.utils.parseEther("1.0"),
};
const transactionId = await identity.execute(transaction, privateKey);
```

To confirm transaction
```js
await identity.confirm(transactionId)
```