/**
 * Mock Clerk Next.js server for testing
 */

// Default to null (unauthenticated)
// Tests can override this with mockResolvedValue or mockResolvedValueOnce
export const auth = jest.fn().mockResolvedValue({
  userId: null,
});

export const clerkClient = jest.fn().mockResolvedValue({
  users: {
    createUser: jest.fn().mockResolvedValue({
      id: "user_123",
      emailAddress: ["test@example.com"],
    }),
    getUser: jest.fn().mockImplementation((userId: string) => {
      // Return admin user for admin_user
      if (userId === "admin_user" || userId === "test_admin_user") {
        return Promise.resolve({
          id: userId,
          publicMetadata: {
            role: "admin",
          },
        });
      }

      // Return regular user for others
      return Promise.resolve({
        id: userId,
        publicMetadata: {},
      });
    }),
    getUserList: jest.fn().mockResolvedValue({
      data: [],
      totalCount: 0,
    }),
    updateUserMetadata: jest.fn().mockResolvedValue({}),
    deleteUser: jest.fn().mockResolvedValue({}),
  },
  sessions: {
    createSession: jest.fn().mockResolvedValue({
      id: "session_123",
      userId: "user_123",
      expireAt: new Date(Date.now() + 3600000),
    }),
    getToken: jest.fn().mockResolvedValue({
      jwt: "mock_session_token_" + Date.now(),
    }),
  },
});
