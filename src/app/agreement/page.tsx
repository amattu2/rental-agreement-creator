"use client";

import { RentalAgreementForm } from "@/components/form/index";
import { IframeWrapper } from "@/components/iframe";
import { useDatabaseApi } from "@/database/provider";
import { ENV_SCHEMA } from "@/schemas/env";
import { FormSchema, FORM_SCHEMA } from "@/schemas/form";
import { DEFAULT_FORM } from "@/config/constants";
import { generateRentalPDF } from "@/utils/pdf";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid } from "@mui/material";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const databaseApi = useDatabaseApi();

  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const agreementUuid = useMemo<string | null>(() => searchParams.get("uuid"), [searchParams]);

  const methods = useForm<FormSchema>({
    resolver: zodResolver(FORM_SCHEMA),
  });

  const renderPDF = async (data: FormSchema) => {
    const envData = z.parse(ENV_SCHEMA, {
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
    });

    setObjectUrl(URL.createObjectURL(await generateRentalPDF(envData, data)));
  };

  const onSubmit = async (data: FormSchema) => {
    try {
      if (agreementUuid) {
        await databaseApi.updateAgreement(agreementUuid, data);
      } else {
        const agreement = await databaseApi.createAgreement(data);

        router.push(`/agreement?uuid=${agreement.uuid}`);
      }
    } catch (error) {
      console.error("Failed to add agreement to database", error);
    }

    renderPDF(data);
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
            methods.reset(record.agreement);
            renderPDF(record.agreement);
          }
        })
        .catch((error) => {
          console.error("Failed to load agreement", error);
        });
    } else {
      methods.reset(DEFAULT_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container>
      <Grid size={{ lg: 6, xs: 12 }}>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={methods.handleSubmit(onSubmit)} sx={{ p: 3 }}>
            <RentalAgreementForm />
          </Box>
        </FormProvider>
      </Grid>
      <Grid size={{ lg: 6, xs: 12 }}>
        <IframeWrapper src={objectUrl} />
      </Grid>
    </Grid>
  );
};

export default Page;
