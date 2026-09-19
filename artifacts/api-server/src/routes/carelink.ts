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
      name: "Bà Nguyễn Thị Lan",
      age: 76,
      relationship: "Mẹ của bạn",
      location: "Quận 3, TP. Hồ Chí Minh",
      avatarUrl: "https://i.pravatar.cc/160?img=47",
      healthStatus: "Ổn định",
    },
    todayProgress: 4,
    todayTotal: 6,
    medicationProgress: 2,
    medicationTotal: 3,
    trustScore: 96,
    activeAlerts: 0,
    monthlySpend: 4850000,
    nextCheckIn: "Bữa trưa & thuốc",
    nextCheckInTime: "11:30",
  },
  activity: [
    {
      id: 1,
      type: "care",
      title: "Bữa sáng đã được xác nhận",
      detail: "Ngọc Anh · 08:15 hôm nay",
      time: "08:15",
      status: "verified",
      initials: "NA",
    },
    {
      id: 2,
      type: "medication",
      title: "Đã uống thuốc huyết áp",
      detail: "Bà Lan xác nhận bằng giọng nói",
      time: "08:30",
      status: "verified",
      initials: "BL",
    },
    {
      id: 3,
      type: "expense",
      title: "Hóa đơn đi chợ đã tải lên",
      detail: "126.000đ · Chợ Bàn Cờ",
      time: "09:05",
      status: "review",
      initials: "NA",
    },
    {
      id: 4,
      type: "audit",
      title: "Kiểm tra định kỳ hoàn tất",
      detail: "Đội ngũ CareLink · Hôm qua",
      time: "16:40",
      status: "verified",
      initials: "CL",
    },
  ],
  careLogs: [
    {
      id: 1,
      title: "Đón & kiểm tra buổi sáng",
      detail: "Đo huyết áp, vệ sinh cá nhân, mở cửa sổ phòng khách",
      time: "07:30",
      category: "Sức khỏe",
      status: "verified",
      caregiver: "Ngọc Anh",
      photoUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
      verifiedBy: "Bà Lan · giọng nói",
    },
    {
      id: 2,
      title: "Chuẩn bị bữa sáng",
      detail: "Cháo yến mạch, chuối và một ly sữa ấm",
      time: "08:15",
      category: "Dinh dưỡng",
      status: "verified",
      caregiver: "Ngọc Anh",
      photoUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
      verifiedBy: "Gia đình · 08:22",
    },
    {
      id: 3,
      title: "Nhắc thuốc buổi sáng",
      detail: "Amlodipine 5mg · xác nhận sau khi uống",
      time: "08:30",
      category: "Thuốc",
      status: "verified",
      caregiver: "Ngọc Anh",
      photoUrl: null,
      verifiedBy: "Bà Lan · giọng nói",
    },
    {
      id: 4,
      title: "Tập vận động nhẹ",
      detail: "Đi bộ 15 phút quanh công viên Tao Đàn",
      time: "09:20",
      category: "Vận động",
      status: "pending",
      caregiver: "Ngọc Anh",
      photoUrl: null,
      verifiedBy: null,
    },
  ],
  medications: [
    {
      id: 1,
      name: "Amlodipine",
      dosage: "5mg · 1 viên",
      time: "08:30",
      instruction: "Sau bữa sáng",
      status: "taken",
      stock: 18,
      stockLabel: "Còn 18 ngày",
    },
    {
      id: 2,
      name: "Metformin",
      dosage: "500mg · 1 viên",
      time: "12:00",
      instruction: "Sau bữa trưa",
      status: "upcoming",
      stock: 12,
      stockLabel: "Còn 12 ngày",
    },
    {
      id: 3,
      name: "Vitamin D3",
      dosage: "1000 IU · 1 viên",
      time: "19:30",
      instruction: "Sau bữa tối",
      status: "upcoming",
      stock: 4,
      stockLabel: "Sắp hết thuốc",
    },
  ],
  caregivers: [
    {
      id: 1,
      name: "Trần Ngọc Anh",
      role: "Bảo mẫu chính",
      initials: "NA",
      trustScore: 96,
      status: "Đang làm việc",
      distance: "0,8 km",
    },
    {
      id: 2,
      name: "Lê Minh Thư",
      role: "Bảo mẫu dự phòng",
      initials: "MT",
      trustScore: 91,
      status: "Sẵn sàng",
      distance: "2,4 km",
    },
  ],
  schedule: [
    { id: 1, time: "07:30", title: "Đón & kiểm tra buổi sáng", detail: "Đo huyết áp · vệ sinh cá nhân", status: "done" },
    { id: 2, time: "08:30", title: "Uống thuốc sáng", detail: "Amlodipine 5mg", status: "done" },
    { id: 3, time: "09:20", title: "Đi bộ công viên", detail: "Theo dõi lộ trình trực tiếp", status: "active" },
    { id: 4, time: "12:00", title: "Bữa trưa & thuốc", detail: "Nhắc Metformin 500mg", status: "upcoming" },
    { id: 5, time: "15:30", title: "Gọi video gia đình", detail: "15 phút kết nối", status: "upcoming" },
  ],
  expenses: [
    { id: 1, merchant: "Nhà thuốc An Khang", detail: "Vitamin D3 · 2 hộp", amount: 184000, date: "Hôm nay, 09:12", status: "approved", receiptUrl: null },
    { id: 2, merchant: "Chợ Bàn Cờ", detail: "Thực phẩm tuần này", amount: 126000, date: "Hôm nay, 09:05", status: "review", receiptUrl: null },
    { id: 3, merchant: "Phí taxi đi khám", detail: "Bệnh viện Từ Dũ", amount: 92000, date: "12/09/2026", status: "approved", receiptUrl: null },
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
    caregiver: "Bạn",
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
    res.status(400).json({ error: "Thông tin xác nhận không hợp lệ" });
    return;
  }
  const payload = await readPayload();
  const entry = payload.careLogs.find((item) => item.id === params.data.id);
  if (!entry) {
    res.status(404).json({ error: "Không tìm thấy care-log" });
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
    res.status(400).json({ error: "Trạng thái thuốc không hợp lệ" });
    return;
  }
  const payload = await readPayload();
  const medication = payload.medications.find((item) => item.id === params.data.id);
  if (!medication) {
    res.status(404).json({ error: "Không tìm thấy thuốc" });
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
    status: "Đã báo đội ngũ",
    notified: ["Gia đình", "Đội ngũ CareLink"],
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
  const skills = ["Chăm sóc người cao tuổi"];
  if (transcript.includes("nấu") || transcript.includes("bếp")) skills.push("Nấu ăn gia đình");
  if (transcript.includes("thuốc") || transcript.includes("y tế")) skills.push("Theo dõi thuốc");
  const draft = {
    summary: parsed.data.transcript.trim(),
    experience: transcript.match(/\d+\s*(năm|nam)/)?.[0] ?? "Kinh nghiệm chăm sóc thực tế",
    skills,
    availability: transcript.includes("sáng") ? "Buổi sáng" : "Toàn thời gian",
    location: transcript.includes("quận") ? "Đã nhận diện khu vực từ câu trả lời" : "Chưa cập nhật",
  };
  res.json(GenerateProfileDraftResponse.parse(draft));
});

export default router;