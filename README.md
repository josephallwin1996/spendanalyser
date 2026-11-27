# Tandem

Tandem is a calm, private spending tracker for couples. It combines a shared
transaction ledger, household budgets, month-by-month trends, and spending
insights in one responsive, installable web app.

> **Money, in sync - without the spreadsheets.**

## Features

- **Shared households:** create or join a two-person household with a unique invite code.
- **Expense and income tracking:** add transactions manually with categories, notes, payer, and date.
- **Personal and joint payments:** record who paid or mark an expense as paid from a joint account.
- **Monthly dashboard:** compare spending, income, net cash flow, budget balance, and joint spending.
- **Category budgets:** set monthly ceilings and see spending progress, remaining budget, and over-budget categories.
- **Spending insights:** review 3-, 6-, or 12-month trends, cash flow, savings rate, merchants, categories, and weekdays.
- **Ledger filters:** search and filter transactions by month, category, payer, and transaction type.
- **CSV import:** detect common date, description, amount, category, and transaction-type columns; supports comma, semicolon, and tab delimiters.
- **Household settings:** update the household name and currency, view the invite code, edit profiles, or leave a household.
- **Secure sessions:** password-based authentication with signed, HTTP-only session cookies.
- **Progressive Web App:** install Tandem on supported devices and use an offline fallback page.
- **Dark, responsive interface:** purpose-built layouts for desktop and mobile screens.

## Built with

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [MongoDB](https://www.mongodb.com/) with the official Node.js driver
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
- [Zod](https://zod.dev/) and [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [JOSE](https://github.com/panva/jose) for signed session tokens
- Service Worker and Web App Manifest APIs

## Requirements

- Node.js 20 or later
- npm
- A local MongoDB server or MongoDB Atlas cluster

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/josephallwin1996/spendanalyser.git
cd spendanalyser
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

On Windows PowerShell, you can instead use:

```powershell
Copy-Item .env.example .env.local
```

Configure `.env.local`:

```dotenv
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=tandem
AUTH_SECRET=replace-with-a-long-random-string
```

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string for a local server or Atlas. |
| `MONGODB_DB` | No | Database name. Defaults to `tandem`. |
| `AUTH_SECRET` | Yes | Secret used to sign session cookies. It must be at least 16 characters. |

Generate a strong session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start MongoDB

For a local MongoDB installation, start the MongoDB service and make sure the
value of `MONGODB_URI` points to it. For MongoDB Atlas, use the Atlas connection
string and ensure network access is allowed for the development machine.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app automatically creates the required MongoDB indexes on first use.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create an optimized production build. |
| `npm run start` | Serve the production build. |
| `npm run lint` | Run ESLint across the project. |

Run lint and build checks before submitting changes:

```bash
npm run lint
npm run build
```

## Application pages

| Route | Purpose |
| --- | --- |
| `/` | Public landing page. |
| `/login` | Sign in to an existing account. |
| `/signup` | Create a Tandem account. |
| `/onboarding` | Create a household or join one with an invite code. |
| `/dashboard` | Monthly overview, spending pace, budgets, and recent activity. |
| `/transactions` | Search, filter, add, edit, delete, and import transactions. |
| `/budgets` | Configure category budgets for the selected month. |
| `/insights` | Explore 3-, 6-, or 12-month spending trends. |
| `/settings` | Manage profile, household, currency, and invite settings. |

## CSV import format

The CSV importer is header-based and supports common aliases such as `date`,
`transaction date`, `description`, `merchant`, `amount`, `value`, `category`,
and `type`.

A basic import file can look like:

```csv
date,description,amount,category,type
2026-11-27,Grocery market,64.50,groceries,expense
2026-11-26,Salary,2500.00,income,income
```

The importer:

- requires date, description, and amount columns;
- accepts `YYYY-MM-DD`, numeric date forms, and parsable date strings;
- recognizes income values such as `income`, `credit`, and `received`;
- recognizes expense values such as `expense`, `debit`, and `payment`;
- detects CSV, semicolon, and tab delimiters;
- parses decimal and thousands separators used in common bank exports;
- skips invalid or incomplete rows and reports how many were skipped.

## MongoDB collections

Tandem stores application data in four collections:

- `users`: account credentials, profile, household membership, and color.
- `households`: household name, invite code, and currency.
- `transactions`: expense and income entries, category, payer, date, and notes.
- `budgets`: household category budget amounts.

Useful indexes are created automatically for login email uniqueness, household
membership, invite codes, transaction queries, and category budgets.

## Project structure

```text
src/
  app/
    (app)/        Authenticated dashboard, ledger, budgets, insights, and settings
    (auth)/       Sign-in and sign-up routes
    actions/      Server actions for mutations
    onboarding/   Household creation and joining flow
  components/
    app-shell/    Navigation and page layout
    budgets/      Budget editor
    dashboard/    Overview cards and charts
    insights/     Trend and insight visualizations
    transactions/ Transaction entry, import, search, and views
    ui/           Shared interface components
  lib/
    analytics.ts  Dashboard and insight calculations
    auth.ts       Viewer and household authorization
    csv.ts        CSV parsing and normalization
    db.ts         MongoDB client and indexes
    session.ts    Session cookie creation and verification
    types.ts      Data and serialized application types
public/
  sw.js           Service worker
  offline.html    PWA offline fallback
  icon-*.png      PWA and app icon assets
```

## Progressive Web App

The app registers a service worker only in production builds. It provides a
standalone app manifest, installable icons, a portrait-first layout, and an
offline fallback page. The service worker is not registered during local
development.

## Production deployment

Tandem can be deployed to any host that supports Next.js Server Components and
server actions.

1. Set `MONGODB_URI`, `MONGODB_DB`, and `AUTH_SECRET` in the host environment.
2. Use HTTPS in production so authentication cookies are marked secure.
3. Allow the deployment environment to reach the MongoDB server or Atlas cluster.
4. Build and start the app:

   ```bash
   npm run build
   npm run start
   ```

For example, a MongoDB Atlas database can be supplied through `MONGODB_URI`
without changing the application code.

## Security notes

- Passwords are hashed with `bcryptjs`; plain-text passwords are not stored.
- Session tokens are signed with `AUTH_SECRET` and stored in HTTP-only cookies.
- Production session cookies use `Secure` and `SameSite=Lax`.
- MongoDB operations are scoped to the authenticated household where applicable.
- Environment secrets should never be committed to source control.

## Contributing

Contributions are welcome. Please keep changes focused and verify the project
before opening a pull request:

1. Create a branch from `master`.
2. Make your implementation and test changes.
3. Run `npm run lint`.
4. Run `npm run build`.
5. Open a pull request with a concise description and testing notes.

## License

No license file is currently included. All rights remain with the repository
owner unless a license is explicitly added.
