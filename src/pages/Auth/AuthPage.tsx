import { PinkButton, TextButton } from "@/components/Button";
import { useNavigate } from "react-router-dom";
import Wrapper from "@/components/Wrapper";
import { Col } from "@/components/FlexBox";
import TextInput from "./TextInput";
import HeartIcon from "/images/Heart.svg";
import { PinkContainer } from "@/components/PinkContainer";
import { Explanation, InputLabel, Title } from "@/components/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import AvatarIcon from "/images/Avatar.svg";

export const LoginPage = () => {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const { login } = useAuth();

	const navigate = useNavigate();

	const handleLogin = async () => {
		try {
			await login({ email, password });
			navigate("/home");
		} catch {
			alert("로그인에 실패했습니다.");
		}
	};

	return (
		<PinkContainer>
			<Wrapper>
				<img src={HeartIcon} alt="a heart icon" style={{ width: 64 }} />
				<Title>로그인</Title>
				<Explanation>만나기까지의 기다림도 설렘이 될 수 있게</Explanation>
				<Col style={{ gap: 16, width: "100%", marginTop: 30 }}>
					<Col style={{ gap: 4 }}>
						<InputLabel style={{ textAlign: "start" }}>이메일</InputLabel>
						<TextInput
							type="email"
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Col>
					<Col style={{ gap: 4 }}>
						<InputLabel style={{ textAlign: "start" }}>비밀번호</InputLabel>
						<TextInput
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</Col>
					<PinkButton onClick={handleLogin}>로그인</PinkButton>
					<TextButton
						onClick={() => {
							navigate("/signup");
						}}
					>
						계정이 없으신가요? 회원가입
					</TextButton>
				</Col>
			</Wrapper>
		</PinkContainer>
	);
};

export const SignupPage = () => {
    const navigate = useNavigate();
    const { signup, setProfileImg } = useAuth();
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // img file state
    const [profile, setProfile] = useState<File | null>(null);
    const [previewImgUrl, setPreviewImgUrl] = useState<string>(AvatarIcon);

	const handleSignup = async () => {
		try {
        // setProfileImg
  			await signup({ nickname, email, password });
        if (profile) {
            await setProfileImg(profile);
        }

  			navigate("/home");
		} catch {
			alert("회원가입에 실패했습니다.");
		}
  };

    const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProfile(file);
        setPreviewImgUrl(URL.createObjectURL(file));
  	};

    return (
        <PinkContainer>
        <Wrapper>
            <Title>회원가입</Title>
            <Explanation>만나기까지의 기다림도 설렘이 될 수 있게</Explanation>
            <Col style={{ gap: 16, width: '100%', marginTop: 50 }}>
                <Col style={{ gap: 6 }}>
                    <InputLabel style={{ textAlign: "start" }}>프로필 사진 업로드</InputLabel>
                    <label style={{ alignSelf: "center", cursor: "pointer" }}>
                        <img src={previewImgUrl} alt="icon of an avatar"     
                            style={{
                            width: 60,
                            height: 60,
                            borderRadius: "50%",
                            objectFit: "cover",
                            }}
                            onError={() => {
                                alert("이미지 파일의 용량이 너무 크거나 지원하지 않는 형식입니다.");
                                setPreviewImgUrl(AvatarIcon);
                                setProfile(null);
                            }}
                        />
                        <input type="file"
                            style={{ display: "none" }}
                            onChange={handleImgUpload}
                        />
                    </label>
                </Col>

                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>이름</InputLabel>
                    <TextInput type="text" value={nickname} onChange={(e) => setNickname(e.target.value)}/>
                </Col>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>이메일</InputLabel>
                    <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Col>
                <Col style={{ gap: 4 }}>
                    <InputLabel style={{ textAlign: "start" }}>비밀번호</InputLabel>
                    <TextInput type="password" onChange={(e) => setPassword(e.target.value)}/>
                </Col>
                <PinkButton onClick={handleSignup}>회원가입</PinkButton>
                <TextButton onClick={()=> { navigate('/login'); } }>계정이 있으신가요? 로그인</TextButton>
            </Col>
        </Wrapper>
        </PinkContainer>
    )
}
