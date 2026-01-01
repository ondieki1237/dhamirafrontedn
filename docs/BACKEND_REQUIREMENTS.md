# Backend API Requirements for Refined Loan Lifecycle

To support the updated frontend workflows, ensure the following API endpoints are implemented in the backend.

## 1. Savings Management
### 📜 Get Savings History
**Endpoint**: `GET /api/savings`
**Response**: List of transactions including `clientId`, `amountKES` (positive or negative), `description`, and `createdAt`.

### ➕/➖ Log Savings Adjustment
**Endpoint**: `POST /api/savings`
**Auth**: `approver_admin`, `super_admin`
**Payload**:
```json
{
  "clientId": "CLIENT_ID",
  "amountKES": 500,  // Positive for addition, negative for deduction
  "notes": "Weekly deposit"
}
```
**Responsibility**: Update `savings_balance_cents` in the `Client` document. Record the transaction in the history collection.

## 2. Loan Lifecycle Rules (Backend Enforcement)
### 📝 Initial Loan Initiation
**Endpoint**: `POST /api/loans/initiate`
**Rule**: (Removed) Verify that `client.savings_balance_cents >= (payload.amountKES * 100 * 0.2)`. 

### 💰 Disburse Loan
**Endpoint**: `POST /api/loans/:id/disburse`
**Rule**: Verify status is `approved`. Trigger M-Pesa B2C API. Change status to `disbursed`.

## 3. User Roles
Ensure the following roles are strictly enforced in the Auth middleware:
- `loan_officer`: Maker for Clients/Groups, Guarantors, and Assessments.
- `initiator_admin`: Maker for Loan Initiation and Repayments.
- `approver_admin`: Checker for Clients/Groups, Savings, Loan Approval, and Disbursement.
- `super_admin`: Bypass/Global access.
