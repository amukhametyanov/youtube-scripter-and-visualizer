
import React, { useState, useCallback } from 'react';
import SceneDisplay from './components/SceneDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ChatBot from './components/ChatBot';
import { generateScriptAndVisuals } from './services/geminiService';
import type { ScriptData, GroundingChunk } from './types';
import { ScriptIcon, LanguageIcon, ChatIcon, SourceIcon, QuestionIcon, DownloadIcon } from './components/icons';

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState('');
  const [language, setLanguage] = useState<'English' | 'Russian'>('English');
  const [numScenes, setNumScenes] = useState(5);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [loadedImagesCount, setLoadedImagesCount] = useState(0);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setScriptData(null);
    setGroundingChunks([]);
    setImageUrls({});
    setLoadedImagesCount(0);

    try {
      const result = await generateScriptAndVisuals(topic, language, numScenes, questions);
      setScriptData(result.scriptData);
      setGroundingChunks(result.groundingChunks.filter(chunk => chunk.web));
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, language, numScenes, questions]);

  const handleImageGenerated = useCallback((index: number, url: string) => {
    setImageUrls(prev => ({ ...prev, [index]: url }));
    setLoadedImagesCount(prev => prev + 1);
  }, []);

  const handleDownload = () => {
    if (!scriptData) return;

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${scriptData.title}</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 20px; background-color: #111827; color: #d1d5db; }
                .container { max-width: 800px; margin: auto; }
                h1 { color: #60a5fa; text-align: center; }
                h2 { color: #3b82f6; border-bottom: 1px solid #374151; padding-bottom: 5px; }
                h3 { color: #9ca3af; margin-top: 10px; margin-bottom: 20px; font-weight: 500;}
                p { white-space: pre-wrap; }
                img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 15px; }
                .scene { background-color: #1f2937; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #374151;}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${scriptData.title}</h1>
                ${scriptData.scenes.map((scene, index) => `
                    <div class="scene">
                        <h2>Scene ${index + 1}</h2>
                        <h3>${scene.title}</h3>
                        <p>${scene.script}</p>
                        ${imageUrls[index] ? `<img src="${imageUrls[index]}" alt="${scene.visual_prompt}">` : '<p><i>Visual not available.</i></p>'}
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-12 text-center">
          <LoadingSpinner text="Crafting your script and visuals..." />
          <p className="mt-4 text-gray-400">This may take a moment, especially the visuals!</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mt-12 text-center bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          <p><strong>Error:</strong> {error}</p>
        </div>
      );
    }
    
    if (scriptData) {
        const totalImagesToLoad = Math.min(scriptData.scenes.length, 5);
        const allImagesLoaded = loadedImagesCount === totalImagesToLoad;
        return (
            <div className="mt-12">
                <div className="flex justify-center items-center text-center mb-4 gap-4 flex-wrap">
                    <h2 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{scriptData.title}</h2>
                    <button
                        onClick={handleDownload}
                        disabled={!allImagesLoaded}
                        className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
                        title={allImagesLoaded ? "Download script and visuals" : "Waiting for all visuals to generate..."}
                    >
                        <DownloadIcon />
                        <span className="ml-2">Download</span>
                    </button>
                </div>
                {groundingChunks.length > 0 && (
                  <div className="mb-8 p-4 bg-gray-800/60 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold text-gray-300 mb-2 flex items-center"><SourceIcon /> Information Sources</h4>
                      <ul className="list-disc list-inside text-sm text-blue-400">
                          {groundingChunks.map((chunk, index) => (
                            chunk.web && <li key={index} className="mb-1">
                                <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-300 transition-colors">
                                    {chunk.web.title}
                                </a>
                            </li>
                          ))}
                      </ul>
                  </div>
                )}
                <div className="space-y-8">
                    {scriptData.scenes.map((scene, index) => (
                        <SceneDisplay key={index} scene={scene} index={index} onImageGenerated={handleImageGenerated} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="text-center mt-12 text-gray-400">
            <p>Enter a topic above to generate your YouTube script and visuals.</p>
        </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans antialiased" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)" }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
            AI Script & Visuals
          </h1>
          <p className="text-lg text-gray-400">Generate YouTube scripts and visuals with the power of Gemini.</p>
        </header>
        
        <div className="p-6 bg-gray-800/50 rounded-xl shadow-2xl backdrop-blur-md border border-gray-700/50">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Video Topic</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <ScriptIcon />
                </div>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., The history of black holes"
                  className="w-full bg-gray-900/70 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="questions" className="block text-sm font-medium text-gray-300 mb-2">
                Guiding Questions <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <QuestionIcon />
                </div>
                <textarea
                  id="questions"
                  value={questions}
                  onChange={(e) => setQuestions(e.target.value)}
                  placeholder="Enter one question per line. The script will be based on the answers."
                  rows={4}
                  className="w-full bg-gray-900/70 border border-gray-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <div className="relative flex items-center bg-gray-900/70 border border-gray-600 rounded-lg text-white placeholder-gray-500">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                            <LanguageIcon/>
                        </div>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'English' | 'Russian')}
                            className="w-full bg-transparent appearance-none py-3 pl-10 pr-4 focus:outline-none"
                        >
                            <option value="English" className="bg-gray-800">English</option>
                            <option value="Russian" className="bg-gray-800">Russian</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="numScenes" className="block text-sm font-medium text-gray-300 mb-2">Number of Scenes: <span className="font-bold">{numScenes}</span></label>
                    <input
                        id="numScenes"
                        type="range"
                        min="5"
                        max="10"
                        value={numScenes}
                        onChange={(e) => setNumScenes(parseInt(e.target.value, 10))}
                        className="w-full h-2 mt-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>


            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Generating...' : 'Generate Script & Visuals'}
            </button>
          </form>
        </div>

        <main>
          {renderContent()}
        </main>
      </div>
      
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-5 right-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 z-40"
        aria-label="Open Chat"
      >
        <ChatIcon />
      </button>

      <ChatBot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default App;
