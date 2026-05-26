import os
import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from google import genai
from dotenv import load_dotenv
import httpx
import json

load_dotenv()

app = FastAPI()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "gemini-flash-latest"

async def get_course_data(course_id: str, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv('DRF_BACKEND_URL')}/courses/{course_id}/", 
                headers=headers,
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Could not fetch lesson from DRF")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Error contacting DRF: {exc}")
        
async def get_lesson_data(lesson_id: str, token: str):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv('DRF_BACKEND_URL')}/lessons/{lesson_id}/", 
                headers=headers,
                timeout=5.0
            )
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Could not fetch lesson from DRF")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"Error contacting DRF: {exc}")
        
async def get_tenant_persona(token: str):
    """Fetches the specific AI persona from the DRF backend"""
    headers = {"Authorization": f"Bearer {token}" if not token.startswith("Bearer ") else token}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv('DRF_BACKEND_URL')}/accounts/me/", 
                headers=headers,
                timeout=5.0
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("tenant_details", {}).get("ai_persona_prompt", "You are a helpful assistant.")
            return "You are a helpful academic tutor."
        except Exception:
            return "You are a helpful academic tutor."

@app.get("/")
def read_root():
    return {"status": "AI Service is Online"}

@app.websocket("/ws/tutor/{lesson_id}")
async def tutor_websocket(websocket: WebSocket, lesson_id: str):
    await websocket.accept()
    
    transcript_history = []
    token = websocket.query_params.get("token")
    auth_token = token if token.startswith("Bearer ") else f"Bearer {token}"
    
    session_id = str(uuid.uuid4())
    lesson_title = "Lesson" 

    async def save_to_django():
        """Helper utility to sync transcripts instantly to Django DB"""
        if not transcript_history:
            return
        try:
            async with httpx.AsyncClient() as http_client:
                # FIX 1: Use json.dumps to get a clean serialized string wrapper output
                stringified_transcript = json.dumps(transcript_history)
                
                response = await http_client.post(
                    f"{os.getenv('DRF_BACKEND_URL')}/ai-conversations/", 
                    headers={"Authorization": auth_token},
                    json={
                        "session_id": session_id,
                        "lesson": lesson_id,
                        "transcript": stringified_transcript,
                        "summary": f"Discussion about {lesson_title}"
                    },
                    timeout=5.0 
                )
                
                # FIX 2: Explicitly completed the conditional check statement parameters
                if response.status_code in [200,201]:
                    print(f"💾 Live-synced conversation stack state to Django (Size: {len(transcript_history)})")
                else:
                    print(f"❌ Real-time Sync Failed ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"⚠️ Non-blocking Background Sync Error: {e}")

    try:
        lesson_data = await get_lesson_data(lesson_id, token)
        lesson_title = lesson_data.get("title", "Current Lesson")
        course_id = lesson_data.get('course')
        course_data = await get_course_data(course_id, token)
        course_title = course_data.get('title', "Current Course")
        system_instruction_base = await get_tenant_persona(token)
        
        system_instruction = f"""
        {system_instruction_base}
        Context:
        - Course: {course_title}
        - Current Lesson: {lesson_title}
        Guidelines:
        - Ground your answers in the lesson context.
        - If the user asks something outside the scope, gently bring them back to the lesson.
        """
        
        chat = client.chats.create(
            model=MODEL_NAME, 
            config={"system_instruction": system_instruction, "temperature": 0.3}
        )

        while True:
            data = await websocket.receive_json()
            user_text = data.get("content")
            if not user_text: continue

            transcript_history.append({"role": "user", "text": user_text})
            await save_to_django()

            response = chat.send_message(user_text)
            transcript_history.append({"role": "ai", "text": response.text})
            await save_to_django()
            
            await websocket.send_json({
                "role": "ai",
                "text": response.text
            })

    except WebSocketDisconnect:
        print(f"Client disconnected cleanly from lesson {lesson_id}. Final database sync executing...")
        await save_to_django()

    except Exception as e:
        print(f"General Error inside WebSocket runtime thread: {e}")
        try:
            await websocket.send_json({"role": "ai", "text": "I encountered an error. Please try refreshing."})
        except:
            pass
        await save_to_django()