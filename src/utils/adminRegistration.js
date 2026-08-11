export const normalizeRegistrationPayload = (body = {}) => {
  const empId = (body.emp_id ?? body.empId ?? '').toString().trim();
  const empName = (body.emp_name ?? body.empName ?? '').toString().trim();
  const email = (body.email ?? '').toString().trim().toLowerCase();
  const password = (body.password ?? '').toString();
  const location = (body.location ?? '').toString().trim();
  const roleName = (body.role_name ?? body.role ?? 'employee').toString().trim().toLowerCase();

  return {
    emp_id: empId,
    emp_name: empName,
    email,
    password,
    location,
    roleName,
  };
};

export const isAdminCreationAllowed = (existingAdminUser, requestedRole) => {
  const roleName = (requestedRole ?? '').toString().trim().toLowerCase();
  if (roleName !== 'admin') {
    return false;
  }

  return !existingAdminUser;
};
