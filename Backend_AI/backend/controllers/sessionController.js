/* Clerk session controller deprecated and commented out as per manual JWT migration `const User = require("../models/User");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const Invitation = require("../models/Invitation");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const { env } = require("../config/env");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const { ROLES } = require("../constants/roles");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const { DASHBOARD_REDIRECTS, ALLOWED_BASE_PATHS } = require("../constants/navigation");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const { logger } = require("../utils/logger");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const LOGIN_INTENTS = Object.freeze({` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  STUDENT: "student",` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ADMINISTRATION: "administration",` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  PLATFORM_ADMIN: "main",` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `});` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const ADMIN_LOGIN_ROLES = Object.freeze([` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.PRINCIPAL,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.HOD,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.PLACEMENT_OFFICER,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `]);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `const SUPPORTED_SESSION_ROLES = Object.freeze([` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.PLATFORM_ADMIN,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.PRINCIPAL,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.HOD,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.PLACEMENT_OFFICER,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ROLES.STUDENT,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `]);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `function normalizeRole(role, email) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (email === env.platformAdminEmail) return ROLES.PLATFORM_ADMIN;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (role === ROLES.PLACEMENT) return ROLES.PLACEMENT_OFFICER;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (role === ROLES.STANDALONE_STUDENT) return ROLES.STUDENT;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return role || ROLES.STUDENT;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `function normalizeSelectedRole(role) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const value = String(role || "").trim().toLowerCase();` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!value) return null;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (value === ROLES.PLACEMENT) return ROLES.PLACEMENT_OFFICER;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return value;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `function computeRedirectTo(role, isStandalone) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (role === ROLES.STUDENT && isStandalone) return DASHBOARD_REDIRECTS[ROLES.STANDALONE_STUDENT];` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (DASHBOARD_REDIRECTS[role]) return DASHBOARD_REDIRECTS[role];` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return "/login";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `function computeAllowedBasePaths(role, isStandalone) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (role === ROLES.STUDENT && isStandalone) return ALLOWED_BASE_PATHS[ROLES.STANDALONE_STUDENT];` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (ALLOWED_BASE_PATHS[role]) return ALLOWED_BASE_PATHS[role];` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return [];` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `function assertLoginIntent(role, intent, selectedRole) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const normalizedIntent = String(intent || "").trim().toLowerCase();` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!normalizedIntent) return;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!Object.values(LOGIN_INTENTS).includes(normalizedIntent)) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    const error = new Error("Invalid login intent");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    error.statusCode = 400;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    error.code = "INVALID_LOGIN_INTENT";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (normalizedIntent === LOGIN_INTENTS.STUDENT) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (role === ROLES.PLATFORM_ADMIN) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      const error = new Error("Platform admin must use /main");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.statusCode = 403;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.code = "LOGIN_ROUTE_MISMATCH";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (ADMIN_LOGIN_ROLES.includes(role)) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      const error = new Error("Administrative accounts must use /administration-login");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.statusCode = 403;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.code = "LOGIN_ROUTE_MISMATCH";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (normalizedIntent === LOGIN_INTENTS.ADMINISTRATION) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    const normalizedSelectedRole = normalizeSelectedRole(selectedRole);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (!normalizedSelectedRole || !ADMIN_LOGIN_ROLES.includes(normalizedSelectedRole)) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      const error = new Error("Role selection is required for administration login");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.statusCode = 400;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.code = "ROLE_SELECTION_REQUIRED";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (normalizedSelectedRole !== role) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      const error = new Error("Invalid Role Selected");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.statusCode = 403;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.code = "INVALID_ROLE_SELECTED";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (normalizedIntent === LOGIN_INTENTS.PLATFORM_ADMIN) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (role !== ROLES.PLATFORM_ADMIN) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      const error = new Error("Unauthorized access to /main");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.statusCode = 403;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      error.code = "PLATFORM_ADMIN_ONLY";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `exports.assertLoginIntent = assertLoginIntent;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `async function getActiveInvitation(email) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  let invitation = await Invitation.findOne({` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    email,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    status: { $in: ["pending", "invited"] },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  })` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    .sort({ updatedAt: -1 })` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    .lean();` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!invitation) return null;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() <= Date.now()) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    await Invitation.updateOne(` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      { _id: invitation._id, status: { $in: ["pending", "invited"] } },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      { $set: { status: "expired" } },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    );` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return null;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return invitation;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `async function resolveStudentScope(existing, email) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (existing?.collegeId && existing?.departmentId) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      collegeId: existing.collegeId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      departmentId: existing.departmentId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      isStandalone: false,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const invitation = await getActiveInvitation(email);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!invitation) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      collegeId: null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      departmentId: null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      isStandalone: true,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  await Invitation.updateOne(` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    { _id: invitation._id, status: { $in: ["pending", "invited"] } },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    { $set: { status: "accepted", acceptedAt: new Date() } },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  );` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    collegeId: invitation.collegeId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    departmentId: invitation.departmentId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    isStandalone: false,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `async function resolveInternalUser(clerkUserId, email) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const existing = await User.findOne({` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    $or: [{ clerkId: clerkUserId }, { email }],` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  });` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const role = normalizeRole(existing?.role, email);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!SUPPORTED_SESSION_ROLES.includes(role)) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    const error = new Error("Role is not supported for this authentication flow");` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    error.statusCode = 403;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    error.code = "ROLE_NOT_SUPPORTED";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    throw error;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (role === ROLES.PLATFORM_ADMIN) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      existing,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      role,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      collegeId: null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      departmentId: null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      isStandalone: false,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (ADMIN_LOGIN_ROLES.includes(role)) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      existing,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      role,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      collegeId: existing?.collegeId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      departmentId: existing?.departmentId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      isStandalone: false,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const studentScope = await resolveStudentScope(existing, email);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    existing,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    role: ROLES.STUDENT,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    collegeId: studentScope.collegeId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    departmentId: studentScope.departmentId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    isStandalone: studentScope.isStandalone,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `async function buildSession(req, options = {}) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const { clerkUserId, email } = req.clerkUser;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const loginIntent = options.loginIntent || null;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const selectedRole = options.selectedRole || null;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const resolved = await resolveInternalUser(clerkUserId, email);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  assertLoginIntent(resolved.role, loginIntent, selectedRole);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const update = {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    clerkId: clerkUserId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    email,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    role: resolved.role,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    collegeId: resolved.collegeId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    departmentId: resolved.departmentId,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    isStandalone: resolved.isStandalone,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  if (!resolved.existing) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    update.name = email.split("@")[0];` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const userLookup = resolved.existing?._id` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    ? { _id: resolved.existing._id }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    : { email };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const user = await User.findOneAndUpdate(` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    userLookup,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    { $set: update },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    { new: true, upsert: true, setDefaultsOnInsert: true },` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  ).lean();` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const redirectTo = computeRedirectTo(user.role, !!user.isStandalone);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  const allowedBasePaths = computeAllowedBasePaths(user.role, !!user.isStandalone);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  return {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    role: user.role,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    collegeId: user.collegeId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    departmentId: user.departmentId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    isStandalone: !!user.isStandalone,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    redirectTo,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    allowedBasePaths,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  };` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `}` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `/**` */
/* Clerk session controller deprecated and commented out as per manual JWT migration ` * GET /api/session` */
/* Clerk session controller deprecated and commented out as per manual JWT migration ` * Returns authenticated backend session for Clerk user.` */
/* Clerk session controller deprecated and commented out as per manual JWT migration ` */` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `exports.getSession = async (req, res, next) => {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  try {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    const payload = await buildSession(req);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    logger.info("session_fetched", {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      requestId: req.requestId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      role: payload?.role,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      redirectTo: payload?.redirectTo,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    });` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return res.json(payload);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  } catch (error) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    logger.warn("session_fetch_failed", {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      requestId: req.requestId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      clerkUserId: req.clerkUser?.clerkUserId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      code: error.code || "SESSION_FETCH_FAILED",` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      message: error.message,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    });` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (!error.statusCode) error.statusCode = 500;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (!error.code) error.code = "SESSION_FETCH_FAILED";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return next(error);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `};` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `/**` */
/* Clerk session controller deprecated and commented out as per manual JWT migration ` * POST /api/session/initialize` */
/* Clerk session controller deprecated and commented out as per manual JWT migration ` * Initializes session using explicit login intent from frontend route.` */
/* Clerk session controller deprecated and commented out as per manual JWT migration ` */` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `exports.initializeSession = async (req, res, next) => {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  try {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    const payload = await buildSession(req, {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      loginIntent: req.body?.loginIntent,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      selectedRole: req.body?.selectedRole,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    });` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    logger.info("session_initialized", {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      requestId: req.requestId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      loginIntent: req.body?.loginIntent,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      role: payload?.role,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      redirectTo: payload?.redirectTo,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    });` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return res.json(payload);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  } catch (error) {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    logger.warn("session_initialize_failed", {` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      requestId: req.requestId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      clerkUserId: req.clerkUser?.clerkUserId || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      email: req.clerkUser?.email || null,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      code: error.code || "SESSION_INIT_FAILED",` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `      message: error.message,` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    });` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (!error.statusCode) error.statusCode = 500;` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    if (!error.code) error.code = "SESSION_INIT_FAILED";` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `    return next(error);` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `  }` */
/* Clerk session controller deprecated and commented out as per manual JWT migration `};` */
