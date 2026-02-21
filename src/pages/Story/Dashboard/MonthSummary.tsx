import styled from "styled-components";
import type { ThemeProps } from "@/assets/theme";
import { InputLabel, Title } from "@/components/Text";

const SummaryCard = styled.div`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
`;

const SummaryRow = styled.div<{ theme: ThemeProps }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: ${(props) => props.theme.colors.background};
  border-radius: 12px;
`;

const SummaryValue = styled(InputLabel)<{ theme: ThemeProps }>`
    font-weight: ${(props) => props.theme.fontWeights.semiBold};
    color: ${(props) => props.theme.colors.primary};
`;

interface MonthSummaryProps {
	totalTime: number;
	totalDistance: number;
	fastestMeeting: number;
}

const MonthSummary = ({
	totalTime,
	totalDistance,
	fastestMeeting,
}: MonthSummaryProps) => {
	return (
		<SummaryCard>
			<Title>이번 달 총계</Title>
			<SummaryRow>
				<InputLabel>총 만남 시간</InputLabel>
				<SummaryValue>{totalTime}분</SummaryValue>
			</SummaryRow>
			<SummaryRow>
				<InputLabel>총 이동 거리</InputLabel>
				<SummaryValue>{totalDistance}m</SummaryValue>
			</SummaryRow>
			<SummaryRow>
				<InputLabel>가장 빠른 만남</InputLabel>
				<SummaryValue>{fastestMeeting}분</SummaryValue>
			</SummaryRow>
		</SummaryCard>
	);
};

export default MonthSummary;
