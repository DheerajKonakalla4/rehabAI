import React, { useRef, useState } from 'react';

const getYouTubeId = (url) => {
  if (!url) return null;

  const watchMatch = url.match(/[?&]v=([\w-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = url.match(/youtu\.be\/([\w-]{11})/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = url.match(/youtube\.com\/embed\/([\w-]{11})/);
  if (embedMatch) return embedMatch[1];

  return null;
};

const VideoPlayer = ({ src, title, description, onComplete }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const youtubeId = getYouTubeId(src);
  const youtubeEmbedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1` : null;

  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percentage);
      if (percentage >= 99 && onComplete) {
        onComplete();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-primary p-4 my-6">
      <h3 className="text-xl font-bold mb-2 text-primary-dark">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      
      {youtubeEmbedUrl ? (
        <div className="space-y-3">
          <div className="relative w-full overflow-hidden rounded bg-black shadow-inner" style={{ paddingTop: '56.25%' }}>
            <iframe
              title={title}
              src={youtubeEmbedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary-dark"
          >
            ▶ Open on YouTube
          </a>
        </div>
      ) : (
        <div className="relative w-full aspect-w-16 aspect-h-9 bg-black rounded overflow-hidden shadow-inner group">
          <video 
            ref={videoRef}
            src={src || "https://www.w3schools.com/html/mov_bbb.mp4"} 
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => { setIsPlaying(false); if(onComplete) onComplete(); }}
          />
          
          {/* Simple Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center text-white">
            <button 
              onClick={togglePlay} 
              className="focus:outline-none flex items-center justify-center h-10 w-10 bg-primary hover:bg-primary-dark rounded-full"
            >
              {isPlaying ? '⏸' : '▶️'}
            </button>
            
            <div className="flex-grow mx-4">
              <div className="h-2 w-full bg-gray-600 rounded-full cursor-pointer relative overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="text-sm font-semibold">{Math.round(progress)}%</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;