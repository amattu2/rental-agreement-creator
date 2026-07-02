import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

type CancellationDialogProps = {
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Provides a dialog for confirming the cancellation of an agreement.
 *
 * @returns A React component rendering the cancellation dialog.
 */
export const CancellationDialog = ({
  onClose,
  onConfirm,
}: CancellationDialogProps): React.ReactElement => (
  <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Cancel Agreement</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        The agreement will remain visible, but it can no longer be modified. This action is
        irreversible.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" color="error" onClick={onConfirm}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);
