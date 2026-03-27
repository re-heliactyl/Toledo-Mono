# Heliactyl Next Mono V10.0.0 - Frontend

The brand new frontend for the Heliactyl Next dashboard, built with shadcn/ui, Tailwind CSS and in React.

## Standalone build guide

```
npm install
npm run build
```

The files will now be accessible in `dist/`. If the app is located inside the Heliactyl Next directory under `app` then Heliactyl Next will serve `app/dist/` (as of Namek 105) to the user. Have a look: `modules/routing.js`.