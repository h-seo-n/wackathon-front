import { PinkContainer } from "@/components/PinkContainer";
import Wrapper from "@/components/Wrapper";
import LocationIcon from "/images/Location.svg";
import LocationAloneIcon from "/images/LocationAlone.svg";
import LocationTogetherIcon from "/images/LocationTogether.svg";
import SendIcon from "/images/SendIcon.svg";
import { Explanation, Title } from "@/components/Text";
import { GrayButton, PinkButton } from "@/components/Button";
import { IoPauseSharp, IoPlayOutline } from "react-icons/io5";
import { IoMapOutline } from "react-icons/io5";
import { Col, Row } from "@/components/FlexBox";
import { useState, useRef, useCallback, useEffect } from "react";
import Avatar from "/images/Avatar.svg";
import { GoBellFill } from "react-icons/go";
import theme from "@/assets/theme";
import ToggleTab from "@/components/ToggleTab";
import MeetingBanner from "./MeetingBanner";
import styled from "styled-components";
import Toast from "@/components/Toast";
import { notifyPartnerLocationShare } from "@/api/noti";
import { createSession, getActiveSession, acceptSession, getSessionStatus } from "@/api/session";
import { openSessionWs } from "@/ws/sessionWs";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";

const Header = () => {
	return (
		<Row
			style={{
				justifyContent: "flex-end",
				alignItems: "center",
				gap: 10,
				width: "100%",
				maxWidth: 400,
				padding: "5px 0",
			}}
		>
			<button
				type="button"
				style={{
					background: "none",
					border: "none",
					padding: 0,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
				}}
			>
				{/* should put user image */}
				<img
					src={Avatar}
					alt="user profile"
					style={{
						width: 36,
						height: 36,
						borderRadius: "50%",
						objectFit: "cover",
					}}
				/>
			</button>
			<button
				type="button"
				style={{
					background: "none",
					border: "none",
					padding: 0,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
				}}
			>
				<GoBellFill color={theme.colors.primary} size={28} />
			</button>
		</Row>
	);
};

const StartTitle = styled(Title)`
    margin: 0;
`;

const HomePage = () => {
	const navigate = useNavigate();
	const [sessionStatus, setSessionStatus] = useState<
		"false" | "pending" | "received" | "connected"
	>("false");
	const [toast, setToast] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<number | null>(null);
	const [isWsConnected, setIsWsConnected] = useState(false);
	const wsHandleRef = useRef<ReturnType<typeof openSessionWs> | null>(null);
	const partnerName = "상대방";

	const [activeTab, setActiveTab] = useState<"location" | "history">(
		"location",
	);

	const cleanupWs = useCallback(() => {
		console.log("[home] WS cleanup");
		wsHandleRef.current?.close();
		wsHandleRef.current = null;
		setIsWsConnected(false);
	}, []);

	const openWsConnection = useCallback(
		(sessionId: number) => {
			const token = localStorage.getItem("accessToken");
			if (!token) {
				setToast("토큰이 없어 위치 공유를 시작할 수 없습니다.");
				return;
			}

			cleanupWs();
			const handler = openSessionWs(sessionId, token, {
				onOpen: () => {
					console.log("[home] WS open", handler?.url, "sessionId", sessionId);
					setIsWsConnected(true);
					setSessionStatus("connected");
				},
				onClose: () => {
					console.log("[home] WS closed sessionId", sessionId);
					setIsWsConnected(false);
				},
				onError: () => {
					console.error("[home] WS error sessionId", sessionId);
					setIsWsConnected(false);
				},
				onMessage: (data) => {
					console.log("[home] WS msg", data);
				},
			});
			wsHandleRef.current = handler;
		},
		[cleanupWs],
	);

	const startSessionFlow = useCallback(async () => {
		console.log("[home] 세션 흐름 시작");
		try {
			const session = await createSession();
			console.log("[home] 세션 생성 성공", session.id);
			setSessionId(session.id);
			setSessionStatus("pending");
			openWsConnection(session.id);
		} catch (err) {
			console.error("[home] 세션 생성 실패", err);
			setToast("세션을 시작할 수 없습니다.");
		}
	}, [openWsConnection]);

	const handleCheckPartnerSession = async () => {
		console.log("[home] 파트너 세션 조회");
		try {
			const active = await getActiveSession();
			if (active?.sessionId) {
				const sid = active.sessionId;
				setToast("파트너가 세션을 열었습니다. 연결합니다.");
				setSessionId(sid);
				setSessionStatus("received");
				
				const st = await getSessionStatus(sid);
				if (st.status === "PENDING") {
					await acceptSession(sid);
					console.log("[home] accepted:", sid);
				}
				
				openWsConnection(active.sessionId);
			} else {
				setToast("파트너가 위치 공유를 열지 않았습니다.");
			}
		} catch (error) {
			console.error("[home] partner session 확인 실패", error);
			setToast("파트너 세션 확인에 실패했습니다.");
		}
	};

	const handleShareStart = async () => {
		console.log("[home] 위치 공유 시작 버튼 클릭");
		try {
			const response = await notifyPartnerLocationShare();
			console.log("[home] noti/partner 응답", response.status, response.data);
			setToast("상대방에게 위치 공유 알림을 보냈어요");
		} catch (error) {
			console.error("[home] noti/partner 실패", error);
			setToast("위치 공유 알림 전송에 실패했습니다");
		} finally {
			await startSessionFlow();
		}
	};
	const handleShareStop = () => {
		console.log("[home] 위치 공유 중지");
		cleanupWs();
		setSessionStatus("false");
		setSessionId(null);
	};
	const handleOpenLiveMap = () => {
		if (!sessionId) {
			setToast("세션이 없어서 지도를 열 수 없습니다.");
			return;
		}
		navigate(`/live-map/${sessionId}`);
	};

	useEffect(() => {
		return () => {
			cleanupWs();
		};
	}, [cleanupWs]);

	return (
		<PinkContainer style={{ paddingBottom: 100 }}>
			<Header />
			<MeetingBanner
				title="우리의 만남"
				explanation="서로를 찾아가는 여정을 기록해요"
			/>
			<Wrapper style={{ gap: 20 }}>
				{/* conditionally render img based on connection */}
				{sessionStatus === "false" ? (
					<>
						<img
							src={LocationIcon}
							alt="an icon of a pinpoint signifying location"
							style={{ width: 128 }}
						/>
						<StartTitle>위치 공유 시작하기</StartTitle>
						<Explanation>
							위치 공유를 시작하면 상대방에게도 알림이 전송됩니다
						</Explanation>
					</>
				) : sessionStatus === "pending" ? (
					<>
						<img
							src={LocationAloneIcon}
							alt="an icon of a pinpoint on a map, signifying pending shared location"
							style={{ width: 128 }}
						/>
						<StartTitle>위치 공유 중</StartTitle>
						<Explanation>${partnerName}님의 응답을 기다리고 있어요</Explanation>
					</>
				) : sessionStatus === "connected" ? (
					<>
						<img
							src={LocationTogetherIcon}
							alt="an icon of two pinpoints, signifying shared location"
							style={{ width: 128 }}
						/>
						<StartTitle>위치 공유 중</StartTitle>
						<Explanation>
							실시간으로 ${partnerName}님에게 가는 길을 기록하고 있어요
						</Explanation>
					</>
				) : sessionStatus === "received" ? (
					<>
						<img
							src={SendIcon}
							alt="an icon of an airplane flying"
							style={{ width: 128 }}
						/>
						<StartTitle>${partnerName}님의 위치 공유 활성화</StartTitle>
						<Explanation>
							파트너가 위치 공유를 시작했습니다
						</Explanation>
					</>
				) : (
					<>
						<img
							src={SendIcon}
							alt="an icon of an airplane flying"
							style={{ width: 128 }}
						/>
						<StartTitle>${partnerName}님의 위치 공유 활성화</StartTitle>
						<Explanation>
							위치 공유를 시작하고 서로의 위치를 확인해보세요!
						</Explanation>
					</>
				)}
				{sessionId && sessionStatus !== "false" && (
					<Explanation style={{ fontWeight: 600 }}>
						{`세션 ID: ${sessionId} · WS ${isWsConnected ? "연결됨" : "대기 중"}`}
					</Explanation>
				)}

				{sessionStatus === "false" ? (
					<>
						<PinkButton onClick={handleShareStart}>
							<IoPlayOutline size={20} color="white" />
							위치 공유 시작
						</PinkButton>
						<GrayButton onClick={handleCheckPartnerSession}>
							파트너 위치 공유 확인
						</GrayButton>
					</>
				) : (
					<Col style={{ gap: 20, width: "100%" }}>
						<PinkButton onClick={handleOpenLiveMap}>
							<IoMapOutline size={20} color="white" />
							실시간 위치 보기
						</PinkButton>
						<GrayButton onClick={handleShareStop}>
							<IoPauseSharp size={20} color={theme.colors.black} />
							위치 공유 중지
						</GrayButton>
					</Col>
				)}
			</Wrapper>
			<ToggleTab activeTab={activeTab} onTabChange={setActiveTab} />
			{toast && <Toast message={toast} onClose={() => setToast(null)} />}
		</PinkContainer>
	);
};

export default HomePage;
