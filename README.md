# GATE Matrix — IIT GATE CBT Examination & Analytics Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.0-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](#license)

**GATE Matrix** is an authentic, production-grade Computer Based Test (CBT) examination, practice, and performance analytics platform engineered specifically for **GATE (Graduate Aptitude Test in Engineering)** aspirants across 6 major engineering streams.

---

## 🌟 Key Features

### 🎯 1. Official IIT GATE CBT Test Engine
* **TCS iON Exam Replica**: Practice under real exam conditions with identical UI navigation, section timers, and question status indicators.
* **On-Screen Scientific NAT Keypad**: Integrated virtual keypad for Numerical Answer Type (NAT) inputs to prevent exam-day calculation or rounding errors.
* **Color-Coded Question Palette**: Track status in real time across *Answered*, *Not Answered*, *Marked for Review*, and *Answered & Marked for Review*.
* **Scoring Rules**: Exact GATE marking scheme (+1/+2 marks for correct answers, -0.33/-0.67 negative marking for MCQs, zero penalty for MSQs & NATs).

### 📐 2. Step-by-Step KaTeX Math Solutions
* High-precision mathematical and algorithmic solution rendering using **KaTeX**.
* Complete derivations, matrix notation, code blocks, and step-by-step reasoning for all question types.

### 📊 3. Diagnostic Weak-Area Performance AI
* **Topic Accuracy Heatmap**: Pinpoint exact sub-topics requiring revision (e.g., *Data Structures*, *DBMS*, *Machine Learning*, *Signals & Systems*).
* **Speed & Time-per-Question Metrics**: Track average time spent per question to eliminate time bottlenecks during full-length mocks.
* **Negative Marking Penalty Reduction**: Analyze marks lost to incorrect MCQ guesses and improve your net exam score.

### 📚 4. Multi-Discipline Engineering Streams
Comprehensive question banks and full-length test series across **6 major GATE streams**:
1. **CS**: Computer Science & Information Technology
2. **DA**: Data Science & Artificial Intelligence
3. **EE**: Electrical Engineering
4. **EC**: Electronics & Communication Engineering
5. **ME**: Mechanical Engineering
6. **CE**: Civil Engineering

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server & Client Components) |
| **UI & Styling** | [React 19](https://react.dev/), [Tailwind CSS 3.4](https://tailwindcss.com/), Custom Design System |
| **Icons & Math** | [Lucide React](https://lucide.dev/), [KaTeX](https://katex.org/) |
| **Authentication & Database** | [Firebase 11](https://firebase.google.com/) (Google Auth, Firestore, Firebase Admin SDK) |
| **Testing** | [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) |
| **Language & Tooling** | TypeScript 5.6, PostCSS, ESLint |

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.17.0 or higher
* **npm**: v9.0.0 or higher (or pnpm/yarn)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ramanand-tomar/Gate-Matrix.git
   cd Gate-Matrix
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Builds the production bundle |
| `npm run start` | Runs the compiled production server |
| `npm run typecheck` | Runs TypeScript compiler checks without emitting files |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run test:unit` | Executes unit tests using Vitest |
| `npm run check:secrets` | Validates environment variables and secret leaks |

---

## 📁 Directory Structure

```
Gate-Matrix/
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── page.tsx            # Premium Landing Page
│   │   ├── catalog/            # Test Series Catalog with branch filtering
│   │   ├── exam/               # IIT Standard CBT Exam Player
│   │   ├── performance/        # Diagnostic Analytics Dashboard
│   │   ├── library/            # User Bookmarks & Saved Attempts
│   │   ├── admin/              # Admin Test Series Console
│   │   ├── api/                # API Endpoints (Papers, Submit, Analytics)
│   │   └── globals.css         # Global styles & dark mode definitions
│   ├── components/             # Reusable UI & Layout Components
│   │   ├── ui/                 # Buttons, Cards, Badges, Modals
│   │   ├── Navbar.tsx          # Sticky Header with Theme & User Auth
│   │   ├── Footer.tsx          # Comprehensive Footer
│   │   └── MathRenderer.tsx    # KaTeX Math Formula Renderer
│   ├── context/                # AuthContext & ThemeContext
│   └── lib/                    # Firebase config & Sanitizer utilities
├── scripts/                    # Data audit & import utility scripts
├── tests/                      # Unit & integration test suites
├── public/                     # Static assets & icons
└── README.md                   # Project documentation
```

---

## 🚢 Deployment

### Deploy to Vercel
The easiest way to deploy GATE Matrix is via [Vercel](https://vercel.com/):
1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Add your `.env.local` environment variables in the Vercel Dashboard.
4. Click **Deploy**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
