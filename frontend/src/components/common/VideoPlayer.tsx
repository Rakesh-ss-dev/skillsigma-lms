import React from 'react';
// Import main components
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
// Import the "Default Layout" (pre-built UI like standard LMS players)
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Import the CSS (Required for it to look good)
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VideoPlayerProps {
    url: string; // Accepts full URLs like 'https://www.youtube.com/watch?v=...'
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            {/* The Player Container */}
            <MediaPlayer
                src={url}
                viewType="video"
                streamType="on-demand"
                logLevel="warn"
                crossOrigin
                playsInline
                title="Course Content" // You can pass dynamic titles here
                aspectRatio="16/9"
            >
                {/* The Provider handles loading YouTube/Vimeo internally */}
                <MediaProvider />

                {/* The Layout handles the UI (Buttons, Sliders, Speed, Quality) */}
                {/* This completely replaces the YouTube/Vimeo native controls */}
                <DefaultVideoLayout
                    icons={defaultLayoutIcons}

                    // You can customize which buttons appear here:
                    slots={{
                        // Removing these slots would hide them, but default is usually good
                    }}
                />
            </MediaPlayer>
        </div>
    );
};

export default VideoPlayer;