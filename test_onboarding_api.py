#!/usr/bin/env python3
"""
Test script for onboarding API endpoints
Run this to test your complete onboarding system
"""

import requests
import json
from datetime import date

# Configuration
BASE_URL = "http://127.0.0.1:5000"
TEST_USER_EMAIL = "test@example.com"
TEST_USER_PASSWORD = "testpassword123"

# Test data
SAMPLE_PROFILE_DATA = {
    "gender": "male",
    "activity_level": "lightly_active",
    "tracking_difficulty": "manageable",
    "experience_level": "some_experience",
    "height_unit": "metric",
    "height_value": 180,
    "weight_unit": "metric",
    "weight_value": 75,
    "date_of_birth": "1990-05-15",
    "main_goal": "build_muscle",
    "dietary_preference": "no_restrictions"
}

PREVIEW_DATA = {
    "gender": "female",
    "activity_level": "very_active",
    "height_unit": "imperial",
    "height_value": 5,
    "height_inches": 6,
    "weight_unit": "imperial",
    "weight_value": 140,
    "date_of_birth": "1995-03-20",
    "main_goal": "lose_weight",
    "dietary_preference": "vegetarian"
}

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def print_result(test_name, response):
    print(f"\n🧪 {test_name}")
    print(f"Status: {response.status_code}")
    
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
    except:
        print(f"Response: {response.text}")
    
    print("-" * 40)

def test_health_check():
    """Test basic health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    print_result("Health Check", response)
    return response.status_code == 200

def test_protected_route(token):
    """Test protected route with authentication"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/protected", headers=headers)
    print_result("Protected Route", response)
    return response.status_code == 200

def test_preview_targets():
    """Test target calculation preview (no auth required)"""
    response = requests.post(
        f"{BASE_URL}/calculate-targets",
        json=PREVIEW_DATA,
        headers={"Content-Type": "application/json"}
    )
    print_result("Preview Daily Targets", response)
    return response.status_code == 200

def test_create_profile(token):
    """Test profile creation"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(
        f"{BASE_URL}/user_profiles",
        json=SAMPLE_PROFILE_DATA,
        headers=headers
    )
    print_result("Create Profile", response)
    return response.status_code == 201

def test_get_profile(token):
    """Test profile retrieval"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/user_profiles", headers=headers)
    print_result("Get Profile", response)
    return response.status_code == 200

def test_recalculate_targets(token):
    """Test target recalculation"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/recalculate", headers=headers)
    print_result("Recalculate Targets", response)
    return response.status_code == 200

def main():
    """Run all tests"""
    print_header("🧪 ONBOARDING API TEST SUITE")
    
    # Test 1: Basic connectivity
    print_header("Step 1: Basic Connectivity")
    if not test_health_check():
        print("❌ Health check failed! Make sure Flask app is running on port 5000")
        return
    
    # Test 2: Preview targets (no auth)
    print_header("Step 2: Target Calculation Preview")
    if not test_preview_targets():
        print("❌ Target preview failed!")
        return
    
    print_header("Step 3: Authentication Required Tests")
    print("⚠️  For the next tests, you need a valid JWT token.")
    print("📋 To get a token:")
    print("   1. Open backend/test_auth.html in your browser")
    print("   2. Sign up/sign in with Supabase")
    print("   3. Copy the JWT token from the browser's network tab or console")
    print("   4. Paste it below")
    
    token = input("\n🔑 Enter your JWT token (or press Enter to skip auth tests): ").strip()
    
    if not token:
        print("⏭️  Skipping authentication tests")
        print_summary(tests_passed=2, total_tests=2)
        return
    
    tests_passed = 2  # Health check and preview passed
    total_tests = 6
    
    # Test 3: Protected route
    if test_protected_route(token):
        tests_passed += 1
    
    # Test 4: Create profile
    if test_create_profile(token):
        tests_passed += 1
    
    # Test 5: Get profile
    if test_get_profile(token):
        tests_passed += 1
    
    # Test 6: Recalculate targets
    if test_recalculate_targets(token):
        tests_passed += 1
    
    print_summary(tests_passed, total_tests)

def print_summary(tests_passed, total_tests):
    """Print test summary"""
    print_header("🏁 TEST SUMMARY")
    print(f"Tests passed: {tests_passed}/{total_tests}")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Your onboarding system is working correctly.")
    else:
        print(f"❌ {total_tests - tests_passed} test(s) failed. Check the setup guide.")
    
    print("\n📖 Next steps:")
    print("   - Complete your frontend onboarding UI")
    print("   - Test the full user journey from signup to profile completion")
    print("   - Integrate with your existing food tracking features")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        print("Make sure Flask app is running and Supabase is configured correctly") 