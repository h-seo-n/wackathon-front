import { useState } from "react";
import styled from "styled-components";
import type { ThemeProps } from "@/assets/theme";
import {
	IoCalendarClearOutline,
	IoChevronBack,
	IoLocationOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { Title } from "@/components/Text";
import { GiFountainPen } from "react-icons/gi";

const NavContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  gap: 16px;
  padding: 16px 16px;
  background-color: #ffffff;
  border-bottom: 0.71px #B2B2B2 solid;
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  position: relative;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #1A1A1A;
  outline: none;
`;

const TitleText = styled(Title)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);

`;
const TabRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: center;
`;

const Tab = styled.button<{ $active: boolean; theme: ThemeProps }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  width: 100%;
  background-color: ${(props) => (props.$active ? props.theme.colors.primary : props.theme.colors.gray )};
  color: ${(props) => (props.$active ? "#ffffff" : props.theme.colors.darkgray )};
  outline: none;

  &:focus {
    outline: none;
  }
`;


type TabType = "story" | "map" | "list";

interface NavigationBarProps {
	title?: string;
	activeTab?: TabType;
	onTabChange?: (tab: TabType) => void;
	onBack?: () => void;
}

const NavigationBar = ({
	title = "만남 회고",
	activeTab: controlledTab,
	onTabChange,
	onBack,
}: NavigationBarProps) => {
	const navigate = useNavigate();
	const [internalTab, setInternalTab] = useState<TabType>("story");
	const activeTab = controlledTab ?? internalTab;

	const handleTabChange = (tab: TabType) => {
		setInternalTab(tab);
		onTabChange?.(tab);
	};

	const handleBack = () => {
		if (onBack) {
			onBack();
		} else {
			navigate(-1);
		}
	};

	const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
		{ key: "story", label: "스토리", icon: <GiFountainPen /> },
		{ key: "map", label: "지도", icon: <IoLocationOutline /> },
		{ key: "list", label: "목록", icon: <IoCalendarClearOutline /> },
	];

	return (
		<NavContainer>
			<TopRow>
				<BackButton onClick={handleBack}>
					<IoChevronBack size={24} />
				</BackButton>
				<TitleText>{title}</TitleText>
			</TopRow>
			<TabRow>
				{tabs.map((tab) => (
					<Tab
						key={tab.key}
						$active={activeTab === tab.key}
						onClick={() => handleTabChange(tab.key)}
					>
						{tab.icon} {tab.label}
					</Tab>
				))}
			</TabRow>
		</NavContainer>
	);
};

export default NavigationBar;
