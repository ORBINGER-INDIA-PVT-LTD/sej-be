export const normalizeLoginPayload = (body = {}) => {
  const password =
    typeof body.password === "string" ? body.password.trim() : body.password;

  const identifier =
    (body.identifier ?? body.email ?? body.emp_id ?? body.username ?? "")
      .toString()
      .trim();

  return {
    identifier,
    password,
  };
};
