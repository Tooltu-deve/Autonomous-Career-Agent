import type { Metadata } from "next";
import "./cv-manager.css";
import { CvManager } from "./CvManager";

export const metadata: Metadata = { title: "CareerNav — CV Manager" };

export default function CvManagerPage() { return <CvManager />; }
