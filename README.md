# WebSocket Demo Projects

This workspace contains two separate projects that work together:

## Projects

### 1. Shared Types (`shared-types/`)
- **Strongly-typed message definitions** shared between all projects
- **Type guards** and **message builders** for type safety
- **No more `any` types** - everything is properly constrained
- **Single source of truth** for message contracts

### 2. WebSocket Server (`websocket-server/`)
- **TypeScript WebSocket server** with Strategy pattern message handling
- **Strongly-typed message processing** using shared types
- **Extensible handler system** for easy addition of new message types
- Runs on `ws://localhost:8080`

### 3. React Client (`react-client/`)
- **React frontend** with custom TypeScript WebSocket hook
- **Type-safe message sending** and receiving
- **Loading states** and **error handling**
- Runs on `http://localhost:3000`

## Quick Start

### Option 1: Run everything from root (Recommended)
```bash
npm run setup  # Installs dependencies for both projects
npm start      # Starts both server and client concurrently
```

### Option 2: Run projects individually
1. **Start the WebSocket server:**
```bash
cd websocket-server
npm install
npm run dev
```

2. **In a new terminal, start the React client:**
```bash
cd react-client
npm install
npm start
```

### Use the app:
- The React app will open in your browser at `http://localhost:3000`
- Click "Send Hello" button
- See "world" response displayed

## Available Scripts (from root)

- `npm run setup` - Install dependencies for both projects
- `npm start` or `npm run dev` - Start both projects concurrently
- `npm run build` - Build both projects for production
- `npm run clean` - Clean node_modules and build artifacts from both projects
- `npm run install:server` - Install only server dependencies
- `npm run install:client` - Install only client dependencies
- `npm run start:server` - Start only the WebSocket server
- `npm run start:client` - Start only the React client

## Architecture

### **Shared Types System**
- **Strongly-typed messages** with `eventType` and `eventBody` structure
- **Type guards** for runtime type checking (`isHelloRequest()`, etc.)
- **Message builders** for creating valid messages (`createHelloRequest()`, etc.)
- **Complete type safety** from client to server

### **WebSocket Server**
- **Strategy Pattern** for message handling with extensible handler registry
- **Type-safe message processing** using shared type definitions
- **Professional error handling** with typed error responses

### **React Client** 
- **Custom WebSocket hook** for connection management
- **Type-safe message handling** with compile-time and runtime validation
- **Professional UI patterns** with loading states and error handling

All projects share the same strongly-typed message contracts, ensuring type safety across the entire system.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.