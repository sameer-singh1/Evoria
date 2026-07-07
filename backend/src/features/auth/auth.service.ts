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
    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new Error("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return this.repository.create({ email, passwordHash, name, role });
  }

  async login(email: string, password: string) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET!, { expiresIn: "15m" });
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}
