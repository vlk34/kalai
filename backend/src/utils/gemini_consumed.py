import pandas as pd
import numpy as np

import base64
import io

from openai import OpenAI
from PIL import Image

GEMINI_API_KEY = 'AIzaSyBcFy3ArLmo3YILsqXmvsbmT0X2PRKraqQ'
BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'

gemini_client = OpenAI(
                    api_key=GEMINI_API_KEY,
                    base_url=BASE_URL
                )

image = Image.open('first_image.png')

buffered = io.BytesIO()
image.save(buffered, format="PNG")
img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

system_prompt = """Analyze the food in the image and return nutritional information in valid JSON format. 
        Return ONLY a JSON object with these exact fields:
        {
            "name": "food name",
            "emoji": "emoji related to food name"
            "protein": "protein content in grams",
            "carbs": "carbohydrate content in grams", 
            "fats": "fat content in grams",
            "calories": "calorie content"
        }
        
        Provide reasonable estimates for a typical serving size. Use only numbers for nutritional values (no units in the values)."""

messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this food and provide nutritional information in the specified JSON format."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{img_base64}"
                        }
                    }
                ]
            }
        ]

response = gemini_client.chat.completions.create(
            model="gemini-2.0-flash",
            messages=messages,
            temperature=0.0,
            stream=False,
            response_format={"type": "json_object"}
        )