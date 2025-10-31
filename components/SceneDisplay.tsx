
import React, { useState, useEffect } from 'react';
import type { Scene } from '../types';
import { generateImage } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface SceneDisplayProps {
  scene: Scene;
  index: number;
  onImageGenerated: (index: number, url: string) => void;
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({ scene, index, onImageGenerated }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only generate images for the first 5 scenes.
    if (index >= 5) {
      setIsLoading(false);
      return;
    }

    const fetchImage = async () => {
      if (!scene.visual_prompt) {
        setIsLoading(false);
        setError("No visual prompt provided for this scene.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const url = await generateImage(scene.visual_prompt);
        setImageUrl(url);
        onImageGenerated(index, url);
      } catch (e) {
        setError("Could not generate visual for this scene.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImage();
  }, [scene.visual_prompt, index, onImageGenerated]);

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg mb-8 backdrop-blur-sm border border-gray-700/50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="p-6 lg:p-8 flex flex-col">
          <div className="mb-4">
              <span className="block text-sm font-semibold uppercase text-blue-500 tracking-wider">Scene {index + 1}</span>
              <h3 className="text-2xl font-bold text-white mt-1">{scene.title}</h3>
          </div>
          <p className="text-gray-300 leading-relaxed flex-grow whitespace-pre-wrap">{scene.script}</p>
          
          <div className="mt-auto pt-4 border-t border-gray-700">
             <div>
                <p className="text-xs text-gray-500 italic">Visual Prompt: "{scene.visual_prompt}"</p>
             </div>
          </div>
        </div>
        <div className="bg-gray-900/50 min-h-[300px] flex items-center justify-center">
          {isLoading && <LoadingSpinner text="Generating visual..." />}
          {error && <div className="text-red-400 p-4 text-center">{error}</div>}
          {imageUrl && (
            <img src={imageUrl} alt={scene.visual_prompt} className="w-full h-full object-cover" />
          )}
          {!isLoading && !imageUrl && !error && index >= 5 && (
            <div className="text-gray-400 p-4 text-center">
              Visuals are only generated for the first 5 scenes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SceneDisplay;
