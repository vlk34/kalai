"""
Nutrition Calculator Utility

Calculates daily calorie and macronutrient targets based on user profile data.
Uses the Mifflin-St Jeor equation for BMR calculation.
"""

from datetime import date
from typing import Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class DailyTargets:
    """Data class for daily nutrition targets"""
    calories: int
    protein_g: float
    carbs_g: float
    fats_g: float


class NutritionCalculator:
    """Calculator for daily nutrition targets based on user profile"""
    
    # Activity level multipliers for BMR
    ACTIVITY_MULTIPLIERS = {
        'sedentary': 1.2,        # Little to no exercise
        'lightly_active': 1.375, # Light exercise 1-3 days/week
        'very_active': 1.725,    # Hard exercise 6-7 days/week
    }
    
    # Goal adjustments (percentage of maintenance calories)
    GOAL_ADJUSTMENTS = {
        'lose_weight': 0.8,      # 20% deficit
        'maintain_weight': 1.0,   # No change
        'gain_weight': 1.15,     # 15% surplus
        'build_muscle': 1.1,     # 10% surplus
    }
    
    # Protein requirements (grams per kg body weight)
    PROTEIN_REQUIREMENTS = {
        'lose_weight': 2.0,      # Higher protein for muscle preservation
        'build_muscle': 2.2,     # Highest for muscle building
        'maintain_weight': 1.6,  # Standard maintenance
        'gain_weight': 1.6,      # Standard for weight gain
    }
    
    # Macronutrient ratios by dietary preference
    MACRO_RATIOS = {
        'no_restrictions': {'protein': 0.25, 'fat': 0.25, 'carb': 0.50},
        'vegetarian': {'protein': 0.20, 'fat': 0.30, 'carb': 0.50},
        'vegan': {'protein': 0.15, 'fat': 0.25, 'carb': 0.60},
        'keto': {'protein': 0.25, 'fat': 0.70, 'carb': 0.05},
    }
    
    @staticmethod
    def calculate_age(date_of_birth: date) -> int:
        """Calculate age from date of birth"""
        today = date.today()
        return today.year - date_of_birth.year - (
            (today.month, today.day) < (date_of_birth.month, date_of_birth.day)
        )
    
    @staticmethod
    def convert_to_metric(
        height_unit: str,
        height_value: float,
        height_inches: Optional[int],
        weight_unit: str,
        weight_value: float
    ) -> Tuple[float, float]:
        """Convert imperial measurements to metric"""
        
        # Convert height to cm
        if height_unit == 'imperial':
            # Convert feet + inches to cm
            total_inches = height_value * 12 + (height_inches or 0)
            height_cm = total_inches * 2.54
        else:
            height_cm = height_value
        
        # Convert weight to kg
        if weight_unit == 'imperial':
            weight_kg = weight_value * 0.453592  # lbs to kg
        else:
            weight_kg = weight_value
        
        return height_cm, weight_kg
    
    @staticmethod
    def calculate_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> float:
        """
        Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
        
        Men: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
        Women: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161
        """
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age
        
        if gender == 'male':
            bmr += 5
        else:  # female or other
            bmr -= 161
        
        return bmr
    
    @classmethod
    def calculate_daily_targets(
        cls,
        gender: str,
        activity_level: str,
        height_unit: str,
        height_value: float,
        height_inches: Optional[int],
        weight_unit: str,
        weight_value: float,
        date_of_birth: date,
        main_goal: str,
        dietary_preference: str
    ) -> DailyTargets:
        """
        Calculate daily nutrition targets based on user profile
        
        Args:
            gender: 'male', 'female', or 'other'
            activity_level: 'sedentary', 'lightly_active', or 'very_active'
            height_unit: 'metric' or 'imperial'
            height_value: Height value (cm for metric, feet for imperial)
            height_inches: Additional inches for imperial (optional)
            weight_unit: 'metric' or 'imperial'
            weight_value: Weight value (kg for metric, lbs for imperial)
            date_of_birth: Date of birth
            main_goal: 'lose_weight', 'maintain_weight', 'gain_weight', or 'build_muscle'
            dietary_preference: 'no_restrictions', 'vegetarian', 'vegan', or 'keto'
        
        Returns:
            DailyTargets object with calories and macronutrient targets
        """
        
        # Calculate age
        age = cls.calculate_age(date_of_birth)
        
        # Convert measurements to metric
        height_cm, weight_kg = cls.convert_to_metric(
            height_unit, height_value, height_inches, weight_unit, weight_value
        )
        
        # Calculate BMR
        bmr = cls.calculate_bmr(gender, weight_kg, height_cm, age)
        
        # Calculate maintenance calories (BMR × activity multiplier)
        activity_multiplier = cls.ACTIVITY_MULTIPLIERS.get(activity_level, 1.2)
        maintenance_calories = bmr * activity_multiplier
        
        # Adjust for goal
        goal_adjustment = cls.GOAL_ADJUSTMENTS.get(main_goal, 1.0)
        daily_calories = maintenance_calories * goal_adjustment
        
        # Calculate macronutrient targets
        protein_g, carbs_g, fats_g = cls.calculate_macronutrients(
            daily_calories, main_goal, dietary_preference, weight_kg
        )
        
        return DailyTargets(
            calories=round(daily_calories),
            protein_g=round(protein_g, 1),
            carbs_g=round(carbs_g, 1),
            fats_g=round(fats_g, 1)
        )
    
    @classmethod
    def calculate_macronutrients(
        cls,
        daily_calories: float,
        main_goal: str,
        dietary_preference: str,
        weight_kg: float
    ) -> Tuple[float, float, float]:
        """
        Calculate macronutrient distribution
        
        Returns:
            Tuple of (protein_g, carbs_g, fats_g)
        """
        
        # Get minimum protein based on body weight and goal
        min_protein_per_kg = cls.PROTEIN_REQUIREMENTS.get(main_goal, 1.6)
        min_protein_g = weight_kg * min_protein_per_kg
        
        # Get macro ratios for dietary preference
        ratios = cls.MACRO_RATIOS.get(dietary_preference, cls.MACRO_RATIOS['no_restrictions'])
        
        # Calculate protein (ensure minimum is met)
        protein_from_calories = daily_calories * ratios['protein'] / 4  # 4 cal per g protein
        protein_g = max(min_protein_g, protein_from_calories)
        
        # Calculate fats
        fats_g = daily_calories * ratios['fat'] / 9  # 9 cal per g fat
        
        # Calculate carbs from remaining calories
        remaining_calories = daily_calories - (protein_g * 4) - (fats_g * 9)
        carbs_g = max(0, remaining_calories / 4)  # 4 cal per g carb
        
        return protein_g, carbs_g, fats_g
    
    @classmethod
    def calculate_from_profile(cls, profile_data: Dict) -> DailyTargets:
        """
        Calculate daily targets from a user profile dictionary
        
        Args:
            profile_data: Dictionary containing user profile data
        
        Returns:
            DailyTargets object
        """
        return cls.calculate_daily_targets(
            gender=profile_data['gender'],
            activity_level=profile_data['activity_level'],
            height_unit=profile_data['height_unit'],
            height_value=profile_data['height_value'],
            height_inches=profile_data.get('height_inches'),
            weight_unit=profile_data['weight_unit'],
            weight_value=profile_data['weight_value'],
            date_of_birth=profile_data['date_of_birth'],
            main_goal=profile_data['main_goal'],
            dietary_preference=profile_data['dietary_preference']
        )


# Example usage and helper functions
def example_calculation():
    """Example of how to use the nutrition calculator"""
    
    targets = NutritionCalculator.calculate_daily_targets(
        gender='male',
        activity_level='lightly_active',
        height_unit='metric',
        height_value=180,
        height_inches=None,
        weight_unit='metric',
        weight_value=75,
        date_of_birth=date(1990, 5, 15),
        main_goal='build_muscle',
        dietary_preference='no_restrictions'
    )
    
    print(f"Daily Targets:")
    print(f"Calories: {targets.calories}")
    print(f"Protein: {targets.protein_g}g")
    print(f"Carbs: {targets.carbs_g}g")
    print(f"Fats: {targets.fats_g}g")


if __name__ == "__main__":
    example_calculation() 