import styled from "styled-components";
import { Explanation, Title } from "@/components/Text";
import type { ThemeProps } from "@/assets/theme";

const Container = styled.div`
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  gap: 16px;
  width: 100%;
`;

const CirclesWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Circle = styled.img<{ color: string; $zIndex?: number; theme: ThemeProps }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  z-index: ${(props) => props.$zIndex ?? 0};
  box-shadow: ${(props) => props.theme.shadow};

  &:last-child {
    margin-left: -16px;
  }
`;

const TextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

interface MeetingBannerProp {
  title: string;
  explanation: string | null;
}

const MeetingBanner = ({ title, explanation }: MeetingBannerProp) => {
  return (
    <Container>
      <CirclesWrapper>
        <Circle color="#F2DCA0" $zIndex={1} />
        <Circle color="#EC4899" />
      </CirclesWrapper>
      <TextGroup>
        <Title style={{ padding: 0, margin: 0 }}>{title}</Title>
        {explanation && <Explanation>{explanation}</Explanation>}
      </TextGroup>
    </Container>
  );
};

export default MeetingBanner;
