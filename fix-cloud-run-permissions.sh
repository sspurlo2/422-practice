#!/bin/bash

# Script to fix Cloud Run "Forbidden" error by allowing unauthenticated access
# Usage: ./fix-cloud-run-permissions.sh [PROJECT_ID] [REGION]

PROJECT_ID=${1:-$PROJECT_ID}
REGION=${2:-us-central1}

if [ -z "$PROJECT_ID" ]; then
    echo "Error: PROJECT_ID is required"
    echo "Usage: ./fix-cloud-run-permissions.sh [PROJECT_ID] [REGION]"
    echo "Or set PROJECT_ID environment variable"
    exit 1
fi

echo "Setting PROJECT_ID to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo ""
echo "Fixing permissions for Cloud Run services..."
echo ""

# Fix server service
echo "1. Allowing unauthenticated access to flock-manager-server..."
gcloud run services add-iam-policy-binding flock-manager-server \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --project=$PROJECT_ID

# Fix client service
echo ""
echo "2. Allowing unauthenticated access to flock-manager-client..."
gcloud run services add-iam-policy-binding flock-manager-client \
    --region=$REGION \
    --member="allUsers" \
    --role="roles/run.invoker" \
    --project=$PROJECT_ID

echo ""
echo "✅ Permissions updated successfully!"
echo ""
echo "Your services should now be publicly accessible."
echo "Get service URLs with:"
echo "  gcloud run services describe flock-manager-server --region=$REGION --format='value(status.url)'"
echo "  gcloud run services describe flock-manager-client --region=$REGION --format='value(status.url)'"

