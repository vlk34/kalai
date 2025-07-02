# Photo Storage Setup Guide

This guide explains how to set up photo storage functionality for your nutrition tracking app.

## Prerequisites
- Supabase project with authentication enabled
- Backend Flask app already configured with Supabase

## Setup Steps

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Set bucket name as: `food-images`
5. Set the bucket to **Public** (so photos can be accessed via URLs)
6. Click **Create bucket**

### 2. Configure Bucket Policies

In the Supabase dashboard, go to **Storage > Policies** and create the following policies for the `food-images` bucket:

#### Policy 1: Allow authenticated users to upload
```sql
CREATE POLICY "Users can upload their own food photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

#### Policy 2: Allow public read access
```sql
CREATE POLICY "Anyone can view food photos" ON storage.objects
FOR SELECT USING (bucket_id = 'food-images');
```

#### Policy 3: Allow users to delete their own photos
```sql
CREATE POLICY "Users can delete their own food photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'food-images' 
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

### 3. Run Database Migration

Execute the migration SQL in your Supabase SQL Editor:

```sql
-- Add photo_path column to existing Foods_consumed table
ALTER TABLE Foods_consumed 
ADD COLUMN photo_path VARCHAR(500);

-- Add comment for the new column
COMMENT ON COLUMN Foods_consumed.photo_path IS 'Path to photo in Supabase Storage';

-- Create index on photo_path for better query performance
CREATE INDEX idx_foods_consumed_photo_path ON Foods_consumed(photo_path) WHERE photo_path IS NOT NULL;
```

Or run the migration file:
```bash
# Run this in your Supabase SQL Editor
-- Copy and paste the contents of backend/migration_add_photo_path.sql
```

### 4. Environment Variables

Ensure your `.env` file has the necessary Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Recommended for backend operations
SUPABASE_JWT_SECRET=your_jwt_secret
```

## How It Works

### Photo Upload Flow
1. User uploads a photo via the `/consumed` endpoint
2. Photo is saved to Supabase Storage at path: `food-photos/{user_id}/{unique_filename}`
3. AI analyzes the photo for nutritional data
4. Food record is saved to database with both nutritional data and photo path
5. Public photo URL is returned in the response

### Retrieving Photos
1. History endpoints (`/recently_eaten`, `/full_history`) now include `photo_url` field
2. Frontend can display photos using the provided URLs
3. Photos are organized by user to maintain privacy

## Storage Structure

```
food-images/
├── food-photos/
│   ├── user_123.../
│   │   ├── uuid1.jpg
│   │   ├── uuid2.png
│   │   └── ...
│   ├── user_456.../
│   │   ├── uuid3.jpg
│   │   └── ...
│   └── ...
```

## API Response Changes

### Upload Response (`/consumed`)
```json
{
  "success": true,
  "message": "Photo uploaded, analyzed, and saved successfully",
  "data": {
    "file_info": {
      "original_filename": "food.jpg",
      "unique_filename": "uuid.jpg",
      "storage_path": "food-photos/user_id/uuid.jpg",
      "photo_url": "https://your-project.supabase.co/storage/v1/object/public/food-images/food-photos/user_id/uuid.jpg"
    },
    "nutritional_analysis": { ... },
    "database_record": { ... }
  }
}
```

### History Response (`/recently_eaten`, `/full_history`)
```json
{
  "foods": [
    {
      "id": "uuid",
      "name": "Avocado Toast",
      "emoji": "🥑",
      "protein": 12.0,
      "carbs": 30.0,
      "fats": 25.0,
      "calories": 380.0,
      "photo_url": "https://your-project.supabase.co/storage/v1/object/public/food-images/food-photos/user_id/uuid.jpg",
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Frontend Integration

### Displaying Photos
```javascript
// In your React component
{food.photo_url && (
  <img 
    src={food.photo_url} 
    alt={food.name}
    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
  />
)}
```

### Handling Missing Photos
```javascript
const handleImageError = (e) => {
  e.target.style.display = 'none'; // Hide broken image
  // Or show a placeholder
};

<img 
  src={food.photo_url} 
  alt={food.name}
  onError={handleImageError}
/>
```

## Testing

After setup, you can test the functionality:

1. **Upload a photo** via the `/consumed` endpoint
2. **Check storage** - Photo should appear in the `food-images` bucket
3. **Verify database** - `photo_path` column should be populated
4. **Test history** - Photo URLs should be included in responses

## Troubleshooting

### Common Issues

1. **Storage upload fails**
   - Check if `food-images` bucket exists and is public
   - Verify storage policies are correctly configured
   - Ensure service role key has storage permissions

2. **Photo URLs not working**
   - Verify bucket is set to public
   - Check storage policies allow public read access
   - Ensure the storage path format is correct

3. **Database insertion fails**
   - Run the migration script to add the `photo_path` column
   - Check if the column was added successfully

### Debug Tips

- Check Supabase logs for storage and database errors
- Verify environment variables are loaded correctly
- Test storage operations in Supabase dashboard first 