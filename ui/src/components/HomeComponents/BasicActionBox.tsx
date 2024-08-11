import { Box, StyledBoxTitle } from "@/styles/HomeStyles";
import { Button } from "../Button";
import { InfoRow, InfoType } from "../InfoRow";
import { useCallback, useEffect, useState } from "react";
import { ProviderError } from "@aurowallet/mina-provider";

export const BaseActionBox = ({
  currentAccount,
  onSetCurrentAccount,
}: {
  currentAccount: string;
  onSetCurrentAccount: (account: string) => void;
}) => {
  const [accounts, setAccounts] = useState(currentAccount);
  const [accountsMsg, setAccountsMsg] = useState("");
  const [btnTxt, setBtnTxt] = useState("Connect Wallet");
  const [btnStatus, setBtnStatus] = useState(!currentAccount);
  const [noWindowAccount, setNoWindowAccount] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (currentAccount) {
      setBtnTxt(`${currentAccount.slice(0, 3)}...${currentAccount.slice(-4)}`);
      setIsConnected(true);
      setMenuVisible(false);
    } else {
      setBtnTxt("Connect Wallet");
      setIsConnected(false);
    }
    setAccounts(currentAccount);
  }, [currentAccount]);

  const onClickConnect = useCallback(async () => {
    if (isConnected) {
      setMenuVisible(!menuVisible);
    } else {
      const data: string[] | ProviderError = await (window as any)?.mina
        .requestAccounts()
        .catch((err: any) => err);
      if ((data as ProviderError).message) {
        setAccountsMsg((data as ProviderError).message);
      } else {
        let account = (data as string[])[0];
        onSetCurrentAccount(account);
        setAccounts(account);
        setAccountsMsg("");
        setIsConnected(true);
        setMenuVisible(true);
      }
    }
  }, [isConnected, menuVisible, onSetCurrentAccount]);

  const onGetAccount = useCallback(async () => {
    let data = await (window as any)?.mina?.getAccounts();
    setNoWindowAccount(data);
    if (Array.isArray(data) && data.length > 0) {
      onSetCurrentAccount(data[0]);
    }
    setNoWindowAccount(data);
  }, [onSetCurrentAccount]);

  const handleDisconnectClick = () => {
    onSetCurrentAccount("");
    setIsConnected(false);
    setMenuVisible(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button onClick={onClickConnect}>
        {btnTxt}
      </Button>
      {menuVisible && isConnected && (
        <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 50 }}>
          <Button onClick={handleDisconnectClick}>Disconnect</Button>
        </div>
      )}
    </div>
  );
};
