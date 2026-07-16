import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { Role } from "../../generated/prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

export class AuthService {
  private repository = new AuthRepository();

  async register(email: string, password: string, name: string, role: Role) {
    console.log(`[Auth] register: email=${email}, name=${name}, role=${role}`);
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      console.warn(`[Auth] registration failed: email already registered: ${email}`);
      throw new Error("Email already registered");
    }

    console.log(`[Auth] hashing password for email=${email}`);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.repository.create({ email, passwordHash, name, role });
    console.log(`[Auth] user registered successfully: userId=${user.id}, email=${email}`);
    return user;
  }

  async login(email: string, password: string) {
    console.log(`[Auth] login attempt: email=${email}`);
    const user = await this.repository.findByEmail(email);
    if (!user) {
      console.warn(`[Auth] login failed: user not found: ${email}`);
      throw new Error("Invalid credentials");
    }

    console.log(`[Auth] verifying password for email=${email}`);
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      console.warn(`[Auth] login failed: invalid password for email=${email}`);
      throw new Error("Invalid credentials");
    }

    console.log(`[Auth] generating JWT token for userId=${user.id}`);
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET!, { expiresIn: "15m" });
    console.log(`[Auth] login successful: userId=${user.id}, email=${email}, role=${user.role}`);
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
