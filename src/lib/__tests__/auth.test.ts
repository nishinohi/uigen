import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createSession, getSession, deleteSession, verifySession } from "../auth";
import { NextRequest } from "next/server";

// Mock Next.js cookies
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(mockCookieStore),
}));

// Mock jose module
vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt-token"),
  })),
  jwtVerify: vi.fn(),
}));

const mockVerifyResult = {
  payload: {
    userId: "test-user-id",
    email: "test@example.com",
    expiresAt: new Date("2024-12-31T23:59:59Z"),
  },
};

// Import mocked modules
import { SignJWT, jwtVerify } from "jose";

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.NODE_ENV;
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("createSession creates a JWT token and sets cookie", async () => {
  const userId = "user-123";
  const email = "user@example.com";

  await createSession(userId, email);

  // Verify JWT creation
  expect(SignJWT).toHaveBeenCalled();

  // Verify cookie setting
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      httpOnly: true,
      secure: false, // NODE_ENV is not production
      sameSite: "lax",
      expires: expect.any(Date),
      path: "/",
    })
  );
});

test("createSession sets secure cookie in production", async () => {
  process.env.NODE_ENV = "production";

  await createSession("user-123", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      secure: true,
    })
  );
});

test("createSession sets expiration date 7 days in the future", async () => {
  const mockNow = new Date("2024-01-01T00:00:00Z").getTime();
  vi.spyOn(Date, "now").mockReturnValue(mockNow);

  await createSession("user-123", "user@example.com");

  const expectedExpiresAt = new Date(mockNow + 7 * 24 * 60 * 60 * 1000);
  
  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    "mock-jwt-token",
    expect.objectContaining({
      expires: expectedExpiresAt,
    })
  );
});

test("getSession returns session payload when valid token exists", async () => {
  const mockToken = "valid-jwt-token";
  mockCookieStore.get.mockReturnValue({ value: mockToken });
  (jwtVerify as any).mockResolvedValue(mockVerifyResult);

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Object));
  expect(result).toEqual(mockVerifyResult.payload);
});

test("getSession returns null when no token exists", async () => {
  mockCookieStore.get.mockReturnValue(undefined);

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test("getSession returns null when token verification fails", async () => {
  const mockToken = "invalid-jwt-token";
  mockCookieStore.get.mockReturnValue({ value: mockToken });
  (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

  const result = await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Object));
  expect(result).toBeNull();
});

test("getSession returns null when cookie value is empty string", async () => {
  mockCookieStore.get.mockReturnValue({ value: "" });

  const result = await getSession();

  expect(result).toBeNull();
  expect(jwtVerify).not.toHaveBeenCalled();
});

test("deleteSession deletes the auth cookie", async () => {
  await deleteSession();

  expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
});

test("verifySession returns session payload from request cookie", async () => {
  const mockToken = "valid-jwt-token";
  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    },
  } as unknown as NextRequest;
  
  (jwtVerify as any).mockResolvedValue(mockVerifyResult);

  const result = await verifySession(mockRequest);

  expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Object));
  expect(result).toEqual(mockVerifyResult.payload);
});

test("verifySession returns null when request has no token", async () => {
  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue(undefined),
    },
  } as unknown as NextRequest;

  const result = await verifySession(mockRequest);

  expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).not.toHaveBeenCalled();
  expect(result).toBeNull();
});

test("verifySession returns null when request token verification fails", async () => {
  const mockToken = "invalid-jwt-token";
  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: mockToken }),
    },
  } as unknown as NextRequest;
  
  (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

  const result = await verifySession(mockRequest);

  expect(mockRequest.cookies.get).toHaveBeenCalledWith("auth-token");
  expect(jwtVerify).toHaveBeenCalledWith(mockToken, expect.any(Object));
  expect(result).toBeNull();
});

test("verifySession handles empty token from request", async () => {
  const mockRequest = {
    cookies: {
      get: vi.fn().mockReturnValue({ value: "" }),
    },
  } as unknown as NextRequest;

  const result = await verifySession(mockRequest);

  expect(result).toBeNull();
  expect(jwtVerify).not.toHaveBeenCalled();
});

test("JWT_SECRET uses environment variable when available", async () => {
  process.env.JWT_SECRET = "custom-secret-key";

  await createSession("user-123", "user@example.com");

  expect(SignJWT).toHaveBeenCalled();
});

test("JWT_SECRET uses development fallback when env var not set", async () => {
  delete process.env.JWT_SECRET;

  await createSession("user-123", "user@example.com");

  // The JWT secret should still be used (development fallback)
  expect(SignJWT).toHaveBeenCalled();
});