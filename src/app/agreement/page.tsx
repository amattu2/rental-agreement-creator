"use client";

import { RentalAgreementForm } from "@/components/form/index";
import { IframeWrapper } from "@/components/iframe";
import { useDatabaseApi } from "@/database/provider";
import { ENV_SCHEMA } from "@/schemas/env";
import { FormSchema, FORM_SCHEMA } from "@/schemas/form";
import { DEFAULT_FORM } from "@/config/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import z from "zod";
import { BillingStateProvider } from "@/components/BillingContext";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const databaseApi = useDatabaseApi();

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isArchived, setIsArchived] = useState<boolean>(false);
  const agreementUuid = useMemo<string | null>(() => searchParams.get("uuid"), [searchParams]);

  const methods = useForm<FormSchema>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: DEFAULT_FORM,
    disabled: isArchived,
  });

  const renderPDF = async (record: AgreementRecord) => {
    const { generateAgreement } = await import("@/pdfs/agreement");

    const envData = z.parse(ENV_SCHEMA, {
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
      NEXT_PUBLIC_DEPLOYMENT_URL: process.env.NEXT_PUBLIC_DEPLOYMENT_URL,
    });

    setObjectUrl(URL.createObjectURL(await generateAgreement(envData, record)));
  };

  const onSubmit: SubmitHandler<FormSchema> = async (data: FormSchema) => {
    try {
      await databaseApi.upsertVehicle(data.rental_vehicle);

      let record: AgreementRecord;
      if (agreementUuid) {
        record = await databaseApi.updateAgreement(agreementUuid, data);
      } else {
        record = await databaseApi.createAgreement(data);
        router.push(`/agreement?uuid=${record.uuid}`);
      }

      await renderPDF(record);
      methods.reset(record.agreement);
    } catch (error) {
      console.error("Failed to add agreement to database", error);
    }
  };

  useEffect(() => {
    return () => {
      if (!objectUrl) {
        return;
      }

      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  useEffect(() => {
    if (agreementUuid) {
      databaseApi
        .getAgreement(agreementUuid)
        .then((record) => {
          if (record) {
            setIsArchived(record.status === "archived");
            methods.reset(record.agreement);
            renderPDF(record);
          }
        })
        .catch((error) => {
          console.error("Failed to load agreement", error);
        });
    } else {
      methods.reset(DEFAULT_FORM);
      setIsArchived(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container>
      <Grid size={{ lg: 6, xs: 12 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <FormProvider {...methods}>
            <BillingStateProvider>
              <Box component="form" onSubmit={methods.handleSubmit(onSubmit)} sx={{ p: 3 }}>
                <RentalAgreementForm />
              </Box>
            </BillingStateProvider>
          </FormProvider>
        </LocalizationProvider>
      </Grid>
      <Grid size={{ lg: 6, xs: 12 }}>
        <IframeWrapper src={objectUrl} />
      </Grid>
    </Grid>
  );
};

export default Page;
