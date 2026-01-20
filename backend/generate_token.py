import os
from google_auth_oauthlib.flow import InstalledAppFlow

# The permissions we need
SCOPES = ['https://www.googleapis.com/auth/drive']

def main():
    # Uses the file you downloaded in Step 1
    flow = InstalledAppFlow.from_client_secrets_file(
        'client_secrets.json', SCOPES)
    
    # This will open your browser to log in. 
    # Log in with 'urrakeshsingh4u@gmail.com'.
    creds = flow.run_local_server(port=0)

    # Save the credentials for the next run
    with open('token.json', 'w') as token:
        token.write(creds.to_json())
    
    print("Successfully created 'token.json'. Move this file to your Django project.")

if __name__ == '__main__':
    main()