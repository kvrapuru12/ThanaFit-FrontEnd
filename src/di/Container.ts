import { AuthRepositoryImpl } from '../infrastructure/implementations/AuthRepositoryImpl';
import { IAuthRepository } from '../core/domain/interfaces/IAuthRepository';

// Dependency Injection Container
export class Container {
  private static instance: Container;
  private dependencies: Map<string, any> = new Map();

  private constructor() {
    this.initializeDependencies();
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeDependencies(): void {
    // Register repositories
    this.register<IAuthRepository>('IAuthRepository', new AuthRepositoryImpl());
    
    // Register other dependencies as needed
    // this.register<ISomeService>('ISomeService', new SomeServiceImpl());
  }

  public register<T>(key: string, implementation: T): void {
    this.dependencies.set(key, implementation);
  }

  public resolve<T>(key: string): T {
    const dependency = this.dependencies.get(key);
    if (!dependency) {
      throw new Error(`Dependency ${key} not found`);
    }
    return dependency as T;
  }

  public getAuthRepository(): IAuthRepository {
    return this.resolve<IAuthRepository>('IAuthRepository');
  }
}

// Export singleton instance
export const container = Container.getInstance();
