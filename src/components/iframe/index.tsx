import { styled, Typography } from "@mui/material";
import { CSSProperties } from "react";

const BaseStyling: CSSProperties = {
  border: "none",
  borderRadius: "6px",
  minHeight: "calc(100vh - 68.5px - 20px)",
  position: "sticky",
  top: "10px",
  width: "calc(100% - 20px)",
  margin: "10px",
};

const StyledIframe = styled("iframe")(({ theme }) => ({
  ...BaseStyling,
  boxShadow: theme.shadows[3],
}));

const StyledPlaceholder = styled("div")(({ theme }) => ({
  ...BaseStyling,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.palette.grey[900],
  boxShadow: theme.shadows[3],
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.getContrastText(theme.palette.grey[900]),
  userSelect: "none",
}));

type IframeProps = {
  src: string | null;
} & Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, "src">;

/**
 * A general purpose wrapper component for iframes with a guard for null src.
 *
 * @returns A styled iframe or a placeholder if no src is provided.
 */
export const IframeWrapper = ({ src, ...props }: IframeProps) => {
  if (!src) {
    return (
      <StyledPlaceholder data-testid="iframe-placeholder">
        <StyledTypography variant="body1">No content available</StyledTypography>
      </StyledPlaceholder>
    );
  }

  return <StyledIframe src={src} {...props} data-testid="iframe" />;
};
