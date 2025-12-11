# Design Guidelines: Department OD Management System

## Design Approach
**Selected Approach**: Design System - Material Design 3
**Justification**: This is a data-intensive, form-heavy educational administration tool requiring clear information hierarchy, robust data tables, and intuitive workflows. Material Design excels at productivity applications with its structured components and clear visual feedback.

## Core Design Principles
1. **Clarity Over Style**: Information density and usability take priority
2. **Role-Based Clarity**: Distinct visual patterns for Student vs Staff vs Admin views
3. **Progressive Disclosure**: Complex workflows broken into clear, sequential steps
4. **Status Transparency**: Real-time feedback on request states and system actions

## Typography System
**Font Family**: Roboto (via Google Fonts)
- **Headings**: Roboto Medium (500)
  - Page Titles: text-2xl (24px)
  - Section Headers: text-xl (20px)
  - Card Titles: text-lg (18px)
- **Body Text**: Roboto Regular (400)
  - Primary: text-base (16px)
  - Secondary/Helper: text-sm (14px)
- **Data/Tables**: Roboto Regular
  - Table Headers: text-sm font-medium
  - Table Data: text-sm
- **Buttons/CTAs**: Roboto Medium (500), text-sm

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8
- Component padding: p-4, p-6
- Section spacing: mb-6, mb-8
- Grid gaps: gap-4, gap-6
- Card spacing: p-6

**Grid Structure**:
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Two-column forms: grid-cols-1 md:grid-cols-2
- Single column for complex workflows

**Container Widths**:
- Dashboard: max-w-7xl mx-auto px-4
- Forms: max-w-3xl mx-auto
- Full-width tables: w-full with horizontal scroll on mobile

## Component Library

### Navigation & Layout
**Top App Bar**:
- Fixed height (h-16)
- Logo/Department name left-aligned
- User profile/role badge right-aligned
- Role indicator: Small badge showing "Student" | "Staff" | "Admin"

**Sidebar Navigation** (Desktop only, hamburger menu on mobile):
- Width: w-64
- Nested navigation for different sections
- Active state: Subtle background fill
- Icons from Material Icons

### Dashboard Components
**Overview Cards**:
- Elevated cards with subtle shadow (shadow-md)
- Rounded corners (rounded-lg)
- Icon + metric + label pattern
- Grid layout: 3 columns desktop, 2 tablet, 1 mobile

**Data Tables**:
- Striped rows for readability (alternate subtle backgrounds)
- Sticky headers for long tables
- Action buttons (icon buttons) in last column
- Responsive: Collapse to cards on mobile
- Pagination controls at bottom

### Forms & Input
**File Upload Zone**:
- Dashed border drag-drop area
- Clear file type indicators (XLSX, CSV, PDF)
- Upload progress bars
- File preview/remove functionality

**Date Picker**:
- Material Design calendar component
- Multiple date selection for OD ranges
- Week-day highlighting

**Input Fields**:
- Outlined variant (border-2)
- Labels above inputs
- Helper text below in text-sm
- Error states with red accent and icon
- Spacing: mb-4 between fields

**PDF Upload**:
- Thumbnail preview when uploaded
- File size/name display
- Replace/remove actions

### OD Request Components
**Request Card** (Student View):
- Each request as an elevated card
- Header: Date range + Status badge
- Body: Reason, uploaded PDF thumbnail
- Footer: Staff approval breakdown
- Status badges: Pending (blue), Approved (green), Rejected (red)

**Request List** (Staff View):
- Table format with expandable rows
- Student name, date range, subject, status
- Expand to see PDF and full reason
- Inline approve/reject buttons
- Batch selection for multiple approvals

**Status Badge**:
- Pill-shaped (rounded-full)
- Small size (px-3 py-1)
- Icon + text

### Report Generation
**Report Preview Modal**:
- Full-screen overlay
- Letter format preview
- Download PDF button
- Share/email options
- Staff approval status table within letter

### Attendance Display
**Percentage Cards**:
- Student photo/avatar
- Progress ring showing percentage
- Color-coded: >90% green, 75-90% yellow, <75% red
- Subject name below

## Interaction Patterns
**Loading States**:
- Skeleton screens for data tables
- Spinner for file processing
- Progress bars for uploads

**Notifications/Feedback**:
- Toast messages (top-right)
- Inline success messages in forms
- Confirmation dialogs for destructive actions

**Empty States**:
- Illustration + text
- Primary action button
- Example: "No OD requests yet. Submit your first request to get started."

## Page-Specific Layouts

### Admin Dashboard
- File upload section (top)
- Statistics cards (uploaded students, staff count, pending requests)
- Recent activity table

### Student Dashboard
- Timetable view (weekly grid)
- Quick OD submission form
- Recent requests list

### Staff Dashboard
- Today's schedule card
- Pending OD requests (priority)
- Student attendance overview grid

## Icons
**Library**: Material Icons (via CDN)
- Upload: upload_file
- Calendar: calendar_today
- Check: check_circle
- Close: cancel
- PDF: picture_as_pdf
- User: person
- Schedule: schedule

## Responsive Breakpoints
- Mobile: base (< 768px) - Single column, stacked cards
- Tablet: md (768px+) - Two columns where appropriate
- Desktop: lg (1024px+) - Full multi-column layouts with sidebar

## Accessibility
- All form inputs with associated labels
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Focus indicators on all interactive elements (ring-2 ring-blue-500)
- Color contrast ratios meeting WCAG AA standards