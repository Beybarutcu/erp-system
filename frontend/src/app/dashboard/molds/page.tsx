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
  Box,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Wrench,
  TrendingUp,
  Eye,
} from "lucide-react";

// TODO: Replace with actual API call
interface Mold {
  id: string;
  code: string;
  name: string;
  type: string;
  material: string;
  cavities: number;
  cycleTime: number; // seconds
  totalShots: number;
  maxShots: number;
  status: "available" | "in-use" | "maintenance" | "retired";
  lastMaintenance: string;
  nextMaintenance: string;
  assignedProduct?: string;
  location: string;
}

export default function MoldsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Replace with actual API call
  const molds: Mold[] = [
    {
      id: "1",
      code: "MOLD-001",
      name: "Injection Mold - Product A",
      type: "Injection",
      material: "Steel P20",
      cavities: 4,
      cycleTime: 45,
      totalShots: 125000,
      maxShots: 500000,
      status: "in-use",
      lastMaintenance: "2025-01-15",
      nextMaintenance: "2025-03-15",
      assignedProduct: "Product A",
      location: "Machine Bay 1",
    },
    {
      id: "2",
      code: "MOLD-002",
      name: "Compression Mold - Housing",
      type: "Compression",
      material: "Steel H13",
      cavities: 2,
      cycleTime: 60,
      totalShots: 85000,
      maxShots: 300000,
      status: "available",
      lastMaintenance: "2025-02-01",
      nextMaintenance: "2025-04-01",
      location: "Mold Storage A",
    },
    {
      id: "3",
      code: "MOLD-003",
      name: "Transfer Mold - Component C",
      type: "Transfer",
      material: "Steel NAK80",
      cavities: 8,
      cycleTime: 35,
      totalShots: 450000,
      maxShots: 500000,
      status: "maintenance",
      lastMaintenance: "2025-02-10",
      nextMaintenance: "2025-02-20",
      location: "Maintenance Shop",
    },
    {
      id: "4",
      code: "MOLD-004",
      name: "Blow Mold - Container",
      type: "Blow",
      material: "Aluminum",
      cavities: 6,
      cycleTime: 40,
      totalShots: 180000,
      maxShots: 400000,
      status: "available",
      lastMaintenance: "2025-01-20",
      nextMaintenance: "2025-03-20",
      location: "Mold Storage B",
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      available: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
      "in-use": { bg: "bg-blue-100 text-blue-800", icon: Box },
      maintenance: { bg: "bg-amber-100 text-amber-800", icon: Wrench },
      retired: { bg: "bg-gray-100 text-gray-800", icon: AlertTriangle },
    };
    return styles[status as keyof typeof styles] || styles.available;
  };

  const getLifespanPercentage = (totalShots: number, maxShots: number) => {
    return ((totalShots / maxShots) * 100).toFixed(1);
  };

  const getLifespanColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  const isMaintenanceDue = (nextMaintenance: string) => {
    const today = new Date();
    const maintenanceDate = new Date(nextMaintenance);
    const daysUntil = Math.ceil(
      (maintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 7;
  };

  const totalMolds = molds.length;
  const availableMolds = molds.filter((m) => m.status === "available").length;
  const inUseMolds = molds.filter((m) => m.status === "in-use").length;
  const maintenanceMolds = molds.filter((m) => m.status === "maintenance").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mold Management</h1>
          <p className="text-muted-foreground">
            Track and manage production molds
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Mold
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Molds</p>
              <p className="text-2xl font-bold">{totalMolds}</p>
            </div>
            <Box className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{availableMolds}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Use</p>
              <p className="text-2xl font-bold">{inUseMolds}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-2xl font-bold">{maintenanceMolds}</p>
            </div>
            <Wrench className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search molds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in-use">In Use</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mold</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Cavities</TableHead>
              <TableHead>Cycle Time</TableHead>
              <TableHead>Lifespan</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {molds.map((mold) => {
              const statusConfig = getStatusBadge(mold.status);
              const StatusIcon = statusConfig.icon;
              const lifespanPct = parseFloat(
                getLifespanPercentage(mold.totalShots, mold.maxShots)
              );
              const maintenanceDue = isMaintenanceDue(mold.nextMaintenance);

              return (
                <TableRow key={mold.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{mold.code}</p>
                      <p className="text-sm text-muted-foreground">
                        {mold.name}
                      </p>
                      {mold.assignedProduct && (
                        <p className="text-xs text-blue-600">
                          → {mold.assignedProduct}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{mold.type}</TableCell>
                  <TableCell>{mold.cavities}</TableCell>
                  <TableCell>{mold.cycleTime}s</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className={`h-2 rounded-full ${getLifespanColor(
                              lifespanPct
                            )}`}
                            style={{ width: `${lifespanPct}%` }}
                          />
                        </div>
                        <span className="text-xs">{lifespanPct}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {mold.totalShots.toLocaleString()}/
                        {mold.maxShots.toLocaleString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {new Date(mold.nextMaintenance).toLocaleDateString()}
                      </p>
                      {maintenanceDue && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs">Due soon</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{mold.location}</p>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${statusConfig.bg}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {mold.status}
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
