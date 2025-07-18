#!/bin/bash

echo "🧹 BroGolfTracker Database Cleanup"
echo "This will clean all test data while preserving admin user and courses."
echo ""
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running cleanup..."
    tsx cleanup-database.js
else
    echo "Cleanup cancelled."
fi