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
  Warehouse, 
  Plus, 
  Search, 
  MapPin, 
  Package, 
  TrendingUp,
  Edit,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

// TODO: Replace with actual API call
interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  type: "warehouse" | "rack" | "shelf" | "bin";
  capacity: number;
  currentOccupancy: number;
  status: "active" | "inactive" | "maintenance";
  parentLocation?: string;
  temperature?: number;
  humidity?: number;
}

export default function WarehousePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Replace with actual API call
  const warehouses: WarehouseLocation[] = [
    {
      id: "1",
      code: "WH-A",
      name: "Main Warehouse A",
      type: "warehouse",
      capacity: 10000,
      currentOccupancy: 7500,
      status: "active",
      temperature: 22,
      humidity: 45,
    },
    {
      id: "2",
      code: "WH-A-R01",
      name: "Warehouse A - Rack 01",
      type: "rack",
      capacity: 500,
      currentOccupancy: 450,
      status: "active",
      parentLocation: "WH-A",
    },
    {
      id: "3",
      code: "WH-A-R02",
      name: "Warehouse A - Rack 02",
      type: "rack",
      capacity: 500,
      currentOccupancy: 380,
      status: "active",
      parentLocation: "WH-A",
    },
    {
      id: "4",
      code: "WH-B",
      name: "Cold Storage B",
      type: "warehouse",
      capacity: 5000,
      currentOccupancy: 3200,
      status: "active",
      temperature: 4,
      humidity: 60,
    },
    {
      id: "5",
      code: "WH-C",
      name: "Quarantine Warehouse",
      type: "warehouse",
      capacity: 2000,
      currentOccupancy: 150,
      status: "active",
    },
  ];

  const getOccupancyPercentage = (location: WarehouseLocation) => {
    return ((location.currentOccupancy / location.capacity) * 100).toFixed(1);
  };

  const getOccupancyColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 bg-red-50";
    if (percentage >= 75) return "text-amber-600 bg-amber-50";
    return "text-green-600 bg-green-50";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      maintenance: "bg-amber-100 text-amber-800",
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warehouse":
        return <Warehouse className="h-4 w-4" />;
      case "rack":
        return <Package className="h-4 w-4" />;
      case "shelf":
      case "bin":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleDelete = (id: string) => {
    // TODO: Add confirmation modal
    toast.success("Warehouse location deleted");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground">
            Manage warehouse locations and storage capacity
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Capacity</p>
              <p className="text-2xl font-bold">17,500</p>
            </div>
            <Warehouse className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Occupied</p>
              <p className="text-2xl font-bold">11,680</p>
            </div>
            <Package className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">5,820</p>
            </div>
            <TrendingUp className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Utilization</p>
              <p className="text-2xl font-bold">66.7%</p>
            </div>
            <MapPin className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search warehouses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="warehouse">Warehouse</SelectItem>
            <SelectItem value="rack">Rack</SelectItem>
            <SelectItem value="shelf">Shelf</SelectItem>
            <SelectItem value="bin">Bin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Occupancy</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Conditions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => {
              const occupancyPct = parseFloat(getOccupancyPercentage(warehouse));
              return (
                <TableRow key={warehouse.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(warehouse.type)}
                      <div>
                        <p className="font-medium">{warehouse.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {warehouse.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="capitalize">{warehouse.type}</span>
                  </TableCell>
                  <TableCell>{warehouse.capacity.toLocaleString()}</TableCell>
                  <TableCell>
                    {warehouse.currentOccupancy.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            occupancyPct >= 90
                              ? "bg-red-500"
                              : occupancyPct >= 75
                              ? "bg-amber-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium px-2 py-0.5 rounded ${getOccupancyColor(
                          occupancyPct
                        )}`}
                      >
                        {occupancyPct}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {warehouse.temperature !== undefined && (
                      <div className="text-sm">
                        <p>{warehouse.temperature}°C</p>
                        <p className="text-muted-foreground">
                          {warehouse.humidity}% RH
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(
                        warehouse.status
                      )}`}
                    >
                      {warehouse.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(warehouse.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
