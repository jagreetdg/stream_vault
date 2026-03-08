# StreamVault

A private video streaming service. Upload a video and get an instant shareable HLS stream link.

## Architecture

| Service      | Tech                  | Port  | Description                              |
|--------------|-----------------------|-------|------------------------------------------|
| **Frontend** | SvelteKit + Nginx     | 3000  | Upload UI and HLS video player           |
| **API**      | Node.js + Express     | 8080  | Upload initiation, video status          |
| **Worker**   | Node.js + FFmpeg      | —     | Transcodes uploads into HLS segments     |
| **Postgres** | PostgreSQL 16         | 5432  | Video metadata and job tracking          |
| **Redis**    | Redis 7               | 6379  | Transcode job queue                      |
| **MinIO**    | S3-compatible storage | 9000  | Raw uploads and HLS segment storage      |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

## Quick Start

### 1. Start all services

```bash
docker-compose up -d
```

This builds and starts all six containers. First run will take a few minutes to pull images and build.

### 2. Run database migrations

```bash
docker exec -i stream_vault-postgres-1 psql -U postgres -d streamvault < migrations/001_create_videos.sql
docker exec -i stream_vault-postgres-1 psql -U postgres -d streamvault < migrations/002_create_jobs.sql
docker exec -i stream_vault-postgres-1 psql -U postgres -d streamvault < migrations/003_add_video_title.sql
```

### 3. Create the S3 storage bucket

```bash
docker run --rm --network stream_vault_default --entrypoint /bin/sh minio/mc -c \
  "mc alias set myminio http://minio:9000 minioadmin minioadmin && \
   mc mb myminio/streamvault && \
   mc anonymous set download myminio/streamvault/hls"
```

### 4. Open the app

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **API Health:** [http://localhost:8080/health](http://localhost:8080/health)
- **MinIO Console:** [http://localhost:9001](http://localhost:9001) — Login: `minioadmin` / `minioadmin`

## Usage

1. Open [http://localhost:3000](http://localhost:3000)
2. Enter a title for the video (optional)
3. Drag & drop or click to select a video file
4. Wait for the upload to complete and the shareable link to appear
5. Share the link — the video will auto-play once transcoding finishes

## Development

After making changes to any service, rebuild and restart the changed container:

```bash
# Frontend changes
docker-compose build frontend && docker-compose up -d --force-recreate frontend

# API changes
docker-compose build api && docker-compose up -d --force-recreate api

# Worker changes
docker-compose build worker && docker-compose up -d --force-recreate worker
```

### View logs

```bash
docker-compose logs -f api       # API logs
docker-compose logs -f worker    # Worker / transcoding logs
docker-compose logs -f frontend  # Nginx access logs
```

### Stop everything

```bash
docker-compose down           # Stop containers (data preserved in volumes)
docker-compose down -v        # Stop containers AND delete volumes (full reset)
```

## Project Structure

```
stream_vault/
├── backend/
│   ├── api/                  # Express API server
│   │   └── src/
│   │       ├── routes/       # upload.js, video.js, health.js
│   │       ├── config.js     # Environment config
│   │       ├── db.js         # Postgres pool
│   │       ├── redis.js      # Redis client
│   │       ├── s3.js         # S3 client + presigned URLs
│   │       └── index.js      # Entrypoint
│   └── worker/               # Transcode worker
│       └── src/
│           ├── transcoder.js # FFmpeg HLS pipeline
│           ├── queue.js      # Redis job consumer
│           └── index.js      # Entrypoint
├── frontend/                 # SvelteKit SPA
│   └── src/
│       ├── lib/
│       │   ├── api.ts        # API client
│       │   └── components/   # VideoPlayer, UploadZone, ProgressBar
│       └── routes/
│           ├── +page.svelte          # Upload page
│           └── watch/[id]/+page.svelte  # Watch page
├── migrations/               # SQL migration files
├── docker-compose.yml
├── .env.example
└── ARCHITECTURE_PLAN.md
```

## Environment Variables

Copy the example and customize if needed:

```bash
cp .env.example .env
```

> **Note:** When running via Docker Compose, environment variables are set directly in `docker-compose.yml` with correct internal service hostnames. The `.env` file is only needed if running services outside Docker.

## Supported Formats

`video/mp4`, `video/quicktime`, `video/webm`, `video/x-matroska`, `video/avi`, `video/x-msvideo`, `video/x-ms-wmv`

Max upload size: **1 GB**
