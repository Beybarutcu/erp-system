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
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";

// TODO: Replace with actual API call
interface QualityInspection {
  id: string;
  inspectionNumber: string;
  lotNumber: string;
  productName: string;
  inspectionType: "incoming" | "in-process" | "final" | "random";
  inspectionDate: string;
  inspector: string;
  sampledQuantity: number;
  passedQuantity: number;
  failedQuantity: number;
  defectRate: number;
  status: "pending" | "passed" | "failed" | "conditional";
  notes?: string;
}

export default function QualityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Replace with actual API call
  const inspections: QualityInspection[] = [
    {
      id: "1",
      inspectionNumber: "QC-2025-001",
      lotNumber: "LOT-2025-02-10-001",
      productName: "Product A",
      inspectionType: "final",
      inspectionDate: "2025-02-12",
      inspector: "John Doe",
      sampledQuantity: 100,
      passedQuantity: 98,
      failedQuantity: 2,
      defectRate: 2.0,
      status: "passed",
      notes: "Minor cosmetic defects on 2 units",
    },
    {
      id: "2",
      inspectionNumber: "QC-2025-002",
      lotNumber: "LOT-2025-02-11-002",
      productName: "Component B",
      inspectionType: "in-process",
      inspectionDate: "2025-02-12",
      inspector: "Jane Smith",
      sampledQuantity: 50,
      passedQuantity: 45,
      failedQuantity: 5,
      defectRate: 10.0,
      status: "conditional",
      notes: "Dimensional tolerance issues, production adjusted",
    },
    {
      id: "3",
      inspectionNumber: "QC-2025-003",
      lotNumber: "LOT-2025-02-09-003",
      productName: "Housing C",
      inspectionType: "incoming",
      inspectionDate: "2025-02-11",
      inspector: "Mike Johnson",
      sampledQuantity: 200,
      passedQuantity: 180,
      failedQuantity: 20,
      defectRate: 10.0,
      status: "failed",
      notes: "Supplier material quality issue, batch rejected",
    },
    {
      id: "4",
      inspectionNumber: "QC-2025-004",
      lotNumber: "LOT-2025-02-12-004",
      productName: "Product D",
      inspectionType: "random",
      inspectionDate: "2025-02-12",
      inspector: "Sarah Williams",
      sampledQuantity: 30,
      passedQuantity: 30,
      failedQuantity: 0,
      defectRate: 0,
      status: "passed",
    },
    {
      id: "5",
      inspectionNumber: "QC-2025-005",
      lotNumber: "LOT-2025-02-12-005",
      productName: "Assembly E",
      inspectionType: "final",
      inspectionDate: "2025-02-12",
      inspector: "John Doe",
      sampledQuantity: 80,
      passedQuantity: 0,
      failedQuantity: 0,
      defectRate: 0,
      status: "pending",
      notes: "Awaiting measurement results",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: "bg-gray-100 text-gray-800", icon: AlertCircle },
      passed: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { bg: "bg-red-100 text-red-800", icon: XCircle },
      conditional: { bg: "bg-amber-100 text-amber-800", icon: AlertCircle },
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getInspectionTypeLabel = (type: string) => {
    const labels = {
      incoming: "Incoming",
      "in-process": "In-Process",
      final: "Final",
      random: "Random",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const totalInspections = inspections.length;
  const passedInspections = inspections.filter(
    (i) => i.status === "passed"
  ).length;
  const failedInspections = inspections.filter(
    (i) => i.status === "failed"
  ).length;
  const passRate = ((passedInspections / totalInspections) * 100).toFixed(1);
  const avgDefectRate = (
    inspections.reduce((sum, i) => sum + i.defectRate, 0) / totalInspections
  ).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quality Control</h1>
          <p className="text-muted-foreground">
            Track quality inspections and defect rates
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Inspection
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Inspections</p>
              <p className="text-2xl font-bold">{totalInspections}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold text-green-600">{passRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold text-red-600">
                {failedInspections}
              </p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Defect Rate</p>
              <p className="text-2xl font-bold">{avgDefectRate}%</p>
            </div>
            <TrendingDown className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search inspections..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
            <SelectItem value="in-process">In-Process</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="random">Random</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="conditional">Conditional</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inspection #</TableHead>
              <TableHead>Product / Lot</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Inspector</TableHead>
              <TableHead>Sample Size</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Defect Rate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspections.map((inspection) => {
              const statusConfig = getStatusBadge(inspection.status);
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow key={inspection.id}>
                  <TableCell>
                    <p className="font-medium">{inspection.inspectionNumber}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{inspection.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {inspection.lotNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getInspectionTypeLabel(inspection.inspectionType)}
                  </TableCell>
                  <TableCell>
                    {new Date(inspection.inspectionDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{inspection.inspector}</TableCell>
                  <TableCell>{inspection.sampledQuantity}</TableCell>
                  <TableCell>
                    {inspection.status !== "pending" ? (
                      <div className="text-sm">
                        <p className="text-green-600 font-medium">
                          ✓ {inspection.passedQuantity} passed
                        </p>
                        {inspection.failedQuantity > 0 && (
                          <p className="text-red-600">
                            ✗ {inspection.failedQuantity} failed
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        Pending
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {inspection.status !== "pending" ? (
                      <span
                        className={`font-medium ${
                          inspection.defectRate === 0
                            ? "text-green-600"
                            : inspection.defectRate < 5
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {inspection.defectRate}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${statusConfig.bg}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {inspection.status}
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
        totalPages={3}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
