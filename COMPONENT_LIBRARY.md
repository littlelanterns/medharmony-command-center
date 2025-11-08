# MedHarmony Component Library

This document provides an overview of all reusable components in the MedHarmony application.

## Directory Structure

```
components/
├── shared/          # Shared components used across the app
├── ui/              # Base UI components (buttons, cards, modals)
├── provider/        # Provider-specific components
└── patient/         # Patient-specific components
```

---

## Shared Components (`components/shared/`)

### Header

A reusable header component with navigation, user info, and action buttons.

**Props:**
- `title: string` - Main header title
- `subtitle?: string` - Optional subtitle text
- `userName?: string` - Display user's name
- `userRole?: 'provider' | 'patient'` - User role (for styling)
- `actionButton?: { label: string; href: string; variant?: 'primary' | 'secondary' }` - Optional action button
- `backButton?: { label: string; href: string }` - Optional back navigation button

**Example:**
```tsx
<Header
  title="Provider Dashboard"
  userName="Dr. Jones"
  actionButton={{
    label: '+ Create New Order',
    href: '/provider/orders/new',
  }}
/>
```

### StatusBadge

Color-coded status badges for orders and appointments.

**Props:**
- `status: 'unscheduled' | 'scheduled' | 'completed' | 'cancelled' | 'confirmed' | 'no-show'`
- `size?: 'sm' | 'md' | 'lg'` (default: 'md')
- `showIcon?: boolean` (default: true)

**Example:**
```tsx
<StatusBadge status="scheduled" size="md" />
```

---

## UI Components (`components/ui/`)

### Button

Reusable button component with multiple variants and sizes.

**Props:**
- `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'` (default: 'primary')
- `size?: 'sm' | 'md' | 'lg'` (default: 'md')
- `fullWidth?: boolean` (default: false)
- `children: React.ReactNode`
- All standard HTML button attributes

**Example:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

### Card

Flexible card container with different styles and padding options.

**Props:**
- `children: React.ReactNode`
- `className?: string`
- `variant?: 'default' | 'outlined' | 'elevated'` (default: 'default')
- `padding?: 'none' | 'sm' | 'md' | 'lg'` (default: 'md')
- `hoverable?: boolean` (default: false) - Adds hover shadow effect
- `onClick?: () => void`

**Example:**
```tsx
<Card variant="elevated" hoverable>
  <h2>Card Content</h2>
</Card>
```

### Modal

Full-featured modal dialog with overlay and keyboard support.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Close handler
- `title?: string` - Optional modal title
- `children: React.ReactNode`
- `footer?: React.ReactNode` - Optional footer content
- `size?: 'sm' | 'md' | 'lg' | 'xl'` (default: 'md')
- `closeOnOverlayClick?: boolean` (default: true)

**Features:**
- Escape key to close
- Click overlay to close (configurable)
- Auto-manages body scroll
- Focus trap

**Example:**
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure?</p>
</Modal>
```

---

## Provider Components (`components/provider/`)

### RevenueMeter

Displays revenue tracking with at-risk, protected, and total values.

**Props:**
- `atRiskRevenue: number` - Revenue from unscheduled orders
- `protectedRevenue: number` - Revenue from scheduled orders
- `totalRevenue: number` - Total revenue across all orders
- `unscheduledCount: number` - Number of unscheduled orders
- `scheduledCount: number` - Number of scheduled orders
- `totalCount: number` - Total order count

**Example:**
```tsx
<RevenueMeter
  atRiskRevenue={5000}
  protectedRevenue={15000}
  totalRevenue={20000}
  unscheduledCount={5}
  scheduledCount={15}
  totalCount={20}
/>
```

### OrderCard

Displays order information with patient details and status.

**Props:**
- `order: Order & { patient?: { full_name: string }; prerequisites?: any[] }`
- `showPatientInfo?: boolean` (default: true)

**Example:**
```tsx
<OrderCard order={order} showPatientInfo={true} />
```

---

## Patient Components (`components/patient/`)

### AIScheduler

Complete AI scheduling interface with 3 options display and booking flow.

**Props:**
- `orderId: string`
- `userId: string`
- `orderDetails: { type: string; title: string; priority: string }`
- `prerequisites: any[]`
- `onOptionSelected: (option: AIScheduleOption) => void` - Callback when user books

**Features:**
- Fetches AI-generated scheduling options
- Shows loading state with progress messages
- Displays 3 ranked options with reasoning
- Prerequisite timeline for each option
- Karma bonus display
- One-click booking

**Example:**
```tsx
<AIScheduler
  orderId={order.id}
  userId={user.id}
  orderDetails={{
    type: order.order_type,
    title: order.title,
    priority: order.priority,
  }}
  prerequisites={order.prerequisites || []}
  onOptionSelected={handleBookOption}
/>
```

### PrerequisiteChecklist

Displays prerequisites in a checklist format.

**Props:**
- `prerequisites: Prerequisite[]`
- `title?: string` (default: 'Prerequisites')

**Example:**
```tsx
<PrerequisiteChecklist
  prerequisites={order.prerequisites}
  title="Required Before Appointment"
/>
```

### AppointmentCard

Displays appointment details with date, location, and status.

**Props:**
- `appointment: Appointment & { orders?: { title: string } }`
- `showTitle?: boolean` (default: true)

**Features:**
- Formatted date/time display
- Location with icon
- Staff assignment (if available)
- Status badge
- Confirmation reminder (if needed)

**Example:**
```tsx
<AppointmentCard
  appointment={appointment}
  showTitle={true}
/>
```

---

## Import Patterns

You can import components individually or from index files:

```tsx
// Individual imports
import Header from '@/components/shared/Header';
import Button from '@/components/ui/Button';

// Group imports from index
import { Header, StatusBadge } from '@/components/shared';
import { Button, Card, Modal } from '@/components/ui';
import { RevenueMeter, OrderCard } from '@/components/provider';
import { AIScheduler, AppointmentCard } from '@/components/patient';
```

---

## Design System Colors

All components follow the MedHarmony design system:

- **Primary Navy**: `#002C5F` - Headers, primary actions
- **Teal Accent**: `#008080` - Buttons, interactive elements
- **Emerald Green**: `#50C878` - Karma scores, success states
- **Status Colors**:
  - Red: Unscheduled/At Risk
  - Green: Scheduled/Protected
  - Blue: Total/Information
  - Yellow: Warnings
  - Orange: Urgent priorities

---

## Updated Pages

All page files have been refactored to use these components:

1. **Provider Dashboard** (`app/provider/page.tsx`)
   - Uses: Header, RevenueMeter, OrderCard, Card

2. **Patient Dashboard** (`app/patient/page.tsx`)
   - Uses: Header, Card, Button, StatusBadge, AppointmentCard

3. **Order Detail Page** (`app/patient/orders/[id]/page.tsx`)
   - Uses: Header, Card, StatusBadge, AIScheduler, PrerequisiteChecklist, AppointmentCard

---

## Benefits of This Architecture

1. **Reusability**: Components can be used across multiple pages
2. **Maintainability**: Logic is centralized, changes propagate automatically
3. **Type Safety**: All components have proper TypeScript props
4. **Consistency**: Design system is enforced through components
5. **Testability**: Components can be tested in isolation
6. **Scalability**: Easy to add new pages using existing components

---

## Next Steps

To add new features:

1. Create new components in the appropriate directory
2. Export from the index file
3. Use TypeScript interfaces for props
4. Follow the MedHarmony design system
5. Make components as reusable as possible with configurable props
