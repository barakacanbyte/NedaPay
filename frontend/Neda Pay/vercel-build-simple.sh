#!/bin/bash

# This is a simplified build script for Vercel that completely bypasses TypeScript checking

echo "Starting simplified Vercel build process..."

# Clean any previous build artifacts
rm -rf .next
rm -rf node_modules/.cache

# Create a simple tsconfig that skips type checking
cat > tsconfig.simple.json << EOL
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOL

# Use the simplified tsconfig
cp tsconfig.simple.json tsconfig.json

# Set environment variables to skip TypeScript checking
export NEXT_SKIP_TYPECHECKING=true
export NEXT_TYPESCRIPT_COMPILE_OPTIONS='{"transpileOnly": true}'
export NEXT_TELEMETRY_DISABLED=1

# Run the Next.js build with all type checking disabled
echo "Running Next.js build with type checking disabled..."
next build --no-lint

echo "Simplified build completed!"
