import React, { useState, useEffect, useRef } from 'react';
import { MathJaxContext } from 'better-react-mathjax';
import { AnimatePresence } from 'framer-motion';
import { explainMathConcept, searchBackend } from './services/geminiService';

// Pages
import LandingPage from './pages/LandingPage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import DocumentPage from './pages/DocumentPage';
import SolverPage from './pages/SolverPage';

// Utils
import { isMathQuery, getSuggestedQueries, formatAIText } from './lib/utils';
import BackgroundGraphics from './components/BackgroundGraphics';

const mathJaxConfig = {
  loader: { load: ["input/asciimath"] },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']]
  }
};

export default function App() {
  const [view, setView] = useState('landing');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [explainingId, setExplainingId] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [history, setHistory] = useState([]);
  const [wolframResults, setWolframResults] = useState({});
  const [conceptProperties, setConceptProperties] = useState({});
  const [scratchpadInput, setScratchpadInput] = useState('');
  const [scratchpadLoading, setScratchpadLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [instantAnswer, setInstantAnswer] = useState(null);
  const [backendError, setBackendError] = useState(null);  // null | string
  const [expandedTerms, setExpandedTerms] = useState([]);
  const [originalTerms, setOriginalTerms] = useState([]);
  const [searchTime, setSearchTime] = useState(null);
  const [totalFound, setTotalFound] = useState(0);

  // Expansion feature toggles
  const [useWordNet, setUseWordNet] = useState(false);
  const [useBert, setUseBert] = useState(false);
  const [useFeedback, setUseFeedback] = useState(false);
  
  // Solver specific
  const [solverInput, setSolverInput] = useState('');
  const [solverResult, setSolverResult] = useState(null);
  const [isSolving, setIsSolving] = useState(false);
  const [solverHistory, setSolverHistory] = useState([]);
  
  // Dashboard specific
  const [dashboardTab, setDashboardTab] = useState('Overview');
  const [persistentHistory, setPersistentHistory] = useState([]);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });

  const searchInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => setPersistentHistory(data))
      .catch(err => console.error("Failed to fetch history:", err));
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const saveToPersistentHistory = async (query, result, type) => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, result, type })
      });
      const newEntry = await res.json();
      setPersistentHistory(prev => [newEntry, ...prev].slice(0, 100));
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setInstantAnswer(null);
    setBackendError(null);
    setExpandedTerms([]);
    setOriginalTerms([]);
    setSearchTime(null);
    setTotalFound(0);
    setView('results');
    setQuery(searchQuery);
    setExplainingId(null);

    setHistory(prev => [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5));

    try {
      // Real backend search + optional Wolfram instant answer in parallel
      const searchPromise = searchBackend(searchQuery, { useWordNet, useBert, useFeedback });
      let instantPromise = Promise.resolve(null);
      
      if (isMathQuery(searchQuery)) {
        instantPromise = fetch(`/api/wolfram?q=${encodeURIComponent(searchQuery)}`)
          .then(res => {
              if (!res.ok) throw new Error("Endpoint missing");
              return res.json();
          })
          .catch(() => null);
      }

      const [backendData, instantData] = await Promise.all([searchPromise, instantPromise]);

      setResults(backendData.results ?? []);
      setExpandedTerms(backendData.expanded_terms ?? []);
      setOriginalTerms(backendData.original_terms ?? []);
      setSearchTime(backendData.elapsed_ms ?? null);
      setTotalFound(backendData.total_found ?? 0);

      if (instantData && instantData.result) {
        setInstantAnswer(instantData);
        saveToPersistentHistory(searchQuery, instantData.result, 'search');
      }
    } catch (error) {
      console.error("Search failed:", error);
      if (error.offline) {
        setBackendError("⚠️ Backend offline — start the FastAPI server: uvicorn Backend.api:app --port 8000");
      } else {
        setBackendError(`Search error: ${error.message}`);
      }
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const runSolver = async (customInput) => {
    const input = customInput || solverInput;
    if (!input.trim()) return;

    setIsSolving(true);
    try {
      const results = await Promise.allSettled([
        fetch(`/api/wolfram?q=${encodeURIComponent(input)}`),
        fetch(`/api/wolfram?q=${encodeURIComponent(input)}&type=simple`)
      ]);
      const valid = results.map(r => r.status === 'fulfilled' && r.value.ok ? r.value : null);
      const textData = valid[0] ? await valid[0].json() : {};
      const imgData = valid[1] ? await valid[1].json() : {};

      setSolverResult({
        text: textData.result,
        imageUrl: imgData.imageUrl
      });
      
      if (textData.result) {
        saveToPersistentHistory(input, textData.result, 'solver');
      }
      
      if (input !== solverHistory[0]) {
        setSolverHistory(prev => [input, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error("Solver error:", error);
    } finally {
      setIsSolving(false);
    }
  };

  const fetchWolfram = async (topic, id) => {
    try {
      const results = await Promise.allSettled([
        fetch(`/api/wolfram?q=${encodeURIComponent(topic)}`),
        fetch(`/api/wolfram?q=${encodeURIComponent(topic)}&type=simple`),
        fetch(`/api/wolfram?q=${encodeURIComponent(topic)}&type=pod&pod=Plot`),
        fetch(`/api/wolfram?q=${encodeURIComponent(topic)}&type=pod&pod=Derivative`),
        fetch(`/api/wolfram?q=${encodeURIComponent(topic)}&type=pod&pod=Integral`)
      ]);
      
      const valid = results.map(r => r.status === 'fulfilled' && r.value.ok ? r.value : null);
      const [textRes, imgRes, plotRes, derivRes, intRes] = valid;
      
      const textData = textRes ? await textRes.json() : {};
      const imgData = imgRes ? await imgRes.json() : {};
      const plotData = plotRes ? await plotRes.json() : {};
      const derivData = derivRes ? await derivRes.json() : {};
      const intData = intRes ? await intRes.json() : {};
      
      setWolframResults(prev => ({ 
        ...prev, 
        [id]: { result: textData.result, imageUrl: imgData.imageUrl } 
      }));

      setConceptProperties(prev => ({
        ...prev,
        [id]: {
          plot: plotData.imageUrl,
          derivative: derivData.imageUrl,
          integral: intData.imageUrl
        }
      }));
    } catch (error) {
      console.error("Wolfram fetch failed:", error);
    }
  };

  const toggleAI = async (doc) => {
    if (explainingId === doc.id) {
      setExplainingId(null);
      return;
    }

    setExplainingId(doc.id);

    if (!explanations[doc.id]) {
      setLoadingId(doc.id);
      try {
        const aiPromise = explainMathConcept(doc.topic, doc.id);
        const wolframPromise = fetchWolfram(doc.topic, doc.id);
        
        const [text] = await Promise.all([aiPromise, wolframPromise]);
        setExplanations(prev => ({ ...prev, [doc.id]: text }));
      } catch (error) {
        setExplanations(prev => ({ ...prev, [doc.id]: `Could not load explanation: ${error.message}` }));
      } finally {
        setLoadingId(null);
      }
    }
  };

  const handleScratchpadCompute = async (id, customQuery) => {
    const q = customQuery || scratchpadInput;
    if (!q.trim()) return;

    setScratchpadLoading(true);
    try {
      const results = await Promise.allSettled([
        fetch(`/api/wolfram?q=${encodeURIComponent(q)}`),
        fetch(`/api/wolfram?q=${encodeURIComponent(q)}&type=simple`)
      ]);
      const valid = results.map(r => r.status === 'fulfilled' && r.value.ok ? r.value : null);
      const textData = valid[0] ? await valid[0].json() : {};
      const imgData = valid[1] ? await valid[1].json() : {};

      setWolframResults(prev => ({ 
        ...prev, 
        [id]: { result: textData.result, imageUrl: imgData.imageUrl } 
      }));
    } catch (error) {
      console.error("Scratchpad compute failed:", error);
    } finally {
      setScratchpadLoading(false);
    }
  };

  const openDocument = (doc) => {
    setSelectedDoc(doc);
    setView('document');
    if (!explanations[doc.id]) {
      toggleAI(doc);
    }
  };

  const handleChainAction = (action) => {
    if (!solverResult?.text) return;
    let newQuery = '';
    const currentResult = solverResult.text;

    switch (action) {
      case 'integrate': newQuery = `integrate ${currentResult}`; break;
      case 'differentiate': newQuery = `d/dx ${currentResult}`; break;
      case 'roots': newQuery = `solve ${currentResult} = 0`; break;
      case 'simplify': newQuery = `simplify ${currentResult}`; break;
    }

    setSolverInput(newQuery);
    runSolver(newQuery);
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className={`min-h-screen flex flex-col font-sans bg-white dark:bg-slate-950 transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
        <BackgroundGraphics />
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingPage 
              key="landing"
              query={query}
              setQuery={setQuery}
              handleSearch={handleSearch}
              setView={setView}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
              history={history}
              searchInputRef={searchInputRef}
            />
          )}
          {view === 'results' && (
            <ResultsPage 
              key="results"
              query={query}
              setQuery={setQuery}
              handleSearch={handleSearch}
              isSearching={isSearching}
              results={results}
              instantAnswer={instantAnswer}
              backendError={backendError}
              expandedTerms={expandedTerms}
              originalTerms={originalTerms}
              searchTime={searchTime}
              totalFound={totalFound}
              useWordNet={useWordNet}
              setUseWordNet={setUseWordNet}
              useBert={useBert}
              setUseBert={setUseBert}
              useFeedback={useFeedback}
              setUseFeedback={setUseFeedback}
              handleSearch={handleSearch}
              explainingId={explainingId}
              toggleAI={toggleAI}
              loadingId={loadingId}
              explanations={explanations}
              formatAIText={formatAIText}
              openDocument={openDocument}
              scratchpadInput={scratchpadInput}
              setScratchpadInput={setScratchpadInput}
              handleScratchpadCompute={handleScratchpadCompute}
              scratchpadLoading={scratchpadLoading}
              wolframResults={wolframResults}
              setView={setView}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
            />
          )}
          {view === 'dashboard' && (
            <DashboardPage 
              key="dashboard"
              dashboardTab={dashboardTab}
              setDashboardTab={setDashboardTab}
              persistentHistory={persistentHistory}
              setPersistentHistory={setPersistentHistory}
              setView={setView}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
              setSolverInput={setSolverInput}
              runSolver={runSolver}
              handleSearch={handleSearch}
            />
          )}
          {view === 'document' && (
            <DocumentPage 
              key="document"
              doc={selectedDoc}
              setView={setView}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              loadingId={loadingId}
              explanations={explanations}
              formatAIText={formatAIText}
              conceptProperties={conceptProperties}
              scratchpadInput={scratchpadInput}
              setScratchpadInput={setScratchpadInput}
              handleScratchpadCompute={handleScratchpadCompute}
              scratchpadLoading={scratchpadLoading}
              wolframResults={wolframResults}
              getSuggestedQueries={getSuggestedQueries}
            />
          )}
          {view === 'solver' && (
            <SolverPage 
              key="solver"
              solverInput={solverInput}
              setSolverInput={setSolverInput}
              runSolver={runSolver}
              isSolving={isSolving}
              solverResult={solverResult}
              solverHistory={solverHistory}
              handleChainAction={handleChainAction}
              setView={setView}
              toggleDarkMode={toggleDarkMode}
              isDarkMode={isDarkMode}
            />
          )}
        </AnimatePresence>
      </div>
    </MathJaxContext>
  );
}
