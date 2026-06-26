import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, "history.json");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // History API Routes
  app.get("/api/history", async (req, res) => {
    try {
      const data = await fs.readFile(HISTORY_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      // Return empty array if file doesn't exist
      res.json([]);
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const { query, result, type, timestamp } = req.body;
      let history = [];
      try {
        const data = await fs.readFile(HISTORY_FILE, "utf-8");
        history = JSON.parse(data);
      } catch (e) {
        // File doesn't exist, start with empty
      }

      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        query,
        result,
        type,
        timestamp: timestamp || new Date().toISOString()
      };

      history = [newEntry, ...history].slice(0, 100); // Keep last 100
      await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
      res.json(newEntry);
    } catch (error) {
      console.error("Save history error:", error);
      res.status(500).json({ error: "Failed to save history" });
    }
  });

  // In-memory cache for Wolfram responses
  const wolframCache = new Map();
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

  // Wolfram Alpha Proxy Route
  app.get("/api/wolfram", async (req, res) => {
    try {
      const { q, type, pod } = req.query;
      const appId = process.env.WOLFRAM_APP_ID;

      if (!q) {
        return res.status(400).json({ error: "Missing query parameter 'q'" });
      }

      if (!appId || appId === "YOUR_WOLFRAM_APP_ID") {
        return res.status(400).json({ error: "Wolfram AppID not configured" });
      }

      // Cache lookup
      const cacheKey = `${type}:${q}:${pod || ""}`;
      const cached = wolframCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }

      let result;
      let usedUrl = "";

      if (type === "simple" || type === "pod") {
        const imageUri = `https://api.wolframalpha.com/v1/simple?appid=${appId}&i=${encodeURIComponent(q)}&background=F8FAFC&fontsize=16`;
        result = { imageUrl: imageUri };
        // We don't really need to fetch for simple images as we return the URL, but let's cache the URL structure
      } else if (type === "advanced") {
        usedUrl = `https://api.wolframalpha.com/v1/query?appid=${appId}&input=${encodeURIComponent(q)}&output=json`;
        const response = await fetch(usedUrl);
        
        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Wolfram Error ${response.status}: ${errorMsg}`);
        }
        
        result = await response.json();
      } else {
        // Default to short answer API
        usedUrl = `https://api.wolframalpha.com/v1/result?appid=${appId}&i=${encodeURIComponent(q)}`;
        const response = await fetch(usedUrl);

        if (response.status === 501) {
          // Fallback to Full Results API if Short Answer fails
          const fallbackUrl = `https://api.wolframalpha.com/v1/query?appid=${appId}&input=${encodeURIComponent(q)}&output=json`;
          const fallbackRes = await fetch(fallbackUrl);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const pods = data.queryresult?.pods || [];
            const targetPod = pods.find(p => p.primary || ['Result', 'Solution', 'Roots', 'Derivative', 'Integral', 'Limit', 'Exact result'].includes(p.title));
            if (targetPod && targetPod.subpods && targetPod.subpods.length > 0) {
              const text = targetPod.subpods.map(sp => sp.plaintext).filter(Boolean).join(' | ');
              if (text) {
                result = { result: text };
                wolframCache.set(cacheKey, { data: result, timestamp: Date.now() });
                return res.json(result);
              }
            }
          }
          // If fallback fails to find text, return null result instead of 501 to avoid console errors
          result = { result: null };
          wolframCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return res.json(result);
        }

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(`Wolfram Error ${response.status}: ${errorMsg}`);
        }

        const text = await response.text();
        result = { result: text };
      }

      // Save to cache
      wolframCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      // Cleanup old cache entries occasionally
      if (wolframCache.size > 1000) {
        const oldestKey = wolframCache.keys().next().value;
        if (oldestKey) wolframCache.delete(oldestKey);
      }

      res.json(result);
    } catch (error) {
      console.error("Wolfram Proxy Error:", error);
      const statusCode = error.message?.includes("400") ? 400 : 500;
      res.status(statusCode).json({ 
        error: "Failed to fetch from Wolfram Alpha",
        details: error.message 
      });
    }
  });

  // Proxy remaining /api/ requests to Python backend (default: http://localhost:8000)
  const backendProxyEndpoints = ["/api/search", "/api/explain", "/api/evaluate", "/api/health", "/api/stats"];
  backendProxyEndpoints.forEach(endpoint => {
    app.get(endpoint, async (req, res) => {
      try {
        const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";
        const targetPath = endpoint.replace(/^\/api/, "");
        const queryParams = new URLSearchParams(req.query).toString();
        const targetUrl = `${BACKEND_URL}${targetPath}${queryParams ? "?" + queryParams : ""}`;
        
        const response = await fetch(targetUrl);
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = { detail: await response.text() };
        }
        res.status(response.status).json(data);
      } catch (error) {
        console.error(`Error proxying ${endpoint}:`, error);
        res.status(500).json({ error: "Failed to connect to backend", details: error.message });
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();
