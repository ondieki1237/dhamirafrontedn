# Dhamira Microfinance Frontend

Next.js frontend application for Dhamira Microfinance Management System.

## Environment Configuration

### Development (Local)
The application automatically uses `http://localhost:5011` when running in development mode.

### Production (Deployment)
The application uses `https://dhamira.codewithseth.co.ke` when deployed.

### Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=https://dhamira.codewithseth.co.ke
LOCAL_API_URL=http://localhost:5011
```

## Getting Started

### Install Dependencies
```bash
npm install
# or
pnpm install
```

### Run Development Server
```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** Make sure your backend is running on `http://localhost:5011` for local development.

### Build for Production
```bash
npm run build
npm start
```

## Default Login Credentials

```
Username: superadmin
Password: ChangeMe123
```

## Tech Stack

- **Framework:** Next.js 16 (React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, Shadcn/ui
- **State Management:** React Hooks
- **API Client:** Fetch API with custom helpers

## Project Structure

```
app/
  ├── api/auth/login/     # Authentication proxy route
  ├── analytics/          # Analytics & reports
  ├── audit-logs/         # System activity logs
  ├── clients/            # Client management
  ├── credit-assessments/ # 5 C's credit evaluation
  ├── dashboard/          # Main dashboard
  ├── groups/             # Group management
  ├── guarantors/         # Loan guarantors
  ├── loans/              # Loan lifecycle management
  ├── repayments/         # Payment tracking
  └── settings/           # User settings

components/
  ├── dashboard-*.tsx     # Dashboard components
  ├── sidebar.tsx         # Navigation
  └── ui/                 # Reusable UI components

lib/
  ├── api.ts              # API client & helpers
  └── utils.ts            # Utility functions
```

## Key Features

- 🔐 Role-based access control (super_admin, initiator_admin, approver_admin, loan_officer)
- 👥 Client & group management with approval workflows
- 💰 Complete loan lifecycle (initiate → approve → disburse → repay)
- 📊 Credit assessment with 5 C's framework
- 💳 M-Pesa integration for disbursement & repayments
- 📈 Analytics & reporting
- 🔍 Audit logs for compliance
- 📱 Fully responsive design

## API Integration

The frontend communicates with the backend API documented in `DOCUMENTATION.md`. All API calls are authenticated using JWT tokens stored in both HttpOnly cookies and localStorage.

## Development Notes

- **Environment Detection:** The app automatically detects `NODE_ENV` and uses the appropriate API URL
- **Token Management:** Tokens are stored in cookies (SSR-safe) with localStorage fallback
- **Error Handling:** All API calls include error handling with toast notifications
- **Type Safety:** Full TypeScript support with proper type definitions

## Deployment

When deploying to production:
1. Ensure `NEXT_PUBLIC_API_URL` is set to your production backend URL
2. Run `npm run build` to create an optimized production build
3. Deploy the `.next` folder and run `npm start`

For Vercel/Netlify deployment, set the environment variable in your platform's dashboard.

## License

Private - Dhamira Microfinance © 2025
