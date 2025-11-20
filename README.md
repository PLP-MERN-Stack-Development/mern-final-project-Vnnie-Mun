# AI Crop Doctor

WhatsApp-based crop disease diagnosis system for Kenyan smallholder farmers. Send a photo of a sick crop, get instant diagnosis, treatment advice, and nearby agrovet locations — all in English and Swahili.

## 🏗️ Architecture

```
┌─────────────────┐
│   WhatsApp      │
│   User/Farmer   │
└────────┬────────┘
         │
         ├─ Sends image + text message
         │
         v
┌─────────────────────────────────────────────────────┐
│              Backend API (Node.js + Express)         │
│  - Receives webhook from WhatsApp                    │
│  - Stores image to S3                                │
│  - Creates job in Redis Queue                        │
│  - Sends acknowledgment to farmer                    │
└──────────────┬──────────────────────────────────────┘
               │
               ├─ Job queued
               │
               v
┌─────────────────────────────────────────────────────┐
│          Worker (BullMQ + Redis)                     │
│  - Picks job from queue                              │
│  - Calls ML inference service                        │
│  - Formats response (EN + SW)                        │
│  - Sends diagnosis to farmer via WhatsApp            │
│  - Saves report to Postgres                          │
└──────────────┬──────────────────────────────────────┘
               │
               ├─ Calls predict endpoint
               │
               v
┌─────────────────────────────────────────────────────┐
│       ML Inference Service (Python + FastAPI)        │
│  - Loads pre-trained PlantVillage model              │
│  - Performs image classification                     │
│  - Returns: disease, confidence, severity, advice    │
└─────────────────────────────────────────────────────┘
               │
               └─ Returns prediction
                        │
                        v
               Farmer receives diagnosis on WhatsApp
               
               
┌─────────────────────────────────────────────────────┐
│         Admin PWA (React + Next.js)                  │
│  - Dashboard with latest reports                     │
│  - Filter by crop, disease, confidence              │
│  - Review low-confidence predictions                 │
│  - Send manual replies via WhatsApp                  │
│  - Download CSV reports                              │
│  - Bilingual interface (EN/SW)                       │
└─────────────────────────────────────────────────────┘
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local dev without Docker)
- Python 3.10+ (for local dev without Docker)

### Run Everything with Docker Compose

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-crop-doctor

# Copy environment template
cp .env.example .env

# Edit .env with your configuration (WhatsApp credentials, etc.)
# For demo purposes, mock endpoints will work without real credentials

# Start all services
docker-compose up --build

# Services will be available at:
# - Frontend (Admin PWA): http://localhost:3000
# - Backend API: http://localhost:4000
# - ML Inference Service: http://localhost:8000
# - MinIO S3: http://localhost:9000
# - Redis: localhost:6379
# - Postgres: localhost:5432
```

### Simulate WhatsApp Flow

```bash
# Send a test webhook (simulates WhatsApp incoming message)
curl -X POST http://localhost:4000/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "254712345678",
            "type": "image",
            "image": {
              "id": "test-image-id",
              "mime_type": "image/jpeg"
            },
            "text": {
              "body": "Napenda kujua tatizo la mimea yangu"
            }
          }]
        }
      }]
    }]
  }'

# Check the logs to see:
# 1. Backend receives webhook
# 2. Job queued in Redis
# 3. Worker processes job
# 4. ML service returns prediction
# 5. Response sent back (logged since we're using mock WhatsApp)
# 6. Report saved to database

# View the report in Admin PWA: http://localhost:3000
```

## 📁 Project Structure

```
ai-crop-doctor/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── routes/          # API routes (webhooks, reports, health)
│   │   ├── services/        # Business logic (WhatsApp, ML client, storage)
│   │   ├── workers/         # BullMQ job processors
│   │   ├── models/          # Database models
│   │   ├── config/          # Configuration
│   │   └── utils/           # Utilities
│   ├── Dockerfile
│   └── package.json
│
├── ml-service/              # Python FastAPI ML inference
│   ├── app/
│   │   ├── main.py          # FastAPI app
│   │   ├── model.py         # Model loading & inference
│   │   ├── preprocessing.py # Image preprocessing
│   │   └── advice.py        # Disease advice database
│   ├── models/              # Model checkpoints
│   ├── data/                # Sample dataset for training
│   ├── scripts/
│   │   ├── train.py         # Training script
│   │   └── evaluate.py      # Evaluation script
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                # React Next.js Admin PWA
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── components/      # React components
│   │   ├── lib/             # API clients, utilities
│   │   └── locales/         # i18n translations (EN/SW)
│   ├── public/              # Static assets
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml       # Orchestrates all services
├── .env.example             # Environment template
└── README.md                # This file
```

## 🔑 Environment Variables

See `.env.example` for all required variables:

- `WHATSAPP_PHONE_NUMBER_ID` - Your WhatsApp Cloud API phone number ID
- `WHATSAPP_ACCESS_TOKEN` - WhatsApp API access token
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - Token for webhook verification
- `DATABASE_URL` - Postgres connection string
- `REDIS_URL` - Redis connection string
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` - MinIO/S3 config
- `ML_SERVICE_URL` - ML inference service URL
- `JWT_SECRET` - Secret for admin authentication

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# ML service tests
cd ml-service
pytest

# E2E tests (requires services running)
cd frontend
npm run test:e2e
```

## 📊 ML Model Details

**Current Model**: MobileNetV3 fine-tuned on PlantVillage dataset

**Supported Crops & Diseases**:
- Tomato: Early Blight, Late Blight, Leaf Mold, Mosaic Virus, Healthy
- Maize: Common Rust, Northern Leaf Blight, Gray Leaf Spot, Healthy
- Cassava: Mosaic Disease, Brown Streak Disease, Healthy

**Training New Model**:

```bash
cd ml-service

# Download dataset (PlantVillage)
python scripts/download_data.py

# Train model
python scripts/train.py --epochs 20 --batch-size 32

# Evaluate
python scripts/evaluate.py --model-path models/latest.pth
```

## 🌍 Bilingual Support

All farmer-facing messages support:
- **English** (en)
- **Swahili** (sw)

Messages automatically include both languages in WhatsApp replies. Admin PWA allows language switching.

## 🔐 Security & Privacy

- WhatsApp sender IDs hashed before storage
- Images stored with random UUIDs, not linked to phone numbers
- No raw phone numbers in database logs
- JWT authentication for admin panel
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS properly configured

## 📈 Scaling Considerations

**Current Setup** (Demo/MVP):
- Single container per service
- Local MinIO for storage
- Single Redis instance

**Production Recommendations**:
- Use managed services (RDS for Postgres, ElastiCache for Redis)
- AWS S3 or similar for image storage
- Kubernetes or ECS for container orchestration
- Horizontal scaling of ML service (multiple replicas)
- CDN for frontend
- Separate read replicas for analytics queries

**Expected Costs** (1,000 monthly users):
- Compute: ~$50/month (DigitalOcean droplets or Heroku dynos)
- Storage: ~$5/month (images + backups)
- WhatsApp API: ~$20/month (messaging costs)
- **Total**: ~$75/month

## 🚢 Deployment

### Option 1: DigitalOcean App Platform

```bash
# Push to GitHub
git push origin main

# Connect DigitalOcean App Platform to your repo
# Configure environment variables
# Deploy all services as Docker containers
```

### Option 2: Heroku

```bash
# Backend
heroku create ai-crop-doctor-backend
heroku addons:create heroku-postgresql
heroku addons:create heroku-redis
git subtree push --prefix backend heroku main

# ML Service
heroku create ai-crop-doctor-ml
git subtree push --prefix ml-service heroku main

# Frontend (or use Vercel)
heroku create ai-crop-doctor-frontend
git subtree push --prefix frontend heroku main
```

### Option 3: Docker Compose on VPS

```bash
# On your VPS
git clone <your-repo>
cd ai-crop-doctor
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.prod.yml up -d
```

## 📋 API Documentation

Once running, visit:
- Backend API docs: http://localhost:4000/api-docs
- ML service docs: http://localhost:8000/docs

## 🎯 What's Next?

1. **More crops & diseases**: Add beans, potatoes, bananas
2. **Human-in-loop learning**: Collect corrections to retrain model
3. **SMS fallback**: Use Africa's Talking for non-WhatsApp users
4. **Analytics dashboard**: Heatmap of diseases by county
5. **Agrovet integration**: Real-time product availability
6. **Farmer profiles**: Track history and recommendations

## 📄 License

MIT License - See LICENSE file

## 🙏 Acknowledgments

- PlantVillage dataset
- iCassava dataset contributors
- WhatsApp Cloud API
- Open-source ML frameworks

---

**Built with ❤️ for Kenyan farmers**