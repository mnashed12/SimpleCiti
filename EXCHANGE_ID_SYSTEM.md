# Exchange ID System - Complete Implementation

## Overview
The Exchange ID system allows users to track multiple 1031 exchanges simultaneously. Each exchange ID represents a separate transaction with its own details (sale price, equity rollover, closing date). Users can "like" properties on the marketplace under specific exchange IDs to organize their replacement candidates.

## User Flow

### 1. Create Exchange ID
**URL:** `/SE/enrollment`

Users fill out a form with:
- Sale price of relinquished property
- Equity to rollover
- Expected closing date

**Backend:** POST `/api/se/exchange-ids/`
- Creates `ExchangeID` record linked to authenticated user
- Auto-generates unique ID in format: `E-1004-01`
  - First number (1004): Global counter across all exchanges
  - Second number (01): User's exchange counter (increments per user)

**Response:** Returns exchange ID object including `exchange_id` string

### 2. Browse Properties & Add to Exchange
**URL:** `/SE/hub`

Users can:
- Browse all available properties
- Click heart icon on property card
- Select which Exchange ID to add the property to
- Property is added to that specific exchange's replacement candidates

**Backend:** POST `/api/se/like-property/`
```json
{
  "property_id": "RE-5004",  // Property reference number
  "exchange_id": 1            // ExchangeID.id (not the E-1004-01 string)
}
```

Creates `PropertyLike` record with:
- user (FK to CustomUser)
- exchange_id (FK to ExchangeID)
- property (FK to Property)
- Unique constraint: Can't like same property twice for same exchange

### 3. View Replacement Candidates
**URL:** `/SE/replacement-candidates`

Displays:
- Dropdown to select Exchange ID
- Shows exchange details (sale price, equity, closing date)
- Lists all properties liked under that exchange ID
- Each property shows:
  - Property image, title, address
  - Key metrics (purchase price, cap rate, equity, closing date)
  - "Remove" button to unlike
  - "View Details" button to go to property detail page

**Backend:** GET `/api/se/user-likes/`
```json
{
  "liked_properties": ["RE-5004", "RE-5005"],  // Array of ref numbers (backwards compatible)
  "likes_detail": [
    {
      "property_ref": "RE-5004",
      "property_title": "Retail Plaza",
      "exchange_id": 1,
      "exchange_id_name": "E-1004-01"
    }
  ]
}
```

### 4. Unlike Property
Users can remove properties from exchange by clicking "Remove" button

**Backend:** POST `/api/se/unlike-property/`
```json
{
  "property_id": "RE-5004",
  "exchange_id": 1
}
```

Deletes matching `PropertyLike` record

## Database Models

### ExchangeID
```python
class ExchangeID(models.Model):
    user = ForeignKey(CustomUser)           # Owner of exchange
    exchange_id = CharField(unique=True)     # E-1004-01 format
    sale_price = DecimalField                # Sale price of relinquished property
    equity_rollover = DecimalField           # Equity to rollover
    closing_date = DateField                 # Expected closing
    created_at = DateTimeField
    updated_at = DateTimeField
```

**Auto-generation logic:**
```python
@staticmethod
def generate_exchange_id(user):
    # Get highest global counter
    last_exchange = ExchangeID.objects.order_by('-id').first()
    global_counter = int(last_exchange.exchange_id.split('-')[1]) + 1 if last_exchange else 1004
    
    # Get user's exchange count
    user_exchange_count = ExchangeID.objects.filter(user=user).count() + 1
    
    return f"E-{global_counter:04d}-{user_exchange_count:02d}"
```

### PropertyLike
```python
class PropertyLike(models.Model):
    user = ForeignKey(CustomUser)            # User who liked (for quick filtering)
    exchange_id = ForeignKey(ExchangeID)     # Which exchange this like belongs to
    property = ForeignKey(Property)          # The liked property
    created_at = DateTimeField
    
    class Meta:
        unique_together = ['exchange_id', 'property']  # Can't like same property twice per exchange
```

**Note:** User can like the same property under DIFFERENT exchange IDs (makes sense for multiple exchanges)

## API Endpoints

### Exchange IDs
```
GET    /api/se/exchange-ids/       - List user's exchange IDs
POST   /api/se/exchange-ids/       - Create new exchange ID
GET    /api/se/exchange-ids/{id}/  - Get specific exchange ID
```

### Property Likes
```
POST   /api/se/like-property/      - Like property for specific exchange
POST   /api/se/unlike-property/    - Unlike property
GET    /api/se/user-likes/         - Get user's liked properties with exchange details
```

## Frontend Components

### ExchangeEnrollment.jsx
- Form to create new exchange ID
- Validates required fields
- Formats currency inputs with $ and commas
- Shows success message with generated exchange ID
- Redirects to profile after creation

### Hub.jsx
- Loads user's exchange IDs on mount
- Loads user's likes grouped by exchange ID
- Heart icon on each property card
- Click heart → modal to select exchange ID
- After selection, calls `/api/se/like-property/`
- Updates local state to show filled heart

### ReplacementCandidates.jsx
- Loads user's exchange IDs
- Loads likes with exchange details
- Groups properties by exchange ID
- Dropdown to switch between exchanges
- Shows exchange details and property count
- Property cards with remove functionality
- Handles unliking and reloads data

### Profile.jsx
- Link to "Replacement Candidates" page
- Shows exchange IDs sidebar (up to 5)
- Shows liked properties sidebar
- Links to browse hub and create exchange

## Migration Notes

### Old System (PropertyEnrollment)
The old `enrollment_submit` view creates `PropertyEnrollment` records but doesn't create `ExchangeID`. This was for collecting initial interest before account creation.

**PropertyEnrollment** stores:
- email, sale_price, equity_rollover, close_date
- qi_name, needs_qi_referral
- property FK (property they were interested in)
- Optional user FK (if they later created account)

**Not connected to new Exchange ID system yet.**

### Migration Path (if needed later)
Could create a management command to:
1. Find PropertyEnrollment records with user FK
2. Create ExchangeID for each enrollment
3. Create PropertyLike linking to that property

But for now, new users create Exchange IDs directly via `/SE/enrollment` form.

## Testing Checklist

1. ✅ User creates exchange ID → receives E-XXXX-XX format ID
2. ✅ User can create multiple exchange IDs → second gets E-XXXX-02
3. ✅ User browses hub → sees heart icons
4. ✅ Click heart → modal shows user's exchange IDs
5. ✅ Select exchange → property added successfully
6. ✅ View replacement candidates → properties grouped by exchange
7. ✅ Switch exchange in dropdown → shows correct properties
8. ✅ Remove property → unlike works, UI updates
9. ✅ Same property can be liked under different exchanges
10. ✅ Can't like same property twice for same exchange (DB constraint)

## Navigation Links

- **Create Exchange ID:** `/SE/enrollment`
- **Browse Properties:** `/SE/hub`
- **View Candidates:** `/SE/replacement-candidates`
- **My Exchange IDs:** `/SE/exchange-ids` (list view)
- **Profile:** `/SE/profile` (links to all above)

## Next Steps (Future Enhancements)

1. **Exchange Status Tracking**
   - Add status field to ExchangeID (active, completed, cancelled)
   - Track 45-day identification deadline
   - Track 180-day closing deadline
   - Send deadline reminders

2. **Property Notes**
   - Add notes field to PropertyLike
   - Allow users to rank/prioritize candidates
   - Add tags or categories

3. **Exchange Documents**
   - Upload exchange-related documents
   - Link to QI correspondence
   - Store PSA, title work, etc.

4. **Analytics Dashboard**
   - Total equity across exchanges
   - Properties viewed vs liked
   - Deadline tracking visualization
   - Exchange progress meters

5. **Email Notifications**
   - New exchange ID created
   - Property liked
   - Deadline approaching
   - New property matches criteria

## Architecture Notes

**Why exchange_id FK on PropertyLike?**
- Allows user to like same property for different exchanges
- Enables proper scoping of replacement candidates
- Tracks which exchange a like belongs to
- Supports unique constraint per exchange

**Why store user FK on PropertyLike?**
- Quick filtering without joining through exchange_id
- User can be derived from exchange_id.user but this is faster
- Denormalization for performance

**Currency Formatting:**
- Frontend formats with $ and commas for display
- Backend stores as Decimal(12,2)
- Frontend strips $ and , before POST
- Serializer to_internal_value also sanitizes

**Exchange ID Generation:**
- Global counter ensures uniqueness across all users
- User counter tracks how many exchanges per user
- Format is human-readable and sortable
- Could support lookup by exchange_id string

## Production Deployment

Changes deployed:
- ✅ Backend: Updated api_views.py (user_liked_properties returns likes_detail)
- ✅ Backend: ExchangeID model and viewset already exist
- ✅ Backend: PropertyLike model and like/unlike endpoints already exist
- ✅ Frontend: ExchangeEnrollment.jsx form built
- ✅ Frontend: ReplacementCandidates.jsx page built
- ✅ Frontend: Hub.jsx updated to track exchange-scoped likes
- ✅ Frontend: Profile.jsx link added
- ✅ Frontend: App.jsx route added
- ✅ Built and pushed to production

**Git Commit:** `ec6bd8e` - "Implement Exchange ID enrollment and replacement candidates system"
