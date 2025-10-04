# Kal AI - Smart Calorie Tracker 🍎

**Kal AI** is a comprehensive, cross-platform calorie tracking application that leverages AI-powered nutrition analysis to help users achieve their health and fitness goals. Built with modern technologies including React Native, Expo, Flask, and Supabase, Kal AI provides an intuitive and intelligent approach to food tracking.

## 🌟 Features

### Core Functionality

- **📸 AI-Powered Food Analysis**: Take or upload photos of your meals for instant nutritional analysis using Google's Gemini AI
- **📊 Comprehensive Tracking**: Monitor calories, protein, carbohydrates, and fats with detailed progress visualization
- **📈 Progress Analytics**: View daily, weekly, and historical nutrition data with beautiful charts and insights
- **🎯 Personalized Goals**: Set and track daily nutrition targets based on your profile and fitness goals
- **🔥 Streak System**: Build healthy habits with a streak tracking system that motivates daily goal achievement
- **📱 Cross-Platform**: Native mobile experience for iOS and Android with responsive web support

### Advanced Features

- **🔄 Smart Editing**: Re-analyze food items with additional text descriptions for improved accuracy
- **📅 History Management**: Complete food history with search, filter, and edit capabilities
- **🌐 Multi-language Support**: Internationalization support (English and Turkish)
- **🔐 Secure Authentication**: Multiple sign-in options including Google OAuth and email/password
- **⚡ Real-time Sync**: Instant synchronization across devices using Supabase
- **🛡️ Rate Limiting**: Intelligent API rate limiting to ensure optimal performance

## 🏗️ Architecture

### Frontend (React Native + Expo)

- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router with file-based routing
- **State Management**: React Query (TanStack Query) for server state
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Authentication**: Supabase Auth with Google Sign-In integration
- **Internationalization**: i18next for multi-language support
- **Image Processing**: Expo Image Manipulator for optimized uploads

### Backend (Flask + Python)

- **Framework**: Flask with Flask-Smorest for API documentation
- **Authentication**: Supabase JWT token verification
- **AI Integration**: Google Gemini 2.0 Flash for food analysis
- **Rate Limiting**: Flask-Limiter with Redis support
- **File Storage**: Supabase Storage for image management
- **Database**: Supabase PostgreSQL with real-time capabilities

### Infrastructure

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Railway for backend hosting
- **AI Model**: Google Gemini 2.0 Flash

## 📱 Screenshots

The app features a modern, intuitive interface with:

- Clean dashboard with daily progress visualization
- Camera integration for instant food logging
- Detailed nutrition analytics with circular progress indicators
- Comprehensive food history with photo thumbnails
- Streak tracking with motivational elements

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+
- Expo CLI
- Supabase account
- Google Cloud Console project (for Gemini AI)
- Railway account (for deployment)

### Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=your_redis_url (optional, defaults to memory)
FLASK_ENV=development
PORT=5000
```

#### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PRODUCTION_API_URL=your_backend_api_url
```

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/kalai.git
cd kalai
```

#### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

#### 4. Database Setup

1. Create a new Supabase project
2. Run the following SQL to create required tables:

```sql
-- User profiles table
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    gender VARCHAR(10) NOT NULL,
    activity_level VARCHAR(20) NOT NULL,
    tracking_difficulty VARCHAR(20) NOT NULL,
    experience_level VARCHAR(20) NOT NULL,
    height_unit VARCHAR(10) NOT NULL,
    height_value DECIMAL(5,2) NOT NULL,
    height_inches INTEGER,
    weight_unit VARCHAR(10) NOT NULL,
    weight_value DECIMAL(5,2) NOT NULL,
    date_of_birth DATE NOT NULL,
    main_goal VARCHAR(20) NOT NULL,
    dietary_preference VARCHAR(20) NOT NULL,
    daily_calories INTEGER NOT NULL,
    daily_protein_g DECIMAL(6,2) NOT NULL,
    daily_carbs_g DECIMAL(6,2) NOT NULL,
    daily_fats_g DECIMAL(6,2) NOT NULL,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foods consumed table
CREATE TABLE foods_consumed (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    emoji VARCHAR(10),
    protein DECIMAL(8,2) DEFAULT 0,
    carbs DECIMAL(8,2) DEFAULT 0,
    fats DECIMAL(8,2) DEFAULT 0,
    calories DECIMAL(8,2) DEFAULT 0,
    portion DECIMAL(4,2) DEFAULT 1.0,
    photo_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User streaks table
CREATE TABLE user_streaks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    daily_calorie_goal DECIMAL(8,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods_consumed ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own foods" ON foods_consumed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own foods" ON foods_consumed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own foods" ON foods_consumed FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own foods" ON foods_consumed FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
```

3. Create a storage bucket named `food-images` for photo storage
4. Configure Google Sign-In in Supabase Auth settings

## 📚 API Documentation

### Authentication

All protected endpoints require a Supabase JWT token in the Authorization header:

```
Authorization: Bearer <your_supabase_jwt_token>
```

### Key Endpoints

#### Food Analysis

- `POST /consumed` - Upload and analyze food photos
- `POST /edit_with_ai` - Re-analyze food with text description
- `PUT /edit_consumed_food` - Manually edit food records
- `DELETE /delete_consumed_food` - Delete food records

#### User Management

- `POST /user_profiles` - Create/update user profile
- `GET /user_profiles` - Get current profile
- `POST /recalculate` - Recalculate daily targets

#### Data Retrieval

- `GET /recently_eaten` - Get today's food items
- `GET /full_history` - Get complete food history
- `GET /daily_nutrition_summary` - Get daily nutrition summary
- `GET /weekly_recently_eaten` - Get 5-day food history
- `GET /weekly_daily_nutrition_summary` - Get 5-day nutrition summary

#### Streak Management

- `POST /update_streak` - Update user streak
- `GET /get_streak` - Get current streak

For complete API documentation, see [API_Documentation.md](./API_Documentation.md) and [Weekly_Endpoints_Documentation.md](./Weekly_Endpoints_Documentation.md).

## 🛠️ Development

### Project Structure

```
kalai/
├── backend/                 # Flask API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   └── utils/          # Utilities (auth, models, calculators)
│   ├── app.py              # Flask application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React Native app
│   ├── app/               # Expo Router pages
│   ├── components/        # Reusable components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts
│   ├── utils/             # Utility functions
│   └── package.json       # Node.js dependencies
└── docs/                  # Documentation
```

### Key Technologies

#### Frontend Stack

- **React Native 0.79.4** - Cross-platform mobile development
- **Expo SDK 53** - Development platform and tools
- **TypeScript** - Type-safe JavaScript
- **NativeWind** - Tailwind CSS for React Native
- **TanStack Query** - Server state management
- **React Navigation** - Navigation library
- **Expo Camera** - Camera functionality
- **Expo Image Picker** - Image selection
- **Supabase Client** - Backend integration

#### Backend Stack

- **Flask 3.0.3** - Python web framework
- **Flask-Smorest** - API documentation and validation
- **Supabase Python Client** - Database and auth
- **Google Gemini AI** - Food analysis
- **Flask-Limiter** - Rate limiting
- **Pillow** - Image processing
- **Pandas** - Data manipulation

### Development Commands

#### Backend

```bash
cd backend
python app.py                    # Start development server
python -m pytest tests/         # Run tests (if implemented)
```

#### Frontend

```bash
cd frontend
npm start                       # Start Expo development server
npm run android                 # Run on Android
npm run ios                     # Run on iOS
npm run web                     # Run on web
npm run lint                    # Run ESLint
```

## 🚀 Deployment

### Backend Deployment (Railway)

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically detect the `Procfile` and deploy

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

### Frontend Deployment

- **Mobile**: Build using EAS Build for app store distribution
- **Web**: Deploy to Vercel, Netlify, or similar platforms

## 🔧 Configuration

### Rate Limiting

The API implements intelligent rate limiting:

- AI Analysis: 50 requests/hour
- File Upload: 50 requests/hour
- Database Write: 200 requests/hour
- Database Read: 500 requests/hour

### Image Processing

- Images are automatically compressed to WEBP format
- Camera images: 1280x1280 max, 40% quality
- Gallery images: 1600x1600 max, 50% quality
- Maximum file size: 10MB

### AI Analysis

- Uses Google Gemini 2.0 Flash model
- Temperature set to 0.0 for consistent results
- JSON response format enforced
- Conservative approach for non-food items

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini** - AI-powered food analysis
- **Supabase** - Backend-as-a-Service platform
- **Expo** - React Native development platform
- **Railway** - Application deployment platform
- **React Native Community** - Open source components and libraries

## 📞 Support

For support, email support@kalai.app or create an issue in the GitHub repository.

## 🔮 Roadmap

- [ ] Barcode scanning for packaged foods
- [ ] Meal planning and recipe suggestions
- [ ] Social features and community challenges
- [ ] Integration with fitness trackers
- [ ] Advanced analytics and insights
- [ ] Voice-to-text food logging
- [ ] Restaurant menu integration
- [ ] Nutritional supplement tracking

---

**Kal AI** - Making healthy eating simple and intelligent. 🍎✨
