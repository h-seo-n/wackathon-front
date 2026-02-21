export interface ThemeProps {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    gray: string;
    black: string;
    darkgray: string;
  };
  fonts: string[];
  fontSizes: {
    smaller: string;
    small: string;
    medium: string;
    large: string;
  };
  fontWeights: {
    regular: string;
    medium: string;
    semiBold: string;
  }
  shadow: string;    
}

const theme = {
    colors: {
        primary: "#F45994",
        secondary: "#",
        background: "#FFF6FB",
        gray: "#F4F4F5",
        black: "#0A0A0A",
        darkgray: "#52525C",
    },
    fonts: ["Inter", "sans-serif", "Roboto"],
    fontSizes: {
        smaller: "14px",
        small: "16px",
        medium: "20px",
        large: "24px",
    },
    fontWeights: {
        regular: "400",
        medium: "500",
        semiBold: "600",
    },
    shadow: "0 15px 25px -12px #60003236",
}

export default theme;