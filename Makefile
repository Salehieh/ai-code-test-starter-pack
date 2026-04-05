# Makefile

.PHONY: install setup start dev test clean

# Install dependencies
install:
    npm install

# Set up the project (install + initial build)
setup: install
    npm run build

# Start the production server
start:
    npm run start

# Start the development server with hot-reloading
dev:
    npm run dev

# Run tests
test:
    npm test

# Clean build artifacts
clean:
    rm -rf dist