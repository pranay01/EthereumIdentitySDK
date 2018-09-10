import ethers, {utils, Interface} from 'ethers';
import {waitForContractDeploy, messageSignature} from './utils';
import Identity from '../abi/Identity';
import ENS from '../abi/ENS';
import PublicResolver from '../abi/PublicResolver';

const {namehash} = utils;

const MANAGEMENT_KEY = 1;
const ACTION_KEY = 2;
const ECDSA_TYPE = 1;

const headers = {'Content-Type': 'application/json; charset=utf-8'};

class EthereumIdentitySDK {
  constructor(relayerUrl, provider) {
    this.provider = provider;
    this.relayerUrl = relayerUrl;
  }

  async create(ensName) {
    const privateKey = this.generatePrivateKey();
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const managementKey = wallet.address;
    const url = `${this.relayerUrl}/identity`;
    const method = 'POST';
    const body = JSON.stringify({managementKey, ensName});
    // eslint-disable-next-line no-undef
    const response = await fetch(url, {headers, method, body});
    const responseJson = await response.json();
    if (response.status === 201) {
      const contract = await waitForContractDeploy(this.provider, Identity, responseJson.transaction.hash);
      return [privateKey, contract.address];
    }
    throw new Error(`${response.status}`);
  }

  addKey() {
    throw new Error('not yet implemented');
  }

  removeKey() {
    throw new Error('not yet implemented');
  }

  generatePrivateKey() {
    return ethers.Wallet.createRandom().privateKey;
  }

  async getRelayerConfig() {
    const url = `${this.relayerUrl}/config`;
    const method = 'GET';
    // eslint-disable-next-line no-undef
    const response = await fetch(url, {headers, method});
    const responseJson = await response.json();
    if (response.status === 200) {
      return responseJson;
    }
    throw new Error(`${response.status}`);
  }

  async execute(contractAddress, message, privateKey) {
    const url = `${this.relayerUrl}/identity/execution`;
    const method = 'POST';
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const signature = messageSignature(wallet, message.to, message.value, message.data);
    const body = JSON.stringify({...message, contractAddress, signature});
    // eslint-disable-next-line no-undef
    const response = await fetch(url, {headers, method, body});
    const responseJson = await response.json();
    if (response.status === 201) {
      const receipt = await this.provider.getTransactionReceipt(responseJson.transaction.hash);
      return this.getExecutionNonce(receipt.logs);
    }
    throw new Error(`${response.status}`);
  }

  getExecutionNonce(emittedEvents) {
    const [eventTopic] = new Interface(Identity.interface).events.ExecutionRequested.topics;
    for (const event of emittedEvents) {
      if (event.topics[0] === eventTopic) {
        return utils.bigNumberify(event.topics[1]);
      }
    }
    throw 'Event ExecutionRequested not emitted';
  }

  async identityExist(identity) {
    const identityAddress = await this.getAddress(identity);
    if (identityAddress && (Identity.runtimeBytecode.slice(0, 14666) === (await this.getCode(identityAddress)).slice(2, 14668))) {
      return identityAddress;
    }
    return false;
  }

  async getAddress(identity) {
    const node = namehash(identity);
    const {ensAddress} = (await this.getRelayerConfig()).config;
    this.ensContract = new ethers.Contract(ensAddress, ENS.interface, this.provider);
    const resolverAddress = await this.ensContract.resolver(node);
    if (resolverAddress != 0) {
      this.resolverContract = new ethers.Contract(resolverAddress, PublicResolver.interface, this.provider);
      return await this.resolverContract.addr(node);
    }
    return false;
  }

  async getCode(address) {
    return await this.provider.getCode(address);
  }
}

export default EthereumIdentitySDK;
export {MANAGEMENT_KEY, ACTION_KEY, ECDSA_TYPE};
