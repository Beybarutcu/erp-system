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
  ShoppingCart,
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
} from "lucide-react";

// TODO: Replace with actual API call
interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  status: "draft" | "sent" | "confirmed" | "partially_received" | "received" | "cancelled";
  totalAmount: number;
  currency: string;
  itemsCount: number;
  receivedItems: number;
}

export default function PurchaseOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // TODO: Replace with actual API call
  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "1",
      poNumber: "PO-2025-001",
      supplier: "ABC Raw Materials Ltd.",
      orderDate: "2025-02-10",
      expectedDelivery: "2025-02-20",
      status: "confirmed",
      totalAmount: 25000,
      currency: "USD",
      itemsCount: 5,
      receivedItems: 0,
    },
    {
      id: "2",
      poNumber: "PO-2025-002",
      supplier: "XYZ Components Inc.",
      orderDate: "2025-02-08",
      expectedDelivery: "2025-02-15",
      status: "partially_received",
      totalAmount: 18500,
      currency: "USD",
      itemsCount: 8,
      receivedItems: 5,
    },
    {
      id: "3",
      poNumber: "PO-2025-003",
      supplier: "Global Packaging Co.",
      orderDate: "2025-02-12",
      expectedDelivery: "2025-02-25",
      status: "sent",
      totalAmount: 12000,
      currency: "USD",
      itemsCount: 3,
      receivedItems: 0,
    },
    {
      id: "4",
      poNumber: "PO-2025-004",
      supplier: "Premium Steel Works",
      orderDate: "2025-02-05",
      expectedDelivery: "2025-02-12",
      status: "received",
      totalAmount: 45000,
      currency: "USD",
      itemsCount: 10,
      receivedItems: 10,
    },
    {
      id: "5",
      poNumber: "PO-2025-005",
      supplier: "Tech Electronics Ltd.",
      orderDate: "2025-02-11",
      expectedDelivery: "2025-02-18",
      status: "draft",
      totalAmount: 8900,
      currency: "USD",
      itemsCount: 4,
      receivedItems: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: { bg: "bg-gray-100 text-gray-800", icon: Clock },
      sent: { bg: "bg-blue-100 text-blue-800", icon: ShoppingCart },
      confirmed: { bg: "bg-green-100 text-green-800", icon: CheckCircle },
      partially_received: { bg: "bg-amber-100 text-amber-800", icon: TrendingUp },
      received: { bg: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
      cancelled: { bg: "bg-red-100 text-red-800", icon: XCircle },
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: "Draft",
      sent: "Sent",
      confirmed: "Confirmed",
      partially_received: "Partially Received",
      received: "Received",
      cancelled: "Cancelled",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const isOverdue = (expectedDelivery: string, status: string) => {
    if (status === "received" || status === "cancelled") return false;
    const today = new Date();
    const deliveryDate = new Date(expectedDelivery);
    return deliveryDate < today;
  };

  const totalPendingOrders = purchaseOrders.filter(
    (po) => po.status !== "received" && po.status !== "cancelled"
  ).length;

  const totalPendingAmount = purchaseOrders
    .filter((po) => po.status !== "received" && po.status !== "cancelled")
    .reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage supplier orders and deliveries
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Purchase Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{purchaseOrders.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-2xl font-bold">{totalPendingOrders}</p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Value</p>
              <p className="text-2xl font-bold">
                ${totalPendingAmount.toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder="Search PO number or supplier..."
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
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="partially_received">Partially Received</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.map((po) => {
              const statusConfig = getStatusBadge(po.status);
              const StatusIcon = statusConfig.icon;
              const overdue = isOverdue(po.expectedDelivery, po.status);

              return (
                <TableRow key={po.id}>
                  <TableCell>
                    <p className="font-medium">{po.poNumber}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{po.supplier}</p>
                  </TableCell>
                  <TableCell>
                    {new Date(po.orderDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          overdue ? "text-red-600 font-medium" : undefined
                        }
                      >
                        {new Date(po.expectedDelivery).toLocaleDateString()}
                      </span>
                      {overdue && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {po.receivedItems}/{po.itemsCount} received
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {po.currency} {po.totalAmount.toLocaleString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusConfig.bg}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {getStatusLabel(po.status)}
                      </span>
                    </div>
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
        totalPages={5}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
