/**
 * Users Module
 * 
 * User management functionality for Super Platform
 * 
 * @module users
 */

// Components
export { UserList } from './components/UserList';
export { UserForm } from './components/UserForm';
export { CreateUserModal } from './components/CreateUserModal';

// API Handlers
export { getUsersHandler, createUserHandler, updateUserHandler } from './api/handlers';

// Hooks
export { useUsers, useCreateUser, useUpdateUser } from './hooks/useUsers';

// Types
export type { PlatformUser, CreateUserRequest, UpdateUserRequest } from './types';
