"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PracticeTemplateEditor } from "@/components/admin/PracticeTemplateEditor";
import { createPracticeTemplate, listPracticeTemplates, savePracticeTemplate, type PracticeTemplate } from "@/lib/admin";

const blankTemplate: PracticeTemplate = {
  templateId: "new-practice-template",
  title: "New Practice Template",
  slug: "new-practice-template",
  category: "interview",
  practiceType: "Job Interview",
  difficulty: "Intermediate",
  description: "",
  scenarioPrompt: "",
  beginnerBriefingEnabled: true,
  conversationMapEnabled: true,
  hintsEnabled: true,
  defaultDurationMinutes: 20,
  isPublic: false,
  isActive: true,
  sortOrder: 99,
  requiredEntitlements: [],
};

export default function AdminPracticeTemplatesPage() {
  const [templates, setTemplates] = useState<PracticeTemplate[]>([]);
  const refresh = () => listPracticeTemplates().then(setTemplates);
  useEffect(() => { refresh(); }, []);
  return (
    <AdminLayout>
      <AdminHeader title="Practice Templates" subtitle="Reusable practice scenarios for future quick-start flows." action={<button onClick={async () => { await createPracticeTemplate(blankTemplate); refresh(); }} className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Create template</button>} />
      <div className="grid gap-4">
        {templates.map((template) => <PracticeTemplateEditor key={template.templateId} template={template} onSave={async (next) => { await savePracticeTemplate(next); refresh(); }} />)}
      </div>
    </AdminLayout>
  );
}
