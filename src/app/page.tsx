"use client";

import { TimesheetForm } from "@/components/form";
import { IframeWrapper } from "@/components/iframe";
import { FormSchema, FORM_SCHEMA } from "@/schemas/form";
import { generateRentalPDF } from "@/utils/pdf";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

const DefaultForm: FormSchema = {
  monthYear: dayjs(),
  workDays: {
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: false,
  },
  events: [],
  employees: [{ fullName: "" }],
};

const CachedForm: Pick<FormSchema, "workDays" | "employees"> = {
  workDays: DefaultForm.workDays,
  employees: DefaultForm.employees,
};

const Page = () => {
  const [prevForm, setPrevForm] = useLocalStorage<typeof CachedForm>("previous-form", CachedForm, {
    initializeWithValue: false,
  });
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const methods = useForm<FormSchema>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: {
      ...DefaultForm,
    },
  });

  const onSubmit = async (data: FormSchema) => {
    // TODO: Use the actual form for this data
    const [COMPANY_NAME, ADDRESS_LINE1, ADDRESS_LINE2] = [
      process.env.NEXT_PUBLIC_COMPANY_NAME || "",
      process.env.NEXT_PUBLIC_COMPANY_ADDRESS_LINE1 || "",
      process.env.NEXT_PUBLIC_COMPANY_ADDRESS_LINE2 || "",
    ];
    const newData = {
      COMPANY_NAME,
      ADDRESS_LINE1,
      ADDRESS_LINE2,
    };

    setObjectUrl(URL.createObjectURL(await generateRentalPDF(newData)));
    setPrevForm({
      workDays: data.workDays,
      employees: data.employees,
    });
  };

  useEffect(() => {
    methods.reset({
      ...methods.getValues(),
      ...prevForm,
    });
  }, [methods, prevForm]);

  useEffect(() => {
    if (objectUrl) {
      window.open(objectUrl, "_blank");
    }
    
    return () => {
      if (!objectUrl) {
        return;
      }

      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <Grid container>
      <Grid size={{ lg: 6, xs: 12 }}>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={methods.handleSubmit(onSubmit)} sx={{ p: 3 }}>
            <TimesheetForm />
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
