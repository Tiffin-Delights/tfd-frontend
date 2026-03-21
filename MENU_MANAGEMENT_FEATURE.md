# Menu Management Feature Documentation

## Overview
This feature allows mess providers to dynamically update their menu items for any day and meal type. Customers immediately see the updated menus when they visit the portal.

## Features Implemented

### 1. **Real-time Menu Management** (Provider Side)
- **Add Menu Items**: Providers can add new menu items for any day/meal combination
- **View Existing Items**: See all current menu items organized by day and meal type
- **Delete Items**: Remove menu items if needed
- **Update Items**: Simply delete old and add new items for the same day/meal

### 2. **Immediate Visibility** (Customer Side)
- Menu automatically refreshes when provider adds/updates items
- Customers see the latest menu without needing to refresh their browser
- No caching delays - all API calls use `cache: "no-store"`

### 3. **Tab-Based Interface**
- **"Add New Item" Tab**: Form to quickly add menu items
  - Select day of week
  - Select meal type (Breakfast, Lunch, Snacks, Dinner)
  - Enter dishes (comma-separated)
  - Set price
  - Optional image URL

- **"View All Items" Tab**: See all existing menu items
  - Organized by day and meal type
  - Shows dish names and price
  - Delete button for easy removal

## Frontend Implementation

### Files Modified:
1. **`src/components/ProviderDashboard/MenuUploadModal.jsx`**
   - Completely rewritten to support dual-tab interface
   - Added real-time menu viewing and deletion
   - Auto-loads menu items when modal opens

2. **`src/components/ProviderDashboard/MenuUploadModal.css`**
   - New styling for tabs, menu cards, and responsive design
   - Better visual hierarchy

3. **`src/api/client.js`**
   - Added `uploadMenuDish()` - Upload new menu item
   - Added `getMyMenu()` - Fetch provider's own menu
   - Added `updateMenuDish()` - Update existing item (optional)
   - Added `deleteMenuDish()` - Delete menu item
   - All API calls use `cache: "no-store"`

## Backend Implementation

### API Endpoints Updated:

#### 1. **POST /api/v1/menu/upload**
- Upload/update a menu item for current provider
- **Authentication**: Provider role required
- **Request Body**:
  ```json
  {
    "day": "monday",
    "meal_type": "breakfast",
    "dishes": ["Aloo Paratha", "Curd", "Pickle"],
    "price": 80.00,
    "image_url": "https://example.com/image.jpg"
  }
  ```
- **Response**: `MenuItemResponse`

#### 2. **GET /api/v1/menu/me** (NEW)
- Fetch current provider's all menu items
- **Authentication**: Provider role required
- **Response**: List of `MenuItemResponse`

#### 3. **GET /api/v1/menu/provider/{provider_id}**
- Fetch menu items for any provider (by ID)
- **Authentication**: Any authenticated user
- **Response**: List of `MenuItemResponse`

#### 4. **DELETE /api/v1/menu/{menu_id}** (NEW)
- Delete a menu item by ID
- **Authentication**: Provider role required (must own the item)
- **Status**: 204 No Content on success

### Files Modified:

1. **`backend/app/routers/menu.py`**
   - Updated `/upload` endpoint to use current provider (no provider_id needed)
   - Added `/me` endpoint for fetching provider's menu
   - Added `DELETE /{menu_id}` endpoint for item deletion
   - All endpoints include proper authorization checks

2. **`backend/app/schemas.py`**
   - Updated `MenuUploadRequest` - removed `provider_id` field
   - Updated `MenuItemResponse` - added `id` property as alias for `menu_id`
   - Added `image_url` field to response

## How It Works

### For New Mess Providers:
1. Provider registers and logs in
2. Opens the "Upload Menu Item" modal from dashboard
3. Uses the "Add New Item" tab to create menu items
4. Can add multiple items for different days/meals
5. All items are immediately saved to database

### For Menu Updates (Anytime):
1. Provider opens "Upload Menu Item" modal anytime
2. Switches to "View All Items" tab to see current menu
3. Can delete old items and add new ones
4. Changes are instant - no page refresh needed

### For Customers:
1. When viewing mess providers, the latest menu is always displayed
2. Menu is fetched fresh each time (no browser cache)
3. If provider updates menu, customer sees it on next page load
4. Prices and dishes update in real-time

## Database Schema

The existing `MenuItem` model already supports this:
```python
class MenuItem(Base):
    __tablename__ = "menu"
    menu_id: int = primary_key
    provider_id: int = foreign_key
    day: DayOfWeek = enum(monday-sunday)
    meal_type: MealType = enum(breakfast/lunch/snacks/dinner)
    dishes: list[str] = JSONB array
    price: Decimal = numeric
    image_url: str = optional
    unique_constraint(provider_id, day, meal_type)
```

## Caching Strategy

All API calls use `cache: "no-store"` to ensure:
- Fresh data on every request
- No browser cache issues
- Customers always see latest menu
- Provider updates visible immediately

HTTP Headers added:
```javascript
cache: "no-store"
```

## Usage Example

### Adding a Menu Item:
```javascript
const payload = {
  day: "monday",
  meal_type: "breakfast",
  dishes: ["Aloo Paratha", "Curd", "Pickle"],
  price: 80.00,
  image_url: null
};

await uploadMenuDish(auth.token, payload);
```

### Fetching Provider's Menu:
```javascript
const myMenu = await getMyMenu(auth.token);
// Returns array of menu items organized by day and meal
```

### Deleting a Menu Item:
```javascript
await deleteMenuDish(auth.token, menu_id);
```

## Future Enhancements

1. **Bulk Upload**: Allow CSV upload for multiple items
2. **Menu Templates**: Save and reuse weekly menu templates
3. **Seasonal Menus**: Create menus for specific date ranges
4. **Menu Analytics**: Show which items are popular
5. **Automatic Updates**: Schedule menu changes for specific dates
6. **Dish Categories**: Organize dishes by type (veg/non-veg)
7. **Nutritional Info**: Add calorie/nutrition details
8. **Menu History**: Track changes over time

## Testing

### Test Scenarios:
1. Provider adds menu item → Visible in "View All Items"
2. Delete menu item → Item removed from list
3. Add duplicate day/meal → Updates existing item
4. Customer views menu → Sees latest version
5. Multiple providers → Each sees their own menu
6. Non-provider user → Cannot access endpoints

### Test Credentials:
```
# Provider Account
Email: provider.demo@tiffinapp.com
Password: Provider@123

# Provider Dashboard → Upload Menu Item modal → Add items
```

## Notes for Implementation

1. The backend already handles provider authentication via `require_roles(UserRole.provider.value)`
2. The `provider_id` is automatically resolved from `current_user` in the `/upload` endpoint
3. All menu items are uniquely identified by (provider_id, day, meal_type) for automatic updates
4. Delete operations include authorization check to prevent cross-provider deletion

## Deployment Checklist

- [ ] Backend migrations applied (if any)
- [ ] Backend endpoints deployed
- [ ] Frontend components built
- [ ] Cache headers configured
- [ ] API calls tested
- [ ] Provider can add/view/delete menus
- [ ] Customers see updated menus
- [ ] Error handling verified
