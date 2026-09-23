import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, carelinkStateTable } from "@workspace/db";
import {
  CreateCareLogBody,
  CreateCareLogResponse,
  CreateExpenseBody,
  CreateExpenseResponse,
  CreateSosAlertBody,
  CreateSosAlertResponse,
  GenerateProfileDraftBody,
  GenerateProfileDraftResponse,
  GetActivityResponse,
  GetCaregiversResponse,
  GetCareLogsResponse,
  GetDashboardSummaryResponse,
  GetExpensesResponse,
  GetMedicationsResponse,
  GetScheduleResponse,
  UpdateCareLogBody,
  UpdateCareLogParams,
  UpdateCareLogResponse,
  UpdateMedicationStatusBody,
  UpdateMedicationStatusParams,
  UpdateMedicationStatusResponse,
} from "@workspace/api-zod";

type CarelinkPayload = {
  summary: Record<string, unknown>;
  activity: Array<Record<string, unknown>>;
  careLogs: Array<Record<string, unknown>>;
  medications: Array<Record<string, unknown>>;
  caregivers: Array<Record<string, unknown>>;
  schedule: Array<Record<string, unknown>>;
  expenses: Array<Record<string, unknown>>;
  nextId: number;
};

const initialPayload: CarelinkPayload = {
  summary: {
    elder: {
      name: "Mrs. Nguyen Thi Lan",
      age: 76,
      relationship: "Your mother",
      location: "District 3, Ho Chi Minh City",
      avatarUrl: "https://i.pravatar.cc/160?img=47",
      healthStatus: "Stable",
    },
    todayProgress: 4,
    todayTotal: 6,
    medicationProgress: 2,
    medicationTotal: 3,
    trustScore: 96,
    activeAlerts: 0,
    monthlySpend: 4850000,
    nextCheckIn: "Lunch & medication",
    nextCheckInTime: "11:30",
  },
  activity: [
    {
      id: 1,
      type: "care",
      title: "Breakfast confirmed",
      detail: "Ngoc Anh · 08:15 today",
      time: "08:15",
      status: "verified",
      initials: "NA",
    },
    {
      id: 2,
      type: "medication",
      title: "Blood pressure medication taken",
      detail: "Mrs. Lan confirmed by voice",
      time: "08:30",
      status: "verified",
      initials: "BL",
    },
    {
      id: 3,
      type: "expense",
      title: "Grocery receipt uploaded",
      detail: "126,000₫ · Ban Co Market",
      time: "09:05",
      status: "review",
      initials: "NA",
    },
    {
      id: 4,
      type: "audit",
      title: "Routine check completed",
      detail: "CareLink team · Yesterday",
      time: "16:40",
      status: "verified",
      initials: "CL",
    },
  ],
  careLogs: [
    {
      id: 1,
      title: "Morning pickup & check-in",
      detail: "Blood pressure check, personal hygiene, opened living room windows",
      time: "07:30",
      category: "Health",
      status: "verified",
      caregiver: "Ngoc Anh",
      photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
      verifiedBy: "Mrs. Lan · voice confirmation",
    },
    {
      id: 2,
      title: "Breakfast preparation",
      detail: "Oatmeal porridge, banana, and a glass of warm milk",
      time: "08:15",
      category: "Nutrition",
      status: "verified",
      caregiver: "Ngoc Anh",
      photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      verifiedBy: "Family · 08:22",
    },
    {
      id: 3,
      title: "Morning medication reminder",
      detail: "Amlodipine 5mg · confirmed after taking",
      time: "08:30",
      category: "Medication",
      status: "verified",
      caregiver: "Ngoc Anh",
      photoUrl: null,
      verifiedBy: "Mrs. Lan · voice confirmation",
    },
    {
      id: 4,
      title: "Light exercise",
      detail: "15-minute walk around Tao Dan Park",
      time: "09:20",
      category: "Exercise",
      status: "pending",
      caregiver: "Ngoc Anh",
      photoUrl: null,
      verifiedBy: null,
    },
  ],
  medications: [
    {
      id: 1,
      name: "Amlodipine",
      dosage: "5mg · 1 tablet",
      time: "08:30",
      instruction: "After breakfast",
      status: "taken",
      stock: 18,
      stockLabel: "18 days left",
    },
    {
      id: 2,
      name: "Metformin",
      dosage: "500mg · 1 tablet",
      time: "12:00",
      instruction: "After lunch",
      status: "upcoming",
      stock: 12,
      stockLabel: "12 days left",
    },
    {
      id: 3,
      name: "Vitamin D3",
      dosage: "1000 IU · 1 tablet",
      time: "19:30",
      instruction: "After dinner",
      status: "upcoming",
      stock: 4,
      stockLabel: "Running low",
    },
  ],
  caregivers: [
    {
      id: 1,
      name: "Tran Ngoc Anh",
      role: "Primary caregiver",
      initials: "NA",
      trustScore: 96,
      status: "On duty",
      distance: "0.8 km",
    },
    {
      id: 2,
      name: "Le Minh Thu",
      role: "Backup caregiver",
      initials: "MT",
      trustScore: 91,
      status: "Available",
      distance: "2.4 km",
    },
  ],
  schedule: [
    { id: 1, time: "07:30", title: "Morning pickup & check-in", detail: "Blood pressure check · personal hygiene", status: "done" },
    { id: 2, time: "08:30", title: "Morning medication", detail: "Amlodipine 5mg", status: "done" },
    { id: 3, time: "09:20", title: "Park walk", detail: "Live route tracking", status: "active" },
    { id: 4, time: "12:00", title: "Lunch & medication", detail: "Metformin 500mg reminder", status: "upcoming" },
    { id: 5, time: "15:30", title: "Family video call", detail: "15-minute connection", status: "upcoming" },
  ],
  expenses: [
    { id: 1, merchant: "An Khang Pharmacy", detail: "Vitamin D3 · 2 boxes", amount: 184000, date: "Today, 09:12", status: "approved", receiptUrl: null },
    { id: 2, merchant: "Ban Co Market", detail: "This week's groceries", amount: 126000, date: "Today, 09:05", status: "review", receiptUrl: null },
    { id: 3, merchant: "Taxi fare to appointment", detail: "Tu Du Hospital", amount: 92000, date: "12/09/2026", status: "approved", receiptUrl: null },
  ],
  nextId: 10,
};

async function readPayload(): Promise<CarelinkPayload> {
  const [row] = await db
    .select()
    .from(carelinkStateTable)
    .where(eq(carelinkStateTable.key, "demo"));

  if (row) return row.payload as CarelinkPayload;

  await db
    .insert(carelinkStateTable)
    .values({ key: "demo", payload: initialPayload })
    .onConflictDoNothing({ target: carelinkStateTable.key });

  const [created] = await db
    .select()
    .from(carelinkStateTable)
    .where(eq(carelinkStateTable.key, "demo"));
  return created.payload as CarelinkPayload;
}

async function writePayload(payload: CarelinkPayload): Promise<void> {
  await db
    .update(carelinkStateTable)
    .set({ payload, updatedAt: new Date() })
    .where(and(eq(carelinkStateTable.key, "demo")));
}

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetDashboardSummaryResponse.parse(payload.summary));
});

router.get("/activity", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetActivityResponse.parse(payload.activity));
});

router.get("/care-log", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetCareLogsResponse.parse(payload.careLogs));
});

router.post("/care-log", async (req, res): Promise<void> => {
  const parsed = CreateCareLogBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid care log");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const payload = await readPayload();
  const entry = {
    id: payload.nextId++,
    ...parsed.data,
    status: "pending",
    caregiver: "You",
    photoUrl: null,
    verifiedBy: null,
  };
  payload.careLogs.unshift(entry);
  await writePayload(payload);
  res.status(201).json(CreateCareLogResponse.parse(entry));
});

router.patch("/care-log/:id", async (req, res): Promise<void> => {
  const params = UpdateCareLogParams.safeParse(req.params);
  const body = UpdateCareLogBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid confirmation details" });
    return;
  }
  const payload = await readPayload();
  const entry = payload.careLogs.find((item) => item.id === params.data.id);
  if (!entry) {
    res.status(404).json({ error: "Care log not found" });
    return;
  }
  Object.assign(entry, body.data);
  await writePayload(payload);
  res.json(UpdateCareLogResponse.parse(entry));
});

router.get("/medications", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetMedicationsResponse.parse(payload.medications));
});

router.patch("/medications/:id/status", async (req, res): Promise<void> => {
  const params = UpdateMedicationStatusParams.safeParse(req.params);
  const body = UpdateMedicationStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid medication status" });
    return;
  }
  const payload = await readPayload();
  const medication = payload.medications.find((item) => item.id === params.data.id);
  if (!medication) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }
  medication.status = body.data.status;
  if (body.data.status === "taken") {
    payload.summary.medicationProgress = Math.min(
      Number(payload.summary.medicationTotal),
      Number(payload.summary.medicationProgress) + 1,
    );
  }
  await writePayload(payload);
  res.json(UpdateMedicationStatusResponse.parse(medication));
});

router.get("/caregivers", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetCaregiversResponse.parse(payload.caregivers));
});

router.get("/schedule", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetScheduleResponse.parse(payload.schedule));
});

router.get("/expenses", async (_req, res): Promise<void> => {
  const payload = await readPayload();
  res.json(GetExpensesResponse.parse(payload.expenses));
});

router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const payload = await readPayload();
  const expense = {
    id: payload.nextId++,
    ...parsed.data,
    status: "review",
    receiptUrl: null,
  };
  payload.expenses.unshift(expense);
  await writePayload(payload);
  res.status(201).json(CreateExpenseResponse.parse(expense));
});

router.post("/sos", async (req, res): Promise<void> => {
  const parsed = CreateSosAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const payload = await readPayload();
  payload.summary.activeAlerts = 1;
  await writePayload(payload);
  const alert = {
    id: payload.nextId++,
    createdAt: new Date().toISOString(),
    status: "Team notified",
    notified: ["Family", "CareLink team"],
  };
  req.log.warn({ source: parsed.data.source }, "SOS alert triggered");
  res.status(201).json(CreateSosAlertResponse.parse(alert));
});

router.post("/profile/ai", async (req, res): Promise<void> => {
  const parsed = GenerateProfileDraftBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const transcript = parsed.data.transcript.toLowerCase();
  const skills = ["Elder care"];
  if (transcript.includes("cook") || transcript.includes("kitchen") || transcript.includes("meal")) skills.push("Family cooking");
  if (transcript.includes("medication") || transcript.includes("medical") || transcript.includes("health")) skills.push("Medication tracking");
  const draft = {
    summary: parsed.data.transcript.trim(),
    experience: transcript.match(/\d+\s*years?/)?.[0] ?? "Hands-on caregiving experience",
    skills,
    availability: transcript.includes("morning") ? "Mornings" : "Full-time",
    location: transcript.includes("district") || transcript.includes("area") || transcript.includes("neighborhood") ? "Location identified from your description" : "Not yet specified",
  };
  res.json(GenerateProfileDraftResponse.parse(draft));
});

export default router;
