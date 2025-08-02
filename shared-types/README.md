# Shared Types Package

This package contains strongly-typed message definitions shared between the WebSocket server and React client.

## Features

- **Strongly Typed Messages** - No more `any` types, everything is properly typed
- **Type Guards** - Runtime type checking with `isHelloRequest()`, `isPongResponse()`, etc.
- **Message Builders** - Helper functions like `createHelloRequest()`, `createPongResponse()`
- **Complete Type Safety** - Both `eventType` and `eventBody` are constrained to valid types

## Message Types

### Request Messages
- **`HelloRequest`** - Contains `userMessage` and `timestamp`
- **`PingRequest`** - Contains `userMessage` and `timestamp`

### Response Messages  
- **`HelloResponse`** - Contains `message` and `timestamp`
- **`PongResponse`** - Contains `message`, `originalBody`, and `timestamp`
- **`ErrorResponse`** - Contains `message`, optional `eventType`, `originalMessage`, and `timestamp`

### Union Types
- **`MessageRequest`** - Union of all possible request messages
- **`MessageResponse`** - Union of all possible response messages

## Usage

### In Server Code:
```typescript
import { 
  MessageRequest, 
  isHelloRequest, 
  createHelloResponse 
} from '@websocket-demo/shared-types';

if (isHelloRequest(message)) {
  return createHelloResponse('world');
}
```

### In Client Code:
```typescript
import { 
  createHelloRequest, 
  isHelloResponse 
} from '@websocket-demo/shared-types';

const request = createHelloRequest('Hello from client!');
if (isHelloResponse(response)) {
  console.log(response.eventBody.message); // TypeScript knows this is a string
}
```

## Benefits

- **Compile-time Safety** - TypeScript catches type errors before runtime
- **IntelliSense** - Full IDE support with auto-completion
- **Runtime Safety** - Type guards provide runtime validation
- **Single Source of Truth** - Message contracts defined once, used everywhere
- **Easy Refactoring** - Change types in one place, get compile errors everywhere that needs updating

## Building

Run `npm run build` to compile TypeScript and generate declaration files for consumption by other projects.