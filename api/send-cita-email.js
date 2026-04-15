export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { to, paciente, fecha, hora, tipo, notas, consultorio, profesional } = req.body;

  if (!to || !paciente || !fecha) {
    return res.status(400).json({ error: "Faltan campos requeridos: to, paciente, fecha" });
  }

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const parts = fecha.split("-");
  const fechaFormateada = parts[2] + " de " + MESES[parseInt(parts[1],10)-1] + " de " + parts[0];
  const horaStr = hora ? hora.substring(0,5) + " hs" : "Sin horario definido";

  // Use consultorio name as sender name, fallback to generic
  const senderName = (consultorio && consultorio.nombre) ? consultorio.nombre : "Recordatorio de Cita";

  let consultorioHtml = "";
  if (consultorio && (consultorio.nombre || consultorio.direccion || consultorio.telefono || consultorio.email)) {
    consultorioHtml = `
      <div style="margin-top:24px;padding:16px 20px;background:#f0fdfa;border-radius:10px;border:1px solid #ccfbf1">
        <div style="font-size:13px;font-weight:700;color:#0a3d2f;margin-bottom:8px">${consultorio.nombre || "Consultorio"}</div>
        ${consultorio.direccion ? '<div style="font-size:12px;color:#475569;margin-bottom:3px">\u{1F4CD} ' + consultorio.direccion + '</div>' : ''}
        ${consultorio.telefono ? '<div style="font-size:12px;color:#475569;margin-bottom:3px">\u{1F4DE} ' + consultorio.telefono + '</div>' : ''}
        ${consultorio.email ? '<div style="font-size:12px;color:#475569">\u{2709}\u{FE0F} ' + consultorio.email + '</div>' : ''}
      </div>
    `;
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
    
    <div style="background:linear-gradient(135deg,#0a3d2f,#0d9488);padding:28px 32px;text-align:center">
      <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px">Recordatorio de Cita Fonoaudiol\u00f3gica</div>
    </div>

    <div style="padding:28px 32px">
      <p style="font-size:15px;color:#1e293b;margin:0 0 20px 0;line-height:1.6">
        Hola, le informamos que tiene una cita agendada para <b>${paciente}</b>.
      </p>

      <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px;margin-bottom:16px">
        <div style="display:flex;margin-bottom:12px">
          <div style="font-size:13px;color:#64748b;width:110px;font-weight:600">\u{1F4C5} Fecha</div>
          <div style="font-size:14px;color:#0a3d2f;font-weight:700">${fechaFormateada}</div>
        </div>
        <div style="display:flex;margin-bottom:12px">
          <div style="font-size:13px;color:#64748b;width:110px;font-weight:600">\u{1F552} Hora</div>
          <div style="font-size:14px;color:#0a3d2f;font-weight:700">${horaStr}</div>
        </div>
        ${profesional ? '<div style="display:flex;margin-bottom:12px"><div style="font-size:13px;color:#64748b;width:110px;font-weight:600">\u{1F9D1}\u{200D}\u{2695}\u{FE0F} Profesional</div><div style="font-size:14px;color:#0a3d2f;font-weight:600">' + profesional + '</div></div>' : ''}
        ${tipo ? '<div style="display:flex;margin-bottom:12px"><div style="font-size:13px;color:#64748b;width:110px;font-weight:600">\u{1F4CB} Tipo</div><div style="font-size:14px;color:#0a3d2f;font-weight:600">' + tipo + '</div></div>' : ''}
        ${notas ? '<div style="display:flex"><div style="font-size:13px;color:#64748b;width:110px;font-weight:600">\u{1F4DD} Notas</div><div style="font-size:13px;color:#475569;line-height:1.5">' + notas + '</div></div>' : ''}
      </div>

      ${consultorioHtml}

      <div style="margin-top:24px;padding:14px 16px;background:#fffbeb;border-radius:8px;border:1px solid #fef3c7">
        <div style="font-size:12px;color:#92400e;line-height:1.5">
          <b>Importante:</b> Si necesita reprogramar o cancelar la cita, por favor comun\u00edquese con anticipaci\u00f3n.
        </div>
      </div>
    </div>

    <div style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
      <div style="font-size:12px;color:#64748b;line-height:1.5">Este es un mensaje autom\u00e1tico enviado por Br\u00fajula KIT &mdash; Sistema profesional de fonoaudiolog\u00eda</div>
    </div>
  </div>
</body>
</html>
  `.trim();

  try {
    const result = await resend.emails.send({
      from: senderName + " <noreply@brujulakit.com>",
      to: [to],
      subject: "Recordatorio de cita - " + paciente + " - " + fechaFormateada,
      html: html
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return res.status(500).json({ success: false, error: result.error.message || "Error de Resend" });
    }

    return res.status(200).json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error("Send email error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
