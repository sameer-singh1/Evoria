import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  private service = new AuthService();

  async register(req: Request, res: Response) {
    const { email, password, name, role } = req.body;

    try {
      const user = await this.service.register(email, password, name, role);
      res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
      res.status(409).json({ error: { message: "Email already registered" } });
    }
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
      const result = await this.service.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: { message: "Invalid credentials" } });
    }
  }
}
