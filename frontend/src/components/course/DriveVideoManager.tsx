import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import useDrivePicker from "react-google-drive-picker";
import axios from "axios";

interface Props {
    onChange: (fileId: string) => void;
}

export default function DriveVideoManager({ onChange }: Props) {
    const [token, setToken] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [openPicker] = useDrivePicker();

    // 1. Unified Login Hook (Handles Auth for BOTH actions)
    const login = useGoogleLogin({
        scope: "https://www.googleapis.com/auth/drive.file", // Scope for creating/selecting
        onSuccess: (tokenResponse) => setToken(tokenResponse.access_token),
    });

    // 2. Custom Upload Function (Replaces DriveUploady)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token) return;

        setUploading(true);

        const metadata = {
            name: file.name,
            mimeType: file.type,
            parents: [import.meta.env.VITE_DRIVE_FOLDER_ID], // Your specific folder
        };

        const formData = new FormData();
        formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
        formData.append("file", file);

        try {
            const res = await axios.post(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // 'Content-Type' is automatically set by axios for FormData
                    },
                }
            );

            // Success!
            onChange(res.data.id);
            alert("Upload complete!");
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    // 3. Picker Function (Uses the same token)
    const handlePick = () => {
        if (!token) return login(); // Ensure we are logged in first

        openPicker({
            clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            developerKey: import.meta.env.VITE_GOOGLE_API_KEY,
            viewId: "DOCS_VIDEOS",
            token: token, // <--- Pass the EXISTING token here
            showUploadView: false, // We use our own button for better folder control
            setIncludeFolders: true,
            callbackFunction: (data) => {
                if (data.action === "picked" && data.docs?.[0]) {
                    onChange(data.docs[0].id);
                }
            },
        });
    };

    if (!token) {
        return (
            <button
                onClick={(e) => { e.preventDefault(); login(); }}
                className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
            >
                Connect Google Drive
            </button>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded bg-gray-50">
            <div className="flex gap-4">
                {/* Custom Upload Button */}
                <div className="relative">
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="video-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="video-upload"
                        className={`px-4 py-2 rounded cursor-pointer text-white ${uploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                            }`}
                    >
                        {uploading ? "Uploading..." : "Upload New Video"}
                    </label>
                </div>

                {/* Picker Button */}
                <button
                    onClick={handlePick}
                    className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100"
                >
                    Select Existing
                </button>
            </div>
        </div>
    );
}