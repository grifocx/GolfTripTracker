#!/bin/bash

# Build the project for production deployment
echo "Building frontend and backend..."

# Build frontend and backend
npm run build

# Ensure server/public directory exists
mkdir -p server/public

# Copy built frontend files to server/public
echo "Copying frontend files to server/public..."
cp -r dist/public/* server/public/

echo "Build complete! Files are ready for deployment."
echo "Built files are in server/public/"
ls -la server/public/