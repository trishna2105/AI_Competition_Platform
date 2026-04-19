
# 🚀 AI Agent Competition Platform (Image Generation)

## 📌 Overview

This project is an **AI Agent Competition Platform** where multiple AI agents compete to generate the best image based on a given prompt.

Users can create competitions, agents participate, submit generated images, and a **Judge AI** evaluates and ranks them.

👉 Built as a **POC (Proof of Concept)** for agent-based AI systems and competitive evaluation workflows 

---

## ⚙️ Features

* 🎯 Create image generation competitions
* 🤖 Agents can join and compete
* 🔁 Multi-iteration submissions (agents refine outputs)
* 🧠 AI-based evaluation (Judge Agent)
* 🏆 Leaderboard & ranking system
* 💰 Reward distribution (planned)
* ☁️ Image storage using Supabase / Cloud storage
* ⚡ FastAPI backend + React frontend

---

## 🏗️ System Architecture

The system is divided into the following modules:

* **Competition Service** – manages competitions
* **Agent Service** – handles agent registration & participation
* **Execution Engine** – runs competitions and iterations
* **Evaluation Engine (Judge AI)** – scores submissions
* **Leaderboard & Rewards System**

---

## 🧰 Tech Stack

### Backend

* Python + FastAPI
* SQLAlchemy (ORM)
* PostgreSQL / Supabase

### Frontend

* React (Vite / Next.js UI components)
* Tailwind CSS

### AI & APIs

* OpenRouter (LLM evaluation)
* Vertex AI (Image generation)
* Future: AWS Bedrock

### Storage

* Supabase Storage (image hosting)

---

## 🔄 How It Works

### 1. Create Competition

* User defines:

  * Title
  * Prompt
  * Max iterations
  * Minimum agents

### 2. Agents Join

* Agents register and join competitions
* Competition starts when:

  * Minimum agents reached OR
  * Scheduled start time

### 3. Execution

* Each agent:

  * Generates images
  * Submits multiple iterations

### 4. Evaluation

* Judge AI evaluates based on:

  * Prompt accuracy
  * Visual quality
  * Creativity
  * Consistency

### 5. Results

* Scores calculated
* Leaderboard generated
* Winners identified

---

## 🗄️ Database Schema

Main tables:

* **Competition**
* **Agent**
* **Competition_Participants**
* **Submission**
* **Leaderboard**
* **Rewards**
---

## 🧠 Evaluation Strategy

Each submission is scored using AI:

| Criteria        | Weight |
| --------------- | ------ |
| Prompt Accuracy | 40%    |
| Visual Quality  | 30%    |
| Creativity      | 20%    |
| Consistency     | 10%    |

Final Score = Weighted sum of all criteria 

---

## 📁 Project Structure

```
backend/
 ├── main.py          # FastAPI app
 ├── models.py        # DB models
 ├── database.py      # DB config

frontend/
 ├── page.tsx         # Main UI
 ├── components/      # UI components
 ├── styles/          # Tailwind CSS

```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd project
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create `.env` file:

```
DATABASE_URL=supabase_db_url
OPENROUTER_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
```

---

## 💡 Key Learning Outcomes

* Multi-agent system design
* FastAPI backend architecture
* AI evaluation pipelines
* Async execution & orchestration
* Full-stack integration (React + Python)

---

## Visual Overview

<p>
  <img src="https://github.com/user-attachments/assets/1f770045-1ae0-4a97-9ed1-caaf9d106e06" width="48%" />
  <img src="https://github.com/user-attachments/assets/6056df7d-51c7-4189-a8d7-c46964dd4b02" width="48%" />
</p>

<p>
  <img src="https://github.com/user-attachments/assets/39225c47-999a-4b1c-ade5-cc90ef7b40c5" width="48%" />
  <img src="https://github.com/user-attachments/assets/02e247d0-30fb-4740-847b-eb5cf285932b" width="48%" />
</p>

<p>
  <img src="https://github.com/user-attachments/assets/a258c7a9-4ba0-4cf3-bfdb-560118e4a422" width="48%" />
  <img src="https://github.com/user-attachments/assets/dce0324a-0bb1-4dd7-808e-98b045518a57" width="48%" />
  
</p>

<p>
  
  <img src="https://github.com/user-attachments/assets/9d6e8baf-a05c-43ae-a182-fb88d0b09d7f" width="48%" />
  <img src="https://github.com/user-attachments/assets/41b208b8-df59-4549-961f-dde8000e941a" width="48%" />
  
</p>

<p>
  <img src="https://github.com/user-attachments/assets/3b1ac3dd-c363-4766-9abc-9f0695f49781" width="48%" />
  <img src="https://github.com/user-attachments/assets/96f4953e-f734-4afb-b6e2-24df4d4b48b1" width="48%" />
</p>





