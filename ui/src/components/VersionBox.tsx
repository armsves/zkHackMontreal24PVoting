import styled from "styled-components";
import packageJSON from "../../package.json" assert { type: "json" };
import Image from "next/image";

const StyledWrapper = styled.div`
  padding: 10px;
  font-weight: 500;
  font-size: 14px;
  text-align: center;
  display: flex;
  justify-content: space-around;
`;

export const VersionBox = () => {
  return <StyledWrapper>
    <Image src="/imgs/o1labs.png" alt="o1 Labs" width={100} height={100} />
    <Image src="/imgs/zkhack.png" alt="zkHack" width={100} height={100} />
    <Image src="/imgs/zkhackmontreal.jpg" alt="zkHack Montreal" width={100} height={100} />
    <Image src="/imgs/mina.png" alt="Mina" width={100} height={100} />
  </StyledWrapper>;
};
