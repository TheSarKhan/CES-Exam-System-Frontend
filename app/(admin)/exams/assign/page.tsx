import React, { Suspense } from "react";
import AssignExamForm from "./AssignExamForm";

export default function AssignExamPage() {
  return (
    <Suspense fallback={<p style={{ color: "var(--text-secondary)" }}>Loading...</p>}>
      <AssignExamForm />
    </Suspense>
  );
}
