import { PinkContainer } from "@/components/PinkContainer";
import PartnerIcon from "/images/Partner.svg"
import Wrapper from "@/components/Wrapper";
import { Explanation, Title } from "@/components/Text";
import { Col } from "@/components/FlexBox";
import { PinkButton } from "@/components/Button";
import TextInput from "../TextInput";
import Divider from "@/components/Divider";
import { useState } from "react";
import Toast from "@/components/Toast";

const PartnerPage = () => {
  const [toast, setToast] = useState<string | null>(null);

    const handleCreateCode = async () => {
        try {
            // api call
            throw new Error("초대 코드 생성 실패");
        } catch {
            setToast("초대 코드 생성 실패");
        }
    };

    const handleAcceptCode = async () => {
        try {
            // api call
            throw new Error("초대 수락 실패");
        } catch {
            setToast("초대 수락 실패")
        }
    }

    return (
        <PinkContainer>
            <Wrapper>
                <img src={PartnerIcon} alt="a pink icon with a person and plus icon" style={{ width: 64 }}/>
                <Title>파트너 연결</Title>
                <Explanation>연인과 연결하여 특별한 순간을 함께 기록하세요</Explanation>
                <Col style={{ gap: 20, width: '100%', marginTop: 40}}>
                    <PinkButton onClick={handleCreateCode}>초대 코드 만들기</PinkButton>
                    <Divider />
                    <Col style={{ gap: 12 }}>
                        <TextInput type="text" placeholder="초대 코드 입력" />
                        <PinkButton onClick={handleAcceptCode}>초대 수락</PinkButton>
                    </Col>
                </Col>
            </Wrapper>
            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </PinkContainer>
    )
}

export default PartnerPage;