# User Design Principles in This Project

This document explains where each major UX/HCI design principle is implemented in a practical, easy-to-read way.

## Quick Summary

| Principle | How It Appears in the Product |
| --- | --- |
| User-Centered Design (UCD) | Separate customer and provider journeys, with task-specific flows. |
| Consistency | Shared theme tokens, repeatable components, and common interaction patterns. |
| Feedback | Clear loading, success, empty, and error messages across features. |
| Simplicity | Step-by-step flows and focused actions instead of crowded screens. |
| Visual Hierarchy | Strong heading structure and summary-first information layout. |
| Accessibility | ARIA labels, keyboard focus states, form labels, and reduced-motion support. |
| Aesthetic Integrity | Coherent look and feel across veg/non-veg themes and all pages. |
| Error Prevention & Recovery | Input checks, guarded submission, and recoverable API error handling. |
| Affordance | Buttons, cards, and toggles look interactive and react clearly on hover/focus. |
| Flexibility | Theme switching, pausable animations, and multiple plan/dashboard modes. |

## Principle-by-Principle Mapping

### 1. User-Centered Design (UCD)

The app is designed around two real user types: customer and provider. Each gets a focused workflow.

Implemented in:
- src/App.jsx
- src/components/Auth/LoginFlow.jsx
- src/components/MessProviders/SubscribeModal.jsx

### 2. Consistency

Colors, spacing, state styles, and component patterns are standardized through shared tokens and repeated UI structure.

Implemented in:
- src/App.css
- src/components/SectionHead.jsx
- src/components/CustomerDashboard/CustomerDashboard.css
- src/components/ProviderDashboard/ProviderDashboard.css

### 3. Feedback

Users are always informed about what is happening: loading states, successful updates, no-data states, and errors.

Implemented in:
- src/components/MessProviders.jsx
- src/components/MessProviders/SubscribeModal.jsx
- src/components/ProviderDashboard/SubscriptionPricingModal.jsx
- src/components/Auth/CustomerLoginModal.jsx
- src/components/Auth/ProviderLoginModal.jsx

### 4. Simplicity

Complex tasks are broken into simple steps. The login flow is role-first, then form-specific.

Implemented in:
- src/components/Auth/LoginFlow.jsx
- src/components/Auth/RoleSelectModal.jsx
- src/components/MessProviders.jsx

### 5. Visual Hierarchy

Content is structured to guide attention from section labels to titles to details. Dashboards present summaries first.

Implemented in:
- src/App.css
- src/components/Hero.jsx
- src/components/SectionHead.jsx
- src/components/CustomerDashboard/CustomerDashboard.css

### 6. Accessibility

Interactive controls include ARIA metadata, forms are labeled, keyboard focus is visible, and motion can be reduced.

Implemented in:
- src/components/Navbar/Navbar.jsx
- src/components/About.jsx
- src/components/Menu.jsx
- src/App.css
- src/components/Auth/CustomerSignupModal.jsx
- src/components/Auth/ProviderSignupModal.jsx

### 7. Aesthetic Integrity

The interface preserves a unified visual identity while supporting both veg and non-veg themes.

Implemented in:
- src/App.css
- src/components/Footer/Footer.css
- src/components/HowItWorks.jsx

### 8. Error Prevention & Recovery

Forms validate important fields early and API failures return understandable messages instead of silent failure.

Implemented in:
- src/components/Auth/CustomerSignupModal.jsx
- src/components/Auth/ProviderSignupModal.jsx
- src/components/MessProviders/SubscribeModal.jsx
- src/components/ProviderDashboard/SubscriptionPricingModal.jsx

### 9. Affordance

Buttons, cards, and toggles visually communicate that they are clickable and provide immediate state changes.

Implemented in:
- src/App.css
- src/components/MessProviders/SubscribeModal.css
- src/components/Navbar/Navbar.css

### 10. Flexibility

Users can switch themes, pause/resume moving card content, and choose plans and dashboard modes based on need.

Implemented in:
- src/components/Navbar/Navbar.jsx
- src/components/About.jsx
- src/components/Menu.jsx
- src/components/MessProviders/SubscribeModal.jsx
- src/App.jsx

## Notes

- Theme behavior is controlled through `document.documentElement.dataset.theme`.
- Core design tokens and theme overrides are defined in src/App.css.
- Interaction states are implemented across both customer and provider experiences.




