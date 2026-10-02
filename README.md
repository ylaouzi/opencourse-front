# 🎓 OpenCourse Frontend

> Modern, high-performance web interface for the **OpenCourse** learning platform. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **WebAssembly**, featuring sequential learning paths, dual XP/SP gamification, and an **in-browser PHP 8.2 WebAssembly code challenge sandbox**.

---

## 🌟 Key Features

### 1. Sequential Curriculum & Prerequisite Enforcement
- Structured course tracks: **Modern PHP Fundamentals** ➔ **Object-Oriented PHP Architecture** ➔ **Laravel Full-Stack Development**.
- Enforces strict pedagogical sequencing: advanced courses remain locked until prerequisites are successfully completed.

### 2. Dual-Progression Gamification (XP & SP)
- **Global Experience Points (XP)**: Earned on every lesson completed (+50 XP) and quiz passed (+100 XP), driving the player's overall level in the top navigation HUD.
- **Category Skill Points (SP)**: Domain-specific mastery points tracking individual skill tree levels (e.g., *PHP & Backend Engineering*) on the learner's dashboard and profile.

### 3. Interactive Assessment Engine
- **Sequence Puzzles (`FLOW_ORDER`)**: Drag-and-drop / arrow reordering questions to arrange architectural lifecycles in chronological order (e.g., the *Laravel HTTP Request Pipeline*).
- **Single & Multi-Answer Choice Quizzes**: Instant feedback revealing correct, missed, and misplaced options.

### 4. 🐘 In-Browser PHP 8.2 WebAssembly Sandbox
- **Zero Server-Side Execution**: User-submitted code is never sent to a remote server.
- The complete **PHP 8.2 Zend Engine runs directly inside the client's browser via WebAssembly (`@php-wasm`)**.
- Instant test execution, automated test case assertion, streaming console output, and watchdog timeout protection against infinite loops (`while(true)`).

### 5. Instructor & Admin Curriculum Studio
- Comprehensive curriculum builder for courses, modules, lessons, and quizzes.
- Rich text editor powered by **TipTap** supporting code blocks, typography, and images.
- Admin quiz editor with live sandbox testing for reference solutions before saving.

### 6. Verifiable Digital Certificates
- Automated certificate issuance upon completing course final quizzes, complete with verifiable unique verification codes.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Server Cache**: [TanStack Query v5](https://tanstack.com/query) & [Zustand](https://github.com/pmndrs/zustand)
- **WebAssembly Engine**: `@php-wasm/universal` & `@php-wasm/web-8-2` (PHP 8.2 Zend Engine in WASM)
- **Rich Editor**: [TipTap 3](https://tiptap.dev/)
- **UI Components**: Radix UI / Base UI, Lucide Icons, Sonner Toasts

---

## 🏁 Getting Started

### 1. Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [Yarn](https://yarnpkg.com/) (`corepack enable` or `npm install -g yarn`)
- The [OpenCourse Backend API](https://github.com/ylaouzi/opencourse-back) running on `http://localhost:3000`

---

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/ylaouzi/opencourse-front.git
cd opencourse-front
yarn install
```

---

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

Ensure `.env.local` points to your running backend API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

### 4. Running the Development Server

Start the Next.js development server:

```bash
yarn dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

### 5. Production Build

To test or deploy the production build:

```bash
# Build the application
yarn build

# Start the production server on port 3001
yarn start
```

---

## 📂 Project Structure

```text
cours-frontend/
├── public/
│   └── php-wasm/              # Standalone PHP 8.2 WASM binary & loader
│       ├── php_8_2.wasm       # PHP 8.2 Zend Engine WebAssembly binary
│       └── php_8_2.js         # WASM runtime loader
├── src/
│   ├── app/                   # Next.js 16 App Router pages
│   │   ├── (admin)/           # Admin dashboard, curriculum builder & course editor
│   │   ├── (auth)/            # Login, registration, OAuth callback pages
│   │   └── (student)/         # Catalog, dashboard, learn viewer, and quizzes
│   ├── components/            # Reusable UI components
│   │   ├── admin/             # Curriculum builder & QuizDialog (live sandbox runner)
│   │   ├── learn/             # FlowOrderQuestion & CodeRunnerQuestion components
│   │   └── ui/                # Buttons, inputs, modals, cards
│   ├── lib/
│   │   ├── api/               # Axios client & typed API endpoints
│   │   ├── code-runner/       # Client-side WASM & Web Worker code runner engine
│   │   │   ├── php-runner.ts  # In-browser PHP 8.2 WASM executor
│   │   │   ├── javascript-runner.ts # Sandboxed Web Worker JS runner
│   │   │   └── types.ts       # Code runner types & test case specifications
│   │   └── stores/            # Zustand auth and UI stores
```

---

## 🔒 Client-Side Sandbox Guarantee

All coding challenges in OpenCourse execute **entirely client-side** using isolated WebAssembly and Web Worker instances. Zero user code is executed on the server, guaranteeing complete immunity against remote execution exploits and providing instantaneous sub-millisecond feedback for learners.

---

## 📄 License

This project is licensed under the MIT License.
