# 🟣 SyncStream - Watch Together

A modern, production-ready web application for synchronized video watching with friends. Create rooms, share links, and enjoy YouTube videos together in perfect sync with real-time chat.

[![Deploy to GitHub Pages](https://github.com/yourusername/syncstream/workflows/Deploy%20SyncStream%20to%20GitHub%20Pages/badge.svg)](https://github.com/yourusername/syncstream/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎬 **Synchronized Video Playback** - Everyone watches in perfect sync
- 💬 **Real-time Chat** - Chat with friends while watching
- 🔗 **Easy Sharing** - Just share a link to invite others
- 📱 **Mobile-First Design** - Optimized for all devices
- ♿ **Accessibility** - WCAG 2.1 AA compliant
- 🎯 **Admin Controls** - Video queue management for room creators
- 🔔 **Toast Notifications** - Beautiful, non-intrusive feedback
- 📱 **PWA Support** - Install as a mobile app
- 🎨 **Modern UI** - Glass morphism design with smooth animations

## 🚀 Live Demo

Visit the live application: **[https://yourusername.github.io/syncstream](https://yourusername.github.io/syncstream)**

## 📱 Quick Start

1. **Create a Room**: Paste any YouTube video URL and click "Create Room"
2. **Share the Link**: Copy and share the room link with your friends
3. **Watch Together**: Everyone joins automatically and watches in sync
4. **Chat & Enjoy**: Use the real-time chat while watching

## 🚀 Deployment Options

### GitHub Pages (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/syncstream.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings
   - Scroll to "Pages" section
   - Select "GitHub Actions" as source
   - The workflow will auto-deploy on push

3. **Access your site**: `https://yourusername.github.io/syncstream`

### Vercel (Alternative)

1. **Connect GitHub** to Vercel
2. **Import** your repository
3. **Deploy** automatically on every push
4. **Custom domain** support included

### Netlify (Alternative)

1. **Drag and drop** your folder to Netlify
2. **Or connect** your GitHub repository
3. **Auto-deploy** on every push

---

**Made with ❤️ for better shared experiences**

# 🟣 SyncStream - Premium Watch-Together Platform

A beautiful, responsive web application that lets you watch YouTube videos together with friends in real-time. Built with vanilla HTML, CSS, JavaScript, and powered by Supabase for real-time synchronization.

![SyncStream Preview](https://via.placeholder.com/800x400/667eea/ffffff?text=SyncStream+Preview)

## ✨ Features

- **🎬 Synchronized Video Playback** - Everyone watches in perfect sync
- **💬 Real-time Chat** - Chat with friends while watching
- **🔗 Easy Sharing** - Just share a link to invite others
- **📱 Fully Responsive** - Works beautifully on all devices
- **🎨 Premium Design** - Modern, clean interface with smooth animations
- **⚡ Real-time Updates** - Powered by Supabase real-time subscriptions
- **🎮 Host Controls** - Room creators can control playback for all participants

## 🚀 Quick Start

### Option 1: Test Locally (Without Supabase)
1. Download or clone this repository
2. Open `index.html` in your browser
3. The app will run in demo mode with mock data

### Option 2: Full Setup with Supabase Backend

#### Step 1: Set Up Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to the SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `supabase-schema.sql` into the SQL Editor
4. Run the SQL to create all necessary tables and policies

#### Step 2: Configure the App
1. Open `js/supabase.js`
2. Replace the placeholder values with your Supabase credentials:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

#### Step 3: Test Locally
1. Open `index.html` in your browser
2. Create a room with a YouTube video URL
3. Share the room link with friends to test together

## 🌐 Deployment

### Deploy to GitHub Pages

1. **Create a GitHub Repository**
   ```bash
   # Initialize git repository
   git init
   git add .
   git commit -m "Initial commit"
   
   # Create GitHub repository and push
   git branch -M main
   git remote add origin https://github.com/yourusername/syncstream.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll down to "Pages" section
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

3. **Access Your Live App**
   - Your app will be available at: `https://yourusername.github.io/syncstream/`
   - Wait a few minutes for deployment to complete

### Alternative Deployment Options
- **Netlify**: Drag and drop the project folder to [Netlify](https://netlify.com)
- **Vercel**: Connect your GitHub repository to [Vercel](https://vercel.com)
- **Firebase Hosting**: Use `firebase init` and `firebase deploy`

## 📁 Project Structure

```
syncstream/
├── index.html              # Landing page
├── room.html               # Room page with video player and chat
├── css/
│   └── style.css          # All styling and responsive design
├── js/
│   ├── supabase.js        # Supabase API integration
│   ├── main.js            # Landing page functionality
│   └── room.js            # Room page functionality
├── assets/                 # Images and other assets (empty for now)
├── supabase-schema.sql     # Database schema for Supabase
└── README.md              # This file
```

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Supabase (Database + Real-time subscriptions)
- **Video**: YouTube Iframe API
- **Deployment**: GitHub Pages (or any static hosting)

## 🔧 Configuration

### Environment Variables
No environment variables needed! All configuration is done directly in the JavaScript files.

### Supabase Configuration
Update these values in `js/supabase.js`:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

### YouTube API
The app uses the YouTube Iframe API which loads automatically. No API key required for basic playback.

## 📖 How to Use

### Creating a Room
1. Visit the landing page
2. Paste a YouTube video URL
3. Click "Create Room"
4. Share the generated link with friends

### Joining a Room
1. Click on a shared room link
2. Enter your name
3. Start watching and chatting!

### Host Controls
- The room creator (host) has special controls to sync all participants
- Hosts can play/pause for everyone
- Use the "Sync All" button to synchronize everyone's playback

## 🎨 Customization

### Styling
- Edit `css/style.css` to customize colors, fonts, and layout
- The design uses CSS Grid and Flexbox for responsive layouts
- Color scheme is based on purple gradients (`#667eea` to `#764ba2`)

### Features
- Add new functionality by extending the JavaScript classes
- The code is modular and well-commented for easy modification

## 🐛 Troubleshooting

### Common Issues

**Video won't load:**
- Make sure the YouTube URL is valid and the video is public
- Check browser console for errors

**Real-time features not working:**
- Verify Supabase credentials are correctly configured
- Check that real-time is enabled in your Supabase project
- Ensure RLS policies are properly set up

**Chat messages not appearing:**
- Check browser console for JavaScript errors
- Verify Supabase connection and table policies

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers supported
- Requires JavaScript enabled

## 🔒 Security

### Current Implementation
- Uses Supabase Row Level Security (RLS) with open policies for MVP
- No user authentication required

### Production Recommendations
- Implement user authentication
- Add more restrictive RLS policies
- Add input validation and sanitization
- Set up proper error handling and logging

## 🚧 Future Enhancements

Potential features to add:
- [ ] User authentication and profiles
- [ ] Room passwords/privacy settings
- [ ] Support for other video platforms
- [ ] Video queue functionality
- [ ] Screen sharing capabilities
- [ ] Emoji reactions
- [ ] User avatars
- [ ] Room themes and customization

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 💬 Support

If you have any questions or issues:
1. Check the troubleshooting section above
2. Look for similar issues in the GitHub repository
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the amazing backend platform
- [YouTube Iframe API](https://developers.google.com/youtube/iframe_api_reference) for video playback
- Modern CSS Grid and Flexbox for responsive design

---

**Made with 💜 for bringing people together through shared experiences**

*Happy watching! 🍿*
