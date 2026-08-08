import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ID Role Pembekuan
const ROLE_PEMBEKUAN_ID = "1500842973259104276";

export async function POST(req: Request) {
    try {
        const { userId } = await req.json();
        
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        const guildId = process.env.DISCORD_GUILD_ID;

        // Fetch data terbaru langsung dari Discord API (Bypassing cache)
        const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
            headers: { Authorization: `Bot ${botToken}` },
            cache: 'no-store'
        });

        if (!discordRes.ok) {
            return NextResponse.json({ error: "Failed to fetch member from Discord", status: discordRes.status }, { status: 400 });
        }

        const member = await discordRes.json();
        const roles: string[] = member.roles || [];

        // Ambil data user saat ini dari database untuk referensi
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('divisi')
            .eq('discord_id', userId)
            .single();

        // 1. DAFTAR PANGKAT (Tertinggi ke Terendah)
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

        let detectedPangkat = "RECRUIT";
        for (const rank of RANK_HIERARCHY) {
            if (roles.includes(rank.id)) { 
                detectedPangkat = rank.name; 
                break; 
            }
        }

        // 2. DAFTAR ROLE KADIV & WAKADIV
        const KADIV_ROLES = [
            { divisi: "SABHARA", id: "1423067332389109801" },
            { divisi: "SATLANTAS", id: "1428104594252238998" },
            { divisi: "PROPAM", id: "1458651434500358194" },
            { divisi: "BRIMOB", id: "1445077121318785075" },
            { divisi: "SETUM", id: "1518415347558907992" },
        ];

        const WAKADIV_ROLES = [
            { divisi: "SABHARA", id: "1423068619860082888" },
            { divisi: "SATLANTAS", id: "1428104859717996665" },
            { divisi: "PROPAM", id: "1466377320909635666" },
            { divisi: "BRIMOB", id: "1456339100457238598" },
            { divisi: "SETUM", id: "1518415643022725201" },
        ];

        const DIVISI_ID = {
            PROPAM: "1458009275472281672",
            BRIMOB: "1417238500025040987",
            SATLANTAS: "1427725693126574121",
            SABHARA: "1423062503646298262",
            SETUM: "1518414822318800987"
        };

        let isKadiv = false;
        let isWakadiv = false;
        let detectedDivisi = "NON DIVISI";

        const matchedKadivs = KADIV_ROLES.filter(item => roles.includes(item.id));
        const matchedWakadivs = WAKADIV_ROLES.filter(item => roles.includes(item.id));

        if (matchedKadivs.length > 0) {
            isKadiv = true;
            const active = matchedKadivs.find(k => k.divisi === existingUser?.divisi) || matchedKadivs[0];
            detectedDivisi = active.divisi;
        } else if (matchedWakadivs.length > 0) {
            isWakadiv = true;
            const active = matchedWakadivs.find(w => w.divisi === existingUser?.divisi) || matchedWakadivs[0];
            detectedDivisi = active.divisi;
        } else {
            for (const [name, id] of Object.entries(DIVISI_ID)) {
                if (roles.includes(id)) { 
                    detectedDivisi = name; 
                    break; 
                }
            }
        }

        // 3. DETEKSI STATUS PEMBEKUAN
        const isPembekuan = roles.includes(ROLE_PEMBEKUAN_ID);
        const isPolice = roles.includes("1393366590942085220");

        if (isPolice) {
            // Perbaikan: Menggunakan kolom boolean is_kadiv & is_wakadiv sesuai struktur database
            const { error: upsertError } = await supabaseAdmin.from('users').upsert({
                discord_id: userId,
                name: member.nick || member.user.username,
                image: member.user.avatar ? `https://cdn.discordapp.com/avatars/${userId}/${member.user.avatar}.png` : null,
                roles: roles,
                divisi: detectedDivisi,
                pangkat: detectedPangkat,
                is_kadiv: isKadiv,
                is_wakadiv: isWakadiv,
                is_pembekuan: isPembekuan,
                last_login: new Date().toISOString(),
            }, { onConflict: 'discord_id' });

            if (upsertError) {
                console.error("Supabase Upsert Error:", upsertError);
                return NextResponse.json({ error: upsertError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ 
            isPolice, 
            divisi: detectedDivisi, 
            pangkat: detectedPangkat, 
            is_kadiv: isKadiv,
            is_wakadiv: isWakadiv,
            is_pembekuan: isPembekuan, 
            discord_id: userId 
        });

    } catch (err: any) {
        console.error("API Check Role Error:", err);
        return NextResponse.json({ error: err.message || "Fail" }, { status: 500 });
    }
}