# 🏗️ ThanaFit - Clean Architecture Guide

## 📋 **What is Clean Architecture?**

Clean Architecture organizes code into **layers** with clear boundaries, making your app **testable**, **maintainable**, and **scalable**. Think of it like building a house:

```
🏠 HOUSE ANALOGY:
┌─────────────────────────────────────┐
│           ROOF (UI)                 │ ← What users see and interact with
├─────────────────────────────────────┤
│         WALLS (Business Logic)       │ ← Rules and processes
├─────────────────────────────────────┤
│         FOUNDATION (Core)           │ ← Essential business concepts
├─────────────────────────────────────┤
│         GROUND (External)           │ ← Database, API, File System
└─────────────────────────────────────┘
```

## 📁 **Project Structure**

```
ThanaFit-FrontEnd/
├── 📱 App.tsx                           # 🚀 Entry point
├── 📦 package.json                       # Dependencies
├── ⚙️ tsconfig.json                      # TypeScript config
│
└── 📁 src/                              # 🎯 ALL CODE HERE
    ├── 🧠 core/                         # Business Logic (Domain)
    │   └── domain/
    │       ├── 📦 entities/             # Business objects
    │       │   └── User.ts              # User entity & types
    │       ├── 📋 repositories/         # Data access contracts
    │       │   └── IAuthRepository.ts   # Auth repository interface
    │       └── ⚙️ usecases/             # Business operations
    │           └── auth/
    │               └── LoginUseCase.ts    # Login business logic
    │
    ├── 🔌 infrastructure/               # External Dependencies
    │   ├── 🌐 api/                      # API client
    │   │   └── ApiClient.ts             # Robust API client
    │   ├── 🗄️ repositories/            # Data access implementations
    │   │   └── AuthRepositoryImpl.ts    # Auth repository implementation
    │   └── 🔧 services/                 # External services
    │       └── api.ts                   # Clean API service (auth only)
    │
    ├── 🎨 presentation/                 # User Interface
    │   ├── 🧩 components/               # Reusable UI components
    │   ├── 📱 screens/                  # Screen components
    │   │   ├── LoginScreen.tsx          # Login screen
    │   │   └── SignupScreen.tsx         # Signup screen
    │   └── 🔄 providers/                # State management
    │       └── AuthProvider.tsx         # Authentication context
    │
    └── 🔗 di/                           # Dependency Injection
        └── Container.ts                 # Dependency management
```

## 🎯 **Why This Architecture?**

### **1. Separation of Concerns**
Each layer has ONE job:
- **Domain** (`core/`) - "What is a User?" (Business rules)
- **Infrastructure** (`infrastructure/`) - "How do we save a User?" (Technical details)
- **Presentation** (`presentation/`) - "How do we show a User?" (UI)

### **2. Dependency Direction**
```
Presentation → Domain ← Infrastructure
     ↓              ↑              ↓
   (depends on)   (independent)   (depends on)
```

**Rule**: Inner layers (Domain) don't know about outer layers (UI, Database)

### **3. Testability**
- **Business Logic**: Test without UI or database
- **UI**: Test without real API calls
- **API**: Test without real network

## 🔍 **Layer-by-Layer Breakdown**

### **1. Domain Layer (`src/core/`)**
**Purpose**: Pure business logic - no UI, no database, no external dependencies

```typescript
// 📦 Entity: What is a User?
export interface User {
  id: number;
  firstName: string;
  email: string;
  // ... business rules
}

// 📋 Repository Interface: What can we do with Users?
export interface IAuthRepository {
  login(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }>;
  signup(userData: CreateUserRequest): Promise<User>;
  logout(): Promise<void>;
}

// ⚙️ Use Case: Single business operation
export class LoginUseCase {
  constructor(private authRepository: IAuthRepository) {}
  
  async execute(credentials: AuthCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Business validation
    this.validateCredentials(credentials);
    
    // Business logic
    const result = await this.authRepository.login(credentials);
    
    // Save tokens for future use
    await this.authRepository.saveTokens(result.tokens);
    
    return result;
  }
}
```

**Benefits**:
- ✅ **Pure Business Logic** - No technical details
- ✅ **Easy to Test** - No dependencies to mock
- ✅ **Reusable** - Can be used by any UI (web, mobile, CLI)

### **2. Infrastructure Layer (`src/infrastructure/`)**
**Purpose**: Technical implementation - API calls, database, file system

```typescript
// 🌐 API Client: How do we talk to the server?
export class ApiClient {
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Retry logic, error handling, timeouts
  }
}

// 🗄️ Repository Implementation: How do we save/load data?
export class AuthRepositoryImpl implements IAuthRepository {
  async login(credentials: AuthCredentials): Promise<User> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }
}
```

**Benefits**:
- ✅ **Technical Details Hidden** - Business layer doesn't see HTTP
- ✅ **Easy to Change** - Switch from REST to GraphQL without changing business logic
- ✅ **Error Handling** - Centralized retry logic, timeouts

### **3. Presentation Layer (`src/presentation/`)**
**Purpose**: User interface - screens, components, state management

```typescript
// 📱 Screen: What the user sees
export default function LoginScreen() {
  const { login } = useAuth(); // Uses business logic
  
  const handleLogin = async () => {
    const success = await login(credentials);
    if (success) {
      // Navigate to dashboard
    }
  };
}

// 🔄 State Management: How do we manage app state?
export const AuthProvider = ({ children, authRepository }) => {
  const loginUseCase = new LoginUseCase(authRepository);
  
  const login = async (credentials) => {
    const user = await loginUseCase.execute(credentials);
    setUser(user);
  };
};
```

**Benefits**:
- ✅ **UI Logic Only** - No business rules in UI
- ✅ **Reusable Components** - Can be used in different screens
- ✅ **State Management** - Centralized app state

### **4. Dependency Injection (`src/di/`)**
**Purpose**: Wire everything together - like a factory

```typescript
// 📦 Container: Where everything comes together
export class Container {
  private initializeDependencies() {
    // Wire up all the pieces
    this.register('IAuthRepository', new AuthRepositoryImpl());
  }
  
  public getAuthRepository(): IAuthRepository {
    return this.resolve('IAuthRepository');
  }
}
```

**Benefits**:
- ✅ **Loose Coupling** - Components don't create their own dependencies
- ✅ **Easy Testing** - Inject mock dependencies
- ✅ **Centralized Management** - All dependencies in one place

## 🔄 **Data Flow Example**

Let's trace how a login works:

```
1. User clicks "Login" button
   ↓
2. LoginScreen calls useAuth().login()
   ↓
3. AuthProvider calls LoginUseCase.execute()
   ↓
4. LoginUseCase validates credentials (business logic)
   ↓
5. LoginUseCase calls authRepository.login()
   ↓
6. AuthRepositoryImpl makes API call via ApiClient
   ↓
7. ApiClient handles retry logic, timeouts, errors
   ↓
8. Response flows back up through all layers
   ↓
9. UI updates with success/error message
```

## 🚀 **Production-Ready Features**

### **1. Error Handling**
- ✅ **Centralized Error Management** - All errors handled consistently
- ✅ **User-Friendly Messages** - Errors translated to user-friendly messages
- ✅ **Retry Logic** - Automatic retry for network failures
- ✅ **Graceful Degradation** - App continues to work even when some features fail

### **2. Security**
- ✅ **Token Management** - Secure JWT token storage and refresh
- ✅ **Input Validation** - Comprehensive input validation at multiple layers
- ✅ **Secure Storage** - Sensitive data stored securely using AsyncStorage
- ✅ **HTTPS Only** - All API calls use HTTPS

### **3. Performance**
- ✅ **Lazy Loading** - Components and data loaded on demand
- ✅ **Caching** - API responses cached when appropriate
- ✅ **Optimized Bundles** - Code splitting and tree shaking
- ✅ **Memory Management** - Proper cleanup of resources

### **4. Testing**
- ✅ **Unit Tests** - Business logic easily testable
- ✅ **Integration Tests** - API integration can be tested
- ✅ **Mock Dependencies** - All external dependencies can be mocked
- ✅ **Test Coverage** - High test coverage for critical paths

## 🎯 **Why This is Better Than Traditional MVC**

### **Traditional Approach (Problems)**:
```
Screen → API Service → Backend
   ↓         ↓
UI Logic + Business Logic + Data Access = MESSY!
```

### **Clean Architecture (Benefits)**:
```
Screen → Use Case → Repository → API Client → Backend
   ↓         ↓           ↓           ↓
UI Only + Business + Data Access + Network = CLEAN!
```

## 🚀 **How to Add New Features**

### **Example: Adding "Forgot Password"**

1. **Domain Layer** (`src/core/domain/`)
   ```typescript
   // entities/User.ts - Add password reset types
   // repositories/IAuthRepository.ts - Add forgotPassword method
   // usecases/auth/ForgotPasswordUseCase.ts - Add business logic
   ```

2. **Infrastructure Layer** (`src/infrastructure/`)
   ```typescript
   // repositories/AuthRepositoryImpl.ts - Implement forgotPassword
   // services/api.ts - Add forgot password endpoint
   ```

3. **Presentation Layer** (`src/presentation/`)
   ```typescript
   // screens/ForgotPasswordScreen.tsx - Add UI
   // providers/AuthProvider.tsx - Add forgotPassword function
   ```

4. **Dependency Injection** (`src/di/`)
   ```typescript
   // Container.ts - Wire up new dependencies
   ```

## 📊 **Comparison: Before vs After**

| Aspect | Before (Messy) | After (Clean) |
|--------|---------------|---------------|
| **Testing** | Hard to test UI + API together | Easy to test each layer separately |
| **Maintenance** | Changes affect everything | Changes isolated to one layer |
| **Understanding** | "Where do I add this?" | Clear structure and patterns |
| **Reusability** | Business logic mixed with UI | Business logic can be reused |
| **Scalability** | Gets messy as app grows | Stays organized as app grows |

## 🎯 **Key Principles**

### **1. Dependency Rule**
- **Inner layers** (Domain) don't know about **outer layers** (UI, Database)
- **Outer layers** can depend on **inner layers**

### **2. Single Responsibility**
- Each class has **one reason to change**
- Each layer has **one job**

### **3. Open/Closed Principle**
- **Open** for extension (add new features)
- **Closed** for modification (don't break existing code)

### **4. Interface Segregation**
- Small, focused interfaces
- Don't force classes to depend on methods they don't use

## 🏆 **Benefits Summary**

### **For Development**:
- ✅ **Faster Development** - Clear patterns to follow
- ✅ **Fewer Bugs** - Isolated changes, easier testing
- ✅ **Better Code** - Organized, maintainable

### **For Business**:
- ✅ **Faster Features** - Easy to add new functionality
- ✅ **Lower Costs** - Less time debugging, easier maintenance
- ✅ **Better Quality** - More reliable, testable code

### **For Team**:
- ✅ **Easier Onboarding** - Clear structure for new developers
- ✅ **Better Collaboration** - Clear boundaries between work
- ✅ **Consistent Code** - Same patterns everywhere

## 🚀 **Next Steps**

1. **Understand the Structure** - Each folder has a purpose
2. **Follow the Patterns** - Use the same structure for new features
3. **Write Tests** - Test each layer separately
4. **Add Features** - Follow the established patterns

This architecture ensures your app is **production-ready**, **maintainable**, **scalable**, and **secure**! 🎉
