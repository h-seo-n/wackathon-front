import styled from "styled-components";
import type { ThemeProps } from "../assets/theme";

const Button = styled.button<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.small};
    font-weight: ${(props) => props.theme.fontWeights.semiBold};
    border-radius: 10px;
    border: none;
    display: flex;
    flex-flow: row nowrap;
    width: 100%;
    align-items: center;
    justify-content: center;
    padding: 14px 0;
`;

export const PinkButton = styled(Button)`
    background-color: ${(props) => props.theme.colors.primary};
    color: #ffffff;
`
export const GrayButton = styled(Button)`
    background-color: ${(props) => props.theme.colors.gray};
    color: ${(props) => props.theme.colors.black};
`

export const TextButton = styled(Button)`
    background: none;
    color: ${(props) => props.theme.colors.primary};
`