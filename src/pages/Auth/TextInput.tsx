import type { ThemeProps } from "@/assets/theme";
import styled from "styled-components";

const TextInput = styled.input<{ theme: ThemeProps }>`
    border: 0.71px solid #D1D5DC;
    padding: 10px 20px;
    font-size: ${(props) => props.theme.fontSizes.small};
    border-radius: 10px;
`

export default TextInput;