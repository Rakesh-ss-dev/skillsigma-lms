import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect,HTTPException
from google import genai
from dotenv import load_dotenv
import httpx

load_dotenv()

app = FastAPI()


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "gemini-flash-latest"
async def get_course_data(course_id:str,token:str):
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{os.getenv("DRF_BACKEND_URL")}/courses/{course_id}/", 
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
                f"{os.getenv("DRF_BACKEND_URL")}/lessons/{lesson_id}/", 
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
                # Return the persona prompt from the Tenant model
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
    
    # NEW: Initialize transcript storage
    transcript_history = []
    token = websocket.query_params.get("token")
    
    try:
        lesson_data = await get_lesson_data(lesson_id, token)
        lesson_title = lesson_data.get("title")
        course_id = lesson_data.get('course')
        course_data = await get_course_data(course_id, token)
        course_title = course_data.get('title')
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

            # 1. Store user message
            transcript_history.append({"role": "user", "text": user_text})

            response = chat.send_message(user_text)
            
            # 2. Store AI message
            transcript_history.append({"role": "ai", "text": response.text})
            
            await websocket.send_json({
                "role": "ai",
                "text": response.text
            })

    except WebSocketDisconnect:
        print(f"Client disconnected from lesson {lesson_id}")
        # Only save if there was a real conversation (User + AI = 2 messages)
        if len(transcript_history) >= 2:
            try:
                # Ensure the token has the 'Bearer ' prefix if it doesn't already
                auth_token = token if token.startswith("Bearer ") else f"Bearer {token}"
                
                async with httpx.AsyncClient() as http_client:
                    response = await http_client.post(
                        f"{os.getenv('DRF_BACKEND_URL')}/ai-conversations/", 
                        headers={"Authorization": auth_token},
                        json={
                            "lesson": lesson_id,
                            "transcript": transcript_history,
                            "summary": f"Discussion about {lesson_title}"
                        },
                        timeout=10.0 # Don't let a slow DRF hang the AI service
                    )
                    
                    if response.status_code == 201:
                        print("✅ Conversation successfully synced to Django.")
                    else:
                        print(f"❌ DRF Save Failed ({response.status_code}): {response.text}")
                        
            except Exception as save_error:
                print(f"⚠️ critical error saving to DRF: {save_error}")

    except Exception as e:
        print(f"General Error: {e}")
        # Only try to send if the websocket is still open
        try:
            await websocket.send_json({"role": "ai", "text": "I encountered an error. Please try refreshing."})
        except:
            pass
        
        