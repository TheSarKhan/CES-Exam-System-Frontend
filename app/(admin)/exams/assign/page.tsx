import React, { Suspense } from "react";
import AssignExamForm from "./AssignExamForm";
import { Loading } from "@/components/ui/Feedback";

export default function AssignExamPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AssignExamForm />
    </Suspense>
  );
}
