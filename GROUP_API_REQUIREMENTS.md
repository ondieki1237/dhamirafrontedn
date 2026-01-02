# Group API Updates - Backend Requirements

## Updated Group Schema Fields

The frontend now expects the following fields to be included when fetching groups:

### Required Fields in API Response

```typescript
{
  _id: string,
  name: string,
  status: "pending" | "active" | "suspended",
  meetingDay: string,
  meetingTime: string,
  
  // Branch relationship (should be populated)
  branchId: {
    _id: string,
    name: string,
    code: string
  },
  
  // Loan Officer relationship (should be populated)
  loanOfficer: {
    _id: string,
    name: string,
    username: string
  },
  
  // Signatories (should be populated with client details)
  chairperson: {
    _id: string,
    name: string,
    nationalId: string
  },
  secretary: {
    _id: string,
    name: string,
    nationalId: string
  },
  treasurer: {
    _id: string,
    name: string,
    nationalId: string
  },
  
  // Stats (optional but recommended)
  membersCount: number,
  activeLoansCount: number,
  totalLent: number,
  progress: number
}
```

## API Endpoints That Need Updates

### 1. GET /api/groups
**List all groups**

Should populate:
- `branchId` → Branch details
- `loanOfficer` → Loan Officer details  
- `chairperson` → Client details
- `secretary` → Client details
- `treasurer` → Client details

Example Mongoose query:
```javascript
Group.find()
  .populate('branchId', 'name code')
  .populate('loanOfficer', 'name username')
  .populate('chairperson', 'name nationalId')
  .populate('secretary', 'name nationalId')
  .populate('treasurer', 'name nationalId')
```

### 2. GET /api/groups/:id
**Get single group details**

Should populate the same fields as the list endpoint, plus potentially:
- `members` array with full client details

Example Mongoose query:
```javascript
Group.findById(id)
  .populate('branchId', 'name code location')
  .populate('loanOfficer', 'name username email')
  .populate('chairperson', 'name nationalId phone')
  .populate('secretary', 'name nationalId phone')
  .populate('treasurer', 'name nationalId phone')
  .populate('members', 'name nationalId phone savings_balance_cents')
```

### 3. PUT /api/groups/:id
**Update group details**

Should accept the following fields in the request body:
```javascript
{
  name: String,
  meetingDay: String,
  meetingTime: String,
  chairperson: ObjectId,  // Client ID
  secretary: ObjectId,    // Client ID
  treasurer: ObjectId,    // Client ID
  // Admin-only fields
  branchId: ObjectId,
  loanOfficer: ObjectId,
  status: String
}
```

Should return the updated group with all populated fields.

### 4. Backend Validation Required

When updating a group:
1. Validate that chairperson, secretary, and treasurer are all different clients
2. If status is "active", all 3 signatories must be present
3. Validate that signatories are actual clients in the system
4. Validate that clients belong to the same branch as the group

## Migration Notes

If your backend currently uses a `signatories` array field like:
```javascript
signatories: [{
  role: String,
  memberNationalId: String
}]
```

You should migrate to direct references:
```javascript
chairperson: { type: ObjectId, ref: 'Client' },
secretary: { type: ObjectId, ref: 'Client' },
treasurer: { type: ObjectId, ref: 'Client' }
```

This allows proper population and better data integrity.

## Testing Checklist

- [ ] GET /api/groups returns populated branchId, loanOfficer, and signatories
- [ ] GET /api/groups/:id returns fully populated group with all relationships
- [ ] PUT /api/groups/:id accepts chairperson, secretary, treasurer as ObjectIds
- [ ] PUT /api/groups/:id validates uniqueness of signatories
- [ ] PUT /api/groups/:id enforces 3 signatories for active groups
- [ ] Edit group dialog loads existing signatory data correctly
- [ ] Edit group dialog saves changes successfully
- [ ] Group detail page displays all signatory information
- [ ] Groups list page displays status and basic info correctly
