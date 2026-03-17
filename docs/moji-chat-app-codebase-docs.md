# Moji Chat App — Codebase Documentation

---

## Project Overview

**Moji** is a Vietnamese-language real-time chat application supporting one-on-one (direct) and group conversations.
It is a full-stack monorepo split into two independent packages:

|            | Backend                         | Frontend                              |
| ---------- | ------------------------------- | ------------------------------------- |
| Language   | JavaScript (ES Modules)         | TypeScript                            |
| Framework  | Express 5                       | React 19 + Vite 7                     |
| Real-time  | Socket.IO 4 (server)            | socket.io-client 4                    |
| Database   | MongoDB (Mongoose 8)            | —                                     |
| Auth       | JWT (access) + crypto (refresh) | Zustand store + Axios interceptors    |
| File store | Cloudinary (signed upload)      | —                                     |
| State      | —                               | Zustand 5 (with `persist` middleware) |
| Styling    | —                               | Tailwind CSS 4 + shadcn/ui (Radix)   |

---

## Technology Stack

### Backend

| Technology    | Version | Purpose                          |
| ------------- | ------- | -------------------------------- |
| Node.js       | —       | Runtime                          |
| Express       | 5.1     | HTTP framework                   |
| Mongoose      | 8.19    | MongoDB ODM                      |
| Socket.IO     | 4.8     | WebSocket server                 |
| jsonwebtoken  | 9.0     | JWT access tokens                |
| bcrypt        | 6.0     | Password hashing                 |
| Cloudinary    | 2.8     | Image/video storage              |
| cookie-parser | 1.4     | HTTP cookie parsing              |
| cors          | 2.8     | Cross-origin resource sharing    |
| dotenv        | 17.2    | Environment variable management  |
| nodemon       | 3.1     | Development hot-reload (dev dep) |

### Frontend

| Technology          | Version | Purpose                   |
| ------------------- | ------- | ------------------------- |
| React               | 19.2    | UI library                |
| Vite                | 7.2     | Build tool & dev server   |
| TypeScript          | 5.9     | Type safety               |
| Zustand             | 5.0     | State management          |
| Tailwind CSS        | 4.1     | Utility-first styling     |
| socket.io-client    | 4.8     | WebSocket client          |
| Axios               | 1.13    | HTTP client               |
| React Router        | 7.9     | Client-side routing       |
| Radix UI            | —       | Headless UI primitives    |
| react-hook-form     | 7.66    | Form handling             |
| Zod                 | 4.1     | Schema validation         |
| embla-carousel      | 8.6     | Carousel for media viewer |
| emoji-picker-react  | 4.16    | Emoji picker              |
| react-dropzone      | 14.3    | Drag & drop file upload   |
| dayjs               | 1.11    | Date formatting           |
| sonner              | 2.0     | Toast notifications       |
| lucide-react        | 0.554   | Icon library              |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌──────────┐   ┌──────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ React UI │─▶│ Zustand  │─▶│ Axios       │  │ Socket.IO   │  │
│  │ (pages,  │   │ Stores   │  │ (REST API)  │  │ Client      │  │
│  │ comps)   │   │(4 stores)│  │             │  │             │  │
│  └──────────┘   └──────────┘  └──────┬──────┘  └──────┬──────┘  │
└──────────────────────────────────────┼────────────────┼─────────┘
                                       │ HTTP           │ WS
┌──────────────────────────────────────┼────────────────┼─────────┐
│                      Server (Node.js)│                │         │
│  ┌──────────┐   ┌───────────┐   ┌────┴───────┐  ┌─────┴──────┐  │
│  │ Routes   │─▶│Controllers │─▶│ Models     │  │ Socket.IO  │  │
│  │ (6 files)│   │ (6 files) │   │ (Mongoose) │  │ Server     │  │
│  └──────────┘   └─────┬─────┘   └─────┬──────┘  └────────────┘  │
│                       │               │                         │
│  ┌──────────┐  ┌──────┴─────┐   ┌─────┴──────┐                  │
│  │Middleware│  │  Helpers   │   │ MongoDB    │                  │
│  │ (3 files)│  │ (5 files)  │   │            │                  │
│  └──────────┘  └────────────┘   └────────────┘                  │
│                                                                 │
│  ┌────────────┐                                                 │
│  │ Cloudinary │  (external file storage)                        │
│  └────────────┘                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture layers

1. **Presentation** — React components, pages, UI primitives (shadcn/ui)
2. **State** — Zustand stores (`useAuthStore`, `useChatStore`, `useSocketStore`, `useThemeStore`)
3. **Service** — Axios-based service modules (`authService`, `chatService`, `userService`, `fileService`, `friendService`)
4. **API** — Express routes + controller functions (6 route groups)
5. **Business logic** — Helper/utility modules (`messageHelper`, `conversationHelper`, `socketHelper`, `uploadFileHelper`)
6. **Data** — Mongoose models (8 schemas) backed by MongoDB
7. **Real-time** — Socket.IO bidirectional events layered on top of HTTP server

---

## Codebase Map

### Folder Structure

```
Moji/
├── Backend/
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── index.js                          # Express app bootstrap & route mounting
│       ├── libs/
│       │   └── db.js                         # MongoDB connection (Mongoose)
│       ├── socket/
│       │   └── index.js                      # Socket.IO server, onlineUsers, room management
│       ├── routes/
│       │   ├── authRoute.js                  # /api/auth/*
│       │   ├── userRoute.js                  # /api/user/*
│       │   ├── friendRoute.js                # /api/friend/*
│       │   ├── messageRoute.js               # /api/message/*
│       │   ├── conversationRoute.js          # /api/conversations/*
│       │   └── fileRoute.js                  # /api/file/*
│       ├── controllers/
│       │   ├── authController.js             # Sign-up, sign-in, sign-out, refresh
│       │   ├── userController.js             # Profile, search, not-friends
│       │   ├── friendController.js           # Friend requests, accept/decline, list
│       │   ├── messageController.js          # Send direct & group messages
│       │   ├── conversationController.js     # CRUD conversations, participants, seen
│       │   └── fileController.js             # Cloudinary signatures, media gallery APIs
│       ├── models/
│       │   ├── User.js                       # User account & profile
│       │   ├── Conversation.js               # Direct/group conversations
│       │   ├── Message.js                    # Chat messages
│       │   ├── Friend.js                     # Friendship pairs
│       │   ├── FriendRequest.js              # Pending friend requests
│       │   ├── Session.js                    # Refresh token sessions (TTL index)
│       │   ├── Attachment.js                 # Media attachments (image/video)
│       │   └── ConversationStats.js          # Per-user message count per conversation
│       ├── middlewares/
│       │   ├── authMiddleware.js             # JWT verification for HTTP routes
│       │   ├── friendMiddleware.js           # Friendship & group membership checks
│       │   └── socketMiddleware.js           # JWT verification for Socket.IO
│       └── utils/
│           ├── Utils.js                      # String normalization (Vietnamese)
│           ├── uploadFileHelper.js           # Cloudinary config, signature generation
│           ├── socketHelper.js               # Socket event handler: onSeenMessage
│           ├── conversationHelper.js         # convertConversation transform
│           └── messageHelper.js              # Post-message-create: update conv & emit
│
├── Frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── .env.development / .env.production
│   └── src/
│       ├── main.tsx                          # React root render
│       ├── App.tsx                           # Router (BrowserRouter + Routes)
│       ├── index.css                         # Root CSS imports
│       ├── lib/
│       │   ├── axios.ts                      # Axios instance + interceptors (token refresh)
│       │   ├── utils.ts                      # Helpers: cn, fromNow, debounce, mergeById, etc.
│       │   └── refreshManager.ts             # Singleton token refresh controller
│       ├── services/
│       │   ├── authService.ts                # Auth API calls
│       │   ├── chatService.ts                # Conversation & message API calls
│       │   ├── userService.ts                # User profile & search API calls
│       │   ├── fileService.ts                # Cloudinary upload + media gallery API calls
│       │   └── friendService.ts              # Friend API calls
│       ├── stores/
│       │   ├── useAuthStore.ts               # Auth state (user, accessToken, signIn/Out)
│       │   ├── useChatStore.ts               # Chat state (conversations, messages, medias)
│       │   ├── useSocketStore.ts             # Socket.IO state (connection, onlineUsers)
│       │   └── useThemeStore.ts              # Dark/light theme
│       ├── hooks/
│       │   ├── use-chat-scroll.ts            # Chat scroll + infinite load-more
│       │   └── use-mobile.ts                 # Mobile breakpoint detection (768px)
│       ├── types/
│       │   ├── chat.ts                       # Message, Conversation, Media types
│       │   ├── user.ts                       # User, Friend, FriendRequest types
│       │   └── store.ts                      # Store state & request types
│       ├── pages/
│       │   ├── ChatAppPage.tsx               # Main chat page (SidebarProvider layout)
│       │   └── auth/
│       │       ├── SignInPage.tsx             # Sign-in page
│       │       └── SignUpPage.tsx             # Sign-up page
│       ├── components/
│       │   ├── auth/
│       │   │   ├── signin-form.tsx           # Sign-in form (Zod + react-hook-form)
│       │   │   ├── signup-form.tsx           # Sign-up form
│       │   │   └── ProtectedRoute.tsx        # Auth guard + socket init
│       │   ├── chat/
│       │   │   ├── chat-window-layout.tsx    # Main chat layout (header + content + footer)
│       │   │   ├── chat-window-header.tsx    # Conversation header (avatar, name, status)
│       │   │   ├── chat-window-inset.tsx     # Message list + scroll management
│       │   │   ├── chat-window-footer.tsx    # Input, emoji, media upload, send
│       │   │   ├── chat-welcome.tsx          # Welcome screen (no conversation)
│       │   │   ├── chat-empty-message-welcome.tsx # Empty conversation prompt
│       │   │   ├── message.tsx               # OtherMessage, OwnerMessage, MediaView
│       │   │   ├── chat-insert-skeleton.tsx  # Loading skeleton
│       │   │   └── chat-card-skeleton.tsx    # Card skeleton
│       │   ├── left-sidebar/
│       │   │   ├── app-sidebar.tsx           # Left sidebar container
│       │   │   ├── chat-list.tsx             # Conversation list
│       │   │   ├── chat-card.tsx             # Conversation card + search card
│       │   │   ├── sidebar-header.tsx        # Search, add friend, add chat buttons
│       │   │   └── nav-user.tsx              # User menu, theme toggle, profile
│       │   ├── right-sidebar/
│       │   │   ├── right-sidebar.tsx         # Conversation info, media, participants
│       │   │   └── participant-management.tsx # Group member management
│       │   ├── dialogs/
│       │   │   ├── add-friend-dialog.tsx     # Add friend dialog
│       │   │   ├── add-chat-dialog.tsx       # New conversation dialog
│       │   │   ├── friends-dialog.tsx        # Friends list + requests
│       │   │   └── others-profile-dialog.tsx # Other user profile view
│       │   ├── gallery/
│       │   │   ├── sidebar-gallery.tsx       # Media grid in right sidebar
│       │   │   ├── media-gallery.tsx         # Full-screen media gallery dialog
│       │   │   └── carousel.tsx              # Embla carousel with thumbnails
│       │   ├── profile/
│       │   │   ├── profile-dialog.tsx        # Own profile dialog
│       │   │   ├── profile-card.tsx          # Profile card components
│       │   │   └── profile-form.tsx          # Edit profile & avatar forms
│       │   ├── avatars/
│       │   │   ├── avatar.tsx                # Avatar, OnlineAvatar, SeenAvatars
│       │   │   └── group-avatar.tsx          # Group conversation avatar
│       │   ├── ui/                           # shadcn/ui primitives (Radix-based)
│       │   │   ├── button.tsx, input.tsx, card.tsx, dialog.tsx, ...
│       │   │   ├── emoji-picker.tsx          # Emoji picker wrapper
│       │   │   ├── video.tsx                 # Video player component
│       │   │   └── shadcn-io/dropzone/       # File dropzone components
│       │   ├── toggle-theme.tsx              # Theme toggle button
│       │   ├── wave-card.tsx                 # Decorative wave card
│       │   └── progress-10.tsx               # Circular progress indicator
│       └── styles/
│           ├── style-index.css               # Aggregated styles
│           ├── variables.css                 # CSS custom properties
│           ├── colors.css                    # Color palette
│           ├── components.css                # Component-level styles
│           ├── loading.css                   # Loading animations
│           ├── scroll-bar.css                # Scrollbar styling
│           └── animation.css                 # CSS animations
```

### Major Modules

| Module              | Location                | Responsibility                                                             |
| ------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Authentication      | BE `auth*`, FE `auth/`  | Sign-up, sign-in, sign-out, JWT + refresh token                           |
| Conversations       | BE `conversation*`      | Create/list/search conversations, manage participants                      |
| Messaging           | BE `message*`, FE chat/ | Send/receive direct & group messages, message rendering                    |
| Real-time (Socket)  | BE `socket/`, FE stores | Online status, live message delivery, seen tracking                        |
| Friends             | BE `friend*`, FE dialog | Friend requests, accept/decline, friend list                              |
| Media & Files       | BE `file*`, FE gallery/ | Cloudinary uploads, media gallery with cursor-based pagination             |
| User Profile        | BE `user*`, FE profile/ | Profile CRUD, avatar/background upload                                     |
| State Management    | FE `stores/`            | 4 Zustand stores: auth, chat, socket, theme                               |

### Important Files

| File                                             | Why it matters                                                  |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `Backend/src/index.js`                           | App bootstrap, route mounting, DB connection                    |
| `Backend/src/socket/index.js`                    | Socket.IO server, `onlineUsers` map, room joins                |
| `Backend/src/utils/messageHelper.js`             | Core post-message logic: update conversation + emit to rooms    |
| `Backend/src/controllers/messageController.js`   | Message creation with transactions, attachments                 |
| `Backend/src/controllers/fileController.js`      | Media gallery APIs with cursor-based pagination                 |
| `Frontend/src/stores/useChatStore.ts`            | Largest store — conversations, messages, medias, socket handlers|
| `Frontend/src/lib/axios.ts`                      | Axios instance with 401 interceptor for silent token refresh    |
| `Frontend/src/components/auth/ProtectedRoute.tsx`| Auth guard, token restore, socket initialization                |

---

## Application Entry Points

### Backend

| Entry point                   | File                              | Description                                                 |
| ----------------------------- | --------------------------------- | ----------------------------------------------------------- |
| HTTP server start             | `Backend/src/index.js`            | Connects MongoDB, mounts routes, listens on `PORT` (5000)   |
| Socket.IO server              | `Backend/src/socket/index.js`     | Created alongside HTTP server, exported as `io`             |
| REST API routes               | `Backend/src/routes/*.js`         | 6 route files mounted under `/api/`                         |
| Auth (public)                 | `POST /api/auth/*`                | No middleware — signup, signin, signout, refresh-token       |
| Protected routes              | `/api/user, /file, /friend, ...`  | `protectedRoute` middleware validates JWT                    |

### Frontend

| Entry point                   | File                                              | Description                                      |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| React root                    | `Frontend/src/main.tsx`                           | `createRoot` → `<App />`                          |
| Router                        | `Frontend/src/App.tsx`                            | `BrowserRouter` with 3 routes                     |
| Auth pages                    | `/signin`, `/signup`                              | Public routes                                     |
| Main app                      | `/` → `ProtectedRoute` → `ChatAppPage`           | Protected route, initializes socket               |
| Socket initialization         | `Frontend/src/components/auth/ProtectedRoute.tsx` | Calls `connectSocket()` when `accessToken` exists |

### Frontend Routes

| Path      | Component        | Auth required |
| --------- | ---------------- | ------------- |
| `/signin` | `SignInPage`     | No            |
| `/signup` | `SignUpPage`     | No            |
| `/`       | `ChatAppPage`    | Yes           |

---

## API Endpoints

### Auth — `/api/auth` (public)

| Method | Path             | Handler              | Description                        |
| ------ | ---------------- | -------------------- | ---------------------------------- |
| POST   | `/signup`        | `signUpHandler`      | Create new user account            |
| POST   | `/signin`        | `signInhandler`      | Authenticate, return tokens        |
| POST   | `/signout`       | `signOutHandler`     | Invalidate session, clear cookie   |
| POST   | `/refresh-token` | `refreshTokenHander` | Exchange refresh cookie for access |

### User — `/api/user` (protected)

| Method | Path              | Handler              | Description              |
| ------ | ----------------- | -------------------- | ------------------------ |
| GET    | `/profile`        | `getProfileHandler`  | Get current user profile |
| PUT    | `/profile/update` | `updateProfile`      | Update profile           |
| GET    | `/`               | `findUserHandler`    | Search users             |
| GET    | `/not-friend`     | `getNotFriendsHandler` | Users not yet friends  |
| GET    | `/:userId`        | `getUser`            | Get user by ID           |

### Friend — `/api/friend` (protected)

| Method | Path                          | Handler                       | Description            |
| ------ | ----------------------------- | ----------------------------- | ---------------------- |
| POST   | `/request`                    | `addFriendHandler`            | Send friend request    |
| POST   | `/request/:requestId/accept`  | `acceptFriendRequestHandler`  | Accept request         |
| POST   | `/request/:requestId/decline` | `deleteFriendRequestHandler`  | Decline request        |
| GET    | `/`                           | `getFriendsHandler`           | List friends           |
| GET    | `/request`                    | `getFriendRequestsHandler`    | List pending requests  |
| DELETE | `/:friendId`                  | `unFriendsHandler`            | Remove friend          |

### Message — `/api/message` (protected)

| Method | Path      | Handler              | Middleware             | Description         |
| ------ | --------- | -------------------- | ---------------------- | ------------------- |
| POST   | `/direct` | `sendDirectMessage`  | —                      | Send direct message |
| POST   | `/group`  | `senGroupMessage`    | `checkGroupMembership` | Send group message  |

### Conversation — `/api/conversations` (protected)

| Method | Path                                       | Handler                     | Description                |
| ------ | ------------------------------------------ | --------------------------- | -------------------------- |
| POST   | `/`                                        | `createConversation`        | Create conversation        |
| GET    | `/`                                        | `getConversations`          | List user's conversations  |
| GET    | `/search`                                  | `getConversationsByKeyword` | Search conversations       |
| GET    | `/:conversationId`                         | `getMessages`               | Get messages (paginated)   |
| DELETE | `/:conversationId/participant/delete`      | `deleteParticipant`         | Leave conversation         |
| POST   | `/:conversationId/participant/add`         | `addParticipant`            | Add single participant     |
| POST   | `/:conversationId/participant/add-multiples` | `addParticipants`         | Add multiple participants  |

### File — `/api/file` (protected)

| Method | Path                                           | Handler                           | Description                            |
| ------ | ---------------------------------------------- | --------------------------------- | -------------------------------------- |
| GET    | `/signature/avatar`                            | `getAvatarSignature`              | Cloudinary signature for avatar        |
| GET    | `/signature/bg`                                | `getBgSignature`                  | Cloudinary signature for background    |
| GET    | `/signature/media`                             | `getMediaSignature`               | Cloudinary signature for media         |
| GET    | `/media/direction/conversation/:conversationId`| `getConversationMediasByDirection` | Cursor-based prev/next media           |
| GET    | `/media/start-end/conversation/:conversationId`| `getMediasGalleryByStartEnd`      | Media range query for gallery          |
| GET    | `/media/conversation/:conversationId`          | `getConversationMedias`           | Initial media load (newest first)      |
| GET    | `/media/:mediaId`                              | `getMediasGalleryById`            | Gallery centered on a specific media   |
| DELETE | `/delete`                                      | `deleteFile`                      | Delete file from Cloudinary            |

---

## Chat Message Flow

### Direct Message: End-to-End

```
User types message & selects media
        │
        ▼
┌─ chat-window-footer.tsx ─────────────────────┐
│ handleSendMessage()                          │
│  • Checks isSendable (text or media ready)   │
│  • Resolves friend._id for direct chat       │
│  • Calls store.sendDirectMessage()           │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ useChatStore.ts ────────────────────────────┐
│ sendDirectMessage(convId, recipientId,       │
│                   content, media)            │
│  • Calls chatService.sendDirectMessage()     │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ chatService.ts ─────────────────────────────┐
│ POST /api/message/direct                     │
│ Body: { conversationId, recipientId,         │
│         content, media }                     │
└───────────────┬──────────────────────────────┘
                │  HTTP (Bearer token)
                ▼
┌─ messageController.js ───────────────────────┐
│ sendDirectMessage(req, res)                  │
│  1. Start Mongoose transaction               │
│  2. Validate content or media                │
│  3. Resolve conversation                     │
│  4. Create Message document                  │
│  5. Create Attachment documents (if media)   │
│  6. Update ConversationStats                 │
│  7. Commit transaction                       │
│  8. Populate mediaIds on message             │
│  9. Build newMessage (medias instead of IDs) │
│ 10. updateConversationAfterCreateMessage()   │
│ 11. emmitNewMessage(io, conv, msg, user)     │
│ 12. res.status(201).json({ message })        │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ messageHelper.js ───────────────────────────┐
│ updateConversationAfterCreateMessage()       │
│  • Sets lastMessage, lastMessageAt           │
│  • Updates unreadCounts (+1 for others)      │
│                                              │
│ emmitNewMessage(io, conv, msg, sender)       │
│  • io.to(conv._id).emit("new-message", {     │
│      message, conversation                   │
│    })                                        │
└───────────────┬──────────────────────────────┘
                │  Socket.IO (to conversation room)
                ▼
┌─ useSocketStore.ts → useChatStore.ts ────────┐
│ socket.on("new-message", onNewMessage)       │
│                                              │
│ onNewMessage(data):                          │
│  • Merge conversation (reorder to top)       │
│  • Append message to messages[conv._id]      │
│  • Set isOwner flag                          │
│  • Append medias to medias[conv._id]         │
│  • Update activeConversation if active       │
└──────────────────────────────────────────────┘
```

### Group Message

Same flow, except:
- Calls `store.sendGroupMessage()` → `POST /api/message/group`
- Route uses `checkGroupMembership` middleware
- Handler: `senGroupMessage` in `messageController.js`

---

## Authentication Flow

### Sign-in

```
User submits credentials
        │
        ▼
┌─ signin-form.tsx ────────────────────────────┐
│ Zod validation → signIn(username, password)  │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ useAuthStore.ts ────────────────────────────┐
│ signIn():                                    │
│  • clearState() + chatStore.reset()          │
│  • authService.signIn(username, password)    │
│  • set({ accessToken, user })                │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ authService.ts ─────────────────────────────┐
│ POST /api/auth/signin                        │
│ { username, password }                       │
│ withCredentials: true, skipAuth: true        │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ authController.js ──────────────────────────┐
│ signInhandler():                             │
│  1. Find user by username                    │
│  2. bcrypt.compare password                  │
│  3. JWT access token (30 min TTL)            │
│  4. Crypto refresh token (64-byte hex)       │
│  5. Store Session (14 days TTL)              │
│  6. Set HttpOnly cookie (refreshToken)       │
│  7. Return { accessToken, user }             │
└──────────────────────────────────────────────┘
```

### Token management

| Token         | Storage                       | TTL     | Transport                             |
| ------------- | ----------------------------- | ------- | ------------------------------------- |
| Access token  | Zustand `useAuthStore`        | 30 min  | `Authorization: Bearer` header        |
| Refresh token | HttpOnly cookie + MongoDB     | 14 days | Automatically sent via `withCredentials` |

### Silent token refresh (on 401)

```
API call returns 401
        │
        ▼
┌─ axios.ts response interceptor ───────────────┐
│  • Check !originalRequest._retry              │
│  • Skip if skipAuth                           │
│  • Queue concurrent requests                  │
│  • refreshManager.getValidAccessToken()       │
│    └→ POST /api/auth/refresh-token (cookie)   │
│  • Update store + retry queued requests       │
│  • On failure: clearState → redirect /signin  │
└───────────────────────────────────────────────┘
```

### Protected route guard

`ProtectedRoute.tsx`:
1. If no `accessToken` → attempt `refreshToken()`
2. If `accessToken` but no `user` → `getProfile()`
3. If `accessToken` present → `connectSocket()`
4. If still no `accessToken` → redirect to `/signin`

---

## Real-time Communication

### Socket.IO connection lifecycle

```
ProtectedRoute mounts
        │
        ▼
┌─ useSocketStore.ts ──────────────────────────┐
│ connectSocket():                             │
│  • Guard: skip if socket exists or no token  │
│  • io(SOCKET_URL, { auth: { token } })       │
│  • Register event listeners                  │
│  • On unmount: disconnectSocket()            │
└───────────────┬──────────────────────────────┘
                │ WS handshake
                ▼
┌─ socketMiddleware.js ────────────────────────┐
│  • Extract token from handshake.auth         │
│  • jwt.verify → load User                    │
│  • Set socket.user                           │
│  • Error: "NO_TOKEN" or "AUTH_ERROR"         │
└───────────────┬──────────────────────────────┘
                │
                ▼
┌─ socket/index.js (on "connection") ──────────┐
│  1. Guard: disconnect if no user             │
│  2. Add to onlineUsers[userId] Set           │
│  3. Emit "online-user" to all                │
│  4. Join all conversation rooms              │
│  5. Register "seen-message-request" handler  │
│  6. On "disconnect": remove from set, emit   │
└──────────────────────────────────────────────┘
```

### Socket events

| Event                   | Direction        | Payload                                                         | Purpose                         |
| ----------------------- | ---------------- | --------------------------------------------------------------- | ------------------------------- |
| `online-user`           | Server → Client  | `string[]` (online user IDs)                                    | Update online status            |
| `new-message`           | Server → Client  | `{ message, conversation }`                                     | Deliver new message             |
| `seen-message-request`  | Client → Server  | `{ conversationId, lastSeenAt }`                                | Mark messages as seen           |
| `seen-message-updated`  | Server → Client  | `{ conversationId, lastSeenAt, user, messageId, unreadCounts }` | Broadcast seen status           |
| `updated-user`          | Server → Client  | `User` object                                                   | Profile update broadcast        |
| `connect_error`         | Client internal  | `Error`                                                         | Auth failure → refresh token    |

### `onlineUsers` structure

```javascript
// Backend: Map<userId, Set<socketId>>
// Supports multiple browser tabs / devices per user
onlineUsers.set(userId, new Set([socketId1, socketId2]));
```

### Seen message flow

1. **Client** — `useChatStore.seenMessage()` emits `"seen-message-request"` with `{ conversationId, lastSeenAt }` when user scrolls to bottom and there are unread messages
2. **Server** — `socketHelper.onSeenMessage` → `conversationController.updateSeenBy`:
   - Updates `Conversation.seenBy` and sets `unreadCounts[userId] = 0`
   - Emits `"seen-message-updated"` to the conversation room
3. **Client** — `useChatStore.onSeenMessage(data)` updates `seenBy` and `unreadCounts` in the local conversation

---

## Database Layer

### Models and relationships

```
┌──────────┐     ┌───────────────┐     ┌──────────┐
│  User    │────▶│ Conversation  │◀───│ Message  │
│          │     │  .participants│     │ .senderId│
│          │     │  .lastMessage │     │ .convId  │
└──────────┘     └───────────────┘     └────┬─────┘
     │                                      │
     │           ┌───────────────┐          │
     │           │  Attachment   │◀─────────┘
     │           │  .messageId   │   (.mediaIds)
     │           │  .senderId    │
     │           │  .convId      │
     │           └───────────────┘
     │
     ├──────────▶┌───────────────┐
     │           │   Friend      │
     │           │  .user .friend│
     │           └───────────────┘
     │
     ├──────────▶┌───────────────┐
     │           │ FriendRequest │
     │           │ .fromUser     │
     │           │ .toUser       │
     │           └───────────────┘
     │
     ├──────────▶┌───────────────┐
     │           │   Session     │
     │           │  .userId      │
     │           │  .refreshToken│
     │           │  .expiresAt   │  (TTL index)
     │           └───────────────┘
     │
     └──────────▶┌───────────────────┐
                 │ ConversationStats │
                 │ .conversationId   │
                 │ .userId           │
                 │ .messageCount     │
                 └───────────────────┘
```

### Schema details

| Model              | Key fields                                                                     | Indexes                                         |
| ------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| **User**            | `username`, `hashPassword`, `email`, `displayName`, `searchName`, `avtUrl`    | —                                                |
| **Conversation**    | `type` (direct/group), `participants[]`, `group{}`, `lastMessage`, `seenBy`   | `participants.userId`, `lastMessageAt`           |
| **Message**         | `conversationId`, `senderId`, `type` (text/media/mixed/system), `mediaIds[]`  | `conversationId`, `createdAt`                    |
| **Attachment**      | `conversationId`, `messageId`, `senderId`, `type` (image/video), `url`, `meta`| `(conversationId, messageId, senderId, createdAt)` |
| **Friend**          | `user`, `friend` (auto-sorted so `user < friend`)                            | Unique `(user, friend)`                          |
| **FriendRequest**   | `fromUser`, `toUser`                                                          | `(fromUser, toUser)`, `fromUser`, `toUser`       |
| **Session**         | `userId`, `refreshToken`, `expiresAt`                                         | TTL index on `expiresAt`                         |
| **ConversationStats** | `conversationId`, `userId`, `messageCount`, `lastMessageAt`                 | Unique `(conversationId, userId)`                |

### Conversation types

- **Direct** (`type: "direct"`) — exactly 2 participants, no group name
- **Group** (`type: "group"`) — N participants with roles (ADMIN, MEMBER), group name and avatar

### Participant structure

```javascript
{
  userId: ObjectId,
  role: "ADMIN" | "MEMBER",
  status: "ACTIVE" | "LEFT",
  joinedAt: Date,
  addedBy: ObjectId
}
```

---

## Media Gallery

### Cursor-based pagination design

The media gallery uses **external cursor** pagination — the cursor returned by each API is a document that is NOT included in the current result set but represents the next/previous boundary.

### API flow

| API                                 | Purpose                                    | Sort                      | Cursor returned          |
| ----------------------------------- | ------------------------------------------ | ------------------------- | ------------------------ |
| `getConversationMedias`             | Initial load (newest first)                | `createdAt: -1, _id: -1`  | `prevCursor { _id, createdAt }` |
| `getConversationMediasByDirection`  | Load older/newer from a cursor             | Depends on `direction`     | `nextCursor` or `prevCursor`    |
| `getMediasGalleryById`             | Load around a specific media (gallery open)| Both directions            | `nextCursor` + `prevCursor`     |
| `getMediasGalleryByStartEnd`       | Load range between two media IDs           | `createdAt: 1, _id: 1`    | `nextCursor` + `prevCursor`     |

### Frontend gallery components

1. **SidebarGallery** — media grid in right sidebar; loads via `getConvMedias`, paginates on scroll via `getMedias(direction: 'prev')`
2. **MediaGalleryDialog** — full-screen dialog; opens from sidebar or inline media click; loads missing data via `getMediasByMediaId` or `getMediasByRange`
3. **Carousel** — embla-carousel with thumbnails; triggers `onClickFirst`/`onClickLast` for boundary pagination

### Media state in Zustand

```typescript
medias: Record<conversationId, {
  items: Media[],
  prevCursor?: { _id: string, createdAt: string },
  nextCursor?: { _id: string, createdAt: string },
  newestMediaId?: string
}>
```

---

## Utilities and Shared Components

### Backend utilities

| File                    | Functions                                                  | Purpose                                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `Utils.js`              | `getNormalizeString`                                       | Vietnamese diacritics normalization for search          |
| `uploadFileHelper.js`   | `generateSignature`, `buildImageUrl`, Cloudinary presets   | Cloudinary signed upload support                       |
| `socketHelper.js`       | `onSeenMessage`                                            | Socket event handler for message seen tracking         |
| `conversationHelper.js` | `convertConversation`                                      | Transform conversation document for API response       |
| `messageHelper.js`      | `updateConversationAfterCreateMessage`, `emmitNewMessage`  | Post-message-create conversation update + socket emit  |

### Frontend utilities

| File                  | Functions                                                                      | Purpose                                    |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| `lib/utils.ts`        | `cn`, `fromNow`, `getAcronym`, `getNormalizeString`, `stringToHexColor`, `debounce`, `diffMinutes`, `getMessageTime`, `mergeById` | General helpers          |
| `lib/axios.ts`        | Axios instance, request/response interceptors                                  | HTTP client with automatic token refresh   |
| `lib/refreshManager.ts` | `AuthRefreshController.getValidAccessToken()`                                | Singleton refresh token coordinator        |

### Frontend hooks

| Hook             | File                    | Purpose                                                            |
| ---------------- | ----------------------- | ------------------------------------------------------------------ |
| `useChatScroll`  | `hooks/use-chat-scroll.ts` | Manages scroll position, auto-scroll, and infinite load-more    |
| `useIsMobile`    | `hooks/use-mobile.ts`     | Responsive breakpoint detection (768px)                          |

### Shared UI components (shadcn/ui)

The `components/ui/` directory contains Radix-based headless primitives styled with Tailwind CSS. These are used throughout the application:

`button`, `input`, `card`, `dialog`, `dropdown-menu`, `popover`, `separator`, `sidebar`, `tabs`, `tooltip`, `skeleton`, `slider`, `textarea`, `label`, `field`, `collapsible`, `breadcrumb`, `sheet`, `avatar`, `loading`, `emoji-picker`, `video`, `dropzone`

---

## Important Notes

1. **Module system** — Backend uses ES Modules (`"type": "module"` in `package.json`). All imports use `import/export` syntax.

2. **Environment variables** — Backend reads from `.env` via `dotenv`. Frontend uses Vite's `import.meta.env` with `VITE_API_URL` and `VITE_SOCKET_URL`.

3. **Transactions** — Message creation (`sendDirectMessage`, `senGroupMessage`) uses Mongoose sessions/transactions to atomically create Message + Attachments + update ConversationStats.

4. **File uploads** — Uses Cloudinary's signed upload flow: frontend requests a signature from backend, then uploads directly to Cloudinary from the browser.

5. **Persisted state** — `useAuthStore` persists `user` to localStorage. `useChatStore` persists `conversations`. `useThemeStore` persists `isDark`. Access tokens are NOT persisted (restored via refresh token on page reload).

6. **Multi-tab support** — `onlineUsers` on the server is a `Map<userId, Set<socketId>>`, allowing multiple socket connections per user.

7. **Vietnamese search** — Both backend (`Utils.js`) and frontend (`utils.ts`) implement `getNormalizeString` to remove Vietnamese diacritics for case-insensitive search.

8. **Cursor convention** — The media gallery system uses external cursors: returned cursor documents are NOT part of the current result set. Subsequent queries use `$gte`/`$lte` to include the cursor as the first element of the next page.
