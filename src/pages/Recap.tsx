import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquareText, Copy, Send } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function Recap() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "Rekap WhatsApp · DG-KOMPUTER";
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("customers").select("nama,area,paket,status,sales_id,created_at"),
        supabase.from("profiles").select("id,nama"),
      ]);
      setCustomers(c ?? []);
      const m: Record<string, string> = {};
      (p ?? []).forEach((x: any) => { m[x.id] = x.nama; });
      setProfiles(m);
    })();
  }, []);

  const text = useMemo(() => {
    const today = format(new Date(), "d MMMM yyyy", { locale: localeId });
    const total = customers.length;
    const pending = customers.filter((c) => c.status === "Pending");
    const selesai = customers.filter((c) => c.status === "Selesai");
    const bySales: Record<string, { selesai: number; pending: number }> = {};
    customers.forEach((c) => {
      if (!c.sales_id) return;
      bySales[c.sales_id] = bySales[c.sales_id] ?? { selesai: 0, pending: 0 };
      if (c.status === "Selesai") bySales[c.sales_id].selesai++; else bySales[c.sales_id].pending++;
    });

    let out = `*📊 REKAP DG-KOMPUTER*\n${today}\n\n`;
    out += `*Ringkasan*\n`;
    out += `• Total pelanggan: *${total}*\n`;
    out += `• Selesai pasang: *${selesai.length}*\n`;
    out += `• Antrian pending: *${pending.length}*\n\n`;
    out += `*Per Sales*\n`;
    Object.entries(bySales)
      .sort((a, b) => b[1].selesai - a[1].selesai)
      .forEach(([uid, v]) => {
        out += `• ${profiles[uid] ?? "Unknown"}: ${v.selesai} selesai / ${v.pending} pending\n`;
      });
    if (pending.length) {
      out += `\n*Antrian Teknisi (${pending.length})*\n`;
      pending.slice(0, 20).forEach((c, i) => {
        out += `${i + 1}. ${c.nama} — ${c.area ?? "-"} (${c.paket ?? "-"})\n`;
      });
    }
    return out;
  }, [customers, profiles]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Teks disalin ke clipboard");
  };
  const sendWA = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
          <MessageSquareText className="h-6 w-6 text-success" /> Rekap WhatsApp
        </h1>
        <p className="text-sm text-muted-foreground">Generate laporan ringkasan siap kirim ke WhatsApp</p>
      </div>
      <Card className="border-border/60 shadow-card">
        <CardHeader>
          <CardTitle className="text-base font-display">Preview Laporan</CardTitle>
          <CardDescription>Edit jika perlu, lalu salin atau kirim</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea value={text} readOnly rows={18} className="font-mono text-xs" />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={copy}><Copy className="mr-2 h-4 w-4" /> Salin</Button>
            <Button onClick={sendWA}><Send className="mr-2 h-4 w-4" /> Kirim ke WhatsApp</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}