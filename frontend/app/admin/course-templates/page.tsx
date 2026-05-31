"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CourseTemplateEditor } from "@/components/admin/CourseTemplateEditor";
import { createCourseTemplateAdmin, listCourseTemplatesAdmin, saveCourseTemplateAdmin, type CourseTemplateAdmin } from "@/lib/admin";

const blankTemplate: CourseTemplateAdmin = {
  templateId: "new-course-template",
  title: "New Course Template",
  slug: "new-course-template",
  category: "interview",
  durationDays: 7,
  durationLabel: "7 days",
  frequency: "daily",
  dailyMinutes: 20,
  difficulty: "Intermediate",
  targetSkills: [],
  description: "",
  expectedTransformation: "",
  schedulePattern: "daily",
  milestones: [],
  requiredEntitlements: [],
  isPublic: false,
  isActive: true,
  sortOrder: 99,
};

export default function AdminCourseTemplatesPage() {
  const [templates, setTemplates] = useState<CourseTemplateAdmin[]>([]);
  const refresh = () => listCourseTemplatesAdmin().then(setTemplates);
  useEffect(() => { refresh(); }, []);
  return (
    <AdminLayout>
      <AdminHeader title="Course Templates" subtitle="Fixed-duration courses and training paths managed by admin." action={<button onClick={async () => { await createCourseTemplateAdmin(blankTemplate); refresh(); }} className="rounded-2xl bg-[#6200a8] px-5 py-3 font-semibold text-white">Create course</button>} />
      <div className="grid gap-4">
        {templates.map((template) => <CourseTemplateEditor key={template.templateId} template={template} onSave={async (next) => { await saveCourseTemplateAdmin(next); refresh(); }} />)}
      </div>
    </AdminLayout>
  );
}
