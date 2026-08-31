import type { Request, Response } from "express";
import * as accountService from "../services/account.service.js";
import { AuthRequest } from "../types/auth.js";

export async function getAccountsHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  try {
    if (!user.organizationId) {
      return res.status(403).json({ success: false, error: "User is not part of an organization" });
    }
    const accounts = await accountService.getAccounts(user.organizationId);
    return res.status(200).json({ success: true, data: accounts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch accounts" });
  }
}

export async function getAccountByIdHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;
  try {
    const account = await accountService.getAccountById(id as string);
    if (!account) return res.status(404).json({ success: false, error: "Account not found" });

    if (user.role.name !== "ADMIN" && account.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    return res.status(200).json({ success: true, data: account });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to fetch account" });
  }
}

export async function createAccountHandler(req: Request, res: Response) {
  const user = (req as AuthRequest).user;
  const data = req.body;

  if (!user.organizationId) {
    return res.status(403).json({ success: false, error: "User is not part of an organization" });
  }

  if (!data.displayName) {
    return res.status(400).json({ success: false, error: "Account display name is required" });
  }

  try {
    const account = await accountService.createAccount({
      ...data,
      organizationId: user.organizationId,
      createdById: user.id,
    });
    return res.status(201).json({ success: true, data: account });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to create account" });
  }
}

export async function updateAccountHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;
  const data = req.body;

  try {
    const account = await accountService.getAccountById(id as string);
    if (!account) return res.status(404).json({ success: false, error: "Account not found" });

    if (user.role.name !== "ADMIN" && account.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const updated = await accountService.updateAccount(id as string, data);
    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to update account" });
  }
}

export async function deleteAccountHandler(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as AuthRequest).user;

  try {
    const account = await accountService.getAccountById(id as string);
    if (!account) return res.status(404).json({ success: false, error: "Account not found" });

    if (user.role.name !== "ADMIN" && account.organizationId !== user.organizationId) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    await accountService.deleteAccount(id as string);
    return res.status(204).send();
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Failed to delete account" });
  }
}
