export interface Employee {
  uId: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  salary: string;
  paidSalary: number;
  profileStatus: string;
  userType: string;
  createdAt: string;
  assignedCompany: Record<string, AssignedCompanyDetails>;
  salaryHistory: Record<string, SalaryRecord>;
}

export interface AssignedCompanyDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPersons: string;
  salary: number;
  status: string;
}

export interface SalaryRecord {
  paidSalary: number;
  salaryStatus: string;
}