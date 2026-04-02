import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { schools } from "@/db/schema";
import { requireAdminUser } from "@/lib/admin/apiAuth";
import { importBulkStudentsFromRows } from "@/lib/admin/bulkStudentImport";

type Params = { params: Promise<{ id: string }> };

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_DATA_ROWS = 5000;

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAdminUser();
  if (auth.unauthorizedResponse) return auth.unauthorizedResponse;

  const { id: schoolId } = await params;

  const [school] = await db
    .select({ id: schools.id })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .limit(1);

  if (!school) {
    return NextResponse.json(
      { success: false, error: "Colegio no encontrado" },
      { status: 404 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { success: false, error: "Envía el archivo como multipart/form-data" },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo leer el formulario" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Falta el archivo (campo «file»)" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        success: false,
        error: `El archivo supera el máximo de ${MAX_FILE_BYTES / (1024 * 1024)} MB`,
      },
      { status: 400 },
    );
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return NextResponse.json(
      { success: false, error: "Solo se aceptan archivos .xlsx o .xls" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return NextResponse.json(
      { success: false, error: "No se pudo leer el archivo Excel" },
      { status: 400 },
    );
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json(
      { success: false, error: "El libro no tiene hojas" },
      { status: 400 },
    );
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false,
  });

  if (rows.length > MAX_DATA_ROWS) {
    return NextResponse.json(
      {
        success: false,
        error: `Máximo ${MAX_DATA_ROWS} filas de datos por archivo`,
      },
      { status: 400 },
    );
  }

  const summary = await importBulkStudentsFromRows(db, rows, schoolId);

  return NextResponse.json({
    success: true,
    data: summary,
  });
}
