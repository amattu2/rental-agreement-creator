"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { FormSchema, AgreementChargeItemSchema, AgreementChargesSchema } from "@/schemas/form";
import { buildAgreementCharges, groupByCategory } from "@/utils/billing";
import { formatCurrency, formatDate, formatNumber } from "@/utils/text";
import { useFormContext } from "react-hook-form";
import dayjs from "dayjs";
import { CATEGORY_NAMES } from "@/config/constants";

type ChargeConfirmationDialogProps = {
  onClose: () => void;
  onConfirm: () => void;
};

export const ChargeConfirmationDialog = ({ onClose, onConfirm }: ChargeConfirmationDialogProps) => {
  const { watch, setValue } = useFormContext<FormSchema>();
  const form = watch();

  const [quantitiesByCode, setQuantitiesByCode] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      form.agreement_charges?.line_items.map((lineItem) => [lineItem.code, lineItem.quantity]) ?? []
    )
  );
  const [salesTaxRate, setSalesTaxRate] = useState<number>(
    form.agreement_charges?.sales_tax_rate ?? 0
  );
  const [depositAmount, setDepositAmount] = useState<number>(
    form.agreement_charges?.deposit_amount ?? 0
  );

  const previewCharges = useMemo<AgreementChargesSchema>(
    () =>
      buildAgreementCharges(form, {
        quantitiesByCode,
        salesTaxRate,
        depositAmount,
      }),
    [depositAmount, form, quantitiesByCode, salesTaxRate]
  );

  const categorizedItems = useMemo<Record<string, Array<AgreementChargeItemSchema>>>(
    () => groupByCategory(previewCharges.line_items),
    [previewCharges.line_items]
  );

  const distance = useMemo<number>(
    () =>
      Math.max(0, form.rental_agreement_info.odometer_in - form.rental_agreement_info.odometer_out),
    [form.rental_agreement_info.odometer_in, form.rental_agreement_info.odometer_out]
  );

  const durationHours = useMemo<number>(
    () =>
      Math.max(
        0,
        Math.abs(
          dayjs(form.rental_agreement_info.date_in).diff(
            form.rental_agreement_info.date_out,
            "hour",
            true
          )
        )
      ),
    [form.rental_agreement_info.date_in, form.rental_agreement_info.date_out]
  );

  const handleConfirm = () => {
    setValue("agreement_charges", previewCharges, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    onConfirm();
  };

  if (!form) {
    return null;
  }

  return (
    <Dialog onClose={onClose} maxWidth="md" open fullWidth disablePortal>
      <DialogTitle>Edit Charges</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rental Period
              </Typography>
              <Typography variant="body2">
                {formatDate(form.rental_agreement_info.date_out, "MM/DD/YYYY h:mma")} &ndash;{" "}
                {formatDate(form.rental_agreement_info.date_in, "MM/DD/YYYY h:mma")}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body2">{durationHours.toFixed(1)} hours</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Distance
              </Typography>
              <Typography variant="body2">
                {formatNumber(distance)}{" "}
                {form.rental_agreement_info.max_distance_measurement?.toLowerCase()}
              </Typography>
            </Box>
          </Stack>

          {previewCharges.line_items.length === 0 ? (
            <Alert severity="info">
              No billable units are configured on this agreement. Add rental rates, usage rates,
              VDW, or PAI to the form first.
            </Alert>
          ) : null}

          {Object.keys(categorizedItems).map((category) => (
            <Box key={category}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {CATEGORY_NAMES[category] ?? category}
              </Typography>
              <Stack spacing={1.5}>
                {categorizedItems[category].map((lineItem) => (
                  <Box
                    key={lineItem.code}
                    sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {lineItem.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(lineItem.rate, form.currency)} {lineItem.note}
                        </Typography>
                      </Box>
                      <TextField
                        label="Quantity"
                        type="number"
                        size="small"
                        value={quantitiesByCode[lineItem.code] ?? lineItem.quantity}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setQuantitiesByCode((current) => ({
                            ...current,
                            [lineItem.code]: Number.isNaN(value) || value < 0 ? 0 : value,
                          }));
                        }}
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                        sx={{ width: { xs: "100%", sm: 140 } }}
                      />
                      <Box sx={{ minWidth: { sm: 120 } }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Line total
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(lineItem.total, form.currency)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}

          <Divider />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Sales Tax Rate (%)"
              type="number"
              size="small"
              value={salesTaxRate}
              onChange={(event) => {
                const value = Number(event.target.value);
                setSalesTaxRate(Number.isNaN(value) || value < 0 ? 0 : value);
              }}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              sx={{ width: { xs: "100%", sm: 220 } }}
            />
            <TextField
              label="Deposit Amount"
              type="number"
              size="small"
              value={depositAmount}
              onChange={(event) => {
                const value = Number(event.target.value);
                setDepositAmount(Number.isNaN(value) || value < 0 ? 0 : value);
              }}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              sx={{ width: { xs: "100%", sm: 220 } }}
            />
          </Stack>

          <Box textAlign={{ xs: "left", sm: "right" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Subtotal
            </Typography>
            <Typography variant="h6">
              {formatCurrency(previewCharges.subtotal, form.currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Deposit: {formatCurrency(previewCharges.deposit_amount, form.currency)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sales Tax: {formatCurrency(previewCharges.sales_tax_amount, form.currency)}
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              Total Due: {formatCurrency(previewCharges.total_due, form.currency)}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" sx={{ mr: "auto" }}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="text">
          Save & Close
        </Button>
        <Button onClick={handleConfirm} variant="contained" type="submit">
          Save & Generate
        </Button>
      </DialogActions>
    </Dialog>
  );
};
