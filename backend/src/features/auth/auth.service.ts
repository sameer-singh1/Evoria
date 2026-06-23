import * as bcrypt from "bcrypt";
import { AuthRepository } from "./auth.repository";
import { Role } from "../../generated/prisma/client";

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
}
