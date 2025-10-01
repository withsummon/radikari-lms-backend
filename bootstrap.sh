#!/bin/bash

# Bootstrap script for initializing a new project from this template

# Function to convert project name to kebab-case
convert_to_kebab_case() {
    local project_name="$1"
    # Convert to lowercase, replace spaces with hyphens, then handle camelCase
    echo "$project_name" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/\([a-z0-9]\)\1*/\1/g' | sed 's/\([a-z0-9]\)-\([a-z0-9]\)/\1-\2/g'
}

# Function to validate project name
validate_project_name() {
    local project_name="$1"
    if [[ -z "$project_name" ]]; then
        echo "Error: Project name cannot be empty"
        exit 1
    fi
    
    if [[ "$project_name" =~ [^a-zA-Z0-9\-\_\ ] ]]; then
        echo "Error: Project name contains invalid characters. Use only letters, numbers, hyphens, underscores, and spaces."
        exit 1
    fi
}

# Main script
echo "🚀 Bootstrap script for new project initialization"
echo "=================================================="

# Get project name from user
read -p "Enter your project name: " PROJECT_NAME

# Validate project name
validate_project_name "$PROJECT_NAME"

# Convert to kebab-case for package name
PACKAGE_NAME=$(convert_to_kebab_case "$PROJECT_NAME")

echo "📦 Project name: $PROJECT_NAME"
echo "📦 Package name: $PACKAGE_NAME"
echo ""

# Confirm before proceeding
read -p "Proceed with initialization? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Initialization cancelled"
    exit 1
fi

echo ""
echo "🔄 Starting initialization process..."

# 1. Update package.json with new project name
echo "📝 Updating package.json..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"name\": \"nodewave-base\"/\"name\": \"$PACKAGE_NAME\"/" package.json
    sed -i '' "s/\"description\": \"\"/\"description\": \"$PROJECT_NAME\"/" package.json
else
    # Linux
    sed -i "s/\"name\": \"nodewave-base\"/\"name\": \"$PACKAGE_NAME\"/" package.json
    sed -i "s/\"description\": \"\"/\"description\": \"$PROJECT_NAME\"/" package.json
fi

# 2. Remove existing git repository
echo "🗑️  Removing existing git repository..."
rm -rf .git

# 3. Initialize new git repository
echo "🔧 Initializing new git repository..."
git init

# 4. Add all files and make initial commit
echo "📁 Adding all files to git..."
git add .

echo "💾 Making initial commit..."
git commit -m "chore: initialization of repository"

echo "Installing dependencies..."
bun install

echo ""
echo "✅ Bootstrap completed successfully!"
echo ""
echo "📋 Summary:"
echo "   • Project name: $PROJECT_NAME"
echo "   • Package name: $PACKAGE_NAME"
echo "   • Git repository: Initialized with initial commit"
echo ""
echo "🚀 You can now start developing your new project!"
echo ""
echo "💡 Next steps:"
echo "   1. Update README.md with your project details"
echo "   2. Configure your environment variables"
echo "   3. Update any references to 'nodewave-base' in your code"
echo "   4. Push to your remote repository when ready"
