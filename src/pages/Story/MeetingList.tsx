import styled from "styled-components";
import type { ThemeProps } from "@/assets/theme";
import { IoTimeOutline } from "react-icons/io5";
import { HiOutlineArrowsRightLeft } from "react-icons/hi2";
import { Col } from "@/components/FlexBox";

const ListContainer = styled(Col)`
    gap: 12px;
    width: 100%;
`;

const Card = styled(Col)<{ theme: ThemeProps }>`
  background-color: #ffffff;
  border-radius: 16px;
  padding: 20px;
  gap: 14px;
  width: 100%;  
  box-shadow: ${(props) => props.theme.shadow};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const DateGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DateText = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
`;

const TimeText = styled.span`
  font-size: 13px;
  font-weight: 400;
  color: #9CA3AF;
`;

const MeetingNumber = styled.span<{ theme: ThemeProps }>`
  font-size: 13px;
  font-weight: 500;
  color: #9CA3AF;
`;

const StatsRow = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
`;

const StatBox = styled.div`
  width: 100%;
  background-color: #FDF2F8;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.div<{ theme: ThemeProps }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.primary};
`;

const StatValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
`;

export interface MeetingRecord {
	date: string; // e.g. "2월 15일 (일)"
	time: string; // e.g. "오전 12:00"
	duration: number; // 분
	distance: number; // m
}

interface MeetingListProps {
	meetings: MeetingRecord[];
}

const MeetingList = ({ meetings }: MeetingListProps) => {
	return (
		<ListContainer>
			{meetings.map((meeting, index) => (
				<Card key={`${meeting.date}-${meeting.time}`}>
					<CardHeader>
						<DateGroup>
							<DateText>{meeting.date}</DateText>
							<TimeText>{meeting.time}</TimeText>
						</DateGroup>
						<MeetingNumber>만남 #{meetings.length - index}</MeetingNumber>
					</CardHeader>

					<StatsRow>
						<StatBox>
							<StatLabel>
								<IoTimeOutline size={14} />
								소요 시간
							</StatLabel>
							<StatValue>{meeting.duration}분</StatValue>
						</StatBox>

						<StatBox>
							<StatLabel>
								<HiOutlineArrowsRightLeft size={14} />
								이동 거리
							</StatLabel>
							<StatValue>{meeting.distance}m</StatValue>
						</StatBox>
					</StatsRow>
				</Card>
			))}
		</ListContainer>
	);
};

export default MeetingList;
