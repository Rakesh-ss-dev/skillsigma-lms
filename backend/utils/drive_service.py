# utils/drive_service.py
import os
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request, AuthorizedSession
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload, MediaFileUpload

# --- CONFIGURATION ---
SCOPES = ['https://www.googleapis.com/auth/drive']
DRIVE_FOLDER_ID = '1NGwd2qaKu0OLN1YfTz8FDkDYanEu9PHD' 
TOKEN_FILE = 'token.json' 
# ---------------------

def get_credentials():
    """
    Loads user credentials from token.json. 
    Refreshes the token automatically if it's expired.
    """
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                with open(TOKEN_FILE, 'w') as token:
                    token.write(creds.to_json())
            except Exception as e:
                raise Exception(f"Error refreshing token: {e}")
        else:
            raise Exception("token.json is missing or invalid. Run generate_token.py first.")
            
    return creds

def upload_video_private(file_obj_or_path):
    """
    Uploads a video to Google Drive and keeps it PRIVATE (Restricted).
    Accepts either a Django file object OR a file path string.
    Returns the file_id (not a link).
    """
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)

    # Handle input type (Django File Object vs Local Path String)
    if isinstance(file_obj_or_path, str):
        # It's a file path (from Celery)
        filename = os.path.basename(file_obj_or_path)
        media = MediaFileUpload(file_obj_or_path, mimetype='video/mp4', resumable=True)
    else:
        # It's a Django file object (Direct Upload)
        filename = os.path.basename(file_obj_or_path.name)
        media = MediaIoBaseUpload(file_obj_or_path.file, mimetype=file_obj_or_path.content_type, resumable=True)

    file_metadata = {
        'name': filename,
        'parents': [DRIVE_FOLDER_ID]
    }

    # Execute Upload
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()
    
    file_id = file.get('id')
    
    # NOTE: We intentionally REMOVED the "permissions" block.
    # The file is now Private (Owner only). Django will act as the Owner when streaming.
    
    return file_id

def stream_video_from_drive(file_id, range_header=None):
    """
    Generates a response object to stream video bytes from Google Drive.
    Handles the 'Range' header to support video seeking.
    """
    creds = get_credentials()
    # Create an authorized session to make raw HTTP requests
    authed_session = AuthorizedSession(creds)
    
    # We use the 'alt=media' parameter to get file content
    drive_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
    
    headers = {}
    if range_header:
        headers['Range'] = range_header

    # Request the stream from Google
    # stream=True is critical: it keeps the connection open without downloading the whole file
    response = authed_session.get(
        drive_url,
        headers=headers,
        stream=True
    )

    return response

def check_video_processing_status(file_id):
    """
    Checks if a video on Google Drive has finished processing.
    Returns: 'PROCESSING', 'READY', or 'ERROR'
    """
    creds = get_credentials()
    service = build('drive', 'v3', credentials=creds)

    try:
        file = service.files().get(
            fileId=file_id, 
            fields='videoMediaMetadata'
        ).execute()
        
        metadata = file.get('videoMediaMetadata', {})

        if not metadata:
            return 'PROCESSING'

        if 'width' in metadata and 'durationMillis' in metadata:
            return 'READY'
            
        return 'PROCESSING'

    except Exception as e:
        print(f"Error checking status: {e}")
        return 'ERROR'