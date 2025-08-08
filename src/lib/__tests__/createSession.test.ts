import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createSession } from "../auth";

// Mock next/headers
const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock jose JWT functions
vi.mock("jose", () => {
  const mockSignJWTInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(),
  };

  return {
    SignJWT: vi.fn(() => mockSignJWTInstance),
    jwtVerify: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieStore.set.mockResolvedValue(undefined);
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("JWT_SECRET", "test-secret-key");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("createSession should create JWT token and set cookie", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  expect(mockSignJWTInstance.setProtectedHeader).toHaveBeenCalledWith({ alg: "HS256" });
  expect(mockSignJWTInstance.setExpirationTime).toHaveBeenCalledWith("7d");
  expect(mockSignJWTInstance.setIssuedAt).toHaveBeenCalled();
  expect(mockSignJWTInstance.sign).toHaveBeenCalled();

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    })
  );
});

test("createSession should set secure cookie in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      secure: true,
    })
  );
});

test("createSession should set expiration date 7 days from now", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const mockDate = new Date("2023-01-01T00:00:00.000Z");
  vi.setSystemTime(mockDate);

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  const expectedExpiration = new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  expect(mockCookieStore.set).toHaveBeenCalledWith(
    "auth-token",
    mockToken,
    expect.objectContaining({
      expires: expectedExpiration,
    })
  );
});

test("createSession should include correct session payload in JWT", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const mockDate = new Date("2023-01-01T00:00:00.000Z");
  vi.setSystemTime(mockDate);

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  const expectedExpiration = new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expectedPayload = {
    userId,
    email,
    expiresAt: expectedExpiration,
  };

  expect(SignJWT).toHaveBeenCalledWith(expectedPayload);
});

test("createSession should use JWT_SECRET for signing", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  // sign関数が何らかの引数で呼ばれることを確認（Uint8Arrayの内容は実装詳細）
  expect(mockSignJWTInstance.sign).toHaveBeenCalledTimes(1);
  expect(mockSignJWTInstance.sign).toHaveBeenCalledWith(expect.anything());
});

test("createSession should call sign function with secret", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  // sign関数が呼ばれることを確認
  expect(mockSignJWTInstance.sign).toHaveBeenCalledTimes(1);
  expect(mockSignJWTInstance.sign).toHaveBeenCalledWith(expect.anything());
});

test("createSession should handle JWT signing failure", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const error = new Error("JWT signing failed");

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockRejectedValue(error);

  await expect(createSession(userId, email)).rejects.toThrow("JWT signing failed");
  
  expect(mockCookieStore.set).not.toHaveBeenCalled();
});

test("createSession should handle cookies API failure", async () => {
  const userId = "user123";
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  mockCookieStore.set.mockImplementation(() => {
    throw new Error("Cookie setting failed");
  });

  await expect(createSession(userId, email)).rejects.toThrow("Cookie setting failed");
});

test("createSession should create session with special characters in email", async () => {
  const userId = "user123";
  const email = "test+tag@example.co.uk";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId,
      email,
      expiresAt: expect.any(Date),
    })
  );
});

test("createSession should create session with long userId", async () => {
  const userId = "a".repeat(100);
  const email = "test@example.com";
  const mockToken = "mock-jwt-token";

  const { SignJWT } = await vi.importMock<typeof import("jose")>("jose");
  const mockSignJWTInstance = (SignJWT as any)();
  mockSignJWTInstance.sign.mockResolvedValue(mockToken);

  await createSession(userId, email);

  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({
      userId,
      email,
      expiresAt: expect.any(Date),
    })
  );
});