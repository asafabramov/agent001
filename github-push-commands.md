# GitHub Push Commands for Hebrew Chatbot v0.0.1

## After creating your GitHub repository, run these commands:

```bash
# Add your GitHub repository as remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Verify remote was added
git remote -v

# Push main branch to GitHub
git push -u origin main

# Push the version tag
git push origin v0.0.1
```

## Example with actual repository:
```bash
# If your GitHub username is "asafabramov" and repo is "hebrew-chatbot"
git remote add origin https://github.com/asafabramov/hebrew-chatbot.git
git push -u origin main
git push origin v0.0.1
```

## Verify Success:
After pushing, you should see:
- ✅ Main branch with all 39 files
- ✅ Release tag v0.0.1 
- ✅ Complete commit history
- ✅ README.md displayed on GitHub homepage