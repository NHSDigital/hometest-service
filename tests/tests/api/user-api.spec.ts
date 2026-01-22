import { test, expect } from '../../fixtures';
import { User, CreateUserPayload } from '../../api/clients';

test.describe('User API Tests @api', () => {
  test('GET - should retrieve user by ID and validate response', async ({ userApi }) => {
    // Arrange
    const userId = 1;

    // Act
    const response = await userApi.getUserByIdRaw(userId);
    const user = await response.json() as User;

    // Assert - Validate status code
    expect(response.status()).toBe(200);
    expect(response.ok()).toBeTruthy();

    // Assert - Validate response body structure
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');

    // Assert - Validate specific fields
    expect(user.id).toBe(userId);
    expect(user.name).toBeTruthy();
    expect(user.email).toContain('@');

    console.log('Retrieved user:', JSON.stringify(user, null, 2));
  });

  test('GET - should retrieve all users successfully', async ({ userApi }) => {
    // Act
    const users = await userApi.getAllUsers();

    // Assert - Validate response
    expect(users).toBeDefined();
    expect(Array.isArray(users)).toBeTruthy();
    expect(users.length).toBeGreaterThan(0);

    // Assert - Validate first user structure
    const firstUser = users[0];
    expect(firstUser).toHaveProperty('id');
    expect(firstUser).toHaveProperty('name');
    expect(firstUser).toHaveProperty('email');

    console.log(`Retrieved ${users.length} users`);
  });

  test('POST - should create new user and return 201', async ({ userApi }) => {
    // Arrange
    const newUser: CreateUserPayload = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      phone: '123-456-7890',
      website: 'johndoe.com',
    };

    // Act
    const response = await userApi.createUserRaw(newUser);
    const createdUser = await response.json() as User;

    // Assert - Validate status code
    expect(response.status()).toBe(201);
    expect(response.ok()).toBeTruthy();

    // Assert - Validate created user
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.name).toBe(newUser.name);
    expect(createdUser.email).toBe(newUser.email);

    console.log('Created user:', JSON.stringify(createdUser, null, 2));
  });
});
