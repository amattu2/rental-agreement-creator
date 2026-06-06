"use client";

import { RentalAgreementForm } from "@/components/form/index";
import { IframeWrapper } from "@/components/iframe";
import { ENV_SCHEMA } from "@/schemas/env";
import { FormSchema, FORM_SCHEMA } from "@/schemas/form";
import { generateRentalPDF } from "@/utils/pdf";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Grid } from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

const DefaultForm: FormSchema = {
  agreement_number: "",
  rentee: {
    full_name: "",
    address_street1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    verified: false,
    driver_license_number: "",
    driver_license_state: "",
    driver_license_expiration: dayjs(null),
    date_of_birth: dayjs(null),
    cell_phone: "",
    alternate_phone: "",
    email: "",
  },
  rentee_employer: {
    company: "",
    position: "",
    address_street1: "",
    address_city: "",
    address_state: "",
    address_zip: "",
  },
  rentee_insurance: {
    company: "",
    policy_number: "",
  },
  additional_drivers: [],
  vehicle_damage_waiver: undefined,
  personal_accident_insurance: undefined,
  rental_vehicle: {
    identifier: "",
    VIN: "",
    license_plate: "",
    year: new Date().getFullYear(),
    make: "",
    model: "",
    color: "",
  },
  rental_agreement_info: {
    odometer_in: 0,
    date_in: dayjs(null),
    odometer_out: 0,
    date_out: dayjs(),
    max_distance: 0,
    max_distance_measurement: "MI",
    max_payload: 0,
    max_payload_measurement: "LB",
    fuel_level_in: "F",
    fuel_level_out: "F",
  },
};

const Page = () => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const methods = useForm<FormSchema>({
    resolver: zodResolver(FORM_SCHEMA),
    defaultValues: DefaultForm,
  });

  const onSubmit = async (data: FormSchema) => {
    const envData = z.parse(ENV_SCHEMA, {
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
      NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
      NEXT_PUBLIC_ADDRESS_LINE1: process.env.NEXT_PUBLIC_ADDRESS_LINE1,
      NEXT_PUBLIC_ADDRESS_LINE2: process.env.NEXT_PUBLIC_ADDRESS_LINE2,
    });

    setObjectUrl(URL.createObjectURL(await generateRentalPDF(envData, data)));
  };

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
