import styled from "styled-components";
import type { ThemeProps } from "@/assets/theme";
import { FaLocationDot } from "react-icons/fa6";
import { IoBookOutline } from "react-icons/io5";
import theme from "@/assets/theme";

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background-color: #ffffff;
  border-radius: 9999px;
  padding: 6px;
  display: flex;
  gap: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
`;

const Tab = styled.button<{ $active: boolean; theme: ThemeProps }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.25s ease;
  background-color: ${(props) => (props.$active ? "#FCE4EC" : "transparent")};
  color: ${(props) => (props.$active ? props.theme.colors.primary : "#9CA3AF")};

  &:hover {
    background-color: ${(props) => (props.$active ? "#FCE4EC" : "#F9FAFB")};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

interface ToggleTabProps {
  activeTab: "location" | "history";
  onTabChange: (tab: "location" | "history") => void;
}

const ToggleTab = ({ activeTab, onTabChange }: ToggleTabProps) => {
    return (
        <FloatingContainer>
            <Tab $active={activeTab === "location"} onClick={() => onTabChange("location")}>
                <FaLocationDot size={30} color={theme.colors.primary} />
                위치 공유
            </Tab>
            <Tab $active={activeTab === "history"} onClick={() => onTabChange("history")}>
                <IoBookOutline size={30} color={theme.colors.primary} />
                지난 만남
            </Tab>
        </FloatingContainer>
    )
};

export default ToggleTab;
    
