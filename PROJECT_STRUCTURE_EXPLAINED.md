# 🏗️ ThanaFit Project Structure - Explained

## 📁 **Current Clean Structure**

```
ThanaFit-FrontEnd/
├── 📱 App.tsx                           # 🚀 Entry point
├── 📦 package.json                       # Dependencies
├── ⚙️ tsconfig.json                      # TypeScript config
├── 📚 ARCHITECTURE.md                    # Architecture guide
│
└── 📁 src/                              # 🎯 ALL CODE HERE
    ├── 🧠 core/                         # Business Logic (Domain Layer)
    │   └── domain/
    │       ├── 📦 entities/             # Business objects
    │       │   ├── User.ts              # User entity & types
    │       │   └── index.ts             # Export all entities
    │       ├── 📋 repositories/         # Data access contracts
    │       │   ├── IAuthRepository.ts   # Auth repository interface
    │       │   └── index.ts             # Export all repositories
    │       └── ⚙️ usecases/             # Business operations
    │           ├── auth/
    │           │   ├── LoginUseCase.ts    # Login business logic
    │           │   ├── SignupUseCase.ts   # Signup business logic
    │           │   └── LogoutUseCase.ts   # Logout business logic
    │           └── index.ts              # Export all use cases
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
    │   ├── 🧩 components/              # Reusable UI components
    │   │   ├── Button.tsx              # Reusable button component
    │   │   ├── Input.tsx               # Reusable input component
    │   │   └── index.ts                # Export all components
    │   ├── 📱 screens/                 # Screen components
    │   │   ├── LoginScreen.tsx         # Login screen
    │   │   └── SignupScreen.tsx        # Signup screen
    │   └── 🔄 providers/               # State management
    │       └── AuthProvider.tsx        # Authentication context
    │
    └── 🔗 di/                           # Dependency Injection
        └── Container.ts                 # Dependency management
```

## 🎯 **Why This Structure is Good**

### **1. Clear Separation of Concerns**
Each directory has a **specific purpose** and **clear boundaries**:

- **Domain** (`core/`) - Pure business logic, no technical details
- **Infrastructure** (`infrastructure/`) - Technical implementation, no business rules
- **Presentation** (`presentation/`) - User interface, no business logic
- **DI** (`di/`) - Wiring everything together

### **2. Scalable Organization**
As your app grows, you can easily add new features:

```
src/core/domain/usecases/
├── auth/                    # Authentication features
│   ├── LoginUseCase.ts
│   ├── SignupUseCase.ts
│   └── LogoutUseCase.ts
├── profile/                 # Profile features
│   ├── UpdateProfileUseCase.ts
│   └── GetProfileUseCase.ts
├── health/                  # Health tracking features
│   ├── LogWeightUseCase.ts
│   ├── LogWaterUseCase.ts
│   └── LogFoodUseCase.ts
└── women/                   # Women's health features
    ├── LogCycleUseCase.ts
    └── GetCyclePhaseUseCase.ts
```

### **3. Easy to Find Things**
- **Need a business rule?** → `src/core/domain/usecases/`
- **Need to change API?** → `src/infrastructure/api/`
- **Need to update UI?** → `src/presentation/screens/`
- **Need a reusable component?** → `src/presentation/components/`

## 🔍 **Directory-by-Directory Breakdown**

### **🧠 `src/core/` - Business Logic (Domain Layer)**

**Purpose**: Contains all business rules, entities, and logic. This is the **heart** of your application.

#### **📦 `entities/` - Business Objects**
```typescript
// User.ts - What is a User in your business?
export interface User {
  id: number;
  firstName: string;
  email: string;
  // ... business rules
}
```

**Why it's good**:
- ✅ **Pure business objects** - No technical details
- ✅ **Reusable** - Can be used by any UI (web, mobile, CLI)
- ✅ **Testable** - Easy to test business rules
- ✅ **Clear** - Everyone understands what a User is

#### **📋 `repositories/` - Data Access Contracts**
```typescript
// IAuthRepository.ts - What can we do with Users?
export interface IAuthRepository {
  login(credentials: AuthCredentials): Promise<User>;
  signup(userData: CreateUserRequest): Promise<User>;
}
```

**Why it's good**:
- ✅ **Abstraction** - Business logic doesn't know about databases
- ✅ **Testable** - Easy to mock for testing
- ✅ **Flexible** - Can switch from REST to GraphQL without changing business logic
- ✅ **Clear contracts** - Everyone knows what methods are available

#### **⚙️ `usecases/` - Business Operations**
```typescript
// LoginUseCase.ts - Single business operation
export class LoginUseCase {
  async execute(credentials: AuthCredentials): Promise<User> {
    // Only login business logic
  }
}
```

**Why it's good**:
- ✅ **Single responsibility** - Each UseCase does ONE thing
- ✅ **Easy to test** - Test one operation at a time
- ✅ **Reusable** - Can be used by different UIs
- ✅ **Clear intent** - Name tells you exactly what it does

### **🔌 `src/infrastructure/` - External Dependencies**

**Purpose**: Contains all technical implementation details - API calls, database, file system.

#### **🌐 `api/` - API Client**
```typescript
// ApiClient.ts - How do we talk to the server?
export class ApiClient {
  async request<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Retry logic, error handling, timeouts
  }
}
```

**Why it's good**:
- ✅ **Centralized** - All API logic in one place
- ✅ **Robust** - Built-in retry logic, error handling
- ✅ **Reusable** - Used by all repositories
- ✅ **Configurable** - Easy to change API settings

#### **🗄️ `repositories/` - Data Access Implementation**
```typescript
// AuthRepositoryImpl.ts - How do we save/load data?
export class AuthRepositoryImpl implements IAuthRepository {
  async login(credentials: AuthCredentials): Promise<User> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  }
}
```

**Why it's good**:
- ✅ **Implements contracts** - Follows the repository interface
- ✅ **Technical details hidden** - Business layer doesn't see HTTP
- ✅ **Easy to change** - Switch from REST to GraphQL without affecting business logic
- ✅ **Error handling** - Handles network errors, timeouts

#### **🔧 `services/` - External Services**
```typescript
// api.ts - Clean API service (auth only)
class ApiService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Authentication-specific API calls
  }
}
```

**Why it's good**:
- ✅ **Focused** - Only authentication endpoints
- ✅ **Clean** - No bloated code
- ✅ **Maintainable** - Easy to add new auth features
- ✅ **Organized** - Clear separation of concerns

### **🎨 `src/presentation/` - User Interface**

**Purpose**: Contains all UI-related code - screens, components, state management.

#### **🧩 `components/` - Reusable UI Components**
```typescript
// Button.tsx - Reusable button component
export const Button: React.FC<ButtonProps> = ({ title, onPress, variant }) => {
  // Reusable button logic
};
```

**Why it's good**:
- ✅ **Reusable** - Can be used across different screens
- ✅ **Consistent** - Same look and feel everywhere
- ✅ **Maintainable** - Change once, updates everywhere
- ✅ **Testable** - Easy to test UI components

#### **📱 `screens/` - Screen Components**
```typescript
// LoginScreen.tsx - What the user sees
export default function LoginScreen() {
  const { login } = useAuth(); // Uses business logic
  
  const handleLogin = async () => {
    const success = await login(credentials);
    if (success) {
      // Navigate to dashboard
    }
  };
}
```

**Why it's good**:
- ✅ **UI logic only** - No business rules in UI
- ✅ **Focused** - Each screen has one purpose
- ✅ **Reusable components** - Uses components from `components/`
- ✅ **Clean** - Easy to understand and modify

#### **🔄 `providers/` - State Management**
```typescript
// AuthProvider.tsx - How do we manage app state?
export const AuthProvider = ({ children, authRepository }) => {
  const loginUseCase = new LoginUseCase(authRepository);
  
  const login = async (credentials) => {
    const user = await loginUseCase.execute(credentials);
    setUser(user);
  };
};
```

**Why it's good**:
- ✅ **Centralized state** - All auth state in one place
- ✅ **Uses business logic** - Calls UseCases, not API directly
- ✅ **Reactive** - UI updates automatically when state changes
- ✅ **Testable** - Easy to test state management

### **🔗 `src/di/` - Dependency Injection**

**Purpose**: Wires everything together - like a factory that creates and connects all the pieces.

```typescript
// Container.ts - Where everything comes together
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

**Why it's good**:
- ✅ **Loose coupling** - Components don't create their own dependencies
- ✅ **Easy testing** - Inject mock dependencies
- ✅ **Centralized management** - All dependencies in one place
- ✅ **Flexible** - Easy to change implementations

## 🚀 **Benefits of This Structure**

### **For Development**:
- ✅ **Easy to find things** - Clear folder structure
- ✅ **Easy to add features** - Follow established patterns
- ✅ **Easy to test** - Each layer can be tested separately
- ✅ **Easy to understand** - Clear responsibilities

### **For Maintenance**:
- ✅ **Changes are isolated** - Modify one layer without affecting others
- ✅ **Consistent patterns** - Same structure everywhere
- ✅ **Clear boundaries** - Know exactly where to make changes
- ✅ **Reduced bugs** - Isolated changes mean fewer side effects

### **For Team Collaboration**:
- ✅ **Clear ownership** - Each developer knows their area
- ✅ **Easy onboarding** - New developers understand the structure
- ✅ **Consistent code** - Same patterns everywhere
- ✅ **Reduced conflicts** - Different areas don't interfere

### **For Business**:
- ✅ **Faster development** - Clear patterns to follow
- ✅ **Lower costs** - Less time debugging, easier maintenance
- ✅ **Better quality** - More reliable, testable code
- ✅ **Easier scaling** - Structure supports growth

## 🎯 **How to Use This Structure**

### **Adding a New Feature (Example: "Forgot Password")**

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

## 📋 **File Naming Conventions**

- **Entities**: `User.ts`, `Product.ts`
- **Interfaces**: `I` prefix - `IAuthRepository.ts`
- **Implementations**: `Impl` suffix - `AuthRepositoryImpl.ts`
- **Use Cases**: `Action` suffix - `LoginUseCase.ts`
- **Screens**: `Screen` suffix - `LoginScreen.tsx`
- **Components**: Descriptive names - `Button.tsx`, `Input.tsx`

## 🏆 **Why This Structure is Industry Standard**

### **Used by Top Companies**:
- ✅ **Google** - Android development
- ✅ **Microsoft** - .NET applications
- ✅ **Netflix** - Microservices
- ✅ **Uber** - Backend services
- ✅ **Airbnb** - Web applications

### **Supported by Modern Frameworks**:
- ✅ **Clean Architecture** - Robert C. Martin's pattern
- ✅ **Domain-Driven Design (DDD)** - Eric Evans' methodology
- ✅ **Hexagonal Architecture** - Alistair Cockburn's pattern

This structure ensures your app is **professional**, **maintainable**, **scalable**, and **industry-standard**! 🎉
