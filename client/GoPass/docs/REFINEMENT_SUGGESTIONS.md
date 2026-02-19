# UI/UX Refinement Suggestions for GoPass

Suggestions for future improvements to achieve a more professional, polished app.

---

## 1. Visual & Layout

- **Consistent spacing system**  
  Use the theme spacing scale everywhere (e.g. 8, 12, 16, 24) instead of magic numbers for padding/margins.

- **Skeleton loaders**  
  Replace generic spinners with skeleton placeholders on list screens (routes, tickets, passes) so layout is clear while loading.

- **Empty states**  
  Every list screen should have a clear empty state: illustration or icon, short message, and one primary action (e.g. “Find routes”, “Book a ticket”).

- **Bottom sheet for trip details**  
  On Track Bus, consider a draggable bottom sheet for “Your trip” and stats so the map stays the focus and details are optional.

- **Pull-to-refresh feedback**  
  Use a clear progress or animation (e.g. linear bar or spinner) so users see that refresh is in progress.

---

## 2. Typography & Readability

- **Hierarchy**  
  Use a clear type scale: one bold title per section, consistent body size, and muted color for secondary text (e.g. timestamps, labels).

- **Contrast**  
  Ensure text meets accessibility contrast ratios, especially for “seats left” and status badges on dark cards.

- **Localization**  
  Plan for longer strings (e.g. Kinyarwanda) so layouts don’t break and truncation is consistent (e.g. `numberOfLines` + ellipsis).

---

## 3. Navigation & Flow

- **Back button consistency**  
  Use the same back control (chevron or “Back”) and placement on all secondary screens.

- **Deep linking**  
  Support links to a specific ticket, pass, or route so notifications and shares open the right screen.

- **Confirmation steps**  
  For destructive actions (e.g. cancel ticket), use a short confirmation (modal or inline) with clear “Cancel” / “Confirm” and optional brief explanation.

---

## 4. Feedback & Errors

- **Toast position**  
  Consider a single toast container (e.g. top or bottom) and reuse it for all success/error/info messages so behavior is predictable.

- **Offline handling**  
  Show a small banner or toast when the app goes offline and, where possible, queue actions and retry when back online.

- **Form validation**  
  Show field-level errors inline (as you do for login) on all forms (register, booking, payment) and reserve toasts for submit/server errors.

---

## 5. Performance & Polish

- **Image handling**  
  For route/bus images, use a placeholder (e.g. gradient + icon) until loaded, and consider caching (e.g. `expo-image`) to avoid flicker and repeated downloads.

- **List performance**  
  Use `FlatList` with `getItemLayout` if item height is fixed, and `keyExtractor` with stable IDs for smoother scrolling.

- **Haptics**  
  Use light haptics on primary actions (e.g. “Book”, “Pay”) and optional subtle haptic on tab change for a more tactile feel.

---

## 6. Accessibility

- **Labels**  
  Add `accessibilityLabel` and `accessibilityHint` to icon-only buttons (e.g. swap, back, refresh) and to key cards (route, ticket).

- **Focus order**  
  Ensure tab order on forms and modals is logical (e.g. From → To → Search).

- **Dynamic type**  
  Prefer theme font sizes and avoid fixed sizes so the app can scale with system text size where supported.

---

## 7. Data & Content

- **Bus/route images**  
  Backend could expose an `imageUrl` per route or operator; the app already supports `route.imageUrl` in `RouteCard`.

- **ETA on track screen**  
  If the backend can provide estimated arrival, show “Arriving in ~X min” under the map or in the trip details card.

- **Recent searches**  
  Save last few origin/destination pairs locally and show them as chips or a short list above the route list for faster repeat bookings.

---

## 8. Security & Trust

- **Sensitive actions**  
  For “Cancel booking” or “Remove pass”, consider requiring PIN or biometric before proceeding.

- **Payment summary**  
  Always show a clear summary (route, date, seats, total) before payment and a success screen with reference number after.

---

These can be implemented incrementally; tackling **toasts**, **empty states**, and **route card images** first will already improve perceived quality and clarity.
