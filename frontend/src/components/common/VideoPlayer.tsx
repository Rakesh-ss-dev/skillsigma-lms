import React, { useMemo } from 'react';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

interface VideoPlayerProps {
    streamUrl: string;
    title?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl, title = "Course Content" }) => {

    const isExternal = useMemo(() => {
        return streamUrl.includes('youtu.be') ||
            streamUrl.includes('youtube.com') ||
            streamUrl.includes('vimeo.com');
    }, [streamUrl]);


    const authenticatedUrl = useMemo(() => {
        const token = localStorage.getItem('access');
        if (!token || isExternal) return streamUrl;
        const separator = streamUrl.includes('?') ? '&' : '?';
        return `${streamUrl}${separator}token=${token}`;
    }, [streamUrl, isExternal]);

    const mediaSrc = useMemo(() => {
        if (isExternal) {
            return authenticatedUrl;
        } else {
            return {
                src: authenticatedUrl,
                type: 'video/mp4' as 'video/mp4'
            };
        }
    }, [authenticatedUrl, isExternal]);
    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <MediaPlayer
                src={mediaSrc}
                viewType="video"
                streamType="on-demand"
                logLevel="warn"
                crossOrigin={true}
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