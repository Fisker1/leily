# Docker Setup for Leily Application

This document provides comprehensive instructions for running the Leily application using Docker in both development and production environments.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd leily
cp env.example .env
# Edit .env with your actual values
```

### 2. Development Mode

```bash
# Start development environment with hot reload
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **Database**: localhost:5432
- **Redis**: localhost:6379

### 3. Production Mode

```bash
# Build production image
docker build -t leily:latest .

# Run production container
docker run -p 80:80 --env-file .env leily:latest
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://wdwjmapvuibsqiifslno.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_SUPABASE_PROJECT_ID=wdwjmapvuibsqiifslno

# Application Settings
VITE_ENVIRONMENT=development
VITE_APP_URL=http://localhost:8080
VITE_DEBUG=true
```

### Supabase Integration

The application is configured to work with Supabase EU region. Ensure your environment variables match your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Update your `.env` file

## Docker Commands

### Development Commands

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up app

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up --build

# Remove volumes (clean database)
docker-compose down -v
```

### Production Commands

```bash
# Build production image
docker build -t leily:latest .

# Run production container
docker run -d \
  --name leily-app \
  -p 80:80 \
  --env-file .env \
  leily:latest

# View logs
docker logs -f leily-app

# Stop container
docker stop leily-app
docker rm leily-app
```

## Container Registry Deployment

### GitHub Container Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image
docker tag leily:latest ghcr.io/your-username/leily:latest

# Push image
docker push ghcr.io/your-username/leily:latest
```

### Azure Container Registry

```bash
# Login to Azure
az acr login --name your-registry

# Tag image
docker tag leily:latest your-registry.azurecr.io/leily:latest

# Push image
docker push your-registry.azurecr.io/leily:latest
```

### Docker Hub

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag leily:latest your-username/leily:latest

# Push image
docker push your-username/leily:latest
```

## Cloud Deployment

### Azure Container Instances

```bash
# Deploy to Azure Container Instances
az container create \
  --resource-group myResourceGroup \
  --name leily-app \
  --image your-registry.azurecr.io/leily:latest \
  --dns-name-label leily-app \
  --ports 80 \
  --environment-variables \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
```

### AWS ECS

```bash
# Create ECS task definition
aws ecs register-task-definition \
  --family leily-app \
  --container-definitions '[
    {
      "name": "leily-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/leily:latest",
      "portMappings": [{"containerPort": 80}],
      "environment": [
        {"name": "VITE_SUPABASE_URL", "value": "your-supabase-url"},
        {"name": "VITE_SUPABASE_ANON_KEY", "value": "your-anon-key"}
      ]
    }
  ]'
```

## Vercel Compatibility

The Docker setup is fully compatible with Vercel deployment:

1. **Environment Variables**: All Vite environment variables work in both Docker and Vercel
2. **Build Process**: Uses the same `npm run build` command
3. **Static Assets**: Properly configured for CDN delivery
4. **Routing**: SPA routing works in both environments

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# or via CLI:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check if ports are in use
   netstat -tulpn | grep :8080
   
   # Use different ports
   docker-compose up -p 8081:8080
   ```

2. **Environment Variables Not Loading**
   ```bash
   # Check if .env file exists and has correct format
   cat .env
   
   # Restart containers
   docker-compose down && docker-compose up
   ```

3. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Reset database
   docker-compose down -v && docker-compose up
   ```

### Performance Optimization

1. **Multi-stage Build**: Production image is optimized with nginx
2. **Layer Caching**: Dependencies are cached in separate layers
3. **Security**: Non-root user, minimal attack surface
4. **Health Checks**: Built-in health monitoring

### Monitoring

```bash
# View container stats
docker stats

# Check health status
docker inspect --format='{{.State.Health.Status}}' leily-app

# View detailed logs
docker-compose logs --tail=100 -f
```

## Security Considerations

1. **Non-root User**: Application runs as non-root user
2. **Security Headers**: Nginx configured with security headers
3. **Environment Variables**: Sensitive data in environment variables
4. **Network Isolation**: Services communicate through Docker network
5. **Resource Limits**: Consider setting memory and CPU limits

## Development Workflow

1. **Hot Reload**: Development container supports hot reload
2. **Volume Mounting**: Source code is mounted for live updates
3. **Debugging**: Use `docker-compose logs -f` for debugging
4. **Database**: Local PostgreSQL for development
5. **Caching**: Redis for session and data caching

## Production Checklist

- [ ] Environment variables configured
- [ ] Supabase credentials set
- [ ] OAuth providers configured
- [ ] SSL/TLS certificates (if using custom domain)
- [ ] Monitoring and logging setup
- [ ] Backup strategy for database
- [ ] Resource limits configured
- [ ] Security headers verified

