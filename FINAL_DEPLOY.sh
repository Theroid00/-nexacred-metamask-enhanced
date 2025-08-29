#!/bin/bash

echo "🚀 NexaCred Enhanced - Final GitHub Deployment"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "METAMASK_INTEGRATION_COMPLETE.md" ]; then
    echo "❌ Error: Please run from nexacred-enhanced directory"
    exit 1
fi

# Display what we're deploying
echo "📊 Deployment Summary:"
echo "• Repository: nexacred-enhanced (MetaMask integrated)"
echo "• Files ready: $(git ls-tree -r --name-only HEAD | wc -l) files"
echo "• Total commits: $(git rev-list --count HEAD)"
echo "• Integration: Complete Web3 + DeFi credit platform"
echo ""

# Show recent commits
echo "📝 Recent Commits:"
git log --oneline -3
echo ""

# Create new repository using GitHub CLI or manual instructions
echo "🔗 Creating Enhanced NexaCred Repository:"
echo ""
echo "OPTION 1: Automatic (requires GitHub CLI)"
echo "----------------------------------------"
echo "1. Install GitHub CLI: brew install gh"
echo "2. Run: gh auth login"
echo "3. Run: gh repo create nexacred-enhanced --public --push --source=."
echo ""

echo "OPTION 2: Manual GitHub Setup"
echo "-----------------------------"
echo "1. Go to: https://github.com/new"
echo "2. Repository name: nexacred-enhanced"
echo "3. Description: Production-ready DeFi credit platform with MetaMask integration"
echo "4. Public repository"
echo "5. Click 'Create repository'"
echo ""

echo "OPTION 3: Push to Existing Repository"
echo "------------------------------------"
read -p "Do you want to push to the existing nexacred repository? (y/n): " push_existing

if [ "$push_existing" = "y" ]; then
    echo ""
    echo "🔑 Authentication Options:"
    echo "1. Personal Access Token"
    echo "2. SSH Key"
    echo ""
    read -p "Choose option (1-2): " auth_method
    
    if [ "$auth_method" = "1" ]; then
        echo ""
        echo "📝 Get your Personal Access Token:"
        echo "• Visit: https://github.com/settings/tokens"
        echo "• Click 'Generate new token (classic)'"
        echo "• Name: 'NexaCred Enhanced Deployment'"
        echo "• Scope: ☑️ repo (full control)"
        echo ""
        
        read -s -p "🔐 Enter your GitHub Personal Access Token: " TOKEN
        echo ""
        
        if [ -z "$TOKEN" ]; then
            echo "❌ No token provided"
            exit 1
        fi
        
        echo "🚀 Pushing to GitHub with token authentication..."
        git remote set-url origin https://github.com/0Advi/nexacred.git
        git push https://$TOKEN@github.com/0Advi/nexacred.git main --force
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 SUCCESS! NexaCred Enhanced deployed to GitHub!"
            echo "🔗 View repository: https://github.com/0Advi/nexacred"
            echo ""
            echo "✅ What was deployed:"
            echo "   • Complete MetaMask Web3 integration"
            echo "   • Advanced transaction analysis APIs"
            echo "   • Professional React dashboard"
            echo "   • Hybrid authentication system"
            echo "   • Production-ready DeFi platform"
            echo ""
            echo "🎯 Your repository now showcases cutting-edge fintech technology!"
        else
            echo "❌ Push failed. Check token permissions and repository access."
        fi
    
    elif [ "$auth_method" = "2" ]; then
        echo ""
        echo "🔑 SSH Key Setup:"
        echo "Add this SSH key to GitHub: https://github.com/settings/keys"
        echo ""
        echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE1FctpPpsgPcGRThHuf29Etqkfs5keyfZQWcEnxsa/T advi.nexacred@gmail.com"
        echo ""
        read -p "Press Enter after adding SSH key to GitHub..."
        
        git remote set-url origin git@github.com:0Advi/nexacred.git
        echo "🚀 Pushing with SSH authentication..."
        git push origin main --force
        
        if [ $? -eq 0 ]; then
            echo "🎉 SUCCESS! Repository deployed with SSH!"
            echo "🔗 https://github.com/0Advi/nexacred"
        else
            echo "❌ SSH push failed. Check SSH key setup."
        fi
    fi
else
    echo ""
    echo "📋 Manual Deployment Commands:"
    echo ""
    echo "For new repository (nexacred-enhanced):"
    echo "git remote set-url origin https://github.com/0Advi/nexacred-enhanced.git"
    echo "git push https://YOUR_TOKEN@github.com/0Advi/nexacred-enhanced.git main"
    echo ""
    echo "For existing repository (nexacred):"
    echo "git remote set-url origin https://github.com/0Advi/nexacred.git"
    echo "git push https://YOUR_TOKEN@github.com/0Advi/nexacred.git main --force"
    echo ""
    echo "🔗 Get Personal Access Token: https://github.com/settings/tokens"
fi

echo ""
echo "🌟 NexaCred Enhanced Features:"
echo "• 🔗 Complete MetaMask Web3 integration"
echo "• 🔐 Hybrid authentication (Web2 + Web3)"  
echo "• 📊 Real-time DeFi risk analysis"
echo "• 🤖 AI-powered credit scoring"
echo "• 💎 Multi-network blockchain support"
echo "• 🚀 Production-ready deployment"
echo ""
echo "Total: 150+ files showcasing cutting-edge DeFi technology! 🎯"
