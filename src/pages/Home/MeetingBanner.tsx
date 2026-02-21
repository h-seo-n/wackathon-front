import styled from "styled-components";
import { Explanation, Title } from "@/components/Text";
import type { ThemeProps } from "@/assets/theme";
import AvatarIcon from "/images/Avatar.svg";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/api/axios";
import { useEffect, useState } from "react";

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

const Circle = styled.img<{
	color?: string;
	$zIndex?: number;
	theme: ThemeProps;
}>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${(props) => props.color || "none"};
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
  const { user } = useAuth();
  const [partnerImgUrl, setPartnerImgUrl] = useState<string>(AvatarIcon);

  useEffect(() => {
    const fetchPartnerProfile = async () => {
      try {
        const res = await api.get("/api/couples/profile");
        const { user1, user2 } = res.data;
        const partner = user1.id === user?.id ? user2 : user1;
        if (partner.profileImageUrl) {
          setPartnerImgUrl(partner.profileImageUrl);
        }
      } catch (e) {
        console.error("Failed to fetch couple profile", e);
      }
    };
    fetchPartnerProfile();
  }, [user?.id]);


	return (
		<Container>
			<CirclesWrapper>
				<Circle src={user?.profileImageUrl || AvatarIcon} $zIndex={1} />
				<Circle src={partnerImgUrl} $zIndex={0} />
			</CirclesWrapper>
			<TextGroup>
				<Title style={{ padding: 0, margin: 0 }}>{title}</Title>
				{explanation && <Explanation>{explanation}</Explanation>}
			</TextGroup>
		</Container>
	);
};

export default MeetingBanner;
