"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { SmartPagination } from "@/components/ui/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Clock,
  Award,
  Eye,
} from "lucide-react";

// TODO: Replace with actual API call
interface Personnel {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  shift: "morning" | "afternoon" | "night";
  status: "active" | "on-leave" | "inactive";
  skillLevel: "trainee" | "operator" | "senior" | "expert";
  hireDate: string;
  certifications: string[];
  assignedMachine?: string;
  email: string;
  phone: string;
}

export default function PersonnelPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Replace with actual API call
  const personnel: Personnel[] = [
    {
      id: "1",
      employeeId: "EMP-001",
      name: "John Doe",
      department: "Production",
      position: "Machine Operator",
      shift: "morning",
      status: "active",
      skillLevel: "senior",
      hireDate: "2020-03-15",
      certifications: ["Injection Molding", "Safety Level 2"],
      assignedMachine: "Machine 1",
      email: "john.doe@company.com",
      phone: "+1-555-0101",
    },
    {
      id: "2",
      employeeId: "EMP-002",
      name: "Jane Smith",
      department: "Quality Control",
      position: "QC Inspector",
      shift: "morning",
      status: "active",
      skillLevel: "expert",
      hireDate: "2018-06-20",
      certifications: ["ISO 9001", "Six Sigma Green Belt"],
      email: "jane.smith@company.com",
      phone: "+1-555-0102",
    },
    {
      id: "3",
      employeeId: "EMP-003",
      name: "Mike Johnson",
      department: "Maintenance",
      position: "Technician",
      shift: "afternoon",
      status: "active",
      skillLevel: "senior",
      hireDate: "2019-01-10",
      certifications: ["Electrical", "Mechanical", "Hydraulics"],
      email: "mike.j@company.com",
      phone: "+1-555-0103",
    },
    {
      id: "4",
      employeeId: "EMP-004",
      name: "Sarah Williams",
      department: "Production",
      position: "Production Supervisor",
      shift: "night",
      status: "active",
      skillLevel: "expert",
      hireDate: "2017-09-05",
      certifications: ["Leadership", "Lean Manufacturing"],
      email: "sarah.w@company.com",
      phone: "+1-555-0104",
    },
    {
      id: "5",
      employeeId: "EMP-005",
      name: "Tom Brown",
      department: "Production",
      position: "Trainee Operator",
      shift: "morning",
      status: "active",
      skillLevel: "trainee",
      hireDate: "2024-11-01",
      certifications: ["Basic Safety"],
      email: "tom.brown@company.com",
      phone: "+1-555-0105",
    },
    {
      id: "6",
      employeeId: "EMP-006",
      name: "Emily Davis",
      department: "Warehouse",
      position: "Warehouse Clerk",
      shift: "afternoon",
      status: "on-leave",
      skillLevel: "operator",
      hireDate: "2021-04-12",
      certifications: ["Forklift", "Inventory Management"],
      email: "emily.d@company.com",
      phone: "+1-555-0106",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: { bg: "bg-green-100 text-green-800", icon: UserCheck },
      "on-leave": { bg: "bg-amber-100 text-amber-800", icon: Clock },
      inactive: { bg: "bg-gray-100 text-gray-800", icon: UserX },
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  const getSkillLevelBadge = (level: string) => {
    const styles = {
      trainee: "bg-blue-100 text-blue-800",
      operator: "bg-green-100 text-green-800",
      senior: "bg-purple-100 text-purple-800",
      expert: "bg-amber-100 text-amber-800",
    };
    return styles[level as keyof typeof styles] || styles.operator;
  };

  const getShiftBadge = (shift: string) => {
    const styles = {
      morning: "bg-yellow-100 text-yellow-800",
      afternoon: "bg-orange-100 text-orange-800",
      night: "bg-indigo-100 text-indigo-800",
    };
    return styles[shift as keyof typeof styles] || styles.morning;
  };

  const totalPersonnel = personnel.length;
  const activePersonnel = personnel.filter((p) => p.status === "active").length;
  const onLeave = personnel.filter((p) => p.status === "on-leave").length;
  const productionStaff = personnel.filter(
    (p) => p.department === "Production"
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personnel Management</h1>
          <p className="text-muted-foreground">
            Manage employees and workforce
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Personnel</p>
              <p className="text-2xl font-bold">{totalPersonnel}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activePersonnel}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Leave</p>
              <p className="text-2xl font-bold">{onLeave}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Production</p>
              <p className="text-2xl font-bold">{productionStaff}</p>
            </div>
            <Award className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Production">Production</SelectItem>
            <SelectItem value="Quality Control">Quality Control</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
            <SelectItem value="Warehouse">Warehouse</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Skill Level</TableHead>
              <TableHead>Certifications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personnel.map((person) => {
              const statusConfig = getStatusBadge(person.status);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow key={person.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.employeeId}
                      </p>
                      {person.assignedMachine && (
                        <p className="text-xs text-blue-600">
                          → {person.assignedMachine}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{person.department}</TableCell>
                  <TableCell>{person.position}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getShiftBadge(
                        person.shift
                      )}`}
                    >
                      {person.shift}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getSkillLevelBadge(
                        person.skillLevel
                      )}`}
                    >
                      {person.skillLevel}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {person.certifications.slice(0, 2).map((cert, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                        >
                          {cert}
                        </span>
                      ))}
                      {person.certifications.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{person.certifications.length - 2}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${statusConfig.bg}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {person.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <SmartPagination
        currentPage={currentPage}
        totalPages={2}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
