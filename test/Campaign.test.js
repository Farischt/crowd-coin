import { readFile } from "fs/promises"
import assert from "assert"
import ganache from "ganache-cli"
import Web3 from "web3"

const compiledFactory = JSON.parse(
  await readFile(
    new URL("../ethereum/build/CampaignFactory.json", import.meta.url)
  )
)
const compiledCampaign = JSON.parse(
  await readFile(new URL("../ethereum/build/Campaign.json", import.meta.url))
)

const web3 = new Web3(ganache.provider())

const MINIMUM_CONTRIBUTION = "100" // 100 Wei
const NEW_REQUEST = {
  description: "Buy ETH",
  value: "2000",
}

let accounts, factory, campaignAddress, campaign

beforeEach(async () => {
  accounts = await web3.eth.getAccounts()
  factory = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({ data: compiledFactory.evm.bytecode.object })
    .send({ from: accounts[0], gas: "3000000" })

  await factory.methods.createCampaign(MINIMUM_CONTRIBUTION).send({
    from: accounts[0],
    gas: "3000000",
  })

  const addresses = await factory.methods.getDeployedCampaigns().call()
  campaignAddress = addresses[0]
  campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress)
})

describe("Campaigns", () => {
  it("Deploys a factory", () => {
    assert.ok(factory.options.address)
  })

  it("Deploys a campaign", () => {
    assert.ok(campaign.options.address)
  })

  it("Marks caller as the campaing owner", async () => {
    const owner = await campaign.methods.getOwner().call()
    assert.equal(accounts[0], owner)
  })

  it("Should donate and mark donater as contributor", async () => {
    await campaign.methods.contribute().send({
      from: accounts[1],
      value: "200",
    })
    const isContributor = await campaign.methods
      .isContributor(accounts[1])
      .call()
    assert.equal(true, isContributor)
  })

  it("Requires a minimum contribution", async () => {
    const error =
      "VM Exception while processing transaction: revert Please make sure to send at least the minimum contribution."
    await assert.rejects(
      async () => {
        await campaign.methods.contribute().send({
          value: MINIMUM_CONTRIBUTION,
          from: accounts[1],
        })
      },
      (err) => {
        assert.strictEqual(err.message, error)
        return true
      }
    )
  })

  it("Requires the owner to create a request", async () => {
    const error = "VM Exception while processing transaction: revert"
    await assert.rejects(
      async () => {
        await campaign.methods
          .createRequest(
            NEW_REQUEST.description,
            NEW_REQUEST.value,
            accounts[4]
          )
          .send({
            from: accounts[1],
            gas: "3000000",
          })
      },
      (err) => {
        assert.strictEqual(err.message, error)
        return true
      }
    )
  })

  it("Allows the owner to create a payment request", async () => {
    await campaign.methods
      .createRequest(NEW_REQUEST.description, NEW_REQUEST.value, accounts[4])
      .send({
        from: accounts[0],
        gas: "3000000",
      })

    const request = await campaign.methods.requests(0).call()
    assert.equal(NEW_REQUEST.description, request.description)
  })

  it("Process a full request", async () => {
    const recipientAddress = accounts[8]
    const recipientInitialBalance = await web3.eth.getBalance(recipientAddress)
    const initial = parseFloat(
      web3.utils.fromWei(recipientInitialBalance, "ether")
    )
    const moneyToSend = web3.utils.toWei("10", "ether")
    const sentMoney = parseFloat(web3.utils.fromWei(moneyToSend, "ether"))

    await campaign.methods.contribute().send({
      from: accounts[1],
      value: moneyToSend,
    })
    await campaign.methods
      .createRequest(NEW_REQUEST.description, moneyToSend, recipientAddress)
      .send({
        from: accounts[0],
        gas: "3000000",
      })
    await campaign.methods.approveRequest(0).send({
      from: accounts[1],
      gas: "3000000",
    })
    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "3000000",
    })

    const recipientFinalBalance = await web3.eth.getBalance(recipientAddress)
    const final = parseFloat(web3.utils.fromWei(recipientFinalBalance, "ether"))
    const difference = final - initial

    assert.equal(sentMoney, difference)
  })
})
