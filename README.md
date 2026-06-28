# DashIQ SaaS Analytics Dashboard

A premium, full-featured, production-ready Full Stack Analytics Dashboard designed to monitor and manage product sales, customer performance, and monthly business growth.

This project is built using **React + Vite** for the frontend, **FastAPI** for the backend APIs, and **PostgreSQL** as the database system.

---

## 🚀 Key Features

* **Interactive Metrics Grid**: Real-time display of Total Revenue, Total Orders, Total Customers, Total Products, Average Order Value, and Month-over-Month Growth with micro-animations.
* **Responsive Visualizations**: Custom Recharts graphs including:
  * **Line Chart**: Monthly Revenue trends.
  * **Bar Chart**: Sales revenue by categories.
  * **Pie Chart**: Order status distributions.
  * **Area Chart**: Daily revenue trends (last 30 active days).
* **Advanced Data Management**: Interactive sales records table featuring full text search, column sorting, pagination, category & status filters, and one-click client-side CSV downloads.
* **Full CRUD Modals**: Dynamic interface to create, read, update, and delete transaction items with client-side form validations.
* **Bulk Import (CSV Upload)**: Drag-and-drop file uploader that validates rows, parses multiple date formats, and maps categories/products/customers automatically to database relations.
* **JWT Authentication**: Secure user portal guarding dashboard panels behind signed JWT tokens, featuring auto-refreshing routes and light/dark theme switches.
* **Automatic Database Seeding**: Pre-loaded with ~500 realistic, historically distributed transaction entries representing business growth over a 12-month window.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Packages |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | Recharts, Lucide React, Axios, Tailwind CSS v3 |
| **Backend** | FastAPI (Python) | SQLAlchemy ORM, Pydantic, Passlib, python-jose, python-multipart |
| **Database** | PostgreSQL 15 | Relational tables: Users, Categories, Products, Customers, Sales |
| **Deployment** | Docker | Dockerfiles, Nginx (frontend server / reverse-proxy), Docker Compose |

---

## 💻 Quick Start (Docker Compose)

The easiest way to run the entire stack (Database, API, and Web client) in a local or staging environment:

1. Clone or navigate to the project directory.
2. Run the compose environment:
   ```bash
   docker-compose up --build
   ```
3. Once the build completes:
   * **Web Client**: Open [http://localhost:3000](http://localhost:3000)
   * **FastAPI Docs (Swagger UI)**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
   * **PostgreSQL Server**: Running on `localhost:5432`

---

## 🔧 Local Development Setup

If you prefer to run services individually without Docker:

### 1. PostgreSQL Database Setup
Create a PostgreSQL database named `analytics` on your server.

### 2. Backend Setup
1. Open a terminal in the `backend/` folder.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy configurations and customize database credentials:
   ```bash
   cp .env.example .env
   # Edit .env with your local PostgreSQL credentials:
   # DATABASE_URL=postgresql://user:password@localhost:5432/analytics
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```

### 3. Frontend Setup
1. Open a terminal in the `frontend/` folder.
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the development server (configured to proxy requests to `localhost:8000` automatically):
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to [http://localhost:5173](http://localhost:5173).

---

## 🔑 Default Credentials

The database automatically seeds an administrative user on its first launch. You can log in using:

* **Username**: `admin`
* **Password**: `admin123`

---

## 📁 Project Structure

```
├── backend/
│   ├── routers/             # API Router endpoints (auth, sales, dashboard)
│   ├── services/            # Business logic (CSV importer, analytical aggregators)
│   ├── utils/               # Password hashing, JWT token signature utilities
│   ├── config.py            # Pydantic Settings env loader
│   ├── database.py          # SQLAlchemy engine and session configurations
│   ├── Dockerfile           # Backend container build instruction
│   ├── main.py              # FastAPI app startup lifecycle entrypoint
│   ├── models.py            # Relational database models
│   ├── requirements.txt     # Python backend dependencies
│   ├── schemas.py           # Pydantic schema serialization models
│   └── seed.py              # Mock data engine seeding 500 sales entries
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable views (Sidebar, Topbar, Modals, Toasts)
│   │   ├── context/         # React state managers (AuthContext, ThemeContext)
│   │   ├── pages/           # Page controllers (Login, Dashboard, Sales, Upload)
│   │   ├── services/        # Axios API client setup (includes header injectors)
│   │   ├── App.jsx          # Route configurations
│   │   ├── index.css        # Tailwind configurations and scrollbars styles
│   │   └── main.jsx         # Vite entry script
│   ├── Dockerfile           # Multi-stage production build (Node -> Nginx)
│   ├── nginx.conf           # Custom Nginx server configuration (proxy rules)
│   ├── package.json         # Node frontend dependencies
│   └── tailwind.config.js   # Custom theme alignments and keyframes
│
├── .env.example             # Configuration templates
└── docker-compose.yml       # Complete multi-container deployment manifest
```
