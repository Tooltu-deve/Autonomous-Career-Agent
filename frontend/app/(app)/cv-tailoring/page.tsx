import type { Metadata } from "next";
import { CvManager } from "./CvManager";

export const metadata: Metadata = { title: "CareerNav — CV Manager" };

export default function CvManagerPage() { return <CvManager />; }
