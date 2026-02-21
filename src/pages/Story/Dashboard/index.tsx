import { Col } from "@/components/FlexBox";
import MonthSummary from "./MonthSummary";
import TimeDistanceRow from "./TimeDistanceRow";
import styled from "styled-components";

const Container = styled(Col)`
    width: 100%;
    gap: 12px;
    max-width: 400px;
`;

export interface DashboardProps {
	avgTime: number; // 분
	avgDistance: number; // m
	totalTime: number; // 분
	totalDistance: number; // m
	fastestMeeting: number; // 분
}

const Dashboard = ({
	avgTime,
	avgDistance,
	totalTime,
	totalDistance,
	fastestMeeting,
}: DashboardProps) => {
	return (
		<Container>
			<TimeDistanceRow avgTime={avgTime} avgDistance={avgDistance} />
			<MonthSummary
				totalTime={totalTime}
				totalDistance={totalDistance}
				fastestMeeting={fastestMeeting}
			/>
		</Container>
	);
};

export default Dashboard;
