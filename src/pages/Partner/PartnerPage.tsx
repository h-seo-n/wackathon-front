import { PinkContainer } from "@/components/PinkContainer";
import PartnerIcon from "/images/Partner.svg";
import Wrapper from "@/components/Wrapper";
import { Explanation, Title } from "@/components/Text";
import { Col } from "@/components/FlexBox";
import { PinkButton } from "@/components/Button";
import TextInput from "../Auth/TextInput";
import Divider from "@/components/Divider";
import { useState } from "react";
import Toast from "@/components/Toast";
import { createInviteCode, joinInviteCode } from "@/api/couples";

const PartnerPage = () => {
	const [toast, setToast] = useState<string | null>(null);
	const [generatedCode, setGeneratedCode] = useState<string | null>(null);
	const [expiresAt, setExpiresAt] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [inviteCode, setInviteCode] = useState("");
	const [isAccepting, setIsAccepting] = useState(false);

	const handleCreateCode = async () => {
		setIsCreating(true);
		try {
			const response = await createInviteCode();
			setGeneratedCode(response.data.code);
			setExpiresAt(response.data.expiresAt);
			setToast("초대 코드가 생성되었습니다.");
		} catch {
			setToast("초대 코드 생성 실패");
		} finally {
			setIsCreating(false);
		}
	};

	const handleAcceptCode = async () => {
		if (!inviteCode.trim()) {
			setToast("초대 코드를 입력해 주세요");
			return;
		}
		setIsAccepting(true);
		try {
			await joinInviteCode(inviteCode.trim());
			setToast("초대 수락 완료");
			setInviteCode("");
		} catch {
			setToast("초대 수락에 실패했습니다");
		} finally {
			setIsAccepting(false);
		}
	};

	return (
		<PinkContainer>
			<Wrapper>
				<img
					src={PartnerIcon}
					alt="a pink icon with a person and plus icon"
					style={{ width: 64 }}
				/>
				<Title>파트너 연결</Title>
				<Explanation>연인과 연결하여 특별한 순간을 함께 기록하세요</Explanation>
				<Col style={{ gap: 20, width: "100%", marginTop: 40 }}>
					<PinkButton onClick={handleCreateCode} disabled={isCreating}>
						{isCreating ? "생성 중..." : "초대 코드 만들기"}
					</PinkButton>
					{generatedCode && (
						<div style={{ width: "100%", textAlign: "center" }}>
							<Explanation>{`초대 코드: ${generatedCode}`}</Explanation>
							{expiresAt && (
								<Explanation style={{ fontWeight: 600 }}>
									{`만료: ${new Date(expiresAt).toLocaleString()}`}
								</Explanation>
							)}
						</div>
					)}
					<Divider />
					<Col style={{ gap: 12 }}>
						<TextInput
							type="text"
							placeholder="초대 코드 입력"
							value={inviteCode}
							onChange={(e) => setInviteCode(e.target.value)}
						/>
						<PinkButton onClick={handleAcceptCode} disabled={isAccepting}>
							{isAccepting ? "초대 수락 중..." : "초대 수락"}
						</PinkButton>
					</Col>
				</Col>
			</Wrapper>
			{toast && <Toast message={toast} onClose={() => setToast(null)} />}
		</PinkContainer>
	);
};

export default PartnerPage;
