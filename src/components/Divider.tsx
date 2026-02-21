import styled from "styled-components";
import type { ThemeProps } from "@/assets/theme";

const DividerContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
`;

const Line = styled.div<{ theme: ThemeProps }>`
  flex: 1;
  height: 1px;
  background-color: ${(props) => props.theme.colors.gray ?? "#E5E7EB"};
`;

const DividerText = styled.span<{ theme: ThemeProps }>`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: #9CA3AF;
  font-weight: ${(props) => props.theme.fontWeights.regular};
  white-space: nowrap;
`;

const Divider = ({ text = "또는" }: { text?: string }) => {
  return (
    <DividerContainer>
      <Line />
      <DividerText>{text}</DividerText>
      <Line />
    </DividerContainer>
  );
};

export default Divider;
