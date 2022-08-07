import web3 from "./web3"
import CampaignFactory from "./build/CampaignFactory.json"
import { FACTORY_ADDRESS } from "./env"

const instance = new web3.eth.Contract(
  // @ts-ignore
  CampaignFactory.abi,
  FACTORY_ADDRESS
)

export default instance
