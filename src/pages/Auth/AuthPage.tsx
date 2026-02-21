import { PinkButton, TextButton } from "@/components/Button";
import { useNavigate } from "react-router-dom";
import Wrapper from "@/components/Wrapper";
import { Col } from "@/components/FlexBox";
import TextInput from "./TextInput";
import HeartIcon from "/images/Heart.svg"
import { PinkContainer } from "@/components/PinkContainer";
import { Explanation, InputLabel, Title } from "@/components/Text";


export const LoginPage = () => {
    const navigate = useNavigate();

    return (
        <PinkContainer>
        <Wrapper>
            <img src={HeartIcon} alt="a heart icon" style={{ width: 64 }}/>
            <Title>로그인</Title>
            <Explanation>만나기까지의 기다림도 설렘이 될 수 있게</Explanation>
            <Col style={{ gap: 16, width: '100%', marginTop: 30 }}>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>이메일</InputLabel>
                    <TextInput type="email" />
                </Col>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>비밀번호</InputLabel>
                    <TextInput type="password" />
                </Col>
                <PinkButton>로그인</PinkButton>
                <TextButton onClick={()=> { navigate('/signup'); } }>계정이 없으신가요? 회원가입</TextButton>
            </Col>
        </Wrapper>
        </PinkContainer>
    )
}

export const SignupPage = () => {
    const navigate = useNavigate();

    return (
        <PinkContainer>
        <Wrapper>
            <img src={HeartIcon} alt="a heart icon" style={{width: 64}}/>
            <Title>회원가입</Title>
            <Explanation>만나기까지의 기다림도 설렘이 될 수 있게</Explanation>
            <Col style={{ gap: 16, width: '100%', marginTop: 50 }}>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>이름</InputLabel>
                    <TextInput type="text" />
                </Col>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>이메일</InputLabel>
                    <TextInput type="email" />
                </Col>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>비밀번호</InputLabel>
                    <TextInput type="password" />
                </Col>
                <PinkButton>회원가입</PinkButton>
                <TextButton onClick={()=> { navigate('/login'); } }>계정이 있으신가요? 로그인</TextButton>
            </Col>
        </Wrapper>
        </PinkContainer>
    )
}

