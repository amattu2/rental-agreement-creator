import { Chip, type ChipProps } from "@mui/material";
import { memo, useMemo } from "react";

type StatusChipProps = {
  status: AgreementStatus;
};

/**
 * Provides a visual representation of the agreement status.
 *
 * @returns A Chip component representing the agreement status.
 */
const StatusChip = ({ status }: StatusChipProps) => {
  const [label, color] = useMemo<[string, ChipProps["color"]]>(() => {
    if (status === "active") {
      return ["Active", "success"];
    } else if (status === "archived") {
      return ["Archived", "default"];
    } else if (status === "canceled") {
      return ["Canceled", "warning"];
    }

    return ["N/A", "default"];
  }, [status]);

  return (
    <Chip
      label={label}
      color={color}
      variant={status === "active" ? "filled" : "outlined"}
      size="small"
    />
  );
};

export default memo<StatusChipProps>(StatusChip);
