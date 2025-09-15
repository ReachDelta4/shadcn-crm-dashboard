# Shadcn CRM Dashboard - UI

A modern CRM dashboard built with Next.js and Shadcn UI components, featuring a clean and responsive interface for managing customer relationships, sales, and analytics.

## Features

- **Modern UI**: Built with Shadcn UI components and Tailwind CSS
- **Responsive Design**: Fully responsive dashboard that works on all devices
- **Dashboard Analytics**: Visual representations of key metrics and customer data
- **Multiple Modules**: Customers, Invoices, Leads, Orders, and more
- **Dark Mode Support**: Toggle between light and dark themes

## Screenshots

### Dashboard Views
![Dashboard Overview](public/app-screenshots/dashboard-1.png)
![Dashboard Analytics](public/app-screenshots/dashboard-2.png)
![Dashboard Customers](public/app-screenshots/dashboard-3.png)

### Landing Page
![Landing Page](public/app-screenshots/landing.png)

### Mobile Experience
<div style="display: flex; justify-content: space-between;">
  <img src="public/app-screenshots/mobile-1.png" alt="Mobile Dashboard" width="32%" />
  <img src="public/app-screenshots/mobile-2.png" alt="Mobile Analytics" width="32%" />
  <img src="public/app-screenshots/mobile-3.png" alt="Mobile Navigation" width="32%" />
</div>

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── dashboard/       # Dashboard routes
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Shadcn UI components
│   └── shared/          # Shared components
├── features/
│   ├── dashboard/       # Dashboard feature components
│   │   ├── components/  # Dashboard UI components 
│   │   └── pages/       # Dashboard page components
│   └── landing/         # Landing page components
```

## Tech Stack

- **Framework**: Next.js 15.x with React 19
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI with Radix UI primitives

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Sessions (UI-only) — Meetings/Listen

Added a complete Sessions area with:
- Global Quick Actions Dock (macOS-style) for fast nav
- Pages: Overview, All Sessions, Calendar, Reports, Bulk Reports, and Session Detail
- Session Detail: Transcript, Report (10 pages, chart on page 2), Artifacts, QA; right AI chat panel

Backend to add later:
- Sessions/transcripts storage + search
- Report generation (single/bulk) + progress tracking
- Export (PDF) and share links
- AI context retrieval over transcripts/reports
