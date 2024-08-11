'use client';

import { GithubCorner } from "@/components/GithubCorner";
import { BaseActionBox } from "@/components/HomeComponents/BasicActionBox.tsx";
import { CreateNullifierBox } from "@/components/HomeComponents/CreateNullifierBox";
import { MinaSendBox } from "@/components/HomeComponents/SendBox.tsx";
import { SignFieldsBox } from "@/components/HomeComponents/SignFieldsBox.tsx";
import { SignMessageBox } from "@/components/HomeComponents/SignMessageBox.tsx";
import { SignTransactionBox } from "@/components/HomeComponents/SignTransactionBox";
import { SignTypeMessageBox } from "@/components/HomeComponents/SignTypeMessageBox";
import { StakingBox } from "@/components/HomeComponents/StakingBox.tsx";
import { SwitchChainBox } from "@/components/HomeComponents/SwitchChainBox";
import { InfoRow, InfoType } from "@/components/InfoRow.tsx";
import { Box, StyledBoxTitle } from "@/styles/HomeStyles";

import {
  Container,
  PageContainer,
  StyledPageTitle,
  StyledRowSection,
  StyledRowTitle,
  StyledStatusRowWrapper,
} from "@/styles/HomeStyles.ts";
import { ChainInfoArgs, ProviderError } from "@aurowallet/mina-provider";
import Head from "next/head";
import { useCallback, useEffect, useMemo, useState } from "react";
import StyledComponentsRegistry from "./registry";
import { VersionBox } from "@/components/VersionBox";
import Image from 'next/image';
import { Button } from "@/components/Button";

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentVotes, setCurrentVotes] = useState(0);
  const [currentNetwork, setCurrentNetwork] = useState<ChainInfoArgs>({
    networkID: "",
  });

  const onSetCurrentAccount = useCallback((account: string) => {
    setCurrentAccount(account)
  }, [])

  const initNetwork = useCallback(async () => {
    const network: ChainInfoArgs = await (window as any)?.mina
      ?.requestNetwork()
      .catch((err: any) => err);
    console.log("initNetwork==0", JSON.stringify(network));
    console.log("initNetwork==1", (window as any)?.mina);
    setCurrentNetwork(network);
  }, []);

  useEffect(() => {
    /** account change listener */
    (window as any)?.mina?.on("accountsChanged", async (accounts: string[]) => {
      console.log("accountsChanged", accounts);
      if (accounts.length > 0) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log('disconnect');// handled disconnect here
      }
    });
    (window as any)?.mina?.on("chainChanged", async (chainInfo: ChainInfoArgs) => {
      console.log("chainChanged==", JSON.stringify(chainInfo));
      console.log("chainChanged");
      setCurrentNetwork(chainInfo);
    });
    initNetwork();
  }, []);

  const initAccount = useCallback(async () => {
    const data: string[] | ProviderError = await (window as any)?.mina
      ?.getAccounts()
      .catch((err: any) => err);
    if (Array.isArray(data) && data.length > 0) {
      setCurrentAccount(data[0]);
    }
  }, []);
  useEffect(() => {
    initAccount();
  }, []);

  return (
    <StyledComponentsRegistry>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        <PageContainer>
          <Head>
            <link rel="shortcut icon" href="/imgs/auro.png" />
            <title>pVoting zkApp</title>
            <meta
              name="robots"
              content="max-snippet:-1,max-image-preview:standard,max-video-preview:-1"
            />
            <meta
              name="description"
              content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
            />
            <meta
              property="og:image"
              content="%PUBLIC_URL%/imgs/og_priview.png"
              data-rh="true"
            />
            <meta property="og:locale" content="en_US" />
            <meta property="og:type" content="website" />
            <meta
              property="og:title"
              content="Auro Wallet - Mina Protocol Wallet"
              data-rh="true"
            />
            <meta
              property="og:description"
              content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
            />
            {/* <meta property="og:url" content="https://www.aurowallet.com/" /> */}
            <meta property="og:site_name" content="Auro Wallet" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta
              name="twitter:title"
              content="Auro Wallet - Mina Protocol Wallet"
              data-rh="true"
            />
            <meta
              name="twitter:description"
              content="Available as a browser extension and as a mobile app, Auro Wallet perfectly supports Mina Protocol. easily send, receive or stake your MINA anytime."
            />
            <meta
              name="twitter:image"
              content="%PUBLIC_URL%/imgs/og_priview.png"
              data-rh="true"
            />
          </Head>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem' }}>
            <Image src="/imgs/logo.jpg" alt="Auro Wallet" width={100} height={100} />
            <StyledPageTitle style={{ flex: 1, textAlign: 'center' }}>pVoting zkApp</StyledPageTitle>
            <div style={{ marginRight: '5px' }}>
              <Button onClick={() => { }}>{currentNetwork.networkID}</Button>
            </div>
            <BaseActionBox currentAccount={currentAccount} onSetCurrentAccount={onSetCurrentAccount} />
          </header>


          <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <Box>
              <div style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                {currentAccount ? (
                  <div style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center'  }}>
                    <h1>Vote here!</h1>
                    <Image src="/imgs/harold.jpg" alt="Harold" width={200} height={200} />
                    <Button onClick={() => { setCurrentVotes(currentVotes+1)}}>Vote for Harold</Button>
                    <h2>Current Votes: {currentVotes}</h2>
                  </div>
                ) : ( 
                  <h1>Please connect your wallet</h1>
                )}
              </div>
            </Box>
          </Container>
          {
            /*
  
  
          <Container>
            <SwitchChainBox network={currentNetwork} />
          </Container>
          <Container>
            <MinaSendBox />
            <StakingBox />
          </Container>
          <Container>
            <SignTransactionBox currentAccount={currentAccount} network={currentNetwork} />
          </Container>
          <Container>
            <CreateNullifierBox />
            <SignMessageBox currentAccount={currentAccount} />
            <SignTypeMessageBox
              currentAccount={currentAccount}
              network={currentNetwork}
            />
            <SignFieldsBox currentAccount={currentAccount} />
          </Container>
                    */
          }
        </PageContainer>
        <footer style={{ marginTop: 'auto', padding: '5px', textAlign: 'center' }}>
          <VersionBox />
        </footer>
      </div>
    </StyledComponentsRegistry>
  );
}
