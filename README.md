# 🌍 ClimateRisk Assessor - Cloud Deployment Guide

**ClimateRisk Assessor** (*Climate Risk Assessment & Resilience Planning System*) is a production-style MERN application built for governments, municipal authorities, and industrial planners to assess, visualize, and track climate risks (Drought, Heatwave, Storm, Flood).

---

## 🏗️ Architecture Overview

```
                        +----------------------------+
                        |    User Browser            |
                        +--------------+-------------+
                                       |
                                       v
                        +--------------+-------------+
                        |       Vercel               |
                        |   React + Vite Frontend    |
                        +--------------+-------------+
                                       |
                                       | HTTPS API Requests (VITE_API_URL)
                                       v
                        +--------------+-------------+
                        |       Render               |
                        |   Node.js + Express Backend |
                        +-------+------+-------------+
                                |      |
             +------------------+      +-------------------+
             |                                             |
             v                                             v
+------------+---------------+              +--------------+-------------+
|    MongoDB Atlas            |              |      Open-Meteo API        |
|  Cloud Database Cluster    |              |  Live Weather Telemetry     |
+----------------------------+              +----------------------------+
```

---

## 📂 Project Repository Structure

```
ClimateRisk-Assessor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.js        # Uses import.meta.env.VITE_API_URL
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json           # Vercel SPA React Router rewrite rules
│   ├── .env.example          # VITE_API_URL
│   └── .gitignore
├── backend/
│   ├── config/
│   │   ├── db.js             # Mongoose connection (local or MongoDB Atlas)
│   │   └── defaultWeights.js
│   ├── models/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   │   ├── openMeteoService.js
│   │   └── riskEngine.js     # 100% Deterministic Risk Calculation Engine
│   ├── seed.js               # Database seeder script
│   ├── server.js             # Express app with CORS & process.env.PORT
│   ├── package.json
│   ├── .env.example          # PORT, MONGO_URI, JWT_SECRET, FRONTEND_URL
│   └── .gitignore
├── .gitignore
└── README.md
```

---

## 🚀 Step-by-Step Cloud Deployment Guide

### STEP 1: Create MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a free **M0 Shared Cluster**.
3. Create a Database User with username and password under **Database Access**.
4. Allow access from anywhere (`0.0.0.0/0`) under **Network Access**.
5. Click **Connect** ➔ **Drivers** to copy your MongoDB Atlas Connection String:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/climaterisk_db?retryWrites=true&w=majority
   ```

---

### STEP 2: Create GitHub Repository & Push Code
1. Open your terminal in the project directory:
   ```bash
   git init
   git add .
   git commit -m "Prepare ClimateRisk Assessor for cloud deployment"
   ```
2. Create a new public repository named `ClimateRisk-Assessor` on [GitHub](https://github.com/new).
3. Connect your local git repository and push:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ClimateRisk-Assessor.git
   git branch -M main
   git push -u origin main
   ```

---

### STEP 3: Deploy Backend on Render
1. Sign in to [Render](https://render.com).
2. Click **New +** ➔ **Web Service** and select your `ClimateRisk-Assessor` repository.
3. Configure the Web Service:
   - **Name**: `climaterisk-assessor-api`
   - **Region**: Select closest region (e.g. Singapore / Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add **Environment Variables** under the Environment tab:
   - `PORT`: `5000` (or leave default assigned by Render)
   - `MONGO_URI`: Your MongoDB Atlas Connection String (from Step 1)
   - `JWT_SECRET`: `climaterisk_super_secret_jwt_key_2026_safe`
   - `FRONTEND_URL`: `https://climaterisk-assessor.vercel.app` (Temporary placeholder; update after Step 4)
5. Click **Create Web Service**. Once deployed, copy your public backend URL:
   ```
   https://climaterisk-assessor-api.onrender.com
   ```

---

### STEP 4: Deploy Frontend on Vercel
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** ➔ **Project** and import your `ClimateRisk-Assessor` GitHub repository.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click Edit and select `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://climaterisk-assessor-api.onrender.com/api` (Use your Render backend URL from Step 3 + `/api`)
5. Click **Deploy**. Vercel will build the frontend and provide your live public URL:
   ```
   https://climaterisk-assessor.vercel.app
   ```

---

### STEP 5: Update CORS & Seed MongoDB Atlas
1. Return to **Render Dashboard** ➔ `climaterisk-assessor-api` ➔ **Environment**.
2. Update `FRONTEND_URL` to match your exact live Vercel URL:
   ```
   FRONTEND_URL=https://climaterisk-assessor.vercel.app
   ```
3. Save changes. Render will automatically redeploy the backend with proper CORS authorization.
4. Populate your live MongoDB Atlas database by running the seeder script locally pointing to Atlas:
   ```bash
   # In terminal
   MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/climaterisk_db" node backend/seed.js
   ```

---

## 🔑 Pre-Seeded Demo Accounts (Live Production)

| Role | Email | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `Admin@123` | Full access, user management, threshold/weight tuning |
| **Analyst** | `analyst@test.com` | `Analyst@123` | Region CRUD, Open-Meteo telemetry sync, risk assessments, simulator |
| **Viewer** | `viewer@test.com` | `Viewer@123` | Read-only access to dashboards, maps, and reports |

---

## 🧮 Deterministic Risk Model

- **Drought Risk**: $0.40 \times \text{Rainfall Deficit} + 0.30 \times \text{Soil Moisture Deficit} + 0.30 \times \text{Consecutive Dry Days}$
- **Heatwave Risk**: $0.60 \times \text{Temperature Exceedance} + 0.40 \times \text{Heat Index}$
- **Storm Risk**: $0.60 \times \text{Max Wind Speed} + 0.40 \times \text{Extreme Precipitation}$
- **Flood Risk**: $0.60 \times \text{Rainfall Intensity} + 0.40 \times \text{Cumulative Precipitation}$
- **Composite Risk**: Weighted sum (Drought 25%, Heatwave 25%, Storm 25%, Flood 25%).
- **Risk Scale**: `0–24` Low | `25–49` Moderate | `50–74` High | `75–100` Severe.

---

## 🛡️ License
Distributed under the MIT License. Built for Enterprise Climate Risk & Municipal Resilience Planning.
