# Firebase Configuration

This folder contains Firebase configuration files for the GoPass Bus Tracking System.

## 📁 Folder Structure

```
firebase/
├── database.rules.json         # Production rules (recommended)
├── database.rules.dev.json     # Development rules (testing only)
├── database.rules.secure.json  # Secure rules with authentication
└── README.md                   # This file
```

## 🔥 Database Rules Files

### `database.rules.json` (Production - Recommended)

**Use this for production deployment.**

```json
{
  "rules": {
    "buses": {
      ".read": true,
      "$busId": {
        ".write": true
      }
    }
  }
}
```

**Features:**
- ✅ Public read access to bus tracking data
- ✅ Write access limited to `/buses/$busId` path
- ✅ Prevents unauthorized access to other database paths
- ⚠️ No authentication required (suitable for public tracking)

**Use when:**
- Deploying to production
- Admin dashboard needs to read tracking data
- Passenger apps need to view bus locations
- You want balance between security and functionality

---

### `database.rules.dev.json` (Development Only)

**Use this ONLY for local development and testing.**

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Features:**
- ⚠️ **INSECURE**: Anyone can read/write entire database
- ✅ No restrictions for rapid development
- ✅ Easy debugging and testing

**Use when:**
- Testing locally
- Debugging Firebase connection issues
- Rapid prototyping

**⚠️ WARNING**: Never use in production! This allows anyone to access and modify your entire database.

---

### `database.rules.secure.json` (Future - With Authentication)

**Use this when you implement Firebase Authentication.**

```json
{
  "rules": {
    "buses": {
      ".read": "auth != null",
      "$busId": {
        ".write": "auth != null && (auth.token.role == 'DRIVER' || auth.token.role == 'ADMIN')"
      }
    },
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid == $userId",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

**Features:**
- ✅ Requires Firebase Authentication
- ✅ Role-based access control (DRIVER, ADMIN)
- ✅ Users can only access their own data
- ✅ Most secure option

**Use when:**
- You've implemented Firebase Auth in your apps
- You want role-based permissions
- Maximum security is required

**Prerequisites:**
- Firebase Authentication enabled
- Custom claims set for user roles
- Apps configured to authenticate with Firebase

---

## 🚀 How to Deploy Rules

### Option 1: Firebase Console (Easiest)

1. Go to https://console.firebase.google.com
2. Select project: **mobile-based-bus-ticket**
3. Click **Realtime Database** → **Rules** tab
4. Copy content from the desired rules file
5. Paste into the editor
6. Click **Publish**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy specific rules file
firebase deploy --only database
```

**Note**: The CLI uses `database.rules.json` by default. To use a different file, update `firebase.json`:

```json
{
  "database": {
    "rules": "firebase/database.rules.json"
  }
}
```

---

## 📊 Rules Comparison

| Feature | Production | Development | Secure |
|---------|-----------|-------------|--------|
| Public read | ✅ Buses only | ✅ Everything | ❌ Auth required |
| Public write | ❌ | ✅ Everything | ❌ Auth required |
| Role-based access | ❌ | ❌ | ✅ Yes |
| Authentication | ❌ Not required | ❌ Not required | ✅ Required |
| Production ready | ✅ Yes | ❌ No | ✅ Yes (with auth) |

---

## 🔒 Security Best Practices

1. **Never use `database.rules.dev.json` in production**
2. **Start with `database.rules.json` for production**
3. **Upgrade to `database.rules.secure.json` when implementing auth**
4. **Regularly review Firebase Console for unauthorized access**
5. **Monitor Firebase usage in the console**

---

## 🧪 Testing Rules

Use the **Rules Playground** in Firebase Console:

1. Go to Realtime Database → Rules
2. Click **Rules playground**
3. Test read/write operations
4. Verify permissions work as expected

---

## 📝 Current Deployment

**Active Rules**: `database.rules.dev.json` (Public access)

**Recommended Next Step**: Deploy `database.rules.json` for better security while maintaining functionality.

---

## 🆘 Troubleshooting

### Permission Denied Error

```
Error: permission_denied at /buses
```

**Solution**: 
- Ensure you've published the rules to Firebase Console
- Wait 30 seconds for rules to propagate
- Hard refresh your application (Ctrl+Shift+R)

### Rules Not Updating

**Solution**:
- Clear browser cache
- Wait a few minutes for Firebase to propagate changes
- Check Firebase Console to confirm rules are published
- Try using `database.rules.dev.json` temporarily to test

---

## 📚 Additional Resources

- [Firebase Realtime Database Rules Documentation](https://firebase.google.com/docs/database/security)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Security Rules Best Practices](https://firebase.google.com/docs/database/security/securing-data)
