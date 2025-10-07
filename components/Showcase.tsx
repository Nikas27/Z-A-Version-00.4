import React, { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/databaseService';
import { Design } from '../types';
import { useToast } from '../contexts/ToastContext';

const Showcase: React.FC = () => {
  const [creations, setCreations] = useState<Design[]>([]);
  const showToast = useToast();

  const fetchCreations = useCallback(() => {
    const allCreations = databaseService.getAllCreations();
    // Filter for images only, as they are more general-purpose for inspiration
    setCreations(allCreations.filter(c => c.type === 'image').slice(0, 10));
  }, []);

  useEffect(() => {
    fetchCreations(); // Initial fetch
    
    databaseService.subscribe('data_changed', fetchCreations);
    
    return () => {
      databaseService.unsubscribe('data_changed', fetchCreations);
    };
  }, [fetchCreations]);

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    showToast('success', 'Prompt Copied!', 'The prompt has been copied to your clipboard.');
  };

  const handleDownload = async (creation: Design) => {
    showToast('info', 'Preparing Download', 'Your download will begin shortly...');
    try {
        const url = creation.resultDataUrl;
        const cleanPrompt = creation.prompt.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${cleanPrompt || 'inspiration'}.png`;

        // If it's already a data URL, we can download directly
        if (url.startsWith('data:')) {
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // If it's a regular URL, fetch it and convert to blob to download
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok.');
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error('Download failed:', error);
        showToast('error', 'Download Failed', 'Could not download the image. The resource might be unavailable or blocked by CORS policy.');
    }
  };


  if (creations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200">
        Daily Inspirations
      </h3>
      <div className="relative">
         <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {creations.map((creation) => (
            <div 
                key={creation.id}
                className="group relative flex-shrink-0 w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-md"
            >
                <img src={creation.resultDataUrl} alt={creation.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                    <p className="text-xs font-medium leading-tight line-clamp-2 mb-2">{creation.prompt}</p>
                     <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyPrompt(creation.prompt); }}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                            aria-label="Copy Prompt"
                            title="Copy Prompt"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" /></svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(creation); }}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                            aria-label="Download Image"
                            title="Download Image"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            </div>
            ))}
        </div>
         <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-gray-50 dark:from-gray-900 pointer-events-none"></div>
         <div className="absolute top-0 left-0 h-full w-12 bg-gradient-to-r from-gray-50 dark:from-gray-900 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Showcase;
