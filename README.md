# Introduction

[![Vitest](https://github.com/amattu2/rental-agreement-creator/actions/workflows/test.yml/badge.svg)](https://github.com/amattu2/rental-agreement-creator/actions/workflows/test.yml)
[![TypeScript](https://github.com/amattu2/rental-agreement-creator/actions/workflows/typescript.yml/badge.svg)](https://github.com/amattu2/rental-agreement-creator/actions/workflows/typescript.yml)
[![ESLint](https://github.com/amattu2/rental-agreement-creator/actions/workflows/lint.yml/badge.svg)](https://github.com/amattu2/rental-agreement-creator/actions/workflows/lint.yml)

Rental Agreement Creator is a lightweight agreement drafting tool built with Next.js, Material UI, and jsPDF.
It helps rental businesses prepare standardized agreements quickly while keeping a live PDF preview in sync
with form inputs.

Natively supports the following features:

- Create and edit automotive rental agreements from a structured form
- Live PDF generation and in-app preview while filling agreement details
- Client-side persistence with IndexedDB for previously created agreements
- Reopen and update existing agreements using URL-based record identifiers
- QR Code generation for agreement verification or quick access to online records
- Configurable company branding via environment variables

Upcoming features:

- [ ] Automatic tax and total cost calculation
- [ ] Vehicle management
- [ ] Preexisting customer selection and management

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

<img width="1210" height="881" alt="list_page" src="https://github.com/user-attachments/assets/d8111b9b-ebce-4bb2-98fe-e62e0be4a105" />

<img width="1601" height="887" alt="editor_screen" src="https://github.com/user-attachments/assets/6af222d2-b15a-481e-8a47-85cfa02ce397" />
