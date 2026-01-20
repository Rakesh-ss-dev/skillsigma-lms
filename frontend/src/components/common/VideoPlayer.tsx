import React, { useMemo } from 'react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

interface VideoPlayerProps {
    streamUrl: string; // The Django URL (e.g., /api/lessons/1/stream/)
    title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title = "Course Content" }) => {

    // 1. Construct the Authenticated URL
    // We must append the token because <video> tags cannot send Auth Headers
    const authenticatedUrl = useMemo(() => {
        const token = localStorage.getItem('access');
        if (!token) return streamUrl;

        // Check if URL already has params to append correctly
        const separator = streamUrl.includes('?') ? '&' : '?';
        return `${streamUrl}${separator}token=${token}`;
    }, [streamUrl]);

    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <MediaPlayer
                src={{
                    src: authenticatedUrl,
                    type: 'video/mp4' // Explicitly tell Vidstack this is a video file
                }}
                viewType="video"
                streamType="on-demand"
                logLevel="warn"
                crossOrigin={true} // Important for cookies/CORS
                playsInline
                title={title}
                aspectRatio="16/9"
                className="font-sans"
            >
                <MediaProvider />
                <DefaultVideoLayout icons={defaultLayoutIcons} />
            </MediaPlayer>
        </div>
    );
};

export default VideoPlayer;