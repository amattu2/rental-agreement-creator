"use client";

import { useCallback, useEffect, useRef } from "react";
import { Path, useController, useFormContext } from "react-hook-form";
import { Box, Button, Stack, styled, Typography } from "@mui/material";
import type { FormSchema } from "@/schemas/form";
import { isCanvasBlank } from "@/utils/canvas";

const StyledContainer = styled(Box)(({ theme }) => ({
  border: "1px solid",
  borderColor: theme.palette.divider,
  borderRadius: 1,
  overflow: "hidden",
}));

const StyledCanvas = styled("canvas")(({ theme }) => ({
  display: "block",
  width: "100%",
  height: 120,
  touchAction: "none",
  backgroundColor: theme.palette.background.paper,
}));

type SignatureInputProps = {
  name: Path<FormSchema>;
  label: string;
  helperText?: string;
};

export const SignatureInput = ({ name, label, helperText }: SignatureInputProps) => {
  const { control } = useFormContext<FormSchema>();
  const {
    field,
    fieldState: { error },
  } = useController<FormSchema, Path<FormSchema>>({
    name,
    control,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  const getCanvasCoordinates = useCallback((event: PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    return { x, y };
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawFromDataUrl = useCallback(
    (dataUrl: string) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      clearCanvas();

      if (!dataUrl) {
        return;
      }

      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = dataUrl;
    },
    [clearCanvas]
  );

  const saveValue = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isCanvasBlank(canvas)) {
      field.onChange("");
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");
    field.onChange(dataUrl);
  }, [field]);

  const startDrawing = useCallback(
    (event: PointerEvent) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) {
        return;
      }

      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);

      const { x, y } = getCanvasCoordinates(event);
      isDrawingRef.current = true;

      context.beginPath();
      context.moveTo(x, y);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#000";
      context.lineWidth = 3.4;
    },
    [getCanvasCoordinates]
  );

  const draw = useCallback(
    (event: PointerEvent) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || !isDrawingRef.current) {
        return;
      }

      event.preventDefault();
      const { x, y } = getCanvasCoordinates(event);

      context.lineTo(x, y);
      context.stroke();
    },
    [getCanvasCoordinates]
  );

  const stopDrawing = useCallback(
    (event: PointerEvent) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || !isDrawingRef.current) {
        return;
      }

      event.preventDefault();
      isDrawingRef.current = false;

      context.closePath();
      saveValue();
    },
    [saveValue]
  );

  useEffect(() => {
    drawFromDataUrl((field.value as string | undefined) ?? "");
  }, [drawFromDataUrl, field.value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.addEventListener("pointerdown", startDrawing);
    canvas.addEventListener("pointermove", draw);
    canvas.addEventListener("pointerup", stopDrawing);
    canvas.addEventListener("pointerleave", stopDrawing);

    return () => {
      canvas.removeEventListener("pointerdown", startDrawing);
      canvas.removeEventListener("pointermove", draw);
      canvas.removeEventListener("pointerup", stopDrawing);
      canvas.removeEventListener("pointerleave", stopDrawing);
    };
  }, [draw, startDrawing, stopDrawing]);

  return (
    <Stack spacing={1}>
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {label}
      </Typography>
      <StyledContainer>
        <StyledCanvas ref={canvasRef} width={960} height={240} aria-label={label} />
      </StyledContainer>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="caption" color={error ? "error.main" : "text.secondary"}>
          {error?.message ?? helperText ?? "Supports mouse and touch input (if applicable)."}
        </Typography>
        <Button
          type="button"
          size="small"
          onClick={() => {
            clearCanvas();
            field.onChange("");
          }}
        >
          Clear
        </Button>
      </Stack>
    </Stack>
  );
};
