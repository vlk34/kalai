import os
from dotenv import load_dotenv
from openai import OpenAI
from .prompt_generator import PromptGenerator

load_dotenv() 


class Model:
    def __init__(self):
        self.gemini_api_key = os.getenv('GEMINI_API_KEY', '')
        self.gemini_client = self.get_gemini_client()

    def get_gemini_client(self):
        return OpenAI(
            api_key=self.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    
    def gemini_chat_completion(self, messages):
        
        # ===== Generate Response =====
        response = self.gemini_client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=messages,
            temperature=0.0,
            stream=False,
            response_format={"type": "json_object"}
        )

        return response.choices[0].message.content
    