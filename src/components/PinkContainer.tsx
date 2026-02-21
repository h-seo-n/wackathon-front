import type { ThemeProps } from "@/assets/theme";
import styled from "styled-components";

export const PinkContainer = styled.div<{ theme: ThemeProps }>`
  background-color: ${(props) => props.theme.colors.background};
  display: flex;
  width: 100vw;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;
