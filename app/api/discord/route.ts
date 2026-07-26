import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import { createClient } from "@supabase/supabase-js";

// Inisialisasi Supabase menggunakan Service Role
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// DAFTAR PANGKAT (Tertinggi ke Terendah)
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

        // 1. Tanggapi PING dari Discord
        if (interaction.type === 1) {
            return NextResponse.json({ type: 1 });
        }

        // 2. Saat user mengetik /absen -> Munculkan Modal Form
        if (interaction.type === 2 && interaction.data.name === "absen") {
            return NextResponse.json({
                type: 9, // Modal Response
                data: {
                    custom_id: "form_absen_duty",
                    title: "Form Laporan Duty Polisi",
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "input_jam_duty",
                                    label: "Jam Duty (Contoh: 16.30 - 17.57)",
                                    style: 1,
                                    placeholder: "16.30 - 17.57",
                                    required: true,
                                },
                            ],
                        },
                        {
                            type: 1,
                            components: [
                                {
                                    type: 4,
                                    custom_id: "input_catatan",
                                    label: "Catatan Aktivitas / Kegiatan",
                                    style: 2,
                                    placeholder: "Patroli & nangkep suspect...",
                                    required: true,
                                },
                            ],
                        },
                    ],
                },
            });
        }

        // 3. Saat Modal Form di-submit oleh Anggota
        if (interaction.type === 5 && interaction.data.custom_id === "form_absen_duty") {
            const member = interaction.member;
            const user = member?.user || interaction.user;
            const userId = user.id;
            const roles = member?.roles || [];

            // Validasi role Kepolisian utama
            const isPolice = roles.includes("1393366590942085220");
            if (!isPolice) {
                return NextResponse.json({
                    type: 4,
                    data: {
                        content: "❌ **Akses Ditolak:** Kamu tidak memiliki role Kepolisian yang sah untuk melakukan absensi.",
                        flags: 64,
                    },
                });
            }

            // Deteksi Pangkat Otomatis
            let detectedPangkat = "RECRUIT";
            for (const rank of RANK_HIERARCHY) {
                if (roles.includes(rank.id)) {
                    detectedPangkat = rank.name;
                    break;
                }
            }

            // Deteksi Divisi Otomatis
            let detectedDivisi = "NON DIVISI";
            for (const [name, id] of Object.entries(DIVISI_ID)) {
                if (roles.includes(id)) {
                    detectedDivisi = name;
                    break;
                }
            }

            const values = interaction.data.components;
            const jamDuty = values[0].components[0].value;
            const catatan = values[1].components[0].value;
            const userName = member.nick || user.global_name || user.username;
            const userAvatar = user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${user.avatar}.png` : null;

            // Upsert data user ke tabel 'users' sesuai struktur database kamu
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

            // Simpan data presensi ke tabel 'presensi_duty'
            const { error: presensiError } = await supabaseAdmin.from("presensi_duty").insert([
                {
                    user_id_discord: userId,
                    catatan_duty: `[${detectedPangkat}] [${detectedDivisi}] ${userName} | Jam: ${jamDuty} | Catatan: ${catatan}`,
                    status: "VALID",
                    created_at: new Date().toISOString(),
                },
            ]);

            if (presensiError) {
                console.error("Gagal simpan presensi:", presensiError);
            }

            return NextResponse.json({
                type: 4,
                data: {
                    content: `✅ **Absensi Berhasil Dicatat!**\n• Pangkat: **${detectedPangkat}**\n• Divisi: **${detectedDivisi}**\n• Jam Duty: **${jamDuty}**\n\nData sudah masuk ke Dashboard Web MDT.`,
                    flags: 64,
                },
            });
        }

        return NextResponse.json({ error: "Unknown interaction" }, { status: 400 });
    } catch (err) {
        console.error("Error Discord Endpoint:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}