const HDWalletProvider = require("@truffle/hdwallet-provider")
const Web3 = require("web3")
const compiledFactory = require("./build/CampaignFactory.json")
const { MNEMONIC, RINKEBY_URL } = require("./env")

const provider = new HDWalletProvider(MNEMONIC, RINKEBY_URL)

const web3 = new Web3(provider)

const deploy = async () => {
  const accounts = await web3.eth.getAccounts()
  console.log(`Trying to deploy from account: ${accounts[0]}`)
  const result = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({
      data: compiledFactory.evm.bytecode.object,
    })
    //@ts-ignore
    .send({ from: accounts[0], gas: "3000000" })
  console.log("Contract deployed to: " + result.options.address)
  provider.engine.stop()
}

deploy()
