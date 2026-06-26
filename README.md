# 🧮 Math Search Engine

A powerful, AI-driven mathematical search engine and computational solver. This application allows users to search through extensive mathematical textbook datasets, get simplified AI explanations for complex topics, and perform advanced mathematical computations seamlessly.

## 🌟 Key Features

- **Semantic Search Engine:** Custom-built indexing and query processing backend (TF-IDF/Vector based) to rapidly search through thousands of math documents and textbook snippets.
- **Advanced Math Solver:** Integrated with Wolfram Alpha's Computational Engine to solve equations, integrate, differentiate, and plot graphs dynamically.
- **AI-Powered Explanations:** Utilizes Google's Gemini 2.0 Flash model to break down complex mathematical concepts into simple, easy-to-understand explanations with concrete examples.
- **Beautiful UI:** Built with React, Vite, and TailwindCSS, featuring a fully responsive dark/light mode design, micro-animations (Framer Motion), and flawless LaTeX mathematical rendering (MathJax).
- **Session Dashboard:** Built-in history tracking and metrics dashboard to review previous calculations and search logs.

## 📂 Project Structure (File Map)

```text
Math-Search-Engine/
├── 📁 Backend/                   # Python FastAPI Backend
│   ├── api.py                    # Main FastAPI application routes & endpoints
│   ├── Dashboard.py              # System statistics & metrics generation
│   ├── Evaluation.py             # Information Retrieval evaluation metrics (Precision, Recall, MAP)
│   ├── Indexing.py               # Inverted index building and document mapping
│   ├── Preprocessing.py          # Text cleaning, tokenization, and normalization
│   ├── QueryProcessing.py        # Search execution and document ranking algorithms
│   ├── Queryexpansion.py         # Advanced semantic query expansion (WordNet/BERT)
│   └── main.py                   # Alternative entry point / CLI utility
│
├── 📁 Frontend/                  # React + Vite Frontend
│   ├── server.js                 # Custom Express proxy server for Wolfram Alpha and History
│   ├── vite.config.js            # Vite bundler configuration
│   ├── package.json              # Node.js dependencies
│   └── 📁 src/                   # React source code
│       ├── App.jsx               # Main application layout, state, and view router
│       ├── main.jsx              # React DOM entry point
│       ├── index.css             # Global CSS and Tailwind styling
│       ├── 📁 components/        # Reusable UI elements (ResultCard, LogsTable, Graphics)
│       ├── 📁 pages/             # Main views (Landing, Results, Dashboard, Solver, Document)
│       ├── 📁 services/          # External API integration logic (Gemini)
│       ├── 📁 lib/               # Helper utility functions
│       └── 📁 constants/         # Static configurations and placeholder data
│
├── 📁 Documents/                 # (Ignored) Large raw CSV mathematical datasets
├── 📁 Project/                   # (Ignored) IDE configurations and caches
└── .gitignore                    # Git exclusion rules to keep the repo clean
```

## 🚀 Getting Started

### 1. Environment & API Keys Setup

Both the Frontend and Backend use environment variables to run. You will need to obtain API keys for the services:
- **Google Gemini API Key:** Generate one from [Google AI Studio](https://aistudio.google.com/).
- **Wolfram Alpha App ID:** Register and get one from [Wolfram Alpha Developer Portal](https://developer.wolframalpha.com/).

#### Setup Frontend Env:
1. Navigate to the `Frontend` directory.
2. Copy `.env.example` to `.env`.
3. Add your keys:
   ```bash
   GEMINI_API_KEY="your-gemini-key"
   WOLFRAM_APP_ID="your-wolfram-app-id"
   ```

#### Setup Backend Env (Optional):
You can also run the backend independently by copying `Backend/.env.example` to `Backend/.env` and setting your keys there. If Backend `.env` is not set, it will automatically fall back to loading keys from the Frontend `.env` configuration.

### 2. Large Datasets Setup

Due to GitHub's file size limits, the large dataset files are excluded from version control (`.gitignore`).
To run the search engine, you must acquire the following datasets and place them under the `Documents/` folder in the root directory:
1. `tiny-math-textbooks.csv` (approx. 391 MB)
2. `camel.ai.math.csv` (approx. 149 MB)

Ensure the directory structure matches:
```text
Math-Search-Engine/
└── 📁 Documents/
    ├── camel.ai.math.csv
    └── tiny-math-textbooks.csv
```

### 3. Installation & Running in Development Mode

#### Running the Backend
From the root directory, navigate to `Backend`, install dependencies, and run the FastAPI server:
```bash
cd Backend
# Install python requirements
pip install -r requirements.txt

# Run the FastAPI server
uvicorn api:app --port 8000 --reload
```

#### Running the Frontend (Vite Dev Server)
Open a new terminal, navigate to `Frontend`, install dependencies, and start the development server:
```bash
cd Frontend
# Install dependencies
npm install

# Start the development server
npm run dev
```
Then, open your browser and navigate to `http://localhost:3000` to start exploring!

### 4. Running in Production Mode

To run the application in a production-ready setup:
1. Build the frontend assets:
   ```bash
   cd Frontend
   npm run build
   ```
2. Set the environment variable `NODE_ENV=production` and start the server:
   ```bash
   # Linux/macOS
   NODE_ENV=production npm run dev
   
   # Windows (PowerShell)
   $env:NODE_ENV="production"; npm run dev
   ```
The Express proxy server will serve the compiled React static files and handle all API proxying to the Python backend (default: `http://localhost:8000`).
