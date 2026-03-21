import { NextFunction, Request, Response, Router } from "express";
import { UserRoleManagementService } from "../services/user-role-management.service.js";

const service = new UserRoleManagementService();
export const userRoleManagementRouter = Router();

userRoleManagementRouter.get("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const users = await service.listUsers(role, status);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

userRoleManagementRouter.get("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await service.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

userRoleManagementRouter.post("/users", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await service.createUser(req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

userRoleManagementRouter.patch("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await service.updateUser(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

userRoleManagementRouter.delete("/users/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await service.deactivateUser(req.params.id);
    if (!ok) {
      res.status(404).json({ message: "User not found or already inactive" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

userRoleManagementRouter.put(
  "/students/:userId/profile",
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await service.upsertStudentProfile({
      ...req.body,
      userId: req.params.userId,
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
  },
);

userRoleManagementRouter.put(
  "/staff/:userId/profile",
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await service.upsertStaffProfile({
      ...req.body,
      userId: req.params.userId,
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
  },
);
