import styled from "styled-components";
import type { ThemeProps } from "@/assets/theme";
import { IoTimeOutline } from "react-icons/io5";
import { HiOutlineArrowsRightLeft } from "react-icons/hi2";
import { Row } from "@/components/FlexBox";
import Wrapper from "@/components/Wrapper";
import theme from "@/assets/theme";


const RowContainer = styled.div`
    display: flex;
    gap: 12px;
    width: 100%;
`
const StatCard = styled(Wrapper)`
    padding: 16px 20px;
`

const StatLabel = styled.div<{ theme: ThemeProps }>`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  font-size: ${(props) => props.theme.fontSizes.smaller};
  font-weight: ${(props) => props.theme.fontWeights.medium};
  color: ${(props) => props.theme.colors.primary};
`;

const StatValue = styled.span`
  font-size: 36px;
  font-weight: 700;
  color: #1A1A1A;
  line-height: 1;
`;


const StatUnit = styled.span<{ theme: ThemeProps }>`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  font-weight: 400;
  color: #9CA3AF;
`;

interface TimeDistanceRowProps {
    avgTime: number;
    avgDistance: number;
}

const TimeDistanceRow = ({avgTime, avgDistance}: TimeDistanceRowProps) => {

    return (
    <RowContainer>
        <StatCard>
            <StatLabel>
                <IoTimeOutline color={theme.colors.primary} size={20} />
                평균 시간
            </StatLabel>
            <Row style={{ gap: 5 }}>
                <StatValue>{avgTime}</StatValue>
                <StatUnit>분</StatUnit>
            </Row>

        </StatCard>
        <StatCard>
            <StatLabel>
                <HiOutlineArrowsRightLeft color={theme.colors.primary} size={20} />
                평균 거리
            </StatLabel>
            <Row style={{ gap: 5 }}>
                <StatValue>{avgDistance}</StatValue>
                <StatUnit>m</StatUnit>
            </Row>    

        </StatCard>
    </RowContainer>
    );
}

export default TimeDistanceRow;