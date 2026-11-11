# Heliactyl Next (Toledo) Frontend — frontend
 
 Client single-page application for Heliactyl Next (Toledo).
 High-performance dashboard built with React 19, Vite, Tailwind CSS, and shadcn/ui.
 
 ## Tech Stack
 
 - **Framework**: React 19 + Vite 6
 - **Styling**: Tailwind CSS + shadcn/ui components + Framer Motion
 - **State & Data**: TanStack React Query + Axios
 - **Icons**: Lucide React + Heroicons
 
 ## Commands
 
 - `[dev]` - `pnpm dev`
 - `[build]` - `pnpm build`
 - `[preview]` - `pnpm preview`
 
 ## Rules
 
 The detailed rules live in `.agents/rules/`. Read the relevant file before acting:
 
 - **Billing ToS** - [.agents/rules/billing-tos.md](.agents/rules/billing-tos.md) - Mandatory Terms of Service gate before any purchase
 - **Web Performance** - [.agents/rules/web-performance.md](.agents/rules/web-performance.md) - Core Web Vitals constraints (LCP, INP, CLS) from field data
 - **Language Standards** - [.agents/rules/code-language.md](.agents/rules/code-language.md) - All code, UI text, and rules must be in English
 - **Dead Code** - [.agents/rules/dead-code.md](.agents/rules/dead-code.md) - Delete unused functions and dead code immediately
 - **Dependencies** - [.agents/rules/dependencies.md](.agents/rules/dependencies.md) - Always inspect and install the latest compatible package versions
 - **Project Scope** - [.agents/rules/project-scope.md](.agents/rules/project-scope.md) - Universal design: Toledo is for everyone, Overnode is the primary user
 
 ## Universal Rules
 
 - Prefer `pnpm` when available; fall back to `npm` if pnpm is missing or if node_modules was already installed via npm. Never mix lockfiles
 - Never bypass the `withTosGate()` gate for financial and coin purchase actions
 - Keep UI text generic and themeable: never hardcode Overnode-specific branding without configurability
 - All agent rules, AGENTS.md, and code documentation must strictly be written in English
 