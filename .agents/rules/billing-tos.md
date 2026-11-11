# Billing — Terms of Service Acceptance Gate
 
 All purchases (Stripe balance credit or coins) must pass through the Terms of Service (ToS) gate.
 
 ## When this applies
 
 - Modifying the purchase flow in `frontend/src/pages/coins/Wallet.jsx`.
 - Adding any new entry point to `billing/checkout` or `billing/purchase-coins` in the frontend.
 
 ## Rules
 
 - **NEVER** call `billing/checkout` or `billing/purchase-coins` directly without passing through `withTosGate()`.
 - The `withTosGate(action)` helper checks `sessionStorage.getItem('ov_tos_accepted')` before executing the action.
 - If not accepted, display `<TosModal>` linking to `https://overnode.fr/hosting-cgu.html` and `https://overnode.fr/hosting-cgv.html`.
 - The "Confirm" button inside the modal must remain **disabled** until the acceptance checkbox is checked.
 - Acceptance is stored in `sessionStorage` (key `ov_tos_accepted`) — valid for the current browser session only.
 - If a new purchasing flow is introduced, it must also call `withTosGate()` before sending financial requests.
 
 ## Legal links
 
 - Terms of Service (CGU): https://overnode.fr/hosting-cgu.html
 - Terms of Sale (CGV): https://overnode.fr/hosting-cgv.html
 - Legal notices: https://overnode.fr/legal.html
 