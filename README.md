# GlowNest Frontend

GlowNest is a responsive React and Vite storefront for perfumes, cosmetics, and beauty products.

## Features

- Customer sign-up and login
- Product catalog and search
- Full-bottle and decant options
- Shopping cart and invoice generation
- Customer order history and tracking
- Scheduled product discounts
- Admin dashboard and admin authentication
- PayHere checkout integration
- Responsive design

## Tech stack

- React
- Vite
- Tailwind CSS
- JavaScript
- Lucide React

## Requirements

- Node.js
- GlowNest backend running at `http://127.0.0.1:4000`

## Installation

```bash
npm install
npm run dev
```

The frontend runs at `http://127.0.0.1:3005`.

## Environment

To use a different backend URL, create `.env.local`:

```env
VITE_API_URL=http://127.0.0.1:4000
```

## Main pages

- `/`
- `/perfumes`
- `/cosmetics`
- `/cart`
- `/account`
- `/orders`
- `/admin`

## Backend

[GlowNest Backend](https://github.com/GlowNest-Project/GlowNest-BackEnd)
