| table_name     | column_name          | data_type                | is_nullable | column_default    | character_maximum_length | constraint_type |
| -------------- | -------------------- | ------------------------ | ----------- | ----------------- | ------------------------ | --------------- |
| foods_consumed | id                   | uuid                     | NO          | gen_random_uuid() | null                     | PRIMARY KEY     |
| foods_consumed | user_id              | uuid                     | NO          | null              | null                     | null            |
| foods_consumed | name                 | character varying        | NO          | null              | 255                      | null            |
| foods_consumed | emoji                | character varying        | YES         | null              | 10                       | null            |
| foods_consumed | protein              | numeric                  | YES         | null              | null                     | null            |
| foods_consumed | carbs                | numeric                  | YES         | null              | null                     | null            |
| foods_consumed | fats                 | numeric                  | YES         | null              | null                     | null            |
| foods_consumed | calories             | numeric                  | YES         | null              | null                     | null            |
| foods_consumed | created_at           | timestamp with time zone | YES         | now()             | null                     | null            |
| foods_consumed | photo_path           | character varying        | YES         | null              | 500                      | null            |
| user_profiles  | id                   | uuid                     | NO          | gen_random_uuid() | null                     | PRIMARY KEY     |
| user_profiles  | user_id              | uuid                     | NO          | null              | null                     | null            |
| user_profiles  | gender               | character varying        | YES         | null              | 10                       | CHECK           |
| user_profiles  | activity_level       | character varying        | YES         | null              | 20                       | CHECK           |
| user_profiles  | tracking_difficulty  | character varying        | YES         | null              | 15                       | CHECK           |
| user_profiles  | experience_level     | character varying        | YES         | null              | 20                       | CHECK           |
| user_profiles  | height_unit          | character varying        | YES         | null              | 10                       | CHECK           |
| user_profiles  | height_value         | numeric                  | YES         | null              | null                     | null            |
| user_profiles  | height_inches        | integer                  | YES         | null              | null                     | null            |
| user_profiles  | weight_unit          | character varying        | YES         | null              | 10                       | CHECK           |
| user_profiles  | weight_value         | numeric                  | YES         | null              | null                     | null            |
| user_profiles  | date_of_birth        | date                     | YES         | null              | null                     | null            |
| user_profiles  | main_goal            | character varying        | YES         | null              | 15                       | CHECK           |
| user_profiles  | dietary_preference   | character varying        | YES         | null              | 20                       | CHECK           |
| user_profiles  | daily_calories       | integer                  | YES         | null              | null                     | null            |
| user_profiles  | daily_protein_g      | numeric                  | YES         | null              | null                     | null            |
| user_profiles  | daily_carbs_g        | numeric                  | YES         | null              | null                     | null            |
| user_profiles  | daily_fats_g         | numeric                  | YES         | null              | null                     | null            |
| user_profiles  | onboarding_completed | boolean                  | YES         | false             | null                     | null            |
| user_profiles  | created_at           | timestamp with time zone | YES         | now()             | null                     | null            |
| user_profiles  | updated_at           | timestamp with time zone | YES         | now()             | null                     | null            |