import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

const slideUp = keyframes`
  from {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
`;

const slideDown = keyframes`
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ $isExiting: boolean }>`
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: calc(100% - 48px);
  max-width: 400px;
  animation: ${(props) => (props.$isExiting ? slideDown : slideUp)} 0.3s ease forwards;
`;

const ToastContent = styled.div`
  background-color: #FEE2E2;
  color: #DC2626;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

interface ToastProps {
	message: string;
	duration?: number;
	onClose: () => void;
}

const Toast = ({ message, duration = 3000, onClose }: ToastProps) => {
	const [isExiting, setIsExiting] = useState(false);

	useEffect(() => {
		const exitTimer = setTimeout(() => {
			setIsExiting(true);
		}, duration - 300);

		const closeTimer = setTimeout(() => {
			onClose();
		}, duration);

		return () => {
			clearTimeout(exitTimer);
			clearTimeout(closeTimer);
		};
	}, [duration, onClose]);

	return (
		<ToastContainer $isExiting={isExiting}>
			<ToastContent>{message}</ToastContent>
		</ToastContainer>
	);
};

export default Toast;
