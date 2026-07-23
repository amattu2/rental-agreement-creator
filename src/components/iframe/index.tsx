import { Box, styled, Typography } from "@mui/material";
import { CSSProperties, memo } from "react";

const StyledContainer = styled(Box)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  border: "none",
  borderRadius: "6px",
  display: "flex",
  flexDirection: "column",
  minHeight: "calc(100vh - 64px - 20px)",
  position: "sticky",
  top: "10px",
  width: "calc(100% - 20px)",
  margin: "10px",
  overflow: "hidden",
}));

const BaseStyles: CSSProperties = {
  border: "none",
  borderRadius: "6px",
  width: "100%",
  flex: 1,
  minHeight: "100%",
};

const StyledIframe = styled("iframe")({
  ...BaseStyles,
});

const StyledPlaceholder = styled("div")(({ theme }) => ({
  ...BaseStyles,
  backgroundColor: theme.palette.grey[900],
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StaleOverlay = styled(Box)({
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  backgroundColor: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(1px)",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
});

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: theme.palette.common.white,
  textAlign: "center",
  maxWidth: "80%",
  padding: theme.spacing(2),
  userSelect: "none",
}));

type IframeProps = {
  src: string | null;
  isDirty: boolean;
} & Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, "src">;

/**
 * A general purpose wrapper component for iframes with a guard for null src.
 *
 * @returns A styled iframe or a placeholder if no src is provided.
 */
const IframeWrapper = ({ src, isDirty, ...props }: IframeProps) => {
  if (!src) {
    return (
      <StyledContainer>
        <StyledPlaceholder data-testid="iframe-placeholder">
          <StyledTypography variant="body2">No preview is available.</StyledTypography>
        </StyledPlaceholder>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      <StyledIframe src={src} {...props} data-testid="iframe" key={src} />
      {isDirty && (
        <StaleOverlay data-testid="stale-overlay">
          <StyledTypography variant="body2">
            Click &quot;Generate Agreement&quot; to update the preview.
          </StyledTypography>
        </StaleOverlay>
      )}
    </StyledContainer>
  );
};

export default memo<IframeProps>(IframeWrapper);
