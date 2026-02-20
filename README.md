# Mafia Night - React Native Mobile App

A modern mobile game application built with React Native, Expo, and Supabase featuring real-time multiplayer Mafia gameplay.

## 🎮 Features

- **Authentication System**
  - Sign up with email/password
  - Secure email verification
  - Username setup for the game
  - Session management

- **Room Management**
  - Create game rooms with customizable player limits
  - Browse available rooms with real-time updates
  - Unique room codes for easy sharing
  - Room status tracking

- **Real-time Chat**
  - In-game messaging system
  - Real-time message synchronization via Supabase
  - Message timestamps
  - Player-to-player communication

- **Player Management**
  - View active players in each room
  - Player status indicators (alive/dead)
  - Username display
  - Role assignment ready (future enhancement)

- **Modern UI**
  - Dark theme with neon green accents
  - Responsive design
  - Smooth animations and transitions
  - Touch-optimized interface

## 🛠️ Prerequisites

- **Node.js** v18 or higher
- **npm** or **bun** package manager
- **Expo CLI**: `npm install -g expo-cli`
- **Supabase Account** (create at https://supabase.com)

## 📦 Installation

### 1. Clone and Navigate to Project

```bash
cd neon-mafia-nights
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Supabase

#### Create Tables in Supabase

Run these SQL commands in your Supabase SQL editor:

```sql
-- Profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- Game rooms table
create table if not exists game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  host_id uuid references auth.users on delete cascade,
  status text default 'waiting',
  max_players integer default 8,
  created_at timestamp default current_timestamp,
  updated_at timestamp default current_timestamp
);

-- Game players table
create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  username text,
  role text,
  is_alive boolean default true,
  joined_at timestamp default current_timestamp,
  unique(room_id, user_id)
);

-- Chat messages table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references game_rooms on delete cascade,
  user_id uuid references auth.users on delete cascade,
  username text,
  message text,
  created_at timestamp default current_timestamp
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table game_rooms enable row level security;
alter table game_players enable row level security;
alter table chat_messages enable row level security;

-- RLS Policies
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

create policy "Anyone can view game rooms" on game_rooms
  for select using (true);

create policy "Authenticated users can create rooms" on game_rooms
  for insert with check (auth.uid() = host_id);

create policy "Host can update their room" on game_rooms
  for update using (auth.uid() = host_id);

create policy "Host can delete their room" on game_rooms
  for delete using (auth.uid() = host_id);

create policy "Anyone can view players in a room" on game_players
  for select using (true);

create policy "Users can join rooms" on game_players
  for insert with check (auth.uid() = user_id);

create policy "Users can leave rooms" on game_players
  for delete using (auth.uid() = user_id);

create policy "Anyone can view chat" on chat_messages
  for select using (true);

create policy "Authenticated users can send messages" on chat_messages
  for insert with check (auth.uid() = user_id);
```

### 4. Create Environment File

Create `.env.local` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project settings > API.

### 5. Start Development Server

```bash
npm start
# or
bun start
```

### 6. Run on Device/Emulator

- **iOS**: Press `i` in the terminal
- **Android**: Press `a` in the terminal
- **Web**: Press `w` in the terminal

## 📁 Project Structure

```
neon-mafia-nights/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout
│   ├── (auth)/                  # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── verify-email.tsx
│   │   └── set-username.tsx
│   └── (game)/                  # Game screens
│       ├── _layout.tsx
│       ├── home.tsx             # Room browser
│       ├── create-room.tsx      # Room creation
│       └── [roomId].tsx         # Game room screen
│
├── src/
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client setup
│   │       └── queries.ts       # Database query functions
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useRooms.ts
│   │   ├── usePlayers.ts
│   │   └── useChat.ts
│   │
│   ├── lib/
│   │   └── helpers.ts           # Utility functions
│   │
│   ├── store/
│   │   └── gameStore.ts         # Zustand state management
│   │
│   └── components/              # Reusable UI components
│       ├── PlayerListItem.tsx
│       ├── ChatMessage.tsx
│       └── RoomCard.tsx
│
├── assets/                       # App icons and images
├── babel.config.js              # Babel configuration
├── tsconfig.json                # TypeScript configuration
├── app.json                      # Expo configuration
├── package.json                 # Dependencies
├── .env.local                   # Environment variables
└── README.md                     # This file
```

## 🎯 Screens Overview

### Authentication Flow

1. **Login Screen** - Sign in with email/password
2. **Register Screen** - Create new account
3. **Email Verification** - Verify email address
4. **Set Username** - Set display name for the game

### Game Flow

1. **Home Screen** - Browse and create rooms
2. **Create Room Modal** - Set up new game room
3. **Game Room Screen** - Main gameplay with chat and players

## 🔄 Real-time Features

The app uses Supabase's real-time capabilities:

- **Player Updates**: Real-time player list synchronization
- **Chat Messages**: Instant message delivery
- **Room Status**: Live room availability updates

## 🚀 Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

### Web

```bash
npm run build
```

## 🧪 Development Commands

```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web

# Clear cache and rebuild
npm start -- --clear

# Run tests (when implemented)
npm test
```

## 🔑 Environment Variables

Required:
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 🎨 Design System

The app uses a dark theme with neon green accents:

- **Primary Colors**:
  - Background: `#1a1a2e`
  - Accent: `#00ff00` (Neon Green)
  - Dark: `#0f0f1e`

- **Text Colors**:
  - Primary: `#ffffff`
  - Secondary: `#aaaaaa`
  - Accent: `#00ff00`

## 📚 Key Technologies

- **React Native** - Mobile framework
- **Expo** - React Native development platform
- **Expo Router** - Navigation and routing
- **TypeScript** - Type safety
- **Supabase** - Backend and real-time database
- **Zustand** - State management
- **Lucide Icons** - Icon library

## 🐛 Troubleshooting

### Metro Bundler Issues

```bash
npm start -- --clear
```

### Cache Problems

```bash
npm start -- -c
```

### Reset Expo Cache

```bash
expo start -c --reset-cache
```

### Supabase Connection Issues

1. Verify `.env.local` has correct credentials
2. Check Supabase project is active
3. Ensure Row Level Security policies are configured
4. Test API keys in Supabase dashboard

## 🔮 Future Enhancements

- [ ] Voice chat integration
- [ ] Push notifications
- [ ] Offline mode support
- [ ] Game state management (voting, elimination)
- [ ] Player profiles and statistics
- [ ] Achievements and badges
- [ ] Matchmaking system
- [ ] Leaderboards
- [ ] Dark/Light theme toggle
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] In-app currency/rewards system

## 📝 API Reference

### Authentication

```typescript
auth.signUp(email, password)
auth.signIn(email, password)
auth.signOut()
auth.getSession()
```

### User Profiles

```typescript
profiles.getProfile(userId)
profiles.updateProfile(userId, updates)
```

### Game Rooms

```typescript
rooms.getRooms()
rooms.getRoom(roomId)
rooms.createRoom(hostId, name, code, maxPlayers)
rooms.updateRoomStatus(roomId, status)
rooms.deleteRoom(roomId)
```

### Players

```typescript
players.getPlayers(roomId)
players.joinRoom(roomId, userId, username)
players.leaveRoom(roomId, userId)
players.updatePlayer(roomId, userId, updates)
```

### Chat

```typescript
chat.getMessages(roomId, limit)
chat.sendMessage(roomId, userId, username, message)
```

## 📄 License

This project is part of the Mafia Night game series. See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review Supabase docs at https://supabase.com/docs

## 🎉 Getting Started Checklist

- [ ] Install Node.js and npm
- [ ] Install Expo CLI globally
- [ ] Clone repository
- [ ] Create Supabase account
- [ ] Run Supabase SQL setup scripts
- [ ] Create `.env.local` with credentials
- [ ] Run `npm install`
- [ ] Run `npm start`
- [ ] Test on iOS/Android/Web
- [ ] Deploy to Expo

---

**Happy Gaming! 🎮✨**
