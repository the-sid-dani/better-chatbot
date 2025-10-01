#!/bin/bash
vercel env add LANGFUSE_PUBLIC_KEY production preview development <<< "pk-lf-bc54c009-dc31-4aa3-bbad-f58e8f88630b"
vercel env add LANGFUSE_SECRET_KEY production preview development <<< "sk-lf-15d65ded-e26e-4241-b805-68ad48cb1a9a"
vercel env add LANGFUSE_BASE_URL production preview development <<< "https://langfuse.cap.mysamba.tv"
vercel env add LANGFUSE_TRACING_ENVIRONMENT production preview development <<< "production"
vercel env add LANGFUSE_TRACING_RELEASE production preview development <<< "1.0.0"
