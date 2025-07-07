import base64
import io

class PromptGenerator:
    def __init__(self):
        pass

    def consumed_food_prompt(self, image):
        buffered = io.BytesIO()
        # Convert to RGB if needed (WEBP does not support P or RGBA in some cases for encoding without alpha)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        # Save as WEBP with moderate compression to make payload smaller
        image.save(buffered, format="WEBP", quality=80)
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
                            "url": f"data:image/webp;base64,{img_base64}"
                        }
                    }
                ]
        
        # ===== Create System Prompt =====
        system_prompt = """Analyze the image and determine if it contains traditionally recognizable food items. Return nutritional information in valid JSON format.

        Return ONLY a JSON object with these exact fields:
        {
            "name": "food name or item name",
            "emoji": "emoji related to the item",
            "protein": "protein content in grams",
            "carbs": "carbohydrate content in grams", 
            "fats": "fat content in grams",
            "calories": "calorie content"
        }

        IMPORTANT RULES:
        - You should return only one json object not a list of objects. That object could have total calories, total protein, total carbs, total fats, and total portion size if the image contains multiple food items.
        - If the image contains recognizable food items (fruits, vegetables, cooked meals, snacks, beverages, etc.), provide reasonable nutritional estimates for a typical serving size
        - If the image does NOT contain food (animals, people, objects, non-food items, etc.), set ALL nutritional values to 0 and name the item you see
        - Use only numbers for nutritional values (no units in the values)
        - Be conservative - if unsure whether something is food, default to 0 values"""

        # ===== Create Messages =====
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": current_user_prompt}
        ]

        return messages
    
    def consumed_food_prompt_with_description(self, image, text_description):
        buffered = io.BytesIO()
        # Convert to RGB if needed (WEBP does not support P or RGBA in some cases for encoding without alpha)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        # Save as WEBP with moderate compression to make payload smaller
        image.save(buffered, format="WEBP", quality=80)
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # ===== Create User Prompt =====
        current_user_prompt = [
                    {
                        "type": "text",
                        "text": f"Analyze this food and provide nutritional information in the specified JSON format. Additional context: {text_description}"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/webp;base64,{img_base64}"
                        }
                    }
                ]
        
        # ===== Create System Prompt =====
        system_prompt = """Analyze the food in the image and return nutritional information in valid JSON format. 
        Use the provided text description to get more accurate nutritional analysis.
        Return ONLY a JSON object with these exact fields:
        {
            "name": "food name",
            "emoji": "emoji related to food name"
            "protein": "protein content in grams",
            "carbs": "carbohydrate content in grams", 
            "fats": "fat content in grams",
            "calories": "calorie content"
        }
        
        Use the text description to better understand portion sizes, ingredients, and cooking methods for more accurate estimates. Use only numbers for nutritional values (no units in the values)."""

        # ===== Create Messages =====
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": current_user_prompt}
        ]

        return messages
    
    
