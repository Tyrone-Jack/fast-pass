import PDFDocument from "pdfkit";
import { HttpError } from "../../middleware/error-handler.js";
import { reportRepository } from "./report.repository.js";

export const reportService = {
  async gatePdf(gateId: string): Promise<PDFKit.PDFDocument> {
    const gate = await reportRepository.gateById(gateId);
    if (!gate) {
      throw new HttpError(404, "Gate not found", "GATE_NOT_FOUND");
    }

    const logs = await reportRepository.gateLogs(gateId);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.fontSize(20).text("FastPass — Gate Access Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Gate: ${gate.name}`);
    doc.text(`Location: ${gate.location}`);
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Total attempts: ${logs.length}`);
    doc.moveDown();

    doc.fontSize(10);
    for (const log of logs) {
      const time = log.verified_at.toISOString();
      doc
        .fillColor(log.result === "ALLOW" ? "green" : "red")
        .text(`${log.result}  ${time}  ${log.driver_name}`);
      doc.fillColor("black");
      doc.text(
        `  ${log.organization_name} · ${log.driver_phone} · Purpose: ${log.purpose}` +
          (log.reason ? ` · Reason: ${log.reason}` : ""),
      );
      doc.moveDown(0.3);
    }

    doc.end();
    return doc;
  },

  async orgCsv(organizationId: string): Promise<string> {
    const org = await reportRepository.orgById(organizationId);
    if (!org) {
      throw new HttpError(404, "Organization not found", "ORGANIZATION_NOT_FOUND");
    }

    const logs = await reportRepository.orgLogs(organizationId);

    const header = "driver,gate,gate_location,result,reason,purpose,verified_at\n";
    const lines = logs.map((l) =>
      [
        l.driver_name,
        l.gate_name,
        l.gate_location,
        l.result,
        l.reason ?? "",
        l.purpose,
        l.verified_at.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    return header + lines.join("\n");
  },
};
