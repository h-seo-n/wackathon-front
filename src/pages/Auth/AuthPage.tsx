import type { ThemeProps } from "@/assets/theme";
import { PinkButton, TextButton } from "@/components/Button";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Wrapper from "@/components/Wrapper";
import { Col } from "@/components/FlexBox";
import TextInput from "./TextInput";
import HeartIcon from "/images/Heart.svg";

const Title = styled.h3<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.large};
    color: ${(props) => props.theme.colors.black};
    font-weight: ${(props) => props.theme.fontWeights.medium};
`;
const Explanation = styled.span<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.small};
    color: #4A5565;
    font-weight: ${(props) => props.theme.fontWeights.regular};
`;
const Text = styled.span<{ theme: ThemeProps }>`
    font-size: ${(props) => props.theme.fontSizes.smaller};
    color: #364153;
    font-weight: ${(props) => props.theme.fontWeights.medium};
`;

const AuthContainer = styled.div<{ theme: ThemeProps }>`
  background-color: ${(props) => props.theme.colors.background};
  display: flex;
  width: 100vw;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const LoginPage = () => {
	const navigate = useNavigate();

	return (
		<AuthContainer>
			<Wrapper>
				<img src={HeartIcon} alt="a heart icon" style={{ width: 64 }} />
				<Title>로그인</Title>
				<Explanation>만나기까지의 기다림도 설렘이 될 수 있게</Explanation>
				<Col style={{ gap: 16, width: "100%", marginTop: 50 }}>
					<Col style={{ gap: 4 }}>
						<Text style={{ textAlign: "start" }}>이메일</Text>
						<TextInput type="email" />
					</Col>
					<Col style={{ gap: 4 }}>
						<Text style={{ textAlign: "start" }}>비밀번호</Text>
						<TextInput type="password" />
					</Col>
					<PinkButton>로그인</PinkButton>
					<TextButton
						onClick={() => {
							navigate("/signup");
						}}
					>
						계정이 없으신가요? 회원가입
					</TextButton>
				</Col>
			</Wrapper>
		</AuthContainer>
	);
};

export const SignupPage = () => {
	const navigate = useNavigate();

	return (
		<AuthContainer>
			<Wrapper>
				<img src={HeartIcon} alt="a heart icon" style={{ width: 64 }} />
				<Title>회원가입</Title>
				<Explanation>만나기까지의 기다림도 설렘이 될 수 있게</Explanation>
				<Col style={{ gap: 16, width: "100%", marginTop: 50 }}>
					<Col style={{ gap: 4 }}>
						<Text style={{ textAlign: "start" }}>이름</Text>
						<TextInput type="text" />
					</Col>
					<Col style={{ gap: 4 }}>
						<Text style={{ textAlign: "start" }}>이메일</Text>
						<TextInput type="email" />
					</Col>
					<Col style={{ gap: 4 }}>
						<Text style={{ textAlign: "start" }}>비밀번호</Text>
						<TextInput type="password" />
					</Col>
					<PinkButton>회원가입</PinkButton>
					<TextButton
						onClick={() => {
							navigate("/login");
						}}
					>
						계정이 있으신가요? 로그인
					</TextButton>
				</Col>
			</Wrapper>
		</AuthContainer>
	);
};
