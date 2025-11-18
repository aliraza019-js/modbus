# GitHub Setup Guide

This guide will help you push your Modbus project to GitHub and set it up for deployment.

## Step 1: Create a GitHub Repository

### 1.1 Create New Repository on GitHub

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name:** `modbus` (or your preferred name)
   - **Description:** "Modbus monitoring system with Next.js frontend and NestJS backend"
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Initialize Git Repository (if not already done)

### 2.1 Check if Git is Already Initialized

```bash
cd /Users/admin/Desktop/modbus
git status
```

If you see "not a git repository", proceed to initialize:

```bash
git init
```

## Step 3: Configure Git (if not already done)

```bash
# Set your name and email (if not already configured globally)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Or set globally for all repositories
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Add Files to Git

### 4.1 Check Current Status

```bash
git status
```

### 4.2 Add All Files

```bash
# Add all files
git add .

# Or add specific files/directories
git add backend/
git add frontend/
git add docker-compose.yml
git add *.md
git add env.example
git add env.prod.example
```

### 4.3 Verify What Will Be Committed

```bash
git status
```

Make sure `.env` files are NOT included (they should be in `.gitignore`).

## Step 5: Create Initial Commit

```bash
git commit -m "Initial commit: Modbus monitoring system with environment configuration"
```

## Step 6: Add GitHub Remote

### 6.1 Get Your Repository URL

From your GitHub repository page, copy the repository URL. It will look like:
- HTTPS: `https://github.com/your-username/modbus.git`
- SSH: `git@github.com:your-username/modbus.git`

### 6.2 Add Remote

```bash
# Using HTTPS (easier for first-time setup)
git remote add origin https://github.com/your-username/modbus.git

# OR using SSH (if you have SSH keys set up)
git remote add origin git@github.com:your-username/modbus.git
```

### 6.3 Verify Remote

```bash
git remote -v
```

You should see:
```
origin  https://github.com/your-username/modbus.git (fetch)
origin  https://github.com/your-username/modbus.git (push)
```

## Step 7: Push to GitHub

### 7.1 Push to Main Branch

```bash
# If your default branch is 'main'
git branch -M main
git push -u origin main

# OR if your default branch is 'master'
git branch -M master
git push -u origin master
```

### 7.2 Enter Credentials

If using HTTPS, you'll be prompted for:
- **Username:** Your GitHub username
- **Password:** Your GitHub Personal Access Token (not your account password)

**Note:** GitHub no longer accepts passwords for HTTPS. You need to create a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "modbus-project")
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token immediately (you won't see it again)
7. Use this token as your password when pushing

## Step 8: Verify on GitHub

1. Go to your repository on GitHub
2. You should see all your files
3. Verify that `.env` files are NOT visible (they should be ignored)

## Step 9: Set Up Branch Protection (Optional but Recommended)

1. Go to your repository → Settings → Branches
2. Add a branch protection rule for `main` (or `master`)
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging

## Step 10: Create .gitignore (Verify It Exists)

Make sure your `.gitignore` file includes:

```gitignore
# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Build outputs
backend/dist/
frontend/.next/
frontend/out/
frontend/build/

# Environment files
.env
.env.local
.env*.local
backend/.env
frontend/.env.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Testing
coverage/
.nyc_output/

# Misc
*.tsbuildinfo
next-env.d.ts
```

## Future Updates: How to Push Changes

### Making Changes and Pushing

```bash
# 1. Make your changes to files

# 2. Check what changed
git status

# 3. Add changed files
git add .

# 4. Commit with a descriptive message
git commit -m "Description of your changes"

# 5. Push to GitHub
git push
```

### Example Workflow

```bash
# After making changes
git add .
git commit -m "Update environment configuration for production"
git push
```

## Cloning Repository on VPS

When you're ready to deploy on your VPS, you'll clone the repository:

```bash
cd /var/www/modbus
git clone https://github.com/your-username/modbus.git .
```

## Troubleshooting

### If you get "remote origin already exists"

```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/your-username/modbus.git
```

### If you get authentication errors

1. **For HTTPS:** Make sure you're using a Personal Access Token, not your password
2. **For SSH:** Set up SSH keys:
   ```bash
   ssh-keygen -t ed25519 -C "your.email@example.com"
   cat ~/.ssh/id_ed25519.pub
   # Copy the output and add it to GitHub → Settings → SSH and GPG keys
   ```

### If you want to change the remote URL

```bash
git remote set-url origin https://github.com/your-username/new-repo-name.git
```

### If you accidentally committed .env files

```bash
# Remove from git (but keep local file)
git rm --cached .env
git rm --cached backend/.env
git rm --cached frontend/.env.local

# Commit the removal
git commit -m "Remove .env files from repository"

# Push the changes
git push
```

## Best Practices

1. **Never commit sensitive data** (API keys, passwords, etc.)
2. **Use meaningful commit messages**
3. **Commit frequently** with small, logical changes
4. **Pull before pushing** if working with others:
   ```bash
   git pull
   git push
   ```
5. **Create branches** for new features:
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git add .
   git commit -m "Add new feature"
   git push -u origin feature/new-feature
   ```

## Next Steps

After pushing to GitHub:
1. Follow the [DEPLOYMENT.md](./DEPLOYMENT.md) guide to deploy on your VPS
2. Set up CI/CD (optional) for automated deployments
3. Consider adding GitHub Actions for automated testing

