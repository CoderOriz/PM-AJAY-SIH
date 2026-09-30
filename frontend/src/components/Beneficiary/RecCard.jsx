import { QRCode } from "react-qr-code";
import { Badge, Card, CardContent } from "../ui";

const GAP_VARIANT = { zero: "success", partial: "warning", major: "destructive" };

export function RecCard({ r, t }) {
  const qrValue = r.centre && r.centre.phone ? `tel:${r.centre.phone.replace(/\s/g, "")}` : null;
  return (
    <Card className="rec">
      <CardContent className="pt-2">
        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {r.pinned && <Badge>{t("pinned_badge")}</Badge>}
          {r.rpl && <Badge variant="secondary">{t("rpl_badge")}</Badge>}
          <span className="font-bold text-[1.1rem]">{r.title}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {r.sector} · NSQF {t("level")} {r.nsqf_level} · {r.duration_months} {t("months")} · {r.scheme}
          <div className="mt-1">
            <Badge variant={GAP_VARIANT[r.gap]} className="mr-2">{t("gap_" + r.gap)}</Badge>
            {r.centre
              ? <> · {r.centre.name}{r.distance_km != null ? ` · ${t("dist")} ${r.distance_km} ${t("km")}` : ""}{r.centre_stale ? ` · ${t("stale")}` : ""} · <a className="font-bold text-secondary" href={`tel:${r.centre.phone}`}>{r.centre.phone}</a></>
              : <> · {t("no_centre")}</>}
          </div>
          {r.rpl && (
            <div className="mt-1.5">
              {t("coord")}: <a className="font-bold text-secondary" href={`tel:${r.rpl.coordinator}`}>{r.rpl.coordinator}</a> — {r.rpl.note}
            </div>
          )}
          {r.dropout_risk === "high" && <div className="mt-1.5 text-destructive font-medium">{t("dropout_warn")}</div>}
        </div>
          </div>
          {qrValue && (
            <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
              <QRCode value={qrValue} size={64} />
              <span className="text-[11px] text-muted-foreground text-center leading-tight">{t("qr_call")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
