import type { ThemeProps } from "@/assets/theme";
import { PinkContainer } from "@/components/PinkContainer";
import styled from "styled-components";
import NavigationBar from "./NavigationBar";
import MeetingBanner from "../Home/MeetingBanner";
import type { DashboardProps } from "./Dashboard";
import Dashboard from "./Dashboard";
import { useEffect, useState, useMemo } from "react";
import MeetingList from "./MeetingList";
import ToggleTab from "@/components/ToggleTab";
import MapHistory from "./MapHistory";
import { useHistory } from "@/context/HistoryProvider";
import api from "@/api/axios";

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

	const {
		globalHistory,
		// history,
		histories,
		// fetchHistoryBySessionId,
		fetchHistories,
		fetchGlobalHistory,
		isLoadingHistory,
		error,
	} = useHistory();

    const [stat, setStat] = useState<{
        totalMeetings: number;
        averageMinutes: number;
        averageDistance: number;
        totalMinutes: number;
        totalDistance: number;
        minMinutes: number;
    } | null>(null);

    useEffect(() => {
        const fetchStat = async () => {
            try {
                const res = await api.get("/history/stat");
                setStat(res.data);
            } catch (e) {
                console.error("Failed to fetch stat", e);
            }
        };
        fetchStat();
    }, []);

	useEffect(() => {
		if (activeTab !== "map") return;
		void fetchGlobalHistory();
		void fetchHistories();
	}, [activeTab, fetchGlobalHistory, fetchHistories]);

    const now = new Date();
    const month = now.getMonth() + 1;
    const title = stat
    ? `${month}월, 우리는 ${stat.totalMeetings}번 만났어요`
    : `아직 만남 정보가 없어요.`;

    const dashboardData: DashboardProps = {
        avgTime: stat?.averageMinutes ?? 0,
        avgDistance: stat?.averageDistance ?? 0,
        totalTime: stat?.totalMinutes ?? 0,
        totalDistance: stat?.totalDistance ?? 0,
        fastestMeeting: stat?.minMinutes ?? 0,
    };



	const meetings = useMemo(() => {
		const formatKoreanDateTime = (iso: string) => {
			const d = new Date(iso); // "2026-02-21T19:59:55.237Z"

			// ✅ 날짜: 2월 21일 (금)
			const dateStr = d.toLocaleDateString("ko-KR", {
				month: "numeric",
				day: "numeric",
				weekday: "short",
				timeZone: "Asia/Seoul",
			});

			// ✅ 시간: 오후 4:59
			const timeStr = d.toLocaleTimeString("ko-KR", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true,
				timeZone: "Asia/Seoul",
			});

			// dateStr이 "2. 21. (금)"처럼 나올 수 있어서 형식 맞추기
			const cleanedDate = dateStr
				.replace(/\./g, "")
				.replace(/\s+/g, " ")
				.trim(); // "2 21 (금)" 형태

			const parts = cleanedDate.split(" ");
			const month = parts[0];
			const day = parts[1];
			const weekday = parts[2] ?? "";

			return {
				date: `${month}월 ${day}일 ${weekday}`, // "2월 21일 (금)"
				time: timeStr, // "오후 4:59"
			};
		};

		return [...histories]
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
			.map((h) => {
				const { date, time } = formatKoreanDateTime(h.date);

				return {
					date,
					time,
					duration: h.travelMinutes,
					distance: h.distance,
				};
			});
	}, [histories]);

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
					<>
						{isLoadingHistory && (
							<div style={{ width: "100%", fontSize: 13, color: "#666" }}>
								히스토리 불러오는 중...
							</div>
						)}
						{error && (
							<div style={{ width: "100%", fontSize: 13, color: "crimson" }}>
								{error}
							</div>
						)}
						{/* ✅ MapHistory에 history를 props로 전달 */}
						<MapHistory history={globalHistory} />
					</>
				) : (
					<MeetingList meetings={meetings} />
				)}
			</GrayContent>
			<ToggleTab />
		</WhiteContainer>
	);
};

export default StoryPage;
