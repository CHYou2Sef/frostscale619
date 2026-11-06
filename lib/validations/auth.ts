/**
 * FROSTSCALE619 — Auth validation schemas
 */

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Adresse e-mail invalide")
    .max(254, "L'adresse e-mail est trop longue"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(128, "Le mot de passe est trop long"),
});

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Le nom complet doit contenir au moins 2 caractères")
      .max(100, "Le nom complet ne peut pas dépasser 100 caractères")
      .trim(),
    email: z
      .string()
      .email("Adresse e-mail invalide")
      .max(254, "L'adresse e-mail est trop longue"),
    password: z
      .string()
      .min(6, "Le mot de passe doit contenir au moins 6 caractères")
      .max(128, "Le mot de passe est trop long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
