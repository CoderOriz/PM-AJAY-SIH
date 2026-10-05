import { QRCode } from "react-qr-code";
import { Badge, Card, CardContent } from "../ui";

const GAP_VARIANT = { zero: "success", partial: "warning", major: "destructive" };

export function RecCard({ r, t }) {
  const qrValue = r.centre && r.centre.phone ? `tel:${r.centre.phone.replace(/\s/g, "")}` : null;
  return (
    <Card className="rec">
      <CardContent className="pt-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {r.pinned && <Badge variant="accent">{t("pinned_badge")}</Badge>}
          {r.rpl && <Badge variant="secondary">{t("rpl_badge")}</Badge>}
          <span className="font-bold text-[1.1rem]">{r.title}</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {r.sector} · NSQF {t("level")} {r.nsqf_level} · {r.duration_months} {t("months")} · {r.scheme}
          <div className="mt-1">
            <Badge variant={GAP_VARIANT[r.gap]} className="mr-2">{t("gap_" + r.gap)}</Badge>
            {r.centre
              ? <> · {r.centre.name}{r.distance_km != null ? ` · ${t("dist")} ${r.distance_km} ${t("km")}` : ""}{r.centre_stale ? ` · ${t("stale")}` : ""} · <span className="font-semibold whitespace-nowrap">{r.centre.phone}</span></>
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
          {r.centre && (
            <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-center sm:justify-start sm:gap-2 sm:shrink-0 sm:pt-1">
              <a href={qrValue || undefined} className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground no-underline shadow-sm">📞 Call</a>
              {qrValue && (
                <>
                  <QRCode value={qrValue} size={64} />
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">{t("qr_call")}</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
