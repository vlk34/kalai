import base64
import io

class PromptGenerator:
    def __init__(self):
        pass

    def consumed_food_prompt(self, image):
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # ===== Create User Prompt =====
        current_user_prompt = [
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
        
        # ===== Create System Prompt =====
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

        # ===== Create Messages =====
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": current_user_prompt}
        ]

        return messages
    
    
