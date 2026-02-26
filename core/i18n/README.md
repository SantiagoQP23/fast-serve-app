# i18n Implementation Guide

## Overview

This Teikio restaurant app now supports internationalization (i18n) for English and Spanish. The implementation uses:
- **i18next** - Core i18n framework
- **react-i18next** - React bindings
- **expo-localization** - Device locale detection

## Configuration

- **Default language**: Spanish (`es`)
- **Fallback**: No fallback (as per requirements)
- **Date format**: Always DD/MM/YYYY
- **Currency**: Always $ symbol
- **Language persistence**: Yes, stored in AsyncStorage

## Project Structure

```
locales/
├── en/
│   ├── common.json      # Navigation, actions, status, labels
│   ├── auth.json        # Login, profile, logout
│   ├── orders.json      # Orders, order creation, order details
│   ├── tables.json      # Table management
│   ├── menu.json        # Menu, products, cart
│   ├── bills.json       # Bills, payments
│   └── validations.json # Form validations, errors
└── es/
    └── [same structure]

core/i18n/
├── i18n.config.ts           # Main i18n configuration
├── hooks/
│   └── useTranslation.ts    # Custom translation hook
└── utils.ts                 # Utility functions (alerts, dates, currency)
```

## Usage

### Basic Translation

```tsx
import { useTranslation } from '@/core/i18n/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <Text>{t('navigation.home')}</Text>;
}
```

### Translation with Interpolation

```tsx
const { t } = useTranslation('orders');

// In translation file: "orderNumber": "Order #{{number}}"
<Text>{t('orderNumber', { number: 123 })}</Text>
// Output: "Order #123"
```

### Multiple Namespaces

```tsx
const { t } = useTranslation(['common', 'orders']);

<Text>{t('common:actions.save')}</Text>
<Text>{t('orders:details.title')}</Text>
```

### Internationalized Alerts

```tsx
import { i18nAlert } from '@/core/i18n/utils';

// Simple alert
i18nAlert('Error', t('validations.invalidCredentials'));

// Alert with buttons
i18nAlert(
  t('dialogs.logoutTitle'),
  t('dialogs.logoutMessage'),
  [
    { text: t('common:actions.cancel'), style: 'cancel' },
    { text: t('common:actions.confirm'), onPress: handleLogout },
  ]
);
```

### Date Formatting

```tsx
import { formatDate, formatTime, formatDateTime, getRelativeDate } from '@/core/i18n/utils';

formatDate(new Date());        // "15/12/2025"
formatTime(new Date());        // "14:30"
formatDateTime(new Date());    // "15/12/2025 14:30"
getRelativeDate(new Date());   // "Today" (translated)
```

### Currency Formatting

```tsx
import { formatCurrency } from '@/core/i18n/utils';

formatCurrency(123.45);  // "$123.45"
```

### Change Language

```tsx
import { useGlobalStore } from '@/presentation/shared/store/useGlobalStore';

function LanguageSelector() {
  const language = useGlobalStore((state) => state.language);
  const setLanguage = useGlobalStore((state) => state.setLanguage);

  const handleChange = async (lang: 'en' | 'es') => {
    await setLanguage(lang);
  };
}
```

## Translation Files Structure

### common.json
- `navigation.*` - Tab navigation labels
- `actions.*` - Common action buttons (add, edit, remove, etc.)
- `status.*` - Order/payment status labels
- `orderType.*` - Order type labels (In Place, Take Away)
- `labels.*` - Common form labels
- `time.*` - Relative time labels (today, yesterday)

### auth.json
- `login.*` - Login screen
- `profile.*` - Profile screen
- `validations.*` - Auth validation messages
- `dialogs.*` - Confirmation dialogs

### orders.json
- `list.*` - Orders list screen
- `details.*` - Order details screen
- `actions.*` - Order-specific actions
- `newOrder.*` - New order creation
- `dialogs.*` - Order dialogs
- `alerts.*` - Order alerts
- `confirmation.*` - Order confirmation

### tables.json
- `list.*` - Tables list screen
- `details.*` - Table details
- `card.*` - Table card component

### menu.json
- `product.*` - Product details
- `cart.*` - Shopping cart

### bills.json
- `list.*` - Bills list
- `details.*` - Bill details
- `paymentMethods.*` - Payment method labels
- `newBill.*` - New bill creation
- `dialogs.*` - Bill dialogs
- `alerts.*` - Bill alerts

### validations.json
- Common validation messages with interpolation

## Adding Spanish Translations

The Spanish translation files (`locales/es/*.json`) are created with empty strings for you to fill in. To add translations:

1. Open the Spanish file (e.g., `locales/es/common.json`)
2. Fill in the empty strings with Spanish translations
3. Keep the same JSON structure and keys
4. Use the same interpolation variables (e.g., `{{number}}`, `{{name}}`)

Example:
```json
// locales/en/common.json
{
  "navigation": {
    "home": "Home",
    "orders": "Orders"
  }
}

// locales/es/common.json
{
  "navigation": {
    "home": "Inicio",
    "orders": "Órdenes"
  }
}
```

## Migrated Components

The following components have been migrated to use i18n:

### High Priority (Completed)
- ✅ `app/(tabs)/_layout.tsx` - Tab navigation
- ✅ `app/auth/login/index.tsx` - Login screen
- ✅ `presentation/orders/hooks/useOrderStatus.tsx` - Status labels
- ✅ `presentation/orders/new-order-bottom-sheet.tsx` - New order form
- ✅ `app/(tabs)/profile.tsx` - Profile screen with language selector

### Additional Components to Migrate

You can continue migrating other components following the same pattern:

1. Import `useTranslation` hook
2. Get translation function: `const { t } = useTranslation('namespace')`
3. Replace hardcoded strings with `t('key.path')`
4. Add translations to both `en` and `es` JSON files

## Best Practices

1. **Namespace Organization**: Use specific namespaces for related features
2. **Key Naming**: Use dot notation (e.g., `orders.details.title`)
3. **Interpolation**: Use `{{variable}}` for dynamic content
4. **Consistency**: Keep the same structure in all language files
5. **Testing**: Test both languages after adding translations
6. **No Fallback**: Since fallback is disabled, ensure all translations exist

## Language Switching

Users can change language in the Profile screen. The selection is:
- Persisted in AsyncStorage
- Applied immediately across the app
- Updates dayjs locale automatically
- Syncs with i18next

## Troubleshooting

### Missing Translation
If a translation key is missing, it will display the key itself (e.g., `orders.details.title`)

### Language Not Persisting
Check AsyncStorage permissions and ensure the app has access to storage

### Dates Not Formatting
Ensure dayjs locales are imported in `core/i18n/utils.ts`:
```typescript
import 'dayjs/locale/es';
import 'dayjs/locale/en';
```

## Next Steps

1. Fill in Spanish translations in `locales/es/*.json` files
2. Migrate remaining components to use i18n
3. Test language switching
4. Add more translation keys as needed
5. Consider adding more languages in the future
