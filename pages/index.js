import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Web3Modal from "web3modal"
import { providers, Contract } from 'ethers'
import { useEffect, useRef, useState } from "react"
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants"

export default function Home() {
  //walletConnected, returns bool value showin if wallect is connected
  const [walletConnected, setWalletConnected] = useState(false);

  //joinedWhitelist, returns bool value showing if address is whitelisted
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);

  //loading, set to true when a trasanction is being mined
  const [loading, setLoading] = useState(false);

  //numberOfWhitelisted, tracks the number of whitelisted addresses
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);

  //reference for web3modal, used for connecting to metamask
  const web3ModalRef = useRef();

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */


  const getProviderOrSigner = async (needSigner = false) => {
    //Connect to metamask 
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    //check if user is connected to the right network(Rinkeby)
    const { chainId } = await web3Provider.getNetwork();

    if (chainId !== 4){
      window.alert("Please change to Rinkeby Network");
      throw new error("Wrong network!");
    }

    if (needSigner){
      const signer = await web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  /**
   * Add current address to the whitelist
   */

  const addAddressToWhitelist = async () => {
    try {
      
      //get the signer, set to true because we are writing to the blockchain
      const signer = await getProviderOrSigner(true);

      //create an instance of the Contract with a signer to make updates
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );

      //call contract function addToWhitelist to add new addresses to whitelist
      const tx = await whitelistContract.addToWhitelist();
      setLoading(true);

      //wait for the transaction to get mined
      await tx.wait();
      setLoading(false);

      //get updated number of addressed that have been whitelisted
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);

    } catch (error) {
      console.log(error);
      console.log(abi, typeof(abi));
    }
  };

  /**
   * getting the number of whitelisted addresses
   */

  const getNumberOfWhitelisted = async () => {
    try {
      //get the provider, set to false as we are only reading from the blockchain
      const provider = await getProviderOrSigner();

      //create an instance of the Contract with a provider as we noly want to read
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const _numberOfWhitelistedAddresses = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelistedAddresses);    

    } catch (error) {
      console.log(error);
    }
    
  };

  /**
   * checks if the address is already part of the whitelist
   */

  const checkIfAddressInWhitelist = async () => {
    try {
        //get the signer, set to true as we are writing to the blockchain
        const signer = await getProviderOrSigner(true);

        //create an instance of the Contract with a signer to make updates
        const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
        );
        
        //get the address of the signer
        const address = signer.getAddress();

        //call the whitelistedAddress from the contract
        const _joinedWhitelist = await whitelistContract.whitelistedAddress(address);
        setJoinedWhitelist(_joinedWhitelist);
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * connectWallet: connect the metamask wallet
   */

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet

      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (error) {
      console.log(error);
    }
  };

  /*
    renderButton: Returns a button based on the state of the dapp
  */

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return(
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return(
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      } 
    } else {
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect your Wallet!
        </button>
      )
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    //if wallet not connect, create new instance of web3Modal(metamask) and connect
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open

      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
    }
  }, [walletConnected])

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );


}
