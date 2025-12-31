DHAMIRA MICROFINANCE API
Management & Operations System (Internal Use)
1. AUTHENTICATION (REQUIRED FOR ALL PROTECTED ROUTES)
🔐 Login
POST /api/auth/login
Body
{
  "username": "superadmin",
  "password": "ChangeMe123"
}

Response
{
  "_id": "65f9...",
  "username": "superadmin",
  "role": "super_admin",
  "regions": [],
  "token": "JWT_TOKEN_HERE"
}

🔑 How frontend uses auth
Store token


Send in headers for all requests:


Authorization: Bearer JWT_TOKEN_HERE


2. CLIENTS (BORROWERS – NO LOGIN)
👤 Onboard Client
POST /api/clients/onboard
 Auth: super_admin, initiator_admin, approver_admin, loan_officer
 Content-Type: multipart/form-data
Form Fields
name
nationalId
phone
residence          (owned | rented)
businessType
businessLocation
nextOfKinName
nextOfKinPhone
nextOfKinRelationship
groupId
photo              (file)

Response
{
  "message": "Client onboarded successfully",
  "client": { "_id": "...", "name": "...", "groupId": "..." }
}


📋 Get All Clients
GET /api/clients
Response
[
  {
    "_id": "...",
    "name": "...",
    "nationalId": "...",
    "groupId": { "name": "Group A" }
  }
]


3. GROUPS (BORROWER GROUPS)
➕ Create Group
POST /api/groups
{
  "name": "Githurai Women Group",
  "meetingDay": "Wednesday",
  "meetingTime": "10:00",
  "loanOfficerId": "USER_ID"
}


✍️ Assign Signatories
PUT /api/groups/:id/assign-signatories
{
  "signatoryAssignments": [
    { "role": "chairperson", "memberNationalId": "123" },
    { "role": "secretary", "memberNationalId": "456" },
    { "role": "treasurer", "memberNationalId": "789" }
  ]
}


📋 Get Groups
GET /api/groups

4. LOANS (CORE WORKFLOW)
📝 Initiate Loan
POST /api/loans/initiate
 Auth: initiator_admin, loan_officer
{
  "clientNationalId": "34038490",
  "type": "business",
  "amount": 20000,
  "term": 6
}

Rules enforced
Client must have ≥ 20% savings


Must have repaid at least one loan


Group must have signatories



👥 Add Guarantor
POST /api/guarantors
{
  "loanId": "LOAN_ID",
  "clientId": "CLIENT_ID",
  "relationship": "Brother",
  "idCopyUrl": "/uploads/id.jpg",
  "photoUrl": "/uploads/photo.jpg"
}


✅ Accept Guarantor
PUT /api/guarantors/:id/accept

📊 Credit Assessment (5 C’s)
POST /api/credit-assessments
{
  "loanId": "LOAN_ID",
  "character": 4,
  "capacity": 4,
  "capital": 4,
  "collateral": 3,
  "conditions": 4,
  "officerNotes": "Stable business"
}

Rule
Minimum total score = 18 / 25



✔️ Approve Loan
PUT /api/loans/:id/approve
 Auth: approver_admin, super_admin

💰 Disburse Loan (FINAL STEP)
POST /api/loans/:id/disburse
 Auth: super_admin, approver_admin
What frontend should show
“Disburse” button ONLY if:


Loan status = approved


Credit assessment exists


At least 1 guarantor accepted



📋 Get Loans
GET /api/loans

5. REPAYMENTS
💵 Record Repayment
POST /api/repayments
{
  "loanId": "LOAN_ID",
  "amount": 5000,
  "paymentMethod": "mpesa",
  "transactionId": "QWE123ABC"
}


📜 Repayment History
GET /api/repayments/loan/:loanId

6. SYSTEM / UTILITY
❤️ Health Check
GET /api/health



{
  "status": "OK",
  "service": "Microfinance Core API",
  "timestamp": "..."
}


7. FRONTEND EXPECTATIONS (VERY IMPORTANT)
Frontend should:
Never allow clients to login


Role-gate UI actions:


Initiate loan → initiator_admin / loan_officer


Approve → approver_admin


Disburse → super_admin / approver_admin


Follow loan lifecycle strictly


Loan lifecycle for UI:
initiated
→ guarantors added
→ guarantor accepted
→ credit assessed
→ approved
→ disbursed
→ repayments


8. HOW FRONTEND CAN TEST QUICKLY
Login → store token


Create group


Onboard client


Initiate loan


Add guarantor → accept


Submit credit assessment


Approve loan


Disburse loan


Record repayment


All endpoints are live at
 👉 https://dhamira.onrender.com

9. WHAT THIS API IS (AND IS NOT)
✅ Internal management system
 ✅ Microfinance / SACCO-style
 ✅ Officer-driven workflows
 ❌ Not client-facing
 ❌ Not CBK-regulated flows

NEXT (OPTIONAL BUT RECOMMENDED)
If you want, I can:
Export this as OpenAPI / Swagger


Create a Postman collection


Create frontend mock flows


Add role → UI mapping table







MONGO_URI=mongodb+srv://evans_db_user:eXSpgLCnILBTe7jL@cluster0.eemrm5n.mongodb.net/
JWT_SECRET=6fc55fff2e8b11a44855c7b7a1b3894ce2627d140f5668eee6cf3c477971674e846646092bab32f10beb7584b17f3eefd866dcc0834f15559f6374b4590a6654
PORT=5000
GEMINI_API_KEY=AIzaSyDFd_pjSC-ZlAUMjVydK9GShA4MCy__gCA
SEED_SUPERADMIN_USERNAME=superadmin
SEED_SUPERADMIN_PASSWORD=ChangeMe123
SEED_SUPERADMIN_NATIONAL_ID=34038490
SEED_SUPERADMIN_PHONE=254799457182






Microfinance Core API — Frontend Integration Guide
1. System Overview (Mental Model)
This system is role-driven, state-driven, and approval-driven.
There are three operational layers:
Users (staff) → who performs actions
Entities (groups, clients, loans) → what is being managed
State transitions → pending → approved → active
The backend does NOT assume trust.
Everything meaningful follows a request → approval lifecycle.

2. User Roles & Authority Model
Roles (from strongest to weakest)
Role
Description
super_admin
Absolute authority. System owner.
initiator_admin
Cash-side admin. Initiates operations.
approver_admin
Cash-side admin. Approves operations.
loan_officer
Field officer. Originates data.

Core Rule
Loan officers create. Admins approve. Super admin overrides everything.

3. Authentication & Session Model
Login
POST /api/auth/login

Request
{
  "username": "john",
  "password": "secret123"
}

Response
{
  "_id": "64f...",
  "username": "john",
  "role": "loan_officer",
  "regions": ["Mombasa"],
  "token": "JWT_TOKEN"
}

Frontend responsibilities
Store token
Attach to every request:
Authorization: Bearer <token>

Use role to drive UI permissions
Use regions for filtering / scoping

4. Access Control (Very Important)
Backend enforcement
protect → user must be logged in
restrictTo(...) → role-based access
Frontend enforcement
You must also hide UI actions based on role.
Example:
Loan officer must not see “Approve” buttons
Admin must not see “Create client” button
Backend will reject anyway — frontend should prevent bad UX.

5. Groups — Lifecycle & API
Group States
Status
Meaning
legacy
Imported from Excel
provisional
Created by loan officer, pending approval
active
Approved & operational


Create Group (Loan Officer)
POST /api/groups

Who
loan_officer only
What happens
Group created with status = provisional
Awaiting admin approval
Request
{
  "name": "Umoja Women",
  "branchId": "64f...",
  "meetingDay": "Tuesday",
  "meetingTime": "10:00"
}


Approve Group (Admin)
PUT /api/groups/:id/approve

Who
initiator_admin
approver_admin
super_admin
Effect
status → active
Group becomes usable for loans

Assign Signatories (Governance)
PUT /api/groups/:id/signatories

Who
loan_officer (own group)
super_admin (override)
Rules
Exactly 3 roles:
chairperson
secretary
treasurer
Members must already belong to group

Get Groups (List)
GET /api/groups

Scoping rules
loan_officer → only groups assigned to them
admins → all groups
super_admin → all groups
Frontend usage
Group list
Approval queues
Portfolio dashboards

6. Clients — Lifecycle & API
Client States
Status
Meaning
legacy
Imported
pending
Onboarded by officer, waiting approval
active
Approved


Onboard Client (Loan Officer)
POST /api/clients

Who
loan_officer
What happens
Client created with status = pending
Linked to group
Photo required
Multipart form
photo → image file
Other fields → text

Approve Client (Admin)
PUT /api/clients/:id/approve

Who
initiator_admin
approver_admin
super_admin
Effect
Client becomes active
Eligible for loans

Get Clients
GET /api/clients

Scoping
Loan officer → only their groups
Admins → all clients

7. Loans (Preview — High Level)
You already wired:
/api/loans
/api/repayments
/api/guarantors
/api/credit-assessments

Frontend should expect same lifecycle pattern:
Loan Officer → request loan
Admin → approve loan
System → track repayments
Analytics → portfolio health
(We will document loans next.)

8. Static Assets (Client Photos)
GET /uploads/<filename>

Frontend:
<img src="https://api.domain.com/uploads/1699-photo.jpg" />


9. Health Check
GET /api/health

Use for:
uptime checks
dev sanity tests

10. Error Model (Consistent Everywhere)
Response
{
  "message": "Access denied: insufficient permissions",
  "stack": "..."
}

Frontend:
Use message only
Ignore stack in production

11. Frontend Architecture Recommendation
Suggested screens
Login
Dashboard (role-aware)
Groups
Create (loan officer)
Approve (admin)
Clients
Onboard (loan officer)
Approve (admin)
Loans
Request
Approve
Repayments
Analytics (admin / super admin)
UI driven by:
user.role
entity status

12. Design Philosophy (Important)
This backend is built for:
Auditability
Financial safety
Human workflows
Nothing is assumed.
Everything is explicit.
No silent side-effects.

Microfinance Core – M-Pesa Integration Documentation
Audience: Frontend Engineers, QA, Integrators
 Backend stack: Node.js, Express, MongoDB
 Payment rails: Safaricom Daraja (B2C, C2B)

1. System Overview (Mental Model)
Money flows
There are two independent flows:
B2C (Loan Disbursement)
 Backend → Safaricom → Client phone


C2B (Loan Repayment)
 Client phone → Safaricom → Backend


Frontend never calls Safaricom directly.
 Frontend only talks to our API.

2. Key Concepts (Important for Frontend)
Loan lifecycle
initiated → approved → disbursement_pending → disbursed → repaid / defaulted

Accounting (simplified)
Ledger is append-only


Loan balances are derived from ledger


Repayments are split automatically:


interest first


principal next


overpayment → suspense


Frontend never calculates balances.

3. API ENDPOINTS (Authoritative)
3.1 Loan Disbursement (B2C – internal)
Purpose: Trigger loan disbursement to client phone
 Called by: Admin UI
 Auth: Required (admin roles)
POST /api/loans/:loanId/disburse

Request
POST /api/loans/64f1a9.../disburse
Authorization: Bearer <JWT>
Content-Type: application/json

No body required.
Response
{
  "message": "Disbursement initiated",
  "loanId": "64f1a9...",
  "transactionId": "650abc..."
}

What happens after
Backend sends B2C request to Safaricom


Safaricom later calls /api/mpesa/b2c/result


Loan becomes disbursed only after callback


Frontend should:
Show “Disbursement pending”


Poll loan status or refresh later



3.2 B2C Result Callback (Safaricom → Backend)
Purpose: Finalize loan disbursement
 Auth: ❌ none (public, Safaricom only)
POST /api/mpesa/b2c/result

Payload (example from Safaricom)
{
  "Result": {
    "ResultCode": 0,
    "ResultDesc": "The service request is processed successfully.",
    "OriginatorConversationID": "AG_20240901_12345",
    "TransactionID": "QWE123ABC"
  }
}

Backend behavior
Marks transaction success/failure


Posts ledger entries


Updates loan to disbursed


Frontend never calls this.

3.3 Loan Repayment (C2B – Paybill)
Purpose: Client repays loan via M-Pesa
 Initiated by: Client using phone
 Frontend role: Show instructions
Paybill details (sandbox)
Paybill: 600000
Account number: <loanId>

Client enters:
Amount (any amount)


Phone PIN


Safaricom later calls backend.

3.4 C2B Confirmation Callback (Safaricom → Backend)
POST /api/mpesa/c2b/confirmation

Payload (example)
{
  "TransID": "NLJ7RT61SV",
  "MSISDN": "254708374149",
  "TransAmount": "500",
  "BillRefNumber": "64f1a9..."
}

Backend behavior
Records transaction


Allocates payment:


interest


principal


suspense (if overpaid)


Updates loan balances


Frontend never calls this.

3.5 Repayment History (Frontend dashboard)
GET /api/repayments/:loanId

Auth: Required
 Roles: super_admin, initiator_admin, approver_admin, loan_officer
Response
{
  "loanId": "64f1a9...",
  "total_paid_cents": 250000,
  "outstanding_cents": 150000,
  "repayments": [
    {
      "_id": "650abc...",
      "amount_cents": 50000,
      "mpesaReceipt": "NLJ7RT61SV",
      "createdAt": "2025-01-10T10:12:00Z"
    }
  ]
}

Frontend:
Displays history


Displays balances


No calculations



4. Testing Guide (Sandbox)
4.1 Sandbox Credentials
Provided by Safaricom Developer Portal:
Consumer Key


Consumer Secret


Initiator Name: testapi


Shortcode: 600000


Configured in .env.

4.2 Exposing Callbacks (Local Dev)
Backend must be reachable publicly.
Recommended:
ngrok http 5000

Example:
https://abcd-1234.ngrok-free.app

Set callbacks:
/api/mpesa/b2c/result
/api/mpesa/c2b/confirmation
/api/mpesa/c2b/validation


4.3 Register C2B URLs (Once)
curl -X POST https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-H "Content-Type: application/json" \
-d '{
  "ShortCode": "600000",
  "ResponseType": "Completed",
  "ConfirmationURL": "https://abcd.ngrok.app/api/mpesa/c2b/confirmation",
  "ValidationURL": "https://abcd.ngrok.app/api/mpesa/c2b/validation"
}'


4.4 Test Flow (End-to-End)
Step 1 – Create & approve loan
Admin UI → approve loan
Step 2 – Disburse loan
POST /api/loans/:loanId/disburse

Expect:
Loan → disbursement_pending


Later → disbursed


Step 3 – Simulate repayment
Use Safaricom sandbox tools or Paybill simulator:
Paybill: 600000


Account: <loanId>


Amount: partial (e.g. 500)


Step 4 – Verify backend
Check:
/api/repayments/:loanId


Loan outstanding reduced


Ledger entries created



5. Frontend Responsibilities (Clear Contract)
Frontend SHOULD:
Trigger disbursement


Display loan status


Display balances


Display repayment history


Show Paybill instructions


Frontend MUST NOT:
Call Safaricom APIs


Calculate interest


Calculate balances


Change loan state manually



6. Common Errors & Expected Behavior
Situation
What happens
Duplicate C2B callback
Ignored (idempotent)
Overpayment
Stored in suspense
B2C failure
Loan stays approved
Partial repayment
Loan remains disbursed
Full repayment
Loan → repaid


7. Summary (What Changed Recently)
Recent backend changes frontend should know:
Repayments now split interest vs principal


Overpayments supported


Loan status fully derived from ledger


M-Pesa callbacks moved to /api/mpesa/*




