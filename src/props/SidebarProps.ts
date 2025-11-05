// sidebarProps.ts
import type { ComponentType, SVGProps } from "react";
import {
  MailAdd24Regular,
  Drafts24Regular,
  MailInbox24Regular,
  Send24Regular,
  Copy24Regular,
  MailTemplate24Regular,
   Settings24Regular,
  ChartMultiple24Regular,  
  
} from "@fluentui/react-icons";

export type NavItem = {
  pageId: string;
  label: string;
  pageTitle: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  count?: number;
  active?: boolean;
};

//Edit the sidebar items as per your application needs 
export const sidebarItems: NavItem[] = [
  { pageId: "new",    label: "New", icon: MailAdd24Regular, pageTitle: "Create New Memo"  },
  { pageId: "drafts", label: "Drafts",      icon: Drafts24Regular, count: 0, active: true, pageTitle: "Draft & Unassigned Memos" },
  { pageId: "inbox",  label: "Inbox",       icon: MailInbox24Regular, count: 0, pageTitle: "Inbox | Memos Assigned to Me" },
  { pageId: "sent",   label: "Sent Memos",  icon: Send24Regular, count: 0 , pageTitle: "Sent Memos"},
  { pageId: "copied", label: "Copied Memos",icon: Copy24Regular, count: 0 , pageTitle: "Memos CC To Me"},
  {pageId: "bcc", label: "BCC Memos",   icon: MailTemplate24Regular, count: 0 , pageTitle: "Memos BCC To Me"},
   {pageId: "dashboard", label: "Dashboard",   icon: ChartMultiple24Regular , pageTitle: "Memo Reporting Dashboard" },
    {pageId: "settings", label: "Settings",   icon: Settings24Regular, pageTitle: "Settings" }
];
