| table_name             | column_name        | data_type                | is_nullable |
| ---------------------- | ------------------ | ------------------------ | ----------- |
| admin_course_reminders | id                 | integer                  | NO          |
| admin_course_reminders | course_id          | character varying        | YES         |
| admin_course_reminders | reminder_type      | character varying        | NO          |
| admin_course_reminders | is_enabled         | boolean                  | YES         |
| admin_course_reminders | trigger_condition  | jsonb                    | YES         |
| admin_course_reminders | message_template   | text                     | YES         |
| admin_course_reminders | frequency          | character varying        | YES         |
| admin_course_reminders | preferred_time     | time without time zone   | YES         |
| admin_course_reminders | email_enabled      | boolean                  | YES         |
| admin_course_reminders | push_enabled       | boolean                  | YES         |
| admin_course_reminders | in_app_enabled     | boolean                  | YES         |
| admin_course_reminders | created_by         | uuid                     | YES         |
| admin_course_reminders | created_at         | timestamp with time zone | YES         |
| admin_course_reminders | updated_at         | timestamp with time zone | YES         |
| assignments            | id                 | character varying        | NO          |
| assignments            | course_id          | character varying        | NO          |
| assignments            | lesson_id          | character varying        | YES         |
| assignments            | title              | character varying        | NO          |
| assignments            | description        | text                     | YES         |
| assignments            | instructions       | text                     | YES         |
| assignments            | assignment_type    | character varying        | YES         |
| assignments            | priority           | character varying        | YES         |
| assignments            | due_date           | timestamp with time zone | YES         |
| assignments            | estimated_duration | integer                  | YES         |
| assignments            | is_required        | boolean                  | YES         |
| assignments            | is_published       | boolean                  | YES         |
| assignments            | tags               | ARRAY                    | YES         |
| assignments            | resources          | ARRAY                    | YES         |
| assignments            | created_by         | uuid                     | YES         |
| assignments            | created_at         | timestamp with time zone | YES         |
| assignments            | updated_at         | timestamp with time zone | YES         |
| blog_categories        | id                 | character varying        | NO          |
| blog_categories        | name               | character varying        | NO          |
| blog_categories        | slug               | character varying        | NO          |
| blog_categories        | description        | text                     | YES         |
| blog_categories        | color              | character varying        | YES         |
| blog_categories        | post_count         | integer                  | YES         |
| blog_categories        | created_at         | timestamp with time zone | YES         |
| blog_categories        | updated_at         | timestamp with time zone | YES         |
| blog_comments          | id                 | uuid                     | NO          |
| blog_comments          | post_id            | character varying        | NO          |
| blog_comments          | author_id          | character varying        | YES         |
| blog_comments          | author_name        | character varying        | YES         |
| blog_comments          | author_email       | character varying        | YES         |
| blog_comments          | content            | text                     | NO          |
| blog_comments          | status             | character varying        | YES         |
| blog_comments          | parent_id          | uuid                     | YES         |
| blog_comments          | created_at         | timestamp with time zone | YES         |
| blog_comments          | updated_at         | timestamp with time zone | YES         |
| blog_post_tags         | post_id            | character varying        | NO          |
| blog_post_tags         | tag_id             | character varying        | NO          |
| blog_post_tags         | created_at         | timestamp with time zone | YES         |
| blog_posts             | id                 | character varying        | NO          |
| blog_posts             | title              | character varying        | NO          |
| blog_posts             | slug               | character varying        | NO          |
| blog_posts             | content            | text                     | NO          |
| blog_posts             | excerpt            | text                     | YES         |
| blog_posts             | featured_image_url | text                     | YES         |
| blog_posts             | author_id          | character varying        | NO          |
| blog_posts             | category_id        | character varying        | YES         |
| blog_posts             | status             | character varying        | YES         |
| blog_posts             | is_featured        | boolean                  | YES         |
| blog_posts             | view_count         | integer                  | YES         |
| blog_posts             | reading_time       | integer                  | YES         |
| blog_posts             | seo_title          | character varying        | YES         |
| blog_posts             | seo_description    | text                     | YES         |
| blog_posts             | tags               | ARRAY                    | YES         |
| blog_posts             | published_at       | timestamp with time zone | YES         |
| blog_posts             | created_at         | timestamp with time zone | YES         |
| blog_posts             | updated_at         | timestamp with time zone | YES         |
| blog_tags              | id                 | character varying        | NO          |
| blog_tags              | name               | character varying        | NO          |
| blog_tags              | slug               | character varying        | NO          |
| blog_tags              | post_count         | integer                  | YES         |
| blog_tags              | created_at         | timestamp with time zone | YES         |
| course_categories      | id                 | character varying        | NO          |
| course_categories      | name               | character varying        | NO          |
| course_categories      | slug               | character varying        | NO          |
| course_categories      | description        | text                     | YES         |
| course_categories      | parent_id          | character varying        | YES         |
| course_categories      | icon               | character varying        | YES         |
| course_categories      | color              | character varying        | YES         |
| course_categories      | order_index        | integer                  | YES         |
| course_categories      | is_active          | boolean                  | YES         |
| course_categories      | created_at         | timestamp with time zone | YES         |
| course_categories      | updated_at         | timestamp with time zone | YES         |
| course_lessons         | id                 | character varying        | NO          |
| course_lessons         | course_id          | character varying        | NO          |
| course_lessons         | title              | character varying        | NO          |
| course_lessons         | slug               | character varying        | NO          |
| course_lessons         | description        | text                     | YES         |
| course_lessons         | content            | text                     | YES         |
| course_lessons         | lesson_type        | character varying        | YES         |
| course_lessons         | video_url          | text                     | YES         |
| course_lessons         | video_duration     | integer                  | YES         |
| course_lessons         | order_index        | integer                  | NO          |
| course_lessons         | is_preview         | boolean                  | YES         |
| course_lessons         | is_published       | boolean                  | YES         |
| course_lessons         | created_at         | timestamp with time zone | YES         |
| course_lessons         | updated_at         | timestamp with time zone | YES         |