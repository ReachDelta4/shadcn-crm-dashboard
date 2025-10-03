import {
  SquareTerminal,
  Users,
  FileText,
  BarChart,
  Settings2,
  LifeBuoy,
  Send,
  Frame,
  PieChart,
  Map,
  HandCoins,
  ShoppingCart,
  Headphones,
} from "lucide-react";

export const sidebarMenus = {
  user: {
    name: "James",
    email: "james@example.com",
    avatar: "/avatars/avatar.webp",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/overview",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Overview",
          url: "/dashboard/overview",
        },
        {
          title: "Activity Logs",
          url: "/dashboard/activity-logs",
        },
      ],
    },
    {
      title: "Leads",
      url: "/dashboard/leads",
      icon: HandCoins,
      items: [
        {
          title: "All Leads",
          url: "/dashboard/leads",
        },
        {
          title: "Qualified Leads",
          url: "/dashboard/leads/qualified",
        },
        {
          title: "Lead Scoring",
          url: "/dashboard/leads/lead-scoring",
        },
      ],
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: Users,
      items: [
        {
          title: "All Customers",
          url: "/dashboard/customers",
        },
        {
          title: "Segments",
          url: "/dashboard/customers/segments",
        },
        {
          title: "Import/Export",
          url: "/dashboard/customers/import-export",
        },
      ],
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ShoppingCart,
      items: [
        {
          title: "All Orders",
          url: "/dashboard/orders",
        },
        {
          title: "Pending Orders",
          url: "/dashboard/orders/pending",
        },
        {
          title: "Completed Orders",
          url: "/dashboard/orders/completed",
        },
      ],
    },
    {
      title: "Sessions & Reports",
      url: "/dashboard/sessions",
      icon: Headphones,
      items: [
        { title: "Sessions Overview", url: "/dashboard/sessions" },
        { title: "All Sessions", url: "/dashboard/sessions/all" },
        { title: "Calendar", url: "/dashboard/sessions/calendar" },
        { title: "Session Reports", url: "/dashboard/sessions/reports" },
        { title: "Bulk Reports", url: "/dashboard/sessions/bulk-reports" },
        { title: "Sales Report", url: "/dashboard/reports/sales" },
        { title: "Customer Insights", url: "/dashboard/reports/customer-insights" },
        { title: "Revenue", url: "/dashboard/reports/revenue" },
      ],
    },
    {
      title: "Invoices",
      url: "/dashboard/invoices",
      icon: FileText,
      items: [
        {
          title: "All Invoices",
          url: "/dashboard/invoices",
        },
        {
          title: "Pending",
          url: "/dashboard/invoices/pending",
        },
        {
          title: "Paid",
          url: "/dashboard/invoices/paid",
        },
      ],
    },
    {
      title: "Settings",
      url: "/dashboard/settings/general",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Users & Permissions",
          url: "/dashboard/settings/users",
        },
        {
          title: "Integrations",
          url: "/dashboard/settings/integrations",
        },
        {
          title: "API Settings",
          url: "/dashboard/settings/api",
        },
        {
          title: "Products",
          url: "/dashboard/settings/products",
        },
        {
          title: "Link Device",
            url: "/dashboard/settings/link-device",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "/dashboard/support",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "/dashboard/feedback",
      icon: Send,
    },
  ],
  workspaces: [
    {
      name: "Customer Management",
      url: "/dashboard/customers",
      icon: Frame,
    },
    {
      name: "Sales Performance",
      url: "/dashboard/reports/sales",
      icon: PieChart,
    },
    {
      name: "Business Expansion",
      url: "/dashboard/reports/sales",
      icon: Map,
    },
  ],
};
