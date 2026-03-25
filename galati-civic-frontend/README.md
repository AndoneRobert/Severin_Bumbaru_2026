# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Table API helper

For reading/writing extra Supabase tables through the backend API, use `src/services/tableApi.js`.

Example:

```js
import { listTableRows, createTableRow } from './services/tableApi';

const categories = await listTableRows('categories', { limit: 50, orderBy: 'name', ascending: true });
await createTableRow('categories', { name: 'Iluminat public', color: '#f59e0b' });
```

The backend must allow the table in:
- `SUPABASE_READ_TABLES` for reads
- `SUPABASE_WRITE_TABLES` for writes
