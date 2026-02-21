import type { ThemeProps } from "@/assets/theme";
import styled from "styled-components";

const Wrapper = styled.div<{ theme: ThemeProps }>`
    background-color: #ffffff;
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 40px 32px;
    width: 100%;
    max-width: 400px;
    box-shadow: ${(props) => props.theme.shadow};
`;

export default Wrapper;
