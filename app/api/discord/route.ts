import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const RANK_HIERARCHY = [
    { name: "JENDRAL", id: "1393368961940324462" }, { name: "KOMJEN", id: "1393369949988327624" },
    { name: "IRJEN", id: "1393371303779500154" }, { name: "BRIGJEN", id: "1393373068709335121" },
    { name: "KOMBESPOL", id: "1393373724756934756" }, { name: "AKBP", id: "1393374382293782689" },
    { name: "KOMPOL", id: "1393374719608094902" }, { name: "AKP", id: "1393375242860232826" },
    { name: "IPTU", id: "1393375424754487376" }, { name: "IPDA", id: "1393376012858818622" },
    { name: "AIPTU", id: "1393376194640216204" }, { name: "AIPDA", id: "1393376395161239552" },
    { name: "BRIPKA", id: "1393376709990027365" }, { name: "BRIPTU", id: "1393376930384052345" },
    { name: "BRIPDA", id: "1393377097673736264" }, { name: "ABRIPDA", id: "1447257983729008823" },
    { name: "ABRIPTU", id: "1447257808595587173" }, { name: "ABRIGPOL", id: "1468235299346845726" },
    { name: "BHARAKA", id: "1468236252028469552" }, { name: "BHARATU", id: "1414436319873994863" },
    { name: "BHARADA", id: "1414436059806302339" }, { name: "BRIGPOL", id: "1428799768045420706" },
];

const DIVISI_ID = {
    PROPAM: "1458009275472281672",
    BRIMOB: "1417238500025040987",
    SATLANTAS: "1427725693126574121",
    SABHARA: "1423062503646298262"
};

// Fungsi pintar hitung durasi otomatis
function hitungDurasiDuty(teksJam: string) {
    try {
        const parts = teksJam.split(/-|s\/d/i).map(s => s.trim());
        if (parts.length !== 2) return "Format Jam Tidak Valid";

        const parseTime = (t: string) => {
            const clean = t.replace(".", ":");
            const [h, m] = clean.split(":").map(Number);
            if (isNaN(h) || isNaN(m)) return null;
            return h * 60 + m;
        };

        const start = parseTime(parts[0]);
        const end = parseTime(parts[1]);

        if (start === null || end === null) return "Format Jam Tidak Valid";

        let diff = end - start;
        if (diff < 0) diff += 24 * 60;

        const jam = Math.floor(diff / 60);
        const menit = diff % 60;

        if (jam > 0 && menit > 0) return `${jam} Jam ${menit} Menit`;
        if (jam > 0) return `${jam} Jam`;
        return `${menit} Menit`;
    } catch {
        return "Manual / Cek Format";
    }
}

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get("x-signature-ed25519");
        const timestamp = req.headers.get("x-signature-timestamp");
        const bodyText = await req.text();

        if (!signature || !timestamp || !process.env.DISCORD_PUBLIC_KEY) {
            return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
        }

        const isVerified = nacl.sign.detached.verify(
            Buffer.from(timestamp + bodyText),
            Buffer.from(signature, "hex"),
            Buffer.from(process.env.DISCORD_PUBLIC_KEY, "hex")
        );

        if (!isVerified) {
            return NextResponse.json({ error: "Invalid request signature" }, { status: 401 });
        }

        const interaction = JSON.parse(bodyText);

        if (interaction.type === 1) {
            return NextResponse.json({ type: 1 });
        }

        // Saat /absen diketik -> Munculkan form tanggal & jam doang
        if (interaction.type === 2 && interaction.data.name === "absen") {
            return NextResponse.json({
                type: 9,
                data: {
                    custom_id: "form_absen_duty",
                    title: "Form Absensi Duty",
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "input_tanggal",
                                    label: "Tanggal Duty (Contoh: 28/07/2026)",
                                    style: 1,
                                    placeholder: "DD/MM/YYYY",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "input_jam_duty",
                                    label: "Jam Duty (Contoh: 14.00 - 15.30)",
                                    style: 1,
                                    placeholder: "14.00 - 15.30",
                                    required: true,
                                },
                            ],
                        },
                    ],
                },
            });
        }

        // Saat form di-submit
        if (interaction.type === 5 && interaction.data.custom_id === "form_absen_duty") {
            const member = interaction.member;
            const user = member?.user || interaction.user;
            const userId = user.id;
            const roles = member?.roles || [];

            const isPolice = roles.includes("1393366590942085220");
            if (!isPolice) {
                return NextResponse.json({
                    type: 4,
                    data: {
                        content: "❌ **Akses Ditolak:** Kamu bukan anggota kepolisian yang sah.",
                        flags: 64,
                    },
                });
            }

            let detectedPangkat = "RECRUIT";
            for (const rank of RANK_HIERARCHY) {
                if (roles.includes(rank.id)) {
                    detectedPangkat = rank.name;
                    break;
                }
            }

            let detectedDivisi = "NON DIVISI";
            for (const [name, id] of Object.entries(DIVISI_ID)) {
                if (roles.includes(id)) {
                    detectedDivisi = name;
                    break;
                }
            }

            const values = interaction.data.components;
            const tanggalDuty = values[0].components[0].value;
            const jamDuty = values[1].components[0].value;
            const durasi = hitungDurasiDuty(jamDuty); // Hitung otomatis durasinya!

            const userName = member.nick || user.global_name || user.username;
            const userAvatar = user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png` : null;

            await supabaseAdmin.from('users').upsert({
                discord_id: userId,
                id: userId,
                name: userName,
                image: userAvatar,
                roles: roles,
                divisi: detectedDivisi,
                pangkat: detectedPangkat,
                last_login: new Date().toISOString(),
            }, { onConflict: 'discord_id' });

            // Simpan ke database dengan format yang rapi
            await supabaseAdmin.from("presensi_duty").insert([
                {
                    user_id_discord: userId,
                    catatan_duty: `[${detectedPangkat}] [${detectedDivisi}] ${userName} | Tanggal: ${tanggalDuty} | Jam: ${jamDuty} | Total Durasi: ${durasi}`,
                    status: "VALID",
                    created_at: new Date().toISOString(),
                },
            ]);

            return NextResponse.json({
                type: 4,
                data: {
                    content: `✅ **Absensi Berhasil Dicatat!**\n• Tanggal: **${tanggalDuty}**\n• Jam Duty: **${jamDuty}**\n• Total Durasi: **${durasi}**\n• Pangkat/Divisi: **${detectedPangkat} / ${detectedDivisi}**\n\n*Jangan lupa upload screenshot bukti foto duty di channel galeri ya!*`,
                    flags: 64,
                },
            });
        }

        return NextResponse.json({ error: "Unknown interaction" }, { status: 400 });
    } catch (err) {
        console.error("Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}