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
import { useState } from "react";
import Avatar from "/images/Avatar.svg";
import { GoBellFill } from "react-icons/go";
import theme from "@/assets/theme";
import ToggleTab from "@/components/ToggleTab";
import MeetingBanner from "./MeetingBanner";
import styled from "styled-components";

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
	const [sessionStatus, setSessionStatus] = useState<
		"false" | "pending" | "received" | "connected"
	>("false");
	const partnerName = "상대방";

	const [activeTab, setActiveTab] = useState<"location" | "history">(
		"location",
	);

	const handleShareStart = () => {
		setSessionStatus("connected");
		// api call
	};
	const handleShareStop = () => {
		setSessionStatus("false");
	};

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

				{sessionStatus === "false" ? (
					<PinkButton onClick={handleShareStart}>
						<IoPlayOutline size={20} color="white" />
						위치 공유 시작
					</PinkButton>
				) : (
					<Col style={{ gap: 20, width: "100%" }}>
						<PinkButton>
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
		</PinkContainer>
	);
};

export default HomePage;
