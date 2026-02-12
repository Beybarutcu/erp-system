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
  Beaker,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  AlertCircle,
  Eye,
} from "lucide-react";

// TODO: Replace with actual API call
interface Sample {
  id: string;
  sampleNumber: string;
  productName: string;
  purpose: "development" | "customer-demo" | "quality-test" | "trade-show" | "internal-test";
  requestedBy: string;
  requestDate: string;
  requiredDate: string;
  quantity: number;
  status: "pending" | "in-progress" | "completed" | "cancelled" | "delayed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  completionDate?: string;
  notes?: string;
}

export default function SamplesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Replace with actual API call
  const samples: Sample[] = [
    {
      id: "1",
      sampleNumber: "SMP-2025-001",
      productName: "New Product Prototype A",
      purpose: "development",
      requestedBy: "R&D Team",
      requestDate: "2025-02-10",
      requiredDate: "2025-02-20",
      quantity: 10,
      status: "in-progress",
      priority: "high",
      assignedTo: "John Doe",
      notes: "First iteration for design validation",
    },
    {
      id: "2",
      sampleNumber: "SMP-2025-002",
      productName: "Product B - Modified",
      purpose: "customer-demo",
      requestedBy: "Sales Team",
      requestDate: "2025-02-11",
      requiredDate: "2025-02-15",
      quantity: 5,
      status: "completed",
      priority: "urgent",
      assignedTo: "Jane Smith",
      completionDate: "2025-02-14",
      notes: "Customer meeting scheduled for Feb 16",
    },
    {
      id: "3",
      sampleNumber: "SMP-2025-003",
      productName: "Component C - Test Batch",
      purpose: "quality-test",
      requestedBy: "Quality Team",
      requestDate: "2025-02-09",
      requiredDate: "2025-02-18",
      quantity: 50,
      status: "completed",
      priority: "medium",
      assignedTo: "Mike Johnson",
      completionDate: "2025-02-12",
      notes: "Material certification testing",
    },
    {
      id: "4",
      sampleNumber: "SMP-2025-004",
      productName: "Exhibition Display Units",
      purpose: "trade-show",
      requestedBy: "Marketing Team",
      requestDate: "2025-02-12",
      requiredDate: "2025-03-01",
      quantity: 20,
      status: "pending",
      priority: "medium",
      notes: "Trade show in March",
    },
    {
      id: "5",
      sampleNumber: "SMP-2025-005",
      productName: "Product D - Color Variants",
      purpose: "internal-test",
      requestedBy: "Production Team",
      requestDate: "2025-02-08",
      requiredDate: "2025-02-12",
      quantity: 15,
      status: "delayed",
      priority: "low",
      assignedTo: "Sarah Williams",
      notes: "Material availability issue",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: "bg-gray-100 text-gray-800", icon: Clock },
      "in-progress": { bg: "bg-blue-100 text-blue-800", icon: Package },
      completed: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelled: { bg: "bg-red-100 text-red-800", icon: XCircle },
      delayed: { bg: "bg-amber-100 text-amber-800", icon: AlertCircle },
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-amber-100 text-amber-800",
      urgent: "bg-red-100 text-red-800",
    };
    return styles[priority as keyof typeof styles] || styles.medium;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels = {
      development: "Development",
      "customer-demo": "Customer Demo",
      "quality-test": "Quality Test",
      "trade-show": "Trade Show",
      "internal-test": "Internal Test",
    };
    return labels[purpose as keyof typeof labels] || purpose;
  };

  const isOverdue = (requiredDate: string, status: string) => {
    if (status === "completed" || status === "cancelled") return false;
    const today = new Date();
    const dueDate = new Date(requiredDate);
    return dueDate < today;
  };

  const totalSamples = samples.length;
  const pendingSamples = samples.filter(
    (s) => s.status === "pending" || s.status === "in-progress"
  ).length;
  const completedSamples = samples.filter((s) => s.status === "completed").length;
  const urgentSamples = samples.filter((s) => s.priority === "urgent").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sample Management</h1>
          <p className="text-muted-foreground">
            Track sample requests and production
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Sample Request
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Samples</p>
              <p className="text-2xl font-bold">{totalSamples}</p>
            </div>
            <Beaker className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingSamples}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedSamples}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Urgent</p>
              <p className="text-2xl font-bold">{urgentSamples}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search samples..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select value={purposeFilter} onValueChange={setPurposeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Purposes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purposes</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="customer-demo">Customer Demo</SelectItem>
            <SelectItem value="quality-test">Quality Test</SelectItem>
            <SelectItem value="trade-show">Trade Show</SelectItem>
            <SelectItem value="internal-test">Internal Test</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sample #</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Required Date</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samples.map((sample) => {
              const statusConfig = getStatusBadge(sample.status);
              const StatusIcon = statusConfig.icon;
              const overdue = isOverdue(sample.requiredDate, sample.status);

              return (
                <TableRow key={sample.id}>
                  <TableCell>
                    <p className="font-medium">{sample.sampleNumber}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{sample.productName}</p>
                  </TableCell>
                  <TableCell>{getPurposeLabel(sample.purpose)}</TableCell>
                  <TableCell>{sample.requestedBy}</TableCell>
                  <TableCell>{sample.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          overdue ? "text-red-600 font-medium" : undefined
                        }
                      >
                        {new Date(sample.requiredDate).toLocaleDateString()}
                      </span>
                      {overdue && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium capitalize ${getPriorityBadge(
                        sample.priority
                      )}`}
                    >
                      {sample.priority}
                    </span>
                  </TableCell>
                  <TableCell>
                    {sample.assignedTo || (
                      <span className="text-muted-foreground text-sm">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${statusConfig.bg}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {sample.status}
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
