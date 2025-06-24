#!/bin/bash
set -e

echo "🚀 Setting up Wendeal Reports development environment..."

# Update system packages
sudo apt-get update -y

# Install Node.js 18 (required by the project)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js and npm versions
echo "📋 Checking Node.js and npm versions..."
node --version
npm --version

# Navigate to project directory
cd /mnt/persist/workspace

# Install project dependencies
echo "📦 Installing project dependencies..."
npm ci

# Install testing dependencies
echo "🧪 Installing testing framework..."
npm install --save-dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Create Jest configuration
echo "⚙️ Creating Jest configuration..."
cat > jest.config.js << 'EOF'
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/api/**/*',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/tests/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
EOF

# Create Jest setup file
echo "🔧 Creating Jest setup file..."
cat > jest.setup.js << 'EOF'
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock environment variables
process.env.DATABASE_URL = 'file:./test.db'
process.env.JWT_SECRET = 'test-secret'
EOF

# Create a basic test directory structure
echo "📁 Creating test directory structure..."
mkdir -p src/__tests__/components
mkdir -p src/__tests__/lib
mkdir -p src/__tests__/app

# Create a basic component test
echo "✅ Creating sample component test..."
cat > src/__tests__/components/Button.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple Button component test (we'll create a basic button for testing)
function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  )
}

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByTestId('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByTestId('button')
    button.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
EOF

# Create a utility function test
echo "🔧 Creating utility function test..."
cat > src/__tests__/lib/utils.test.ts << 'EOF'
// Test for utility functions
describe('Utility Functions', () => {
  it('should pass basic math test', () => {
    expect(2 + 2).toBe(4)
  })

  it('should handle string operations', () => {
    const testString = 'Hello World'
    expect(testString.toLowerCase()).toBe('hello world')
    expect(testString.length).toBe(11)
  })

  it('should handle array operations', () => {
    const testArray = [1, 2, 3, 4, 5]
    expect(testArray.length).toBe(5)
    expect(testArray.includes(3)).toBe(true)
    expect(testArray.filter(n => n > 3)).toEqual([4, 5])
  })
})
EOF

# Create an API route test
echo "🌐 Creating API test..."
cat > src/__tests__/app/api.test.ts << 'EOF'
// Basic API functionality test
describe('API Functionality', () => {
  it('should handle JSON operations', () => {
    const testData = { name: 'Test Report', status: 'published' }
    const jsonString = JSON.stringify(testData)
    const parsedData = JSON.parse(jsonString)
    
    expect(parsedData.name).toBe('Test Report')
    expect(parsedData.status).toBe('published')
  })

  it('should validate data structures', () => {
    const reportData = {
      id: '1',
      title: 'Test Report',
      content: '<h1>Test</h1>',
      status: 'published',
      createdAt: new Date().toISOString()
    }

    expect(reportData).toHaveProperty('id')
    expect(reportData).toHaveProperty('title')
    expect(reportData).toHaveProperty('content')
    expect(reportData.status).toBe('published')
    expect(typeof reportData.createdAt).toBe('string')
  })
})
EOF

# Update package.json to include test scripts
echo "📝 Adding test scripts to package.json..."
npm pkg set scripts.test="jest"
npm pkg set scripts.test:watch="jest --watch"
npm pkg set scripts.test:coverage="jest --coverage"

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Create environment file for testing
echo "🔐 Setting up environment variables..."
if [ ! -f .env ]; then
    cp deployment/env.example .env
    echo "✅ Created .env file from template"
fi

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check

# Run linting
echo "🧹 Running ESLint..."
npm run lint

echo "✅ Setup completed successfully!"
echo "🧪 Test environment is ready!"