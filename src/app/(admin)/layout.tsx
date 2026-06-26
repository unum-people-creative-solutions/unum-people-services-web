"use client";

import React from "react";
import { TenantProvider } from "@/contexts/TenantContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TenantProvider>{children}</TenantProvider>;
}
