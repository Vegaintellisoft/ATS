import { useState, useEffect } from "react";
import { toast } from "../components/common/Toast";
import { createUser, listUsers } from "../api/user";
import { listRoles } from "../api/role";
import { PageHeader } from "../components/layout/PageHeader";
import { useAuth } from "../context/AuthContext";
import { type User, type Role } from "../types";

export function CreateUserPage() {
  const { user: currentUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [reportingPersonId, setReportingPersonId] = useState("");
  const [role, setRole] = useState("TEAM_MEMBER");
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword] = useState(false);

  useEffect(() => {
    // Load potential managers and dynamic roles
    Promise.all([
      listUsers(),
      listRoles(currentUser?.organizationId || undefined)
    ])
      .then(([u, r]) => {
        setUsers(u);
        setRoles(r);
        if (r.length > 0) setRole(r[0].name);
      })
      .catch(console.error);
  }, []);

  const isValid =
    email.trim() &&
    password.trim() &&
    password.length >= 6 &&
    password === confirmPassword &&
    role.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsSubmitting(true);
      await createUser({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        employeeCode: employeeCode.trim() || undefined,
        department: department.trim() || undefined,
        reportingPersonId: reportingPersonId || undefined,
        role,
      });
      toast.success(`User "${email.trim()}" created successfully!`);
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setEmployeeCode("");
      setDepartment("");
      setReportingPersonId("");
      setRole("TEAM_MEMBER");
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        icon="➕"
        title="Create New User"
        description="Set up a new corporate user account with role and reporting hierarchy."
      />
      <div className="page-body">
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div className="glass-card" style={{ padding: "2rem", borderRadius: "16px" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                
                {/* Email (Full width) */}
                <div className="create-user-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Email Address <span style={{ color: "var(--accent-primary)" }}>*</span></label>
                  <input
                    type="email"
                    className="login-input"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Password */}
                <div className="create-user-field">
                  <label>Password <span style={{ color: "var(--accent-primary)" }}>*</span></label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    minLength={6}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Confirm Password */}
                <div className="create-user-field">
                  <label>Confirm Password <span style={{ color: "var(--accent-primary)" }}>*</span></label>
                  <input
                    type="password"
                    className="login-input"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Full Name */}
                <div className="create-user-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Employee Code */}
                <div className="create-user-field">
                  <label>Employee Code</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="EMP-1001"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Phone */}
                <div className="create-user-field">
                  <label>Phone</label>
                  <input
                    type="tel"
                    className="login-input"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Department */}
                <div className="create-user-field">
                  <label>Department</label>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="e.g. Sales, HR"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  />
                </div>

                {/* Role */}
                <div className="create-user-field">
                  <label>Role</label>
                  <select
                    className="login-input"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Reporting Person */}
                <div className="create-user-field">
                  <label>Reporting To</label>
                  <select
                    className="login-input login-select"
                    value={reportingPersonId}
                    onChange={(e) => setReportingPersonId(e.target.value)}
                    disabled={isSubmitting}
                    style={{ width: "100%", height: "44px", padding: "0 16px" }}
                  >
                    <option value="">None (Top Level)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} ({u.role?.name})</option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="search-btn"
                  disabled={isSubmitting || !isValid}
                  style={{ gridColumn: "1 / -1", height: "48px", marginTop: "16px" }}
                >
                  {isSubmitting ? "Creating User..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
