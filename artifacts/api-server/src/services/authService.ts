import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { db, usersTable, sessionsTable, ProfileRepository } from '@workspace/db';

// Argon2id parameters based on OWASP recommendations (2024)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB RAM
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 parallel thread
};

// Session expiration: 7 days
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  userId: string;
  sessionId: string;
  user: {
    id: string;
    email: string;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  profile: {
    userId: string;
    handle: string;
    name: string;
    bio: string | null;
    avatarUrl: string | null;
    wallpaper: string | null;
    accentColor: string | null;
    moodLabel: string | null;
    moodIcon: string | null;
    nowPlaying: string | null;
    moduleSettings: unknown[];
    joinedAt: Date;
  };
}

export class AuthService {
  private profileRepo: ProfileRepository;

  constructor() {
    this.profileRepo = new ProfileRepository();
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    // Hash password with Argon2id
    const passwordHash = await argon2.hash(input.password, ARGON2_OPTIONS);

    // Generate default handle and name from email
    const emailLocal = input.email.split('@')[0];
    const defaultHandle = emailLocal.toLowerCase().replace(/[^a-z0-9]/g, '');
    const defaultName = emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1);

    // Start a transaction to create user and default profile
    const result = await db.transaction(async (tx) => {
      // Create user
      const [user] = await tx
        .insert(usersTable)
        .values({
          email: input.email,
          passwordHash,
        })
        .returning();

      if (!user) {
        throw new Error('Failed to create user');
      }

      // Create default profile using the repository with transaction
      const profile = await this.profileRepo.createDefaultForUser(
        user.id,
        defaultHandle,
        defaultName
      );

      return { user, profile };
    });

    // Create session
    const session = await this.createSession(result.user.id);

    return {
      userId: result.user.id,
      sessionId: session.id,
      user: result.user,
      profile: result.profile,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    // Find user by email
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    if (users.length === 0) {
      // Return generic error to avoid leaking account existence
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password
    if (!user.passwordHash) {
      // User registered without password (e.g., OAuth)
      throw new Error('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, input.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Get profile
    const profile = await this.profileRepo.getByUserId(user.id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Create session
    const session = await this.createSession(user.id);

    return {
      userId: user.id,
      sessionId: session.id,
      user,
      profile,
    };
  }

  async logout(sessionId: string): Promise<void> {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }

  async verifySession(sessionId: string): Promise<string | null> {
    const sessions = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      .limit(1);

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
      return null;
    }

    // Refresh session expiration on activity
    const newExpiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
    await db
      .update(sessionsTable)
      .set({ expiresAt: newExpiresAt })
      .where(eq(sessionsTable.id, sessionId));

    return session.userId;
  }

  async refreshSession(sessionId: string): Promise<AuthResult | null> {
    const userId = await this.verifySession(sessionId);
    if (!userId) {
      return null;
    }

    // Get user and profile
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    if (users.length === 0) {
      return null;
    }

    const user = users[0];
    const profile = await this.profileRepo.getByUserId(user.id);
    if (!profile) {
      return null;
    }

    return {
      userId: user.id,
      sessionId,
      user,
      profile,
    };
  }

  private async createSession(userId: string) {
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
    const [session] = await db
      .insert(sessionsTable)
      .values({
        userId,
        expiresAt,
      })
      .returning();

    if (!session) {
      throw new Error('Failed to create session');
    }

    return session;
  }
}
