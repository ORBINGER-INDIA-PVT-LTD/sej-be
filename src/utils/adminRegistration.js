export const normalizeRegistrationPayload = (body = {}) => {
  const empId = (body.emp_id ?? body.empId ?? body.employee_id ?? body.employeeId ?? body['Employee ID'] ?? '').toString().trim();
  const empName = (body.emp_name ?? body.empName ?? body.employee_name ?? body.employeeName ?? body['Employee Name'] ?? body.name ?? '').toString().trim();
  const email = (body.email ?? body.Email ?? '').toString().trim().toLowerCase();
  const password = (body.password ?? body.Password ?? '').toString();
  const location = (body.location ?? body.Location ?? '').toString().trim();
  const roleName = (body.role_name ?? body.roleName ?? body.role ?? body.Role ?? 'employee').toString().trim().toLowerCase();

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
