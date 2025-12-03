# Google Cloud Deployment Guide

## Fixing "Forbidden" Error

If you're seeing the error:
```
Error: Forbidden Your client does not have permission to get URL / from this server.
```

This means your Cloud Run service is not publicly accessible. Here are the solutions:

### Option 1: Use the Fix Script (Recommended)

Run the provided script to fix permissions for existing services:

```bash
chmod +x fix-cloud-run-permissions.sh
./fix-cloud-run-permissions.sh YOUR_PROJECT_ID us-central1
```

Or set the PROJECT_ID environment variable:
```bash
export PROJECT_ID=your-project-id
./fix-cloud-run-permissions.sh
```

### Option 2: Manual Fix via gcloud CLI

Allow unauthenticated access to your Cloud Run services:

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Allow public access to server
gcloud run services add-iam-policy-binding flock-manager-server \
    --region=us-central1 \
    --member="allUsers" \
    --role="roles/run.invoker"

# Allow public access to client
gcloud run services add-iam-policy-binding flock-manager-client \
    --region=us-central1 \
    --member="allUsers" \
    --role="roles/run.invoker"
```

### Option 3: Fix via Google Cloud Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on your service (e.g., `flock-manager-server`)
3. Click on the **"PERMISSIONS"** tab
4. Click **"ADD PRINCIPAL"**
5. In "New principals", enter: `allUsers`
6. Select role: **"Cloud Run Invoker"**
7. Click **"SAVE"**

### Option 4: Redeploy with Updated Cloud Build

The Cloud Build configurations have been updated to automatically deploy with `--allow-unauthenticated` flag. 

To redeploy:
```bash
# For server only
gcloud builds submit --config=cloudbuild-server.yaml

# For client only
gcloud builds submit --config=cloudbuild-client.yaml

# For both
gcloud builds submit --config=cloudbuild.yaml
```

## Deployment

### Prerequisites

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`
4. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

### Deploy via Cloud Build

The Cloud Build configurations will:
1. Build Docker images
2. Push to Google Container Registry
3. Deploy to Cloud Run with public access enabled

```bash
# Deploy both server and client
gcloud builds submit --config=cloudbuild.yaml

# Or deploy individually
gcloud builds submit --config=cloudbuild-server.yaml
gcloud builds submit --config=cloudbuild-client.yaml
```

### Manual Deployment

If you prefer to deploy manually:

```bash
# Deploy server
gcloud run deploy flock-manager-server \
    --image gcr.io/YOUR_PROJECT_ID/flock-manager-server:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi

# Deploy client
gcloud run deploy flock-manager-client \
    --image gcr.io/YOUR_PROJECT_ID/flock-manager-client:latest \
    --region us-central1 \
    --platform managed \
    --allow-unauthenticated \
    --port 80 \
    --memory 256Mi
```

## Environment Variables

For Cloud Run services, set environment variables:

```bash
# Server environment variables
gcloud run services update flock-manager-server \
    --region us-central1 \
    --set-env-vars "DATABASE_URL=your-database-url,NODE_ENV=production"

# Client environment variables (if needed)
gcloud run services update flock-manager-client \
    --region us-central1 \
    --set-env-vars "REACT_APP_API_URL=your-server-url"
```

## Get Service URLs

```bash
# Get server URL
gcloud run services describe flock-manager-server \
    --region us-central1 \
    --format='value(status.url)'

# Get client URL
gcloud run services describe flock-manager-client \
    --region us-central1 \
    --format='value(status.url)'
```

## Troubleshooting

### Service returns 403 Forbidden
- Run the fix script or manually add IAM permissions (see Option 1-3 above)

### Service returns 500 Internal Server Error
- Check Cloud Run logs: `gcloud run services logs read flock-manager-server --region us-central1`
- Verify environment variables are set correctly
- Check database connectivity

### Build fails
- Ensure Cloud Build API is enabled
- Check that Dockerfile paths are correct
- Verify project ID is set correctly

