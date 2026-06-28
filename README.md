# Introduction

[![Vitest](https://github.com/amattu2/rental-agreement-creator/actions/workflows/test.yml/badge.svg)](https://github.com/amattu2/rental-agreement-creator/actions/workflows/test.yml)
[![TypeScript](https://github.com/amattu2/rental-agreement-creator/actions/workflows/typescript.yml/badge.svg)](https://github.com/amattu2/rental-agreement-creator/actions/workflows/typescript.yml)
[![ESLint](https://github.com/amattu2/rental-agreement-creator/actions/workflows/lint.yml/badge.svg)](https://github.com/amattu2/rental-agreement-creator/actions/workflows/lint.yml)

Rental Agreement Creator is a lightweight agreement drafting tool built with Next.js, Material UI, and jsPDF.
It helps rental businesses prepare standardized agreements quickly while keeping a live PDF preview in sync
with form inputs.

Natively supports the following features:

- Create and edit automotive rental agreements from a structured form
- Agreement PDF generation and in-app preview while filling agreement details
- Agreement archival and thermal receipt generation (80mm)
- QR Code generation for agreement verification or quick access to online records
- Client-side persistence with IndexedDB for previously created agreements
- Reopen and update existing agreements using URL-based record identifiers
- Configurable company branding via environment variables

Upcoming features:

- [ ] Vehicle management
- [ ] Customer management
- [ ] Digital receipt emailing

# Getting Started

Clone the repository locally, for example:

```bash
git clone github.com/amattu2/rental-agreement-creator.git
```

Install dependencies:

```bash
npm install
```

Create your local environment file and adjust company/app values as needed:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

Open <http://localhost:3000> to view the app.

# Tech Stack

- Next.js (App Router) + React + TypeScript
- Material UI (MUI)
- React Hook Form + Zod validation
- jsPDF
- Vitest + Testing Library

# Previews

<img width="2736" height="1638" alt="agreements-list-page" src="https://github.com/user-attachments/assets/a6a79688-f5c5-489e-b579-a0908fc3d46f" />

<img width="1917" height="909" alt="agreement-form-page" src="https://github.com/user-attachments/assets/f92e9347-b3d3-4263-b7f8-d9083aeb9f77" />

<img width="791" height="1024" alt="agreement-pdf" src="https://github.com/user-attachments/assets/29db67c2-d892-4bb4-8596-2ded92f4bd41" />

<img width="945" height="2186" alt="agreement-receipt-pdf" src="https://github.com/user-attachments/assets/0c1e695d-4c5c-470d-ae60-c2298f1f5335" />
