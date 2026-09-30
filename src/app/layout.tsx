import type { Metadata } from "next";
import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import Nav from "@/components/Nav";
import "./globals.css";

export const runtime = "edge";

export const metadata: Metadata = { title: "Spending Planner", description: "Planificador de gastos anuales" };
