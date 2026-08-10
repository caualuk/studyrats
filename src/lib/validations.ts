import * as z from "zod";

export const usernameField = z
  .string()
  .trim()
  .min(3, { error: "Use pelo menos 3 caracteres." })
  .max(24, { error: "Use no máximo 24 caracteres." })
  .regex(/^[a-z0-9_.]+$/i, {
    error: "Use apenas letras, números, ponto e underline.",
  });

const password = z
  .string()
  .min(8, { error: "A senha precisa de pelo menos 8 caracteres." })
  .regex(/[a-zA-Z]/, { error: "A senha precisa de pelo menos uma letra." })
  .regex(/[0-9]/, { error: "A senha precisa de pelo menos um número." });

export const SignupSchema = z
  .object({
    name: z.string().trim().min(2, { error: "Informe seu nome completo." }),
    username: usernameField,
    email: z.email({ error: "Informe um e-mail válido." }).trim(),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  identifier: z.string().trim().min(1, { error: "Informe seu e-mail ou usuário." }),
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Which challenge (if any) a check-in belongs to is chosen when *starting*
// it (see startCheckin) -- by check-out time that's already fixed, so this
// only covers the fields check-out actually collects. Split into a plain
// object (CheckoutFieldsSchema) and the refined version (CheckoutSchema)
// below because editCheckin needs `.pick()` off the former --
// `.superRefine()` returns a wrapped schema that no longer has `.pick()`.
export const CheckoutFieldsSchema = z.object({
  title: z.string().trim().min(2, { error: "Dê um título para o check-in." }).max(80),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  answeredQuestions: z.string().optional(),
  questionsTotal: z.string().trim().optional(),
  questionsCorrect: z.string().trim().optional(),
});

// questionsTotal/questionsCorrect only matter when the "respondeu questões?"
// checkbox (answeredQuestions) is on -- enforced here (both present,
// integers, total >= 1, correct <= total) only in that case; left alone
// (and stored as null) otherwise.
export const CheckoutSchema = CheckoutFieldsSchema.superRefine((data, ctx) => {
  if (data.answeredQuestions !== "on") return;

  const total = Number(data.questionsTotal);
  const totalValid = data.questionsTotal && Number.isInteger(total) && total >= 1;
  if (!totalValid) {
    ctx.addIssue({
      code: "custom",
      path: ["questionsTotal"],
      message: "Quantas questões você respondeu?",
    });
  }

  const correct = Number(data.questionsCorrect);
  const correctValid = data.questionsCorrect && Number.isInteger(correct) && correct >= 0;
  if (!correctValid) {
    ctx.addIssue({
      code: "custom",
      path: ["questionsCorrect"],
      message: "Quantas você acertou?",
    });
  } else if (totalValid && correct > total) {
    ctx.addIssue({
      code: "custom",
      path: ["questionsCorrect"],
      message: "Não pode ser maior que o total respondido.",
    });
  }
});

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

export const ChallengeCreateSchema = z.object({
  name: z.string().trim().min(3, { error: "Dê um nome para o desafio." }).max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  startDate: z.string().trim().optional().or(z.literal("")),
  endDate: z.string().trim().optional().or(z.literal("")),
  // Which weekdays (0=Sunday..6=Saturday) count for this challenge --
  // checkbox values, so a plain string array rather than a number one.
  // Falls back to every day if left empty, see createChallenge.
  weekdays: z.array(z.string()).optional(),
  coverColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, { error: "Cor inválida." })
    .optional()
    .or(z.literal("")),
});

export type ChallengeCreateInput = z.infer<typeof ChallengeCreateSchema>;

export const ChallengeUpdateSchema = z.object({
  name: z.string().trim().min(3, { error: "Dê um nome para o desafio." }).max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  startDate: z.string().trim().optional().or(z.literal("")),
  endDate: z.string().trim().optional().or(z.literal("")),
  weekdays: z.array(z.string()).optional(),
  coverColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-f]{6}$/i, { error: "Cor inválida." })
    .optional()
    .or(z.literal("")),
});

export type ChallengeUpdateInput = z.infer<typeof ChallengeUpdateSchema>;

export const ChallengeJoinSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, { error: "Código inválido." })
    .max(12, { error: "Código inválido." }),
});

export type ChallengeJoinInput = z.infer<typeof ChallengeJoinSchema>;

export const CommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, { error: "Escreva um comentário." })
    .max(500, { error: "Use no máximo 500 caracteres." }),
});

export type CommentInput = z.infer<typeof CommentSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(2, { error: "Informe seu nome completo." }),
  username: usernameField,
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/** Shared shape for useActionState-backed forms across the app. */
export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
  /** Set by actions that don't redirect, so the client can react (e.g. close a dialog). */
  success?: boolean;
} | undefined;
