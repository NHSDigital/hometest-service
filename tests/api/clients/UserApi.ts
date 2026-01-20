import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './BaseApiClient';
import { API_ENDPOINTS } from '../endpoints';

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  website?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  username?: string;
  phone?: string;
  website?: string;
}

export class UserApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * GET request example: Get user by ID
   */
  async getUserById(id: number): Promise<User> {
    const endpoint = API_ENDPOINTS.users.getUser(id);
    const response = await this.get(endpoint);
    
    this.validateStatus(response, 200);
    
    return await this.parseJsonResponse<User>(response);
  }

  /**
   * GET request example: Get all users
   */
  async getAllUsers(): Promise<User[]> {
    const endpoint = API_ENDPOINTS.users.list;
    const response = await this.get(endpoint);
    
    this.validateStatus(response, 200);
    
    return await this.parseJsonResponse<User[]>(response);
  }

  /**
   * POST request example: Create new user
   */
  async createUser(userData: CreateUserPayload): Promise<User> {
    const endpoint = API_ENDPOINTS.users.createUser;
    const response = await this.post(endpoint, {
      data: userData,
    });
    
    this.validateStatus(response, 201);
    
    return await this.parseJsonResponse<User>(response);
  }

  /**
   * GET raw response (for testing purposes)
   */
  async getUserByIdRaw(id: number): Promise<APIResponse> {
    const endpoint = API_ENDPOINTS.users.getUser(id);
    return await this.get(endpoint);
  }

  /**
   * POST raw response (for testing purposes)
   */
  async createUserRaw(userData: CreateUserPayload): Promise<APIResponse> {
    const endpoint = API_ENDPOINTS.users.createUser;
    return await this.post(endpoint, {
      data: userData,
    });
  }
}
