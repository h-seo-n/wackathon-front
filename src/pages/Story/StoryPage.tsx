import type { ThemeProps } from "@/assets/theme";
import { PinkContainer } from "@/components/PinkContainer";
import styled from "styled-components";
import NavigationBar from "./NavigationBar";
import MeetingBanner from "../Home/MeetingBanner";
import type { DashboardProps } from "./Dashboard";
import Dashboard from "./Dashboard";
import { useState } from "react";
import type { MeetingRecord } from "./MeetingList";
import MeetingList from "./MeetingList";
import ToggleTab from "@/components/ToggleTab";

const WhiteContainer = styled(PinkContainer)`
    background-color: #ffffff;
    width: 100%;
    padding: 0;
`;

const GrayContent = styled.div<{ theme: ThemeProps }>`
  background-color: ${(props) => props.theme.colors.gray};
  width: 100%;
  max-width: 400px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px 100px 20px;
  gap: 16px;
`;

const StoryPage = () => {
	const [activeTab, setActiveTab] = useState<"story" | "map" | "list">("story");

	// current month 가져오기, 만남 횟수 가져오기
	const title = "11월, 우리는 3번 만났어요";
	// 데이터 다 가져오기
	const dashboardData: DashboardProps = {
		avgTime: 33,
		avgDistance: 2467,
		totalTime: 98,
		totalDistance: 7400,
		fastestMeeting: 25,
	};

	// meeting list 더미데이터
	const meetings: MeetingRecord[] = [
		{ date: "2월 15일 (일)", time: "오전 12:00", duration: 32, distance: 2400 },
		{ date: "2월 12일 (목)", time: "오전 12:00", duration: 25, distance: 1800 },
		{ date: "2월 8일 (일)", time: "오전 12:00", duration: 41, distance: 3200 },
	];

	return (
		<WhiteContainer>
			<NavigationBar
				title="만남 회고"
				activeTab={activeTab}
				onTabChange={setActiveTab}
			/>
			<GrayContent>
				{activeTab !== "map" && (
					<MeetingBanner title={title} explanation={null} />
				)}
				{activeTab === "story" ? (
					<Dashboard {...dashboardData} />
				) : activeTab === "map" ? (
					<div />
				) : (
					<MeetingList meetings={meetings} />
				)}
			</GrayContent>
			<ToggleTab />
		</WhiteContainer>
	);
};

export default StoryPage;
