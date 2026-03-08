-- migrations/003_add_video_title.sql
ALTER TABLE videos ADD COLUMN title VARCHAR(255);
