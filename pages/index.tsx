import type { GetServerSideProps, NextPage } from "next"
import Head from "next/head"

import styles from "../styles/Home.module.css"
import factory from "../ethereum/factory"

type Props = {
  campaigns: string[]
}

const Home: NextPage<Props> = ({ campaigns }) => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-2xl">{campaigns[0]}</main>
    </div>
  )
}

export default Home

export const getServerSideProps: GetServerSideProps = async () => {
  const campaigns = await factory.methods.getDeployedCampaigns().call()

  return {
    props: {
      campaigns,
    },
  }
}
