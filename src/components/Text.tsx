import type { ThemeProps } from "@/assets/theme";
import styled from "styled-components";

export const Title = styled.span<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.large};
    color: ${(props) => props.theme.colors.black};
    font-weight: ${(props) => props.theme.fontWeights.medium};
`;
export const Explanation = styled.span<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.small};
    color: #4A5565;
    font-weight: ${(props) => props.theme.fontWeights.regular};
`;
export const InputLabel = styled.span<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.smaller};
    color: #364153;
    font-weight: ${(props) => props.theme.fontWeights.medium};
`;
